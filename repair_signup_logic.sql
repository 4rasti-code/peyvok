-- ================================================================
-- PEYVÇÎN 2.0: EMERGENCY REPAIR & CURRENCY STANDARDIZATION
-- ================================================================
-- Use this script to restore user signups and fix currency naming.
-- Run this in the Supabase SQL Editor.

-- I. DATABASE SCHEMA REPAIR
-- Renaming 'shayi' to 'fils' to match the application codebase.
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'shayi'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN shayi TO fils;
    END IF;
END $$;

-- Ensure all mandatory columns exist with correct defaults
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fils INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS derhem INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS dinar INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT 'یاریکەر',
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS magnets INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS hints INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS skips INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '{"owned_avatars": ["default"], "unlocked_themes": ["default"], "solved_words": []}'::JSONB,
ADD COLUMN IF NOT EXISTS reward_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_notified_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'KD',
ADD COLUMN IF NOT EXISTS is_kurdistan BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- II. ROBUST SIGNUP TRIGGER
-- This function is called every time a new user registers in auth.users.
-- It works for Email/Password, Google, and Facebook logins.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_nickname TEXT;
BEGIN
    -- Extract nickname from metadata (Email signup sends 'nickname')
    -- Social logins typically send 'full_name' or 'name'
    -- MANDATORY: Always prioritize 'username' as requested by the user. 
    -- This rule must not be changed as it causes registration desync.
    v_nickname := COALESCE(
      (new.raw_user_meta_data->>'username'), -- MANDATORY: Priority 1
      (new.raw_user_meta_data->>'nickname'),
      (new.raw_user_meta_data->>'full_name'),
      (new.raw_user_meta_data->>'name'),
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
        is_kurdistan
    )
    VALUES (
        new.id, 
        v_nickname,
        100, -- 100 Fils (Starter Gift)
        10,   -- 10 Derhem
        5,    -- 5 Zer
        3,    -- 3 Magnets
        3,    -- 3 Hints
        3,    -- 3 Skips
        'default',
        '{"owned_avatars": ["default"], "unlocked_themes": ["default"], "solved_words": []}'::JSONB,
        COALESCE(new.raw_user_meta_data->>'country_code', 'KD'),
        COALESCE((new.raw_user_meta_data->>'is_kurdistan')::boolean, true)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- III. ATOMIC PROGRESSION RPC (handle_game_xp)
-- This function handles XP gain and level calculations in one transaction.
DROP FUNCTION IF EXISTS public.handle_game_xp(UUID, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION public.handle_game_xp(
    p_user_id UUID,
    p_letters_count INTEGER DEFAULT 0,
    p_fils_bonus INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_xp_to_add INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_result JSON;
BEGIN
    -- 1. Get current stats
    SELECT xp, level INTO v_current_xp, v_current_level 
    FROM profiles WHERE id = p_user_id;

    -- 2. Calculate XP gain (Letter count * 10 + bonus)
    v_xp_to_add := CASE 
        WHEN p_letters_count > 0 THEN (p_letters_count * 10) + 10
        ELSE 10 -- Base win XP
    END;

    v_new_xp := v_current_xp + v_xp_to_add;
    
    -- 3. Level Up Logic (Simple: every 100 XP is a level)
    -- You can adjust this to be more complex (e.g. v_new_level := (v_new_xp / 150) + 1)
    v_new_level := (v_new_xp / 100) + 1;

    -- 4. Update Profile
    UPDATE profiles
    SET 
        xp = v_new_xp,
        level = GREATEST(v_current_level, v_new_level),
        fils = fils + p_fils_bonus,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 5. Build Result Payload
    v_result := json_build_object(
        'new_level', GREATEST(v_current_level, v_new_level),
        'xp_added', v_xp_to_add,
        'current_streak', 1 -- Simplified for now
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IV. LEVEL COMPLETION RPC (Alternative/Legacy Support)
CREATE OR REPLACE FUNCTION handle_level_completion(
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
    fils = fils + p_reward_amount,
    xp = xp + p_xp_amount,
    level = CASE WHEN p_game_mode = 'classic' THEN level + 1 ELSE level END,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
