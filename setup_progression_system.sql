-- DATABASE STRUCTURE FOR PEYVOK PROGRESSION SYSTEM

-- 1. Ensure the profiles table has solved_words array
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS solved_words TEXT[] DEFAULT '{}';

-- 2. Create the sync_profile_progression RPC
-- This handles updating XP, Level, and adding words to the solved_words list safely.
CREATE OR REPLACE FUNCTION public.sync_profile_progression(
    p_xp_to_add INT,
    p_fils_to_add INT,
    p_derhem_to_add INT,
    p_dinar_to_add INT,
    p_level INT,
    p_solved_words TEXT[],
    p_mode TEXT,
    p_score INT DEFAULT 0,
    p_is_win BOOLEAN DEFAULT TRUE,
    p_attempts INT DEFAULT 0,
    p_is_flawless BOOLEAN DEFAULT FALSE,
    p_is_secret_win BOOLEAN DEFAULT FALSE,
    p_is_riddle_no_skip BOOLEAN DEFAULT FALSE,
    p_is_pvp_flawless BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_xp INT;
    v_updated_solved_words TEXT[];
BEGIN
    -- Update core progression stats
    UPDATE public.profiles
    SET 
        xp = xp + p_xp_to_add,
        fils = fils + p_fils_to_add,
        derhem = derhem + p_derhem_to_add,
        dinar = dinar + p_dinar_to_add,
        level = p_level,
        -- Use array_cat and array_agg(DISTINCT) to ensure no duplicates in solved_words
        solved_words = (
            SELECT ARRAY_AGG(DISTINCT val)
            FROM UNNEST(ARRAY_CAT(solved_words, p_solved_words)) val
        )
    WHERE id = auth.uid()
    RETURNING xp, solved_words INTO v_new_xp, v_updated_solved_words;

    RETURN jsonb_build_object(
        'success', true,
        'new_xp', v_new_xp,
        'new_level', p_level,
        'solved_count', array_length(v_updated_solved_words, 1)
    );
END;
$$;
