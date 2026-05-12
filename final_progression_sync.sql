-- 1. Ensure user_progress table exists
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, word_id)
);

-- 2. Add RLS to user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist to avoid errors on retry
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;

CREATE POLICY "Users can view own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Robust RPC to mark a word as completed and sync rewards
-- This is called from the frontend when a user wins a round.
CREATE OR REPLACE FUNCTION public.sync_game_session(
    p_user_id UUID,
    p_mode TEXT,
    p_magnets_used INTEGER DEFAULT 0,
    p_hints_used INTEGER DEFAULT 0,
    p_skips_used INTEGER DEFAULT 0,
    p_solved_words TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_xp_award INTEGER;
    v_fils_award INTEGER;
    v_word_record RECORD;
    v_current_xp INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_word_text TEXT;
BEGIN
    -- Get current user XP
    SELECT xp INTO v_current_xp FROM public.profiles WHERE id = p_user_id;
    
    -- Calculate rewards based on mode
    CASE p_mode
        WHEN 'classic' THEN v_xp_award := 25; v_fils_award := 50;
        WHEN 'hard_words' THEN v_xp_award := 50; v_fils_award := 100;
        WHEN 'mamak' THEN v_xp_award := 35; v_fils_award := 75;
        WHEN 'word_fever' THEN v_xp_award := 50; v_fils_award := 50;
        WHEN 'secret_word' THEN v_xp_award := 100; v_fils_award := 250;
        ELSE v_xp_award := 10; v_fils_award := 10;
    END CASE;

    -- 1. Update Profile Stats & Inventory
    UPDATE public.profiles
    SET 
        xp = xp + v_xp_award,
        fils = GREATEST(0, fils + v_fils_award),
        magnets = GREATEST(0, magnets - p_magnets_used),
        hints = GREATEST(0, hints - p_hints_used),
        skips = GREATEST(0, skips - p_skips_used),
        updated_at = now()
    WHERE id = p_user_id
    RETURNING xp INTO v_new_xp;

    -- 2. Calculate Level
    v_new_level := floor(sqrt(v_new_xp / 100)) + 1;
    UPDATE public.profiles SET level = v_new_level WHERE id = p_user_id;

    -- 3. Record User Progress (The "No Repeat" & "Dictionary" Source)
    FOREACH v_word_text IN ARRAY p_solved_words
    LOOP
        -- Find word ID
        SELECT id INTO v_word_record FROM public.words WHERE word = v_word_text LIMIT 1;
        
        IF v_word_record.id IS NOT NULL THEN
            -- Record in user_progress for No-Repeat logic
            INSERT INTO public.user_progress (user_id, word_id)
            VALUES (p_user_id, v_word_record.id)
            ON CONFLICT (user_id, word_id) DO NOTHING;
            
            -- Also append to inventory.solved_words for legacy compatibility/DictionaryView
            UPDATE public.profiles
            SET inventory = jsonb_set(
                inventory, 
                '{solved_words}', 
                (COALESCE(inventory->'solved_words', '[]'::jsonb) || jsonb_build_array(v_word_text))
            )
            WHERE id = p_user_id 
            AND NOT (inventory->'solved_words' @> jsonb_build_array(v_word_text));
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'new_xp', v_new_xp,
        'new_level', v_new_level,
        'award_xp', v_xp_award,
        'award_fils', v_fils_award
    );
END;
$$;

-- 4. RPC to get a fresh word (Excludes words in user_progress)
CREATE OR REPLACE FUNCTION public.get_random_fresh_word(
    p_user_id UUID,
    p_mode_tag TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS SETOF public.words
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT w.*
    FROM public.words w
    WHERE 
        -- Exclude already solved words
        NOT EXISTS (
            SELECT 1 FROM public.user_progress up 
            WHERE up.user_id = p_user_id AND up.word_id = w.id
        )
        -- Filter by mode if provided
        AND (p_mode_tag IS NULL OR p_mode_tag = ANY(w.mode_tags))
        -- Filter by category if provided
        AND (p_category IS NULL OR w.category = p_category OR (p_category = 'All' AND w.category IS NOT NULL))
    ORDER BY random()
    LIMIT 1;
END;
$$;
