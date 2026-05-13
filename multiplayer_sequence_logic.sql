-- Optimized Multiplayer Sequence Logic
-- Automatically tags 5-letter words
UPDATE public.words 
SET mode_tags = array_append(mode_tags, 'multiplayer')
WHERE char_length(word) = 5 AND NOT ('multiplayer' = ANY(mode_tags));

-- High-Variety Multiplayer Word Fetcher
-- Enforces that each of the 5 words comes from a DIFFERENT category
CREATE OR REPLACE FUNCTION public.get_multiplayer_words_sequenced()
RETURNS SETOF public.words AS $$
BEGIN
  RETURN QUERY
  WITH random_categories AS (
    -- 1. Identify 5 distinct random categories containing 5-letter words
    SELECT category 
    FROM public.words 
    WHERE char_length(word) = 5
      AND category IS NOT NULL 
      AND category != ''
    GROUP BY category
    ORDER BY random()
    LIMIT 5
  )
  -- 2. Extract 1 random word per category
  SELECT w.*
  FROM random_categories rc
  CROSS JOIN LATERAL (
    SELECT * FROM public.words w2
    WHERE w2.category = rc.category
      AND char_length(w2.word) = 5
    ORDER BY random()
    LIMIT 1
  ) w
  ORDER BY random();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
