-- Migration to add Global Stats and Guess Distribution to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS guess_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0}';

-- Update the sync_profile_progression RPC to handle these stats
CREATE OR REPLACE FUNCTION public.sync_profile_progression(
  p_xp_to_add INTEGER,
  p_fils_to_add INTEGER,
  p_derhem_to_add INTEGER,
  p_dinar_to_add INTEGER,
  p_level INTEGER,
  p_solved_words TEXT[],
  p_mode TEXT,
  p_score INTEGER,
  p_is_win BOOLEAN DEFAULT TRUE,
  p_attempts INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_streak INTEGER;
  v_new_streak INTEGER;
  v_max_streak INTEGER;
  v_distribution JSONB;
  v_attempts_key TEXT;
  v_new_xp INTEGER;
  v_daily_streak INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current stats
  SELECT current_streak, max_streak, guess_distribution, xp
  INTO v_old_streak, v_max_streak, v_distribution, v_new_xp
  FROM public.profiles
  WHERE id = v_user_id;

  -- Calculate streaks and distribution
  IF p_is_win THEN
    v_new_streak := v_old_streak + 1;
    IF v_new_streak > v_max_streak THEN
      v_max_streak := v_new_streak;
    END IF;

    -- Update guess distribution if attempts is between 1 and 6
    IF p_attempts > 0 AND p_attempts <= 6 THEN
      v_attempts_key := p_attempts::TEXT;
      v_distribution := jsonb_set(
        v_distribution, 
        ARRAY[v_attempts_key], 
        ((v_distribution->>v_attempts_key)::INTEGER + 1)::TEXT::jsonb
      );
    END IF;
  ELSE
    v_new_streak := 0;
  END IF;

  -- Update profile with atomic increments and new stats
  UPDATE public.profiles
  SET 
    xp = xp + p_xp_to_add,
    fils = fils + p_fils_to_add,
    derhem = derhem + p_derhem_to_add,
    dinar = dinar + p_dinar_to_add,
    level = p_level,
    solved_words = p_solved_words,
    games_played = games_played + 1,
    games_won = CASE WHEN p_is_win THEN games_won + 1 ELSE games_won END,
    current_streak = v_new_streak,
    max_streak = v_max_streak,
    guess_distribution = v_distribution,
    updated_at = NOW()
  WHERE id = v_user_id
  RETURNING xp, daily_streak INTO v_new_xp, v_daily_streak;

  RETURN jsonb_build_object(
    'success', true,
    'new_xp', v_new_xp,
    'new_level', p_level,
    'award_xp', p_xp_to_add,
    'daily_streak', v_daily_streak
  );
END;
$$;
