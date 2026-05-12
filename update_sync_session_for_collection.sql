-- Update sync_game_session to include collection logic
CREATE OR REPLACE FUNCTION public.sync_game_session(
  p_user_id UUID,
  p_mode TEXT,
  p_magnets_used INTEGER DEFAULT 0,
  p_hints_used INTEGER DEFAULT 0,
  p_skips_used INTEGER DEFAULT 0,
  p_solved_words TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSON AS $$
DECLARE
  v_old_xp BIGINT;
  v_new_xp BIGINT;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_curr_fils INTEGER;
  v_curr_derhem INTEGER;
  v_curr_dinar INTEGER;
  v_curr_magnets INTEGER;
  v_curr_hints INTEGER;
  v_curr_skips INTEGER;
  v_award_xp INTEGER;
  v_award_amount INTEGER;
  v_award_type TEXT;
  v_leveled_up BOOLEAN := FALSE;
  v_inventory JSONB;
  v_stats JSONB;
BEGIN
  -- Security: User can only sync their own data
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get current state
  SELECT 
    xp, fils, derhem, dinar, magnets, hints, skips, inventory 
  INTO 
    v_old_xp, v_curr_fils, v_curr_derhem, v_curr_dinar, v_curr_magnets, v_curr_hints, v_curr_skips, v_inventory
  FROM profiles WHERE id = p_user_id;

  v_stats := COALESCE((v_inventory->>'stats')::JSONB, '{}'::JSONB);

  -- Anti-Cheat: Validate item consumption
  IF v_curr_magnets < p_magnets_used OR v_curr_hints < p_hints_used OR v_curr_skips < p_skips_used THEN
    RAISE EXCEPTION 'Security Violation: Insufficient items.';
  END IF;

  -- Calculate Rewards based on game mode
  IF p_mode = 'classic' THEN v_award_xp := 25; v_award_type := 'fils'; v_award_amount := 50;
  ELSIF p_mode = 'hard_words' THEN v_award_xp := 50; v_award_type := 'derhem'; v_award_amount := 1;
  ELSIF p_mode = 'battle' THEN v_award_xp := 100; v_award_type := 'dinar'; v_award_amount := 1;
  ELSIF p_mode = 'mamak' THEN v_award_xp := 30; v_award_type := 'fils'; v_award_amount := 60;
  ELSIF p_mode = 'word_fever' THEN v_award_xp := 15; v_award_type := 'fils'; v_award_amount := 20;
  ELSE v_award_xp := 10; v_award_type := 'fils'; v_award_amount := 10;
  END IF;

  -- Progression update
  v_old_level := calculate_rpg_level(v_old_xp);
  v_new_xp := v_old_xp + v_award_xp;
  v_new_level := calculate_rpg_level(v_new_xp);
  IF v_new_level > v_old_level THEN v_leveled_up := TRUE; END IF;

  -- Update Stats & Collection
  -- INSERT INTO COLLECTION (user_progress)
  IF array_length(p_solved_words, 1) > 0 THEN
    INSERT INTO public.user_progress (user_id, word_id)
    SELECT p_user_id, w.id
    FROM public.words w
    WHERE w.word = ANY(p_solved_words)
    ON CONFLICT (user_id, word_id) DO NOTHING;
  END IF;

  -- Persist profile updates
  UPDATE profiles
  SET 
    xp = v_new_xp,
    level = v_new_level,
    fils = CASE WHEN v_award_type = 'fils' THEN v_curr_fils + v_award_amount ELSE v_curr_fils END,
    derhem = CASE WHEN v_award_type = 'derhem' THEN v_curr_derhem + v_award_amount ELSE v_curr_derhem END,
    dinar = CASE WHEN v_award_type = 'dinar' THEN v_curr_dinar + v_award_amount ELSE v_curr_dinar END,
    magnets = v_curr_magnets - p_magnets_used,
    hints = v_curr_hints - p_hints_used,
    skips = v_curr_skips - p_skips_used,
    inventory = jsonb_set(
        jsonb_set(COALESCE(inventory, '{}'::JSONB), '{stats}', v_stats),
        '{solved_words}', 
        COALESCE(inventory->'solved_words', '[]'::JSONB) || to_jsonb(p_solved_words)
    ),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'new_xp', v_new_xp,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'award_xp', v_award_xp,
    'award_type', v_award_type,
    'award_amount', v_award_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
