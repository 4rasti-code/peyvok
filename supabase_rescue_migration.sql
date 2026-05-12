-- ==========================================
-- PEYVÇÎN 2.0: EMERGENCY RESCUE MIGRATION
-- This script fixes the "Secured Sync Failed" errors by:
-- 1. Standardizing currency column names (derhem -> derhem)
-- 2. Creating missing RPC functions for game synchronization
-- ==========================================

-- 1. Standardize Currency Column Name (derhem -> derhem)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'profiles' 
        AND column_name = 'derhem'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'profiles' 
        AND column_name = 'derhem'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN derhem TO derhem;
    END IF;
END $$;

-- 2. Create Level Calculation Helper
CREATE OR REPLACE FUNCTION calculate_rpg_level(p_xp BIGINT)
RETURNS INTEGER AS $$
DECLARE
    v_level INTEGER;
BEGIN
    IF p_xp < 500 THEN RETURN 1;
    ELSIF p_xp < 1500 THEN RETURN 2;
    ELSIF p_xp < 3000 THEN RETURN 3;
    ELSIF p_xp < 5500 THEN RETURN 4;
    ELSE
        -- level = 5 + floor(log(1.2, ((XP - 5500)/15000 + 1)))
        v_level := 5 + floor(log(1.2, ((p_xp - 5500)::NUMERIC / 15000) + 1));
        RETURN v_level;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Create Main Game Sync RPC (Secured)
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

  -- Calculate Rewards based on game mode (SYNCED WITH NEW DISTRIBUTION)
  IF p_mode = 'classic' THEN v_award_xp := 20; v_award_type := 'fils'; v_award_amount := 25;
  ELSIF p_mode = 'word_fever' THEN v_award_xp := 40; v_award_type := 'fils'; v_award_amount := 50;
  ELSIF p_mode = 'mamak' THEN v_award_xp := 45; v_award_type := 'fils'; v_award_amount := 60;
  ELSIF p_mode = 'hard_words' THEN v_award_xp := 60; v_award_type := 'fils'; v_award_amount := 80;
  ELSIF p_mode = 'battle' THEN v_award_xp := 100; v_award_type := 'derhem'; v_award_amount := 5;
  ELSIF p_mode = 'secret_word' THEN v_award_xp := 120; v_award_type := 'fils'; v_award_amount := 100;
  ELSE v_award_xp := 10; v_award_type := 'fils'; v_award_amount := 10;
  END IF;

  -- Progression update
  v_old_level := calculate_rpg_level(v_old_xp);
  v_new_xp := v_old_xp + v_award_xp;
  v_new_level := calculate_rpg_level(v_new_xp);
  IF v_new_level > v_old_level THEN v_leveled_up := TRUE; END IF;

  -- Update Stats
  IF p_mode = 'classic' THEN
    v_stats := jsonb_set(v_stats, '{classic,totalCorrect}', (COALESCE(v_stats->'classic'->>'totalCorrect', '0')::int + 1)::text::jsonb);
  ELSIF p_mode = 'battle' THEN
    v_stats := jsonb_set(v_stats, '{battle,totalWins}', (COALESCE(v_stats->'battle'->>'totalWins', '0')::int + 1)::text::jsonb);
  END IF;

  -- Persist updates
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
