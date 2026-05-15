-- ADVANCED BALANCED WORD SELECTION RPC (FIXED FOR MAMAK EXCLUSION)
-- This function ensures:
-- 1. No Repetitions (checks solved_words)
-- 2. Category Exclusion (prevents consecutive same categories)
-- 3. Length Filtering (based on mode)
-- 4. MAMAK EXCLUSION: Riddles ONLY appear in 'mamak' mode.

CREATE OR REPLACE FUNCTION public.get_random_fresh_word(
    p_user_id UUID,
    p_mode_tag TEXT DEFAULT 'classic',
    p_category TEXT DEFAULT NULL,
    p_exclude_category TEXT DEFAULT NULL
)
RETURNS SETOF public.words
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_min_len INT;
    v_max_len INT;
    v_exact_len INT;
BEGIN
    -- 1. Define Mode Constraints (Length)
    CASE p_mode_tag
        WHEN 'classic' THEN v_min_len := 2; v_max_len := 5;
        WHEN 'hard_words' THEN v_min_len := 6; v_max_len := 50;
        WHEN 'word_fever' THEN v_exact_len := 5;
        WHEN 'battle' THEN v_exact_len := 5;
        WHEN 'secret_word' THEN v_min_len := 2; v_max_len := 50;
        WHEN 'mamak' THEN v_min_len := 2; v_max_len := 15;
        ELSE v_min_len := 2; v_max_len := 10;
    END CASE;

    RETURN QUERY
    SELECT w.*
    FROM public.words w
    WHERE 
        -- A. Length Check
        (
            (v_exact_len IS NOT NULL AND LENGTH(w.word) = v_exact_len)
            OR
            (v_exact_len IS NULL AND LENGTH(w.word) BETWEEN v_min_len AND v_max_len)
        )
        AND
        -- B. MAMAK MODE LOGIC (The Fix)
        (
            (p_mode_tag = 'mamak' AND w.category = 'مامک')
            OR
            (p_mode_tag <> 'mamak' AND w.category <> 'مامک')
        )
        AND
        -- C. Category Exclusion (No Consecutive same category)
        (p_exclude_category IS NULL OR w.category <> p_exclude_category)
        AND
        -- D. Specific Category Filter (If user selected one)
        (p_category IS NULL OR w.category = p_category)
        AND
        -- E. Freshness Check (Exclude already solved words)
        NOT EXISTS (
            SELECT 1 
            FROM public.profiles p 
            WHERE p.id = p_user_id 
            AND w.word = ANY(p.solved_words)
        )
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$;

-- Update the balanced function to use the new logic
CREATE OR REPLACE FUNCTION public.get_balanced_random_word(
    p_user_id UUID,
    p_mode_tag TEXT DEFAULT 'classic',
    p_exclude_category TEXT DEFAULT NULL
)
RETURNS SETOF public.words
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.get_random_fresh_word(p_user_id, p_mode_tag, NULL, p_exclude_category);
END;
$$;
