-- 4-Tier Achievement Stats Migration (Revised)
-- Adds tracking for Secret Word wins, Riddles without skip, and PvP flawless wins
-- Updates sync_profile_progression to handle these new metrics

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS secret_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS riddles_no_skip INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pvp_flawless_wins INTEGER DEFAULT 0;

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
  p_attempts INTEGER DEFAULT 0,
  p_is_flawless BOOLEAN DEFAULT FALSE,
  p_is_secret_win BOOLEAN DEFAULT FALSE,
  p_is_riddle_no_skip BOOLEAN DEFAULT FALSE,
  p_is_pvp_flawless BOOLEAN DEFAULT FALSE
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
  v_today DATE;
  v_last_active DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_today := CURRENT_DATE;

  -- 1. Daily Retention Logic
  SELECT last_active_date INTO v_last_active FROM public.profiles WHERE id = v_user_id;
  IF v_last_active IS NULL OR v_last_active < v_today THEN
    UPDATE public.profiles 
    SET 
        total_active_days = COALESCE(total_active_days, 0) + 1,
        last_active_date = v_today
    WHERE id = v_user_id;
  END IF;

  -- 2. Get current stats for streaks and distribution
  SELECT current_streak, max_streak, guess_distribution, xp
  INTO v_old_streak, v_max_streak, v_distribution, v_new_xp
  FROM public.profiles
  WHERE id = v_user_id;

  -- 3. Calculate streaks and distribution
  IF p_is_win THEN
    v_new_streak := COALESCE(v_old_streak, 0) + 1;
    IF v_new_streak > COALESCE(v_max_streak, 0) THEN
      v_max_streak := v_new_streak;
    END IF;

    -- Update guess distribution (handling per-mode if needed, but here we update global for now as per global_stats_system)
    IF p_attempts > 0 AND p_attempts <= 6 THEN
      v_attempts_key := p_attempts::TEXT;
      v_distribution := jsonb_set(
        COALESCE(v_distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb), 
        ARRAY[v_attempts_key], 
        (COALESCE((v_distribution->>v_attempts_key)::INTEGER, 0) + 1)::TEXT::jsonb
      );
    END IF;
  ELSE
    v_new_streak := 0;
  END IF;

  -- 4. Update profile with everything
  UPDATE public.profiles
  SET 
    xp = xp + p_xp_to_add,
    fils = fils + p_fils_to_add,
    derhem = derhem + p_derhem_to_add,
    dinar = dinar + p_dinar_to_add,
    level = p_level,
    solved_words = p_solved_words,
    games_played = COALESCE(games_played, 0) + 1,
    games_won = CASE WHEN p_is_win THEN COALESCE(games_won, 0) + 1 ELSE COALESCE(games_won, 0) END,
    current_streak = v_new_streak,
    max_streak = v_max_streak,
    guess_distribution = v_distribution,
    
    -- New Achievement Metrics
    flawless_wins = CASE WHEN p_is_flawless THEN COALESCE(flawless_wins, 0) + 1 ELSE flawless_wins END,
    secret_wins = CASE WHEN p_is_secret_win THEN COALESCE(secret_wins, 0) + 1 ELSE secret_wins END,
    riddles_no_skip = CASE WHEN p_is_riddle_no_skip THEN COALESCE(riddles_no_skip, 0) + 1 ELSE riddles_no_skip END,
    pvp_flawless_wins = CASE WHEN p_is_pvp_flawless THEN COALESCE(pvp_flawless_wins, 0) + 1 ELSE pvp_flawless_wins END,
    pvp_wins = CASE WHEN (p_mode = 'battle' AND p_is_win) THEN COALESCE(pvp_wins, 0) + 1 ELSE pvp_wins END,
    
    -- Mode Play Counts (Update JSONB)
    mode_play_counts = jsonb_set(
        COALESCE(mode_play_counts, '{"classic":0, "battle":0, "mamak":0, "hard_words":0, "word_fever":0, "secret_word":0}'::jsonb),
        ARRAY[p_mode],
        (COALESCE((mode_play_counts->>p_mode)::int, 0) + 1)::text::jsonb
    ),
    
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
