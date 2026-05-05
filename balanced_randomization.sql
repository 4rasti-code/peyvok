-- SQL Script for Balanced Randomization
-- This script creates the get_balanced_random_word RPC function

CREATE OR REPLACE FUNCTION public.get_balanced_random_word(
    p_user_id UUID,
    p_mode_tag TEXT DEFAULT NULL
)
RETURNS SETOF public.words
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_chosen_category TEXT;
BEGIN
    -- STEP 1: Pick a random category that has unsolved words for this user and mode
    -- This ensures every category has an equal chance of being picked.
    SELECT w.category INTO v_chosen_category
    FROM public.words w
    WHERE 
        -- Exclude already solved words for this user
        NOT EXISTS (
            SELECT 1 FROM public.user_progress up 
            WHERE up.user_id = p_user_id AND up.word_id = w.id
        )
        -- Filter by game mode
        AND (p_mode_tag IS NULL OR p_mode_tag = ANY(w.mode_tags))
        AND w.category IS NOT NULL
    GROUP BY w.category
    ORDER BY random()
    LIMIT 1;

    -- STEP 2: Pick one random word from that specific category
    RETURN QUERY
    SELECT w.*
    FROM public.words w
    WHERE 
        w.category = v_chosen_category
        AND NOT EXISTS (
            SELECT 1 FROM public.user_progress up 
            WHERE up.user_id = p_user_id AND up.word_id = w.id
        )
        AND (p_mode_tag IS NULL OR p_mode_tag = ANY(w.mode_tags))
    ORDER BY random()
    LIMIT 1;
END;
$$;
