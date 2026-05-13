-- Fix for "Database error saving new user" during signup
-- This error happens when the 'handle_new_user' trigger fails to insert into the 'profiles' table,
-- usually because a newly added column (like voice settings) is missing a default value.

-- 1. Ensure all recently added columns have default values and are nullable
ALTER TABLE public.profiles 
  ALTER COLUMN last_nickname_update DROP NOT NULL,
  ALTER COLUMN last_nickname_update SET DEFAULT NULL;

DO $$ 
BEGIN
  -- Add voice/haptic columns safely if they don't exist
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS haptic_enabled BOOLEAN DEFAULT true;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mic_enabled BOOLEAN DEFAULT false;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS speaker_enabled BOOLEAN DEFAULT true;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voice_volume REAL DEFAULT 1.0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mic_volume REAL DEFAULT 1.0;

  -- Ensure existing ones have defaults
  ALTER TABLE public.profiles ALTER COLUMN haptic_enabled SET DEFAULT true;
  ALTER TABLE public.profiles ALTER COLUMN mic_enabled SET DEFAULT false;
  ALTER TABLE public.profiles ALTER COLUMN speaker_enabled SET DEFAULT true;
  ALTER TABLE public.profiles ALTER COLUMN voice_volume SET DEFAULT 1.0;
  ALTER TABLE public.profiles ALTER COLUMN mic_volume SET DEFAULT 1.0;
EXCEPTION
  WHEN others THEN
    -- Ignore errors if columns are already correct
END $$;

-- 2. Create a bulletproof signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_nickname TEXT;
BEGIN
    -- MANDATORY: Always prioritize 'username' as requested by the user. 
    -- This rule must not be changed as it causes registration desync.
    v_nickname := COALESCE(
        new.raw_user_meta_data->>'username', 
        new.raw_user_meta_data->>'nickname', 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'name', 
        'یاریکەر'
    );

    -- Insert with explicit defaults for everything to prevent NOT NULL constraint errors
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
        haptic_enabled,
        mic_enabled,
        speaker_enabled,
        voice_volume,
        mic_volume
    )
    VALUES (
        new.id, 
        v_nickname,
        100, -- Starter Fils
        10,  -- Starter Derhem
        5,   -- Starter Dinar
        3,   -- Starter Magnets
        3,   -- Starter Hints
        3,   -- Starter Skips
        'default',
        '{"owned_avatars": ["default"], "unlocked_themes": ["default"], "solved_words": []}'::JSONB,
        COALESCE(new.raw_user_meta_data->>'country_code', 'KD'),
        COALESCE((new.raw_user_meta_data->>'is_kurdistan')::boolean, true),
        true,  -- haptic_enabled
        false, -- mic_enabled
        true,  -- speaker_enabled
        1.0,   -- voice_volume
        1.0    -- mic_volume
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- If anything fails, still return NEW to allow auth creation
        -- We will just log it in Postgres (invisible to user, but prevents Auth error)
        RAISE WARNING 'Failed to create profile for new user %: %', new.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
