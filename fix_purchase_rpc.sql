-- Fix for process_purchase to use the inventory JSONB column instead of missing top-level columns
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
  v_inventory JSONB;
  v_owned_avatars JSONB;
  v_unlocked_themes JSONB;
BEGIN
  -- Security check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Must be logged in to purchase.';
  END IF;

  -- Get current balance and inventory
  SELECT 
    CASE 
      WHEN p_currency_used = 'fils' THEN fils
      WHEN p_currency_used = 'derhem' THEN derhem
      WHEN p_currency_used = 'dinar' THEN dinar
      ELSE 0
    END,
    inventory
  INTO v_curr_balance, v_inventory
  FROM profiles WHERE id = auth.uid();

  -- Extract nested arrays from inventory
  v_owned_avatars := COALESCE(v_inventory->'owned_avatars', '[]'::JSONB);
  v_unlocked_themes := COALESCE(v_inventory->'unlocked_themes', '[]'::JSONB);

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
    -- Check if already owned in the JSONB array
    IF v_owned_avatars ? p_item_id THEN
      RAISE EXCEPTION 'Item already owned.';
    END IF;
    
    UPDATE profiles
    SET
      fils = CASE WHEN p_currency_used = 'fils' THEN fils - p_price ELSE fils END,
      derhem = CASE WHEN p_currency_used = 'derhem' THEN derhem - p_price ELSE derhem END,
      inventory = jsonb_set(inventory, '{owned_avatars}', v_owned_avatars || to_jsonb(p_item_id)),
      updated_at = NOW()
    WHERE id = auth.uid();

  ELSIF p_item_type = 'theme' THEN
    -- Check if already unlocked in the JSONB array
    IF v_unlocked_themes ? p_item_id THEN
      RAISE EXCEPTION 'Theme already unlocked.';
    END IF;

    UPDATE profiles
    SET
      fils = CASE WHEN p_currency_used = 'fils' THEN fils - p_price ELSE fils END,
      derhem = CASE WHEN p_currency_used = 'derhem' THEN derhem - p_price ELSE derhem END,
      dinar = CASE WHEN p_currency_used = 'dinar' THEN dinar - p_price ELSE dinar END,
      inventory = jsonb_set(inventory, '{unlocked_themes}', v_unlocked_themes || to_jsonb(p_item_id)),
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
