-- Refined get_random_fresh_word RPC with Balanced Category Selection
-- This ensures that when no category is specified, we pick a random category first,
-- preventing categories with high word counts from dominating the results.

CREATE OR REPLACE FUNCTION public.get_random_fresh_word(
    p_user_id UUID,
    p_mode_tag TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS SETOF public.words
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_chosen_category TEXT;
BEGIN
    -- If no specific category is requested, pick a random one from available words first
    IF p_category IS NULL OR p_category = 'All' OR p_category = 'ھەموو' THEN
        SELECT w.category INTO v_chosen_category
        FROM public.words w
        WHERE 
            -- Exclude solved words
            NOT EXISTS (
                SELECT 1 FROM public.user_progress up 
                WHERE up.user_id = p_user_id AND up.word_id = w.id
            )
            -- Match mode
            AND (p_mode_tag IS NULL OR p_mode_tag = ANY(w.mode_tags))
            -- Ensure it has a category
            AND w.category IS NOT NULL
        GROUP BY w.category
        ORDER BY random()
        LIMIT 1;
        
        -- If we found a category, use it to filter
        IF v_chosen_category IS NOT NULL THEN
            p_category := v_chosen_category;
        END IF;
    END IF;

    -- Return a random word from the chosen (or originally requested) category
    RETURN QUERY
    SELECT w.*
    FROM public.words w
    WHERE 
        -- Exclude solved words
        NOT EXISTS (
            SELECT 1 FROM public.user_progress up 
            WHERE up.user_id = p_user_id AND up.word_id = w.id
        )
        -- Match mode
        AND (p_mode_tag IS NULL OR p_mode_tag = ANY(w.mode_tags))
        -- Match category
        AND (p_category IS NULL OR w.category = p_category)
    ORDER BY random()
    LIMIT 1;
END;
$$;
