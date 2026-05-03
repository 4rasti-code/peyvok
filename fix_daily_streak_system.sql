-- Fix Daily Streak System: Database Side Logic
-- This migration adds last_streak_at to track daily activity and updates the sync RPC.

-- 1. Add last_streak_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_streak_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_streak_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Drop the old function first to avoid parameter/return type conflicts
DROP FUNCTION IF EXISTS public.sync_profile_progression(integer,integer);
DROP FUNCTION IF EXISTS public.sync_profile_progression(integer,integer,integer,integer,integer,text[],text,integer);

-- 3. Create a smarter progression sync function that handles streaks
CREATE OR REPLACE FUNCTION public.sync_profile_progression(
  p_xp_to_add INTEGER,
  p_fils_to_add INTEGER DEFAULT 0,
  p_derhem_to_add INTEGER DEFAULT 0,
  p_dinar_to_add INTEGER DEFAULT 0,
  p_level INTEGER DEFAULT 1,
  p_solved_words TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_mode TEXT DEFAULT 'classic',
  p_score INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_current_streak INTEGER;
  v_last_streak_at TIMESTAMP WITH TIME ZONE;
  v_today DATE := CURRENT_DATE;
  v_new_streak INTEGER;
  v_new_xp INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get current streak data
  SELECT daily_streak, last_streak_at, xp INTO v_current_streak, v_last_streak_at, v_new_xp FROM profiles WHERE id = auth.uid();

  -- Streak Logic (Only for certain modes)
  IF p_mode IN ('classic', 'mamak', 'hard_words', 'secret_word') THEN
    IF v_last_streak_at IS NULL THEN
      v_new_streak := 1;
    ELSIF v_last_streak_at::DATE = v_today THEN
      -- Already played today, keep current streak
      v_new_streak := COALESCE(v_current_streak, 1);
    ELSIF v_last_streak_at::DATE = v_today - INTERVAL '1 day' THEN
      -- Played yesterday, increment streak
      v_new_streak := COALESCE(v_current_streak, 0) + 1;
    ELSE
      -- Missed a day, reset to 1
      v_new_streak := 1;
    END IF;
    
    -- Update last_streak_at to now
    v_last_streak_at := NOW();
  ELSE
    v_new_streak := COALESCE(v_current_streak, 0);
  END IF;

  -- Perform atomic update
  UPDATE profiles
  SET
    xp = xp + p_xp_to_add,
    fils = fils + p_fils_to_add,
    derhem = derhem + p_derhem_to_add,
    dinar = dinar + p_dinar_to_add,
    level = p_level,
    daily_streak = v_new_streak,
    last_streak_at = v_last_streak_at,
    inventory = jsonb_set(
      COALESCE(inventory, '{"solved_words": []}'::JSONB),
      '{solved_words}',
      (SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements_text(COALESCE(inventory->'solved_words', '[]'::JSONB) || to_jsonb(p_solved_words)) t(x))
    ),
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING xp INTO v_new_xp;

  RETURN json_build_object(
    'success', true, 
    'new_xp', v_new_xp, 
    'daily_streak', v_new_streak,
    'last_streak_at', v_last_streak_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
