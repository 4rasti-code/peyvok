-- Create the missing get_multiplayer_words_sequenced RPC
CREATE OR REPLACE FUNCTION public.get_multiplayer_words_sequenced()
RETURNS TABLE (
    word TEXT,
    hint TEXT,
    category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT w.word, w.hint, w.category
    FROM public.words w
    WHERE length(w.word) = 5
      AND 'battle' = ANY(w.mode_tags)
    ORDER BY random()
    LIMIT 5;
END;
$$;
