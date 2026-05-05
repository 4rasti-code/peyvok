
-- 1. Create the RPC function to sync vocabulary
CREATE OR REPLACE FUNCTION public.sync_vocabulary(p_words JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, bypassing RLS
AS $$
DECLARE
    v_word_record JSONB;
    v_inserted_count INTEGER := 0;
    v_updated_count INTEGER := 0;
BEGIN
    -- Basic security check (Optional: could restrict to specific admin IDs if needed)
    -- IF auth.role() <> 'service_role' THEN 
    --    RAISE EXCEPTION 'Unauthorized'; 
    -- END IF;

    FOR v_word_record IN SELECT * FROM jsonb_array_elements(p_words)
    LOOP
        INSERT INTO public.words (word, hint, category, mode_tags)
        VALUES (
            v_word_record->>'word',
            v_word_record->>'hint',
            v_word_record->>'category',
            ARRAY(SELECT jsonb_array_elements_text(v_word_record->'mode_tags'))
        )
        ON CONFLICT (word, hint) 
        DO UPDATE SET
            category = EXCLUDED.category,
            mode_tags = EXCLUDED.mode_tags,
            created_at = NOW()
        WHERE 
            public.words.category IS DISTINCT FROM EXCLUDED.category OR
            public.words.mode_tags IS DISTINCT FROM EXCLUDED.mode_tags;

        IF FOUND THEN
            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'processed_count', jsonb_array_length(p_words),
        'affected_count', v_inserted_count
    );
END;
$$;
