-- FINAL BULLETPROOF DAILY REWARD SYSTEM
-- 1. Drop existing versions to clear ambiguity
DROP FUNCTION IF EXISTS public.claim_daily_reward();
DROP FUNCTION IF EXISTS public.claim_daily_reward(DATE);

CREATE OR REPLACE FUNCTION public.claim_daily_reward()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_streak INTEGER;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_today_date DATE := (v_now AT TIME ZONE 'UTC')::DATE;
  v_last_claim_date DATE;
  v_diff INTEGER;
  
  -- Reward values
  v_reward_fils INTEGER := 0;
  v_reward_derhem INTEGER := 0;
  v_reward_dinar INTEGER := 0;
  v_reward_magnets INTEGER := 0;
  v_reward_hints INTEGER := 0;
  v_reward_skips INTEGER := 0;
BEGIN
  -- Security check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Lock and fetch profile data
  SELECT last_reward_claimed_at, reward_streak 
  INTO v_last_claim, v_streak
  FROM public.profiles 
  WHERE id = v_user_id
  FOR UPDATE;

  -- Default values for new users
  v_streak := COALESCE(v_streak, 0);
  
  -- Check if already claimed today
  IF v_last_claim IS NOT NULL THEN
    v_last_claim_date := (v_last_claim AT TIME ZONE 'UTC')::DATE;
    IF v_last_claim_date = v_today_date THEN
      RETURN json_build_object('success', false, 'message', 'Already claimed today');
    END IF;
    
    -- Calculate days passed
    v_diff := v_today_date - v_last_claim_date;
    
    -- Logic for streak
    IF v_diff = 1 THEN
      -- Consecutive day
      v_streak := (v_streak % 7) + 1;
    ELSE
      -- Missed a day or more
      v_streak := 1;
    END IF;
  ELSE
    -- First time ever
    v_streak := 1;
  END IF;

  -- Define rewards based on the NEW v_streak
  IF v_streak = 1 THEN v_reward_fils := 200;
  ELSIF v_streak = 2 THEN v_reward_hints := 1;
  ELSIF v_streak = 3 THEN v_reward_derhem := 5;
  ELSIF v_streak = 4 THEN v_reward_magnets := 1;
  ELSIF v_streak = 5 THEN v_reward_derhem := 15;
  ELSIF v_streak = 6 THEN v_reward_skips := 1;
  ELSIF v_streak = 7 THEN v_reward_fils := 2000; v_reward_dinar := 1;
  END IF;

  -- Update profiles table
  UPDATE public.profiles
  SET 
    reward_streak = v_streak,
    last_reward_claimed_at = v_now,
    fils = fils + v_reward_fils,
    derhem = derhem + v_reward_derhem,
    dinar = dinar + v_reward_dinar,
    magnet_count = magnet_count + v_reward_magnets,
    hint_count = hint_count + v_reward_hints,
    skip_count = skip_count + v_reward_skips
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true, 
    'streak', v_streak,
    'rewards', json_build_object(
      'fils', v_reward_fils,
      'derhem', v_reward_derhem,
      'dinar', v_reward_dinar,
      'magnets', v_reward_magnets,
      'hints', v_reward_hints,
      'skips', v_reward_skips
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
