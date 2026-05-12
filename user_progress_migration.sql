-- ==========================================
-- PEYVÇÎN: USER PROGRESS & COLLECTION LOGIC
-- ==========================================

-- 1. Create User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id BIGINT REFERENCES public.words(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own progress' AND tablename = 'user_progress') THEN
        CREATE POLICY "Users can view their own progress" ON public.user_progress
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own progress' AND tablename = 'user_progress') THEN
        CREATE POLICY "Users can insert their own progress" ON public.user_progress
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. RPC: Get Random Fresh Word (Exclusion Logic)
-- This function fetches a word that the user hasn't solved yet.
CREATE OR REPLACE FUNCTION public.get_random_fresh_word(
  p_user_id UUID,
  p_mode_tag TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS SETOF public.words AS $$
BEGIN
  RETURN QUERY
  SELECT w.*
  FROM public.words w
  LEFT JOIN public.user_progress up ON w.id = up.word_id AND up.user_id = p_user_id
  WHERE up.word_id IS NULL -- Only words NOT in user_progress
    AND (p_mode_tag IS NULL OR p_mode_tag = ANY(w.mode_tags))
    AND (p_category IS NULL OR w.category = p_category)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Mark Word Completed (Atomic)
CREATE OR REPLACE FUNCTION public.mark_word_completed(
  p_user_id UUID,
  p_word_id BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, word_id)
  VALUES (p_user_id, p_word_id)
  ON CONFLICT (user_id, word_id) DO NOTHING;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add view for My Dictionary
CREATE OR REPLACE VIEW public.user_collection AS
SELECT 
    up.user_id,
    w.id as word_id,
    w.word,
    w.hint,
    w.category,
    up.completed_at
FROM public.user_progress up
JOIN public.words w ON up.word_id = w.id;
