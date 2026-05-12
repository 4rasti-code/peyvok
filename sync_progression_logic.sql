-- 🔄 FINAL CONSOLIDATED PROGRESSION SYNC
-- This script ensures the Database Leveling Logic matches progression.js EXACTLY.

-- 1. Helper to calculate Level from XP (Matches progression.js getLevelFromXP)
CREATE OR REPLACE FUNCTION calculate_rpg_level(p_xp BIGINT)
RETURNS INTEGER AS $$
DECLARE
    v_level INTEGER := 1;
    v_current_xp BIGINT := p_xp;
    v_req BIGINT;
BEGIN
    IF v_current_xp <= 0 THEN RETURN 1; END IF;

    -- Level 1-10: 500 XP per level
    FOR i IN 1..10 LOOP
        IF v_current_xp >= 500 THEN
            v_current_xp := v_current_xp - 500;
            v_level := v_level + 1;
        ELSE RETURN v_level; END IF;
    END LOOP;

    -- Level 11-25: 1000 XP per level
    FOR i IN 11..25 LOOP
        IF v_current_xp >= 1000 THEN
            v_current_xp := v_current_xp - 1000;
            v_level := v_level + 1;
        ELSE RETURN v_level; END IF;
    END LOOP;

    -- Level 26-50: 2500 XP per level
    FOR i IN 26..50 LOOP
        IF v_current_xp >= 2500 THEN
            v_current_xp := v_current_xp - 2500;
            v_level := v_level + 1;
        ELSE RETURN v_level; END IF;
    END LOOP;

    -- Level 51-100: 5000 XP per level
    FOR i IN 51..100 LOOP
        IF v_current_xp >= 5000 THEN
            v_current_xp := v_current_xp - 5000;
            v_level := v_level + 1;
        ELSE RETURN v_level; END IF;
    END LOOP;

    -- Level 101+: Exponential (floor(5000 * 1.05^(level-100)))
    WHILE TRUE LOOP
        v_req := floor(5000 * pow(1.05, v_level - 100));
        IF v_current_xp >= v_req THEN
            v_current_xp := v_current_xp - v_req;
            v_level := v_level + 1;
        ELSE EXIT; END IF;
    END LOOP;

    RETURN v_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper to calculate Total XP for Level (Matches progression.js getTotalXPForLevel)
CREATE OR REPLACE FUNCTION get_total_xp_for_level(p_level INTEGER)
RETURNS BIGINT AS $$
DECLARE
    v_total BIGINT := 0;
BEGIN
    IF p_level <= 1 THEN RETURN 0; END IF;

    FOR l IN 1..(p_level - 1) LOOP
        IF l <= 10 THEN v_total := v_total + 500;
        ELSIF l <= 25 THEN v_total := v_total + 1000;
        ELSIF l <= 50 THEN v_total := v_total + 2500;
        ELSIF l <= 100 THEN v_total := v_total + 5000;
        ELSE v_total := v_total + floor(5000 * pow(1.05, l - 100));
        END IF;
    END LOOP;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Ensure profiles table has correct data and trigger
-- Update all existing levels based on the new logic
UPDATE public.profiles SET level = calculate_rpg_level(COALESCE(xp, 0));

-- 4. Create a trigger to automatically update level whenever XP changes
CREATE OR REPLACE FUNCTION trigger_update_profile_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := calculate_rpg_level(NEW.xp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_xp_change_update_level ON public.profiles;
CREATE TRIGGER on_xp_change_update_level
BEFORE UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_update_profile_level();

-- 5. Standardized Reward Atomic RPC
CREATE OR REPLACE FUNCTION public.handle_game_xp_v2(
  p_user_id UUID,
  p_award_xp INTEGER,
  p_currency_type TEXT, -- 'fils', 'derhem', 'dinar'
  p_currency_amount INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_old_xp BIGINT;
  v_new_xp BIGINT;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN := FALSE;
BEGIN
  -- Get current state
  SELECT xp, level INTO v_old_xp, v_old_level FROM profiles WHERE id = p_user_id;
  
  v_new_xp := COALESCE(v_old_xp, 0) + p_award_xp;
  v_new_level := calculate_rpg_level(v_new_xp);
  
  IF v_new_level > v_old_level THEN
    v_leveled_up := TRUE;
  END IF;

  -- Atomic Update
  UPDATE profiles
  SET 
    xp = v_new_xp,
    level = v_new_level,
    fils = CASE WHEN p_currency_type = 'fils' THEN COALESCE(fils, 0) + p_currency_amount ELSE fils END,
    derhem = CASE WHEN p_currency_type = 'derhem' THEN COALESCE(derhem, 0) + p_currency_amount ELSE derhem END,
    dinar = CASE WHEN p_currency_type = 'dinar' THEN COALESCE(dinar, 0) + p_currency_amount ELSE dinar END,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'leveled_up', v_leveled_up,
    'new_level', v_new_level,
    'new_xp', v_new_xp,
    'award_xp', p_award_xp,
    'award_amount', p_currency_amount,
    'award_type', p_currency_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Patch sync_profile_progression to ignore p_level and use calculate_rpg_level
-- This ensures that even if the frontend sends a desynced level, the DB corrects it.
CREATE OR REPLACE FUNCTION public.sync_profile_progression(
  p_xp_to_add INTEGER,
  p_fils_to_add INTEGER,
  p_derhem_to_add INTEGER,
  p_dinar_to_add INTEGER,
  p_level INTEGER, -- Now ignored in favor of server-side calculation
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
  v_new_level INTEGER;
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

  -- 2. Get current stats
  SELECT current_streak, max_streak, guess_distribution, xp
  INTO v_old_streak, v_max_streak, v_distribution, v_new_xp
  FROM public.profiles
  WHERE id = v_user_id;

  -- 3. Update XP and calculate NEW level server-side
  v_new_xp := COALESCE(v_new_xp, 0) + p_xp_to_add;
  v_new_level := calculate_rpg_level(v_new_xp);

  -- 4. Calculate streaks and distribution
  IF p_is_win THEN
    v_new_streak := COALESCE(v_old_streak, 0) + 1;
    IF v_new_streak > COALESCE(v_max_streak, 0) THEN
      v_max_streak := v_new_streak;
    END IF;

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

  -- 5. Update profile
  UPDATE public.profiles
  SET 
    xp = v_new_xp,
    fils = fils + p_fils_to_add,
    derhem = derhem + p_derhem_to_add,
    dinar = dinar + p_dinar_to_add,
    level = v_new_level, -- Server-side source of truth
    solved_words = p_solved_words,
    games_played = COALESCE(games_played, 0) + 1,
    games_won = CASE WHEN p_is_win THEN COALESCE(games_won, 0) + 1 ELSE COALESCE(games_won, 0) END,
    current_streak = v_new_streak,
    max_streak = v_max_streak,
    guess_distribution = v_distribution,
    
    flawless_wins = CASE WHEN p_is_flawless THEN COALESCE(flawless_wins, 0) + 1 ELSE flawless_wins END,
    secret_wins = CASE WHEN p_is_secret_win THEN COALESCE(secret_wins, 0) + 1 ELSE secret_wins END,
    riddles_no_skip = CASE WHEN p_is_riddle_no_skip THEN COALESCE(riddles_no_skip, 0) + 1 ELSE riddles_no_skip END,
    pvp_flawless_wins = CASE WHEN p_is_pvp_flawless THEN COALESCE(pvp_flawless_wins, 0) + 1 ELSE pvp_flawless_wins END,
    pvp_wins = CASE WHEN (p_mode = 'battle' AND p_is_win) THEN COALESCE(pvp_wins, 0) + 1 ELSE pvp_wins END,
    
    mode_play_counts = jsonb_set(
        COALESCE(mode_play_counts, '{"classic":0, "battle":0, "mamak":0, "hard_words":0, "word_fever":0, "secret_word":0}'::jsonb),
        ARRAY[p_mode],
        (COALESCE((mode_play_counts->>p_mode)::int, 0) + 1)::text::jsonb
    ),
    
    updated_at = NOW()
  WHERE id = v_user_id
  RETURNING daily_streak INTO v_daily_streak;

  RETURN jsonb_build_object(
    'success', true,
    'new_xp', v_new_xp,
    'new_level', v_new_level,
    'award_xp', p_xp_to_add,
    'daily_streak', v_daily_streak
  );
END;
$$;
