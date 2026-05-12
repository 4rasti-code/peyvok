-- UPDATE DAILY REWARD TO BE TIMEZONE-AWARE OR ACCEPT CLIENT DATE
CREATE OR REPLACE FUNCTION public.claim_daily_reward(client_date DATE DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_last_claim DATE;
  v_streak INTEGER;
  v_reward_fils INTEGER := 0;
  v_reward_derhem INTEGER := 0;
  v_reward_dinar INTEGER := 0;
  v_reward_magnets INTEGER := 0;
  v_reward_hints INTEGER := 0;
  v_reward_skips INTEGER := 0;
  v_today DATE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Use client date if provided, otherwise use server date
  v_today := COALESCE(client_date, CURRENT_DATE);

  SELECT last_reward_claimed_at::DATE, reward_streak 
  INTO v_last_claim, v_streak 
  FROM profiles WHERE id = auth.uid();

  -- Check if already claimed today (based on the same date context)
  IF v_last_claim IS NOT NULL AND v_last_claim = v_today THEN
    RETURN json_build_object('success', false, 'message', 'Already claimed today', 'streak', v_streak);
  END IF;

  -- Reset streak if missed a day
  -- We use the same v_today context for consistency
  IF v_last_claim IS NULL OR v_last_claim < v_today - INTERVAL '1 day' THEN
    v_streak := 1;
  ELSE
    v_streak := (v_streak % 7) + 1;
  END IF;

  -- Apply rewards based on streak day
  CASE v_streak
    WHEN 1 THEN v_reward_fils := 200;
    WHEN 2 THEN v_reward_hints := 1;
    WHEN 3 THEN v_reward_derhem := 5;
    WHEN 4 THEN v_reward_magnets := 1;
    WHEN 5 THEN v_reward_derhem := 15;
    WHEN 6 THEN v_reward_skips := 1;
    WHEN 7 THEN v_reward_fils := 2000; v_reward_dinar := 1;
  END CASE;

  UPDATE profiles
  SET
    fils = fils + v_reward_fils,
    derhem = derhem + v_reward_derhem,
    dinar = dinar + v_reward_dinar,
    magnets = magnets + v_reward_magnets,
    hints = hints + v_reward_hints,
    skips = skips + v_reward_skips,
    reward_streak = v_streak,
    last_reward_claimed_at = NOW(),
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'streak', v_streak);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
