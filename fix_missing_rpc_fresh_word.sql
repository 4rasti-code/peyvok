-- SQL Script for Fresh Word Fetching
-- This script creates the get_random_fresh_word RPC function
-- Required for category-specific randomized word selection excluding already solved items.

CREATE OR REPLACE FUNCTION public.get_random_fresh_word(
    p_user_id UUID,
    p_mode_tag TEXT DEFAULT 'classic',
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
        -- Filter by category if provided
        (p_category IS NULL OR w.category = p_category)
        -- Filter by game mode
        AND (p_mode_tag IS NULL OR p_mode_tag = ANY(w.mode_tags))
        -- Exclude already solved words for this user
        -- We check user_progress which tracks solves per user/word
        AND NOT EXISTS (
            SELECT 1 FROM public.user_progress up 
            WHERE up.user_id = p_user_id AND up.word_id = w.id
        )
    ORDER BY random()
    LIMIT 1;
END;
$$;
