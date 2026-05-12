-- ================================================================
-- PEYVÇÎN 2.0: CURRENCY RENAMING MIGRATION (SHAYI -> FILS)
-- ================================================================
-- Run this script in the Supabase SQL Editor.

-- 1. RENAME COLUMN
-- This safe block renames 'shayi' to 'fils' if it still exists.
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'profiles' 
        AND column_name = 'shayi'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN shayi TO fils;
    END IF;
END $$;

-- 2. UPDATE handle_new_user TRIGGER FUNCTION
-- Standardizing the starter gift to 'fils' terminology.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_nickname TEXT;
BEGIN
    v_nickname := COALESCE(
        new.raw_user_meta_data->>'nickname', 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'name', 
        'یاریکەر'
    );

    INSERT INTO public.profiles (
        id, 
        nickname, 
        fils, 
        derhem, 
        dinar,
        magnets, 
        hints, 
        skips,
        avatar_url,
        inventory,
        country_code,
        is_kurdistan,
        updated_at
    )
    VALUES (
        new.id, 
        v_nickname,
        1000, -- 1000 Fils (Starter Gift)
        50,   -- 50 Derhem
        5,    -- 5 Dinar
        3,    -- 3 Magnets
        5,    -- 5 Hints
        2,    -- 2 Skips
        'default',
        '{"owned_avatars": ["default"], "unlocked_themes": ["default"], "solved_words": []}'::JSONB,
        COALESCE(new.raw_user_meta_data->>'country_code', 'KD'),
        COALESCE((new.raw_user_meta_data->>'is_kurdistan')::boolean, true),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE LEGACY RPC FUNCTIONS
-- Ensuring legacy handle_level_completion uses the new column name.
CREATE OR REPLACE FUNCTION public.handle_level_completion(
  p_user_id UUID,
  p_reward_amount INTEGER,
  p_xp_amount INTEGER,
  p_game_mode TEXT DEFAULT 'classic',
  p_completed_level INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    fils = fils + p_reward_amount, -- Renamed from shayi
    xp = xp + p_xp_amount,
    level = CASE WHEN p_game_mode = 'classic' THEN level + 1 ELSE level END,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REFRESH LEADERBOARD VIEW
-- Views must be recreated if their underlying columns are renamed.
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  id, 
  nickname, 
  avatar_url, 
  country_code, 
  is_kurdistan, 
  level, 
  xp, 
  fils,   -- Renamed from shayi
  derhem, 
  dinar,
  daily_streak, 
  updated_at
FROM public.profiles
WHERE nickname IS NOT NULL;

-- 5. VERIFY SCHEMA
-- This query helps the user verify the columns after running the script.
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('fils', 'shayi', 'derhem', 'dinar');
