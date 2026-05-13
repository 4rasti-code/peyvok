-- 1. Ensure the trigger uses 'default' instead of NULL for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, country_code, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'nickname', 'یاریکەر'),
    COALESCE(new.raw_user_meta_data->>'country_code', 'KD'),
    'default'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill existing users: Reset 'sun' or NULL defaults to 'default'
-- This ensures they show the User icon (👤) instead of the Sun (☀️)
UPDATE public.profiles 
SET avatar_url = 'default' 
WHERE avatar_url IS NULL OR avatar_url = '' OR avatar_url = 'sun';
