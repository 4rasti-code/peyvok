-- PEYVOK: SYNC EXISTING USERNAMES
-- This script fixes users whose nicknames defaulted to 'یاریکەر' 
-- by pulling their correct name from auth.users metadata.

UPDATE public.profiles
SET nickname = COALESCE(
    auth.users.raw_user_meta_data->>'username', 
    auth.users.raw_user_meta_data->>'nickname', 
    auth.users.raw_user_meta_data->>'full_name', 
    auth.users.raw_user_meta_data->>'name'
)
FROM auth.users
WHERE public.profiles.id = auth.users.id
  AND public.profiles.nickname = 'یاریکەر'
  AND (
    auth.users.raw_user_meta_data->>'username' IS NOT NULL OR 
    auth.users.raw_user_meta_data->>'nickname' IS NOT NULL OR 
    auth.users.raw_user_meta_data->>'full_name' IS NOT NULL OR 
    auth.users.raw_user_meta_data->>'name' IS NOT NULL
  );

-- Verification Query: Check if any 'یاریکەر' profiles still exist and why
-- SELECT id, nickname, (SELECT raw_user_meta_data FROM auth.users u WHERE u.id = p.id) as meta 
-- FROM public.profiles p 
-- WHERE nickname = 'یاریکەر';
