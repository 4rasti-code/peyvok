-- 1. Add the column to the profiles table safely
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_nickname_update TIMESTAMP WITH TIME ZONE;

-- 2. Update the identity proxy RPC to enforce the 14-day lock
CREATE OR REPLACE FUNCTION public.update_profile_identity(
  p_nickname TEXT,
  p_avatar_url TEXT,
  p_country_code TEXT,
  p_is_in_kurdistan BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_current_nickname TEXT;
  v_last_nickname_update TIMESTAMP WITH TIME ZONE;
  v_days_passed INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate nickname length
  IF LENGTH(p_nickname) < 3 OR LENGTH(p_nickname) > 20 THEN
    RAISE EXCEPTION 'Nickname must be between 3 and 20 characters.';
  END IF;

  -- Fetch current data to check if nickname is actually changing
  SELECT nickname, last_nickname_update 
  INTO v_current_nickname, v_last_nickname_update
  FROM public.profiles 
  WHERE id = auth.uid();

  -- If the user is trying to change their nickname to something different
  IF v_current_nickname IS DISTINCT FROM p_nickname THEN
    -- Check if 14 days have passed since the last update
    IF v_last_nickname_update IS NOT NULL THEN
      -- Calculate days passed (Extract EPOCH is safe across Postgres versions)
      v_days_passed := EXTRACT(EPOCH FROM (NOW() - v_last_nickname_update)) / 86400;
      
      IF v_days_passed < 14 THEN
        RAISE EXCEPTION 'You can only change your nickname once every 14 days. % days left.', CEIL(14 - v_days_passed);
      END IF;
    END IF;

    -- Update everything AND set the last_nickname_update timer
    UPDATE profiles
    SET
      nickname = p_nickname,
      avatar_url = p_avatar_url,
      country_code = p_country_code,
      is_kurdistan = p_is_in_kurdistan,
      last_nickname_update = NOW(),
      updated_at = NOW()
    WHERE id = auth.uid();
  ELSE
    -- If nickname is the same (only changing avatar/country), DO NOT lock the timer
    UPDATE profiles
    SET
      avatar_url = p_avatar_url,
      country_code = p_country_code,
      is_kurdistan = p_is_in_kurdistan,
      updated_at = NOW()
    WHERE id = auth.uid();
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
