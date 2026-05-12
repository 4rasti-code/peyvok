-- Peyvçîn Security Hardening Phase 1: Atomic Protected Progression
-- This script replaces handle_game_xp with a version that includes:
-- 1. Sanity Checks (Max XP/Currency per match)
-- 2. Inventory Consumption (Magnets/Hints/Skips)
-- 3. Stats & Solved Words Sync
-- 4. RLS Lockdown (Prevents client-side direct tampering)

-- I. UPGRADED ATOMIC PROGRESSION FUNCTION
CREATE OR REPLACE FUNCTION public.sync_game_session(
  p_user_id UUID,
  p_mode TEXT, -- 'classic', 'battle', 'mamak', etc.
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
  -- 1. SECURITY CHECK: Ensure user is updating their own record
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only sync your own progress.';
  END IF;

  -- 2. GET CURRENT STATE
  SELECT 
    xp, fils, derhem, dinar, magnets, hints, skips, inventory 
  INTO 
    v_old_xp, v_curr_fils, v_curr_derhem, v_curr_dinar, v_curr_magnets, v_curr_hints, v_curr_skips, v_inventory
  FROM profiles WHERE id = p_user_id;

  v_stats := COALESCE((v_inventory->>'stats')::JSONB, '{}'::JSONB);

  -- 3. VALIDATE INVENTORY (Anti-Cheat)
  IF v_curr_magnets < p_magnets_used OR v_curr_hints < p_hints_used OR v_curr_skips < p_skips_used THEN
    RAISE EXCEPTION 'Security Violation: Insufficient items to consume.';
  END IF;

  -- 4. CALCULATE REWARDS (Hardcoded for security)
  IF p_mode = 'classic' THEN v_award_xp := 25; v_award_type := 'fils'; v_award_amount := 50;
  ELSIF p_mode = 'hard_words' THEN v_award_xp := 50; v_award_type := 'derhem'; v_award_amount := 1;
  ELSIF p_mode = 'battle' THEN v_award_xp := 100; v_award_type := 'dinar'; v_award_amount := 1;
  ELSIF p_mode = 'mamak' THEN v_award_xp := 30; v_award_type := 'fils'; v_award_amount := 60;
  ELSIF p_mode = 'word_fever' THEN v_award_xp := 15; v_award_type := 'fils'; v_award_amount := 20;
  ELSE v_award_xp := 10; v_award_type := 'fils'; v_award_amount := 10;
  END IF;

  -- 5. CALCULATE NEW PROGRESSION
  v_old_level := calculate_rpg_level(v_old_xp);
  v_new_xp := v_old_xp + v_award_xp;
  v_new_level := calculate_rpg_level(v_new_xp);
  IF v_new_level > v_old_level THEN v_leveled_up := TRUE; END IF;

  -- 6. UPDATE STATS JSON (Server-side update)
  IF p_mode = 'classic' THEN
    v_stats := jsonb_set(v_stats, '{classic,totalCorrect}', (COALESCE(v_stats->'classic'->>'totalCorrect', '0')::int + 1)::text::jsonb);
    v_stats := jsonb_set(v_stats, '{classic,currentStreak}', (COALESCE(v_stats->'classic'->>'currentStreak', '0')::int + 1)::text::jsonb);
    IF (v_stats->'classic'->>'currentStreak')::int > (v_stats->'classic'->>'bestStreak')::int THEN
        v_stats := jsonb_set(v_stats, '{classic,bestStreak}', (v_stats->'classic'->>'currentStreak')::jsonb);
    END IF;
  ELSIF p_mode = 'battle' THEN
    v_stats := jsonb_set(v_stats, '{battle,totalWins}', (COALESCE(v_stats->'battle'->>'totalWins', '0')::int + 1)::text::jsonb);
  END IF;

  -- 7. ATOMIC PERSISTENCE
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

-- II. LOCKDOWN RLS POLICIES
DROP POLICY IF EXISTS "Users can update non-critical fields" ON profiles;
CREATE POLICY "Users can update non-critical fields" 
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    (old.xp = new.xp OR new.xp IS NULL) AND
    (old.level = new.level OR new.level IS NULL) AND
    (old.fils = new.fils OR new.fils IS NULL) AND
    (old.derhem = new.derhem OR new.derhem IS NULL) AND
    (old.dinar = new.dinar OR new.dinar IS NULL) AND
    (old.magnets = new.magnets OR new.magnets IS NULL) AND
    (old.hints = new.hints OR new.hints IS NULL) AND
    (old.skips = new.skips OR new.skips IS NULL)
  )
);
