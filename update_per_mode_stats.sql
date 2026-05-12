-- Migration to support per-mode guess distribution
-- We change the structure from a flat object to a nested object: { "mode_id": { "1": 0, ... } }

-- 1. Reset/Initialize guess_distribution to an empty object if we want to start fresh with per-mode tracking
-- Or we can try to migrate existing data, but since we just added it, starting clean is safer.
UPDATE public.profiles SET guess_distribution = '{}'::jsonb;

-- 2. Update the sync_profile_progression RPC to handle per-mode distribution
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
  v_mode_dist JSONB;
  v_attempts_key TEXT;
  v_updated_at TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get existing stats
  SELECT current_streak, max_streak, guess_distribution
  INTO v_old_streak, v_max_streak, v_distribution
  FROM public.profiles
  WHERE id = v_user_id;

  -- Handle Win/Loss Streaks
  IF p_is_win THEN
    v_new_streak := v_old_streak + 1;
    IF v_new_streak > v_max_streak THEN
      v_max_streak := v_new_streak;
    END IF;
    
    -- Update Guess Distribution (Per Mode)
    IF p_attempts > 0 THEN
      v_attempts_key := p_attempts::TEXT;
      
      -- Get or initialize distribution for this specific mode
      v_mode_dist := v_distribution->p_mode;
      IF v_mode_dist IS NULL THEN
        v_mode_dist := '{}'::jsonb;
      END IF;
      
      -- Increment the attempt count for this mode
      v_mode_dist := jsonb_set(
        v_mode_dist, 
        ARRAY[v_attempts_key], 
        ((COALESCE(v_mode_dist->>v_attempts_key, '0'))::INTEGER + 1)::TEXT::jsonb
      );
      
      -- Put it back into the main distribution object
      v_distribution := jsonb_set(v_distribution, ARRAY[p_mode], v_mode_dist);
    END IF;
  ELSE
    v_new_streak := 0;
  END IF;

  -- Atomic update of profile
  UPDATE public.profiles
  SET 
    xp = xp + p_xp_to_add,
    fils = fils + p_fils_to_add,
    derhem = derhem + p_derhem_to_add,
    dinar = dinar + p_dinar_to_add,
    level = p_level,
    solved_words = ARRAY(SELECT DISTINCT unnest(array_cat(solved_words, p_solved_words))),
    games_played = games_played + 1,
    games_won = games_won + (CASE WHEN p_is_win THEN 1 ELSE 0 END),
    current_streak = v_new_streak,
    max_streak = v_max_streak,
    guess_distribution = v_distribution,
    updated_at = v_updated_at
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'new_xp', (SELECT xp FROM public.profiles WHERE id = v_user_id),
    'new_streak', v_new_streak
  );
END;
$$;
