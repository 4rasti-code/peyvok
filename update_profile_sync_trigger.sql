-- Optimized Profile Sync Trigger
-- This function handles the creation of a public.profiles row whenever a new user signs up.
-- It intelligently prefers:
-- 1. Manual nickname provided in registration data.
-- 2. Metadata full_name (from Google).
-- 3. Metadata name (Alternative social login path).
-- 4. Default localized Kurdish placeholder 'یاریکەر'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url, country_code, is_kurdistan)
  VALUES (
    new.id,
    COALESCE(
      (new.raw_user_meta_data->>'username'), -- MANDATORY: Priority 1
      (new.raw_user_meta_data->>'nickname'),
      (new.raw_user_meta_data->>'full_name'),
      (new.raw_user_meta_data->>'name'),
      'یاریکەر'
    ),
    'default',
    COALESCE((new.raw_user_meta_data->>'country_code'), 'KD'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is attached to auth.users (re-creating it to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
