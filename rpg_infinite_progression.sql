-- RPG Infinite Progression & Multi-Currency System
-- This script updates the handle_game_xp function to handle infinite leveling and specific currency awards.

-- 1. Helper function to calculate level from XP based on the infinite formula
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
        -- XP = 5500 + 15000 * (1.2^(level-5) - 1)
        -- (XP - 5500) / 15000 + 1 = 1.2^(level-5)
        -- log1.2((XP - 5500) / 15000 + 1) = level - 5
        -- level = 5 + floor(log((XP - 5500)/15000 + 1) / log(1.2))
        v_level := 5 + floor(log(1.2, ((p_xp - 5500)::NUMERIC / 15000) + 1));
        RETURN v_level;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper function to calculate Total XP required for a specific level
CREATE OR REPLACE FUNCTION get_total_xp_for_level(p_level INTEGER)
RETURNS BIGINT AS $$
BEGIN
    IF p_level <= 1 THEN RETURN 0;
    ELSIF p_level = 2 THEN RETURN 500;
    ELSIF p_level = 3 THEN RETURN 1500;
    ELSIF p_level = 4 THEN RETURN 3000;
    ELSIF p_level = 5 THEN RETURN 5500;
    ELSE
        -- TotalXP(n) = 5500 + 15000 * (1.2^(n-5) - 1)
        RETURN floor(5500 + 15000 * (pow(1.2, p_level - 5) - 1))::BIGINT;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Atomic RPG & Currency Reward Function
CREATE OR REPLACE FUNCTION handle_game_xp(
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
  v_old_fils INTEGER;
  v_old_derhem INTEGER;
  v_old_dinar INTEGER;
  v_leveled_up BOOLEAN := FALSE;
BEGIN
  -- Get current state
  SELECT xp, fils, derhem, dinar INTO v_old_xp, v_old_fils, v_old_derhem, v_old_dinar
  FROM profiles WHERE id = p_user_id;
  
  v_old_level := calculate_rpg_level(v_old_xp);
  v_new_xp := v_old_xp + p_award_xp;
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

-- 4. Update Leaderboard View to rank by Level and XP
DROP VIEW IF EXISTS leaderboard_view;
CREATE VIEW leaderboard_view AS
SELECT 
  id,
  nickname,
  avatar_url,
  level,
  xp,
  updated_at
FROM profiles
ORDER BY level DESC, xp DESC;

-- 5. Cleanup: Remove legacy level columns if they exist (OPTIONAL - user might want to keep data for a while)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS mamak_level;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS hard_level;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS lightning_level;
