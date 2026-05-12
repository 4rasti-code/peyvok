-- Peyvçîn Security Hardening Phase 2: RPC-First Architecture
-- This script migrates critical state updates to server-side RPCs and locks down direct client-side updates.
-- Fixed: Replaced invalid RLS 'old/new' syntax with a secure Trigger-based column lock.
-- Fixed: Aligned with schema (individual columns for currencies and inventory).

-- 1. SECURE TRANSACTION HANDLER (Atomic Purchase)
CREATE OR REPLACE FUNCTION public.process_purchase(
  p_item_id TEXT,
  p_item_type TEXT, -- 'powerup', 'avatar', 'theme', 'package', 'currency'
  p_currency_used TEXT, -- 'fils', 'derhem', 'dinar'
  p_price INTEGER,
  p_amount INTEGER DEFAULT 0 -- For currency packs or powerup counts
)
RETURNS JSON AS $$
DECLARE
  v_curr_balance INTEGER;
  v_owned_avatars JSONB;
  v_unlocked_themes JSONB;
BEGIN
  -- Security check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be logged in to purchase.';
  END IF;

  -- Get current balance and inventory
  IF p_currency_used = 'fils' THEN
    SELECT fils, owned_avatars, unlocked_themes INTO v_curr_balance, v_owned_avatars, v_unlocked_themes FROM profiles WHERE id = auth.uid();
  ELSIF p_currency_used = 'derhem' THEN
    SELECT derhem, owned_avatars, unlocked_themes INTO v_curr_balance, v_owned_avatars, v_unlocked_themes FROM profiles WHERE id = auth.uid();
  ELSIF p_currency_used = 'dinar' THEN
    SELECT dinar, owned_avatars, unlocked_themes INTO v_curr_balance, v_owned_avatars, v_unlocked_themes FROM profiles WHERE id = auth.uid();
  ELSE
    RAISE EXCEPTION 'Invalid currency type.';
  END IF;

  -- 1. Balance Check
  IF v_curr_balance < p_price THEN
    RAISE EXCEPTION 'Insufficient balance.';
  END IF;

  -- 2. Process Purchase Logic
  IF p_item_type = 'powerup' THEN
    UPDATE profiles 
    SET 
      fils = CASE WHEN p_currency_used = 'fils' THEN fils - p_price ELSE fils END,
      derhem = CASE WHEN p_currency_used = 'derhem' THEN derhem - p_price ELSE derhem END,
      dinar = CASE WHEN p_currency_used = 'dinar' THEN dinar - p_price ELSE dinar END,
      magnets = CASE WHEN p_item_id = 'attractor_field' THEN magnets + 1 ELSE magnets END,
      hints = CASE WHEN p_item_id = 'hint_pack' THEN hints + 1 ELSE hints END,
      skips = CASE WHEN p_item_id = 'full_skip' THEN skips + 1 ELSE skips END,
      updated_at = NOW()
    WHERE id = auth.uid();

  ELSIF p_item_type = 'avatar' THEN
    IF v_owned_avatars ? p_item_id THEN
      RAISE EXCEPTION 'Item already owned.';
    END IF;
    
    UPDATE profiles
    SET
      fils = CASE WHEN p_currency_used = 'fils' THEN fils - p_price ELSE fils END,
      derhem = CASE WHEN p_currency_used = 'derhem' THEN derhem - p_price ELSE derhem END,
      owned_avatars = v_owned_avatars || to_jsonb(p_item_id),
      updated_at = NOW()
    WHERE id = auth.uid();

  ELSIF p_item_type = 'theme' THEN
    IF v_unlocked_themes ? p_item_id THEN
      RAISE EXCEPTION 'Theme already unlocked.';
    END IF;

    UPDATE profiles
    SET
      fils = CASE WHEN p_currency_used = 'fils' THEN fils - p_price ELSE fils END,
      derhem = CASE WHEN p_currency_used = 'derhem' THEN derhem - p_price ELSE derhem END,
      dinar = CASE WHEN p_currency_used = 'dinar' THEN dinar - p_price ELSE dinar END,
      unlocked_themes = v_unlocked_themes || to_jsonb(p_item_id),
      updated_at = NOW()
    WHERE id = auth.uid();

  ELSIF p_item_type = 'package' AND p_item_id = 'premium_bundle' THEN
    -- Bundle contents: 1000 fils + 3 magnets + 2 skips + 1 hint
    UPDATE profiles
    SET
      fils = fils + 1000,
      magnets = magnets + 3,
      skips = skips + 2,
      hints = hints + 1,
      updated_at = NOW()
    WHERE id = auth.uid();

  ELSIF p_item_type = 'currency' THEN
    UPDATE profiles
    SET
      fils = CASE WHEN p_item_id LIKE 'fils_pack%' THEN fils + p_amount ELSE fils END,
      updated_at = NOW()
    WHERE id = auth.uid();
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. SECURE DAILY REWARD (Server-side validation)
CREATE OR REPLACE FUNCTION public.claim_daily_reward()
RETURNS JSON AS $$
DECLARE
  v_last_claim DATE;
  v_streak INTEGER;
  v_reward_fils INTEGER := 0;
  v_reward_derhem INTEGER := 0;
  v_reward_dinar INTEGER := 0;
  v_reward_magnets INTEGER := 0;
  v_reward_hints INTEGER := 0;
  v_reward_skips INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT last_reward_claimed_at::DATE, reward_streak 
  INTO v_last_claim, v_streak 
  FROM profiles WHERE id = auth.uid();

  -- Check if already claimed today
  IF v_last_claim = CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'message', 'Already claimed today');
  END IF;

  -- Reset streak if missed a day
  IF v_last_claim < CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := 1;
  ELSE
    v_streak := (v_streak % 7) + 1;
  END IF;

  -- Apply rewards based on streak day
  CASE v_streak
    WHEN 1 THEN v_reward_fils := 200;
    WHEN 2 THEN v_reward_hints := 1;
    WHEN 3 THEN v_reward_derhem := 5;
    WHEN 4 THEN v_reward_magnets := 1;
    WHEN 5 THEN v_reward_derhem := 15;
    WHEN 6 THEN v_reward_skips := 1;
    WHEN 7 THEN v_reward_fils := 2000; v_reward_dinar := 1;
  END CASE;

  UPDATE profiles
  SET
    fils = fils + v_reward_fils,
    derhem = derhem + v_reward_derhem,
    dinar = dinar + v_reward_dinar,
    magnets = magnets + v_reward_magnets,
    hints = hints + v_reward_hints,
    skips = skips + v_reward_skips,
    reward_streak = v_streak,
    last_reward_claimed_at = NOW(),
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'streak', v_streak);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. IDENTITY UPDATE PROXY
CREATE OR REPLACE FUNCTION public.update_profile_identity(
  p_nickname TEXT,
  p_avatar_url TEXT,
  p_country_code TEXT,
  p_is_in_kurdistan BOOLEAN
)
RETURNS JSON AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Optional: Add nickname validation/sanitization here
  IF LENGTH(p_nickname) < 3 OR LENGTH(p_nickname) > 20 THEN
    RAISE EXCEPTION 'Nickname must be between 3 and 20 characters.';
  END IF;

  UPDATE profiles
  SET
    nickname = p_nickname,
    avatar_url = p_avatar_url,
    country_code = p_country_code,
    is_kurdistan = p_is_in_kurdistan,
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. PROGRESSION UPDATE PROXY (Hardened Sync)
CREATE OR REPLACE FUNCTION public.sync_profile_progression(
  p_xp INTEGER,
  p_level INTEGER
)
RETURNS JSON AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Optional: Add progression validation here (e.g. max XP increment per sync)
  -- For now, we trust the sync but funnel it through RPC to respect RLS
  UPDATE profiles
  SET
    xp = p_xp,
    level = p_level,
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. PROGRESS MERGE PROXY (Local to Cloud)
CREATE OR REPLACE FUNCTION public.merge_profile_progress(
  p_xp INTEGER,
  p_fils INTEGER,
  p_derhem INTEGER,
  p_dinar INTEGER
)
RETURNS JSON AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE profiles
  SET
    xp = GREATEST(xp, p_xp),
    fils = GREATEST(fils, p_fils),
    derhem = GREATEST(derhem, p_derhem),
    dinar = GREATEST(dinar, p_dinar),
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. INVENTORY SYNC PROXY
CREATE OR REPLACE FUNCTION public.sync_profile_inventory(
  p_magnets INTEGER DEFAULT NULL,
  p_hints INTEGER DEFAULT NULL,
  p_skips INTEGER DEFAULT NULL,
  p_fils INTEGER DEFAULT NULL,
  p_derhem INTEGER DEFAULT NULL,
  p_dinar INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE profiles
  SET
    magnets = COALESCE(p_magnets, magnets),
    hints = COALESCE(p_hints, hints),
    skips = COALESCE(p_skips, skips),
    fils = COALESCE(p_fils, fils),
    derhem = COALESCE(p_derhem, derhem),
    dinar = COALESCE(p_dinar, dinar),
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. TIGHTEN RLS POLICIES & COLUMN PROTECTION
-- Since RLS cannot easily compare OLD and NEW values, we use a trigger for column-level security.
-- This prevents direct client-side manipulation of progression/currency while allowing RPCs (SECURITY DEFINER) to work.

CREATE OR REPLACE FUNCTION public.protect_profile_progression()
RETURNS TRIGGER AS $$
BEGIN
  -- If the update is coming from the 'authenticated' role (client-side), block sensitive changes
  IF current_user = 'authenticated' THEN
    IF (NEW.xp IS DISTINCT FROM OLD.xp) OR
       (NEW.level IS DISTINCT FROM OLD.level) OR
       (NEW.fils IS DISTINCT FROM OLD.fils) OR
       (NEW.derhem IS DISTINCT FROM OLD.derhem) OR
       (NEW.dinar IS DISTINCT FROM OLD.dinar) OR
       (NEW.magnets IS DISTINCT FROM OLD.magnets) OR
       (NEW.hints IS DISTINCT FROM OLD.hints) OR
       (NEW.skips IS DISTINCT FROM OLD.skips) OR
       (NEW.nickname IS DISTINCT FROM OLD.nickname) OR
       (NEW.reward_streak IS DISTINCT FROM OLD.reward_streak) OR
       (NEW.last_reward_claimed_at IS DISTINCT FROM OLD.last_reward_claimed_at) OR
       (NEW.owned_avatars IS DISTINCT FROM OLD.owned_avatars) OR
       (NEW.unlocked_themes IS DISTINCT FROM OLD.unlocked_themes)
    THEN
      RAISE EXCEPTION 'Security Violation: Sensitive progression fields can only be modified via secure RPC functions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_profile_progression ON profiles;
CREATE TRIGGER tr_protect_profile_progression
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_progression();

-- Simplified RLS for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update non-critical fields" ON profiles;
DROP POLICY IF EXISTS "Users can only update heartbeats and basic settings" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles" 
ON profiles FOR SELECT
TO authenticated
USING (true);


-- 5. SECURE ONLINE MATCHES RLS
ALTER TABLE public.online_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their matches" ON online_matches;
CREATE POLICY "Participants can view their matches"
ON online_matches FOR SELECT
TO authenticated
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

DROP POLICY IF EXISTS "Participants can update their matches" ON online_matches;
CREATE POLICY "Participants can update their matches"
ON online_matches FOR UPDATE
TO authenticated
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

DROP POLICY IF EXISTS "Users can insert matches" ON online_matches;
CREATE POLICY "Users can insert matches"
ON online_matches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player1_id);

DROP POLICY IF EXISTS "Participants can delete their matches" ON online_matches;
CREATE POLICY "Participants can delete their matches"
ON online_matches FOR DELETE
TO authenticated
USING (auth.uid() = player1_id OR auth.uid() = player2_id);
