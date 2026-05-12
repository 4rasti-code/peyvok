-- ==========================================
-- PEYVÇÎN 2.0: FINAL CLOUD SYNCHRONIZATION
-- ==========================================

-- 1. Ensure all progression columns exist for new game modes
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mamak_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hard_words_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS word_fever_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS secret_word_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS wins_towards_secret INTEGER DEFAULT 0;

-- 2. Update RPC for Level Completion
-- This version handles rewards, XP, multiple game modes, and linear progression in one transaction.
CREATE OR REPLACE FUNCTION handle_level_completion(
  p_user_id UUID,
  p_reward_amount INTEGER,
  p_xp_amount INTEGER,
  p_game_mode TEXT DEFAULT 'classic',
  p_completed_level INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_level INTEGER;
  v_multiplier NUMERIC;
  v_final_reward INTEGER;
BEGIN
  -- Multiplier logic
  v_multiplier := CASE 
    WHEN p_game_mode = 'hard_words' THEN 1.33
    WHEN p_game_mode = 'secret_word' THEN 4.0
    WHEN p_game_mode = 'mamak' THEN 2.0
    WHEN p_game_mode = 'word_fever' THEN 2.0
    ELSE 1.0
  END;

  -- Get progression state for current mode
  v_current_level := CASE 
    WHEN p_game_mode = 'mamak' THEN (SELECT mamak_level FROM profiles WHERE id = p_user_id)
    WHEN p_game_mode = 'hard_words' THEN (SELECT hard_words_level FROM profiles WHERE id = p_user_id)
    WHEN p_game_mode = 'word_fever' THEN (SELECT word_fever_level FROM profiles WHERE id = p_user_id)
    WHEN p_game_mode = 'secret_word' THEN (SELECT secret_word_level FROM profiles WHERE id = p_user_id)
    ELSE (SELECT level FROM profiles WHERE id = p_user_id)
  END;

  v_final_reward := (p_reward_amount * v_multiplier)::INTEGER;

  -- Replay penalty: 20% reward if repeating an old level
  IF p_completed_level IS NOT NULL AND p_completed_level < v_current_level THEN
    v_final_reward := (v_final_reward * 0.20)::INTEGER;
  END IF;

  -- Atomic update for all currencies and progression
  UPDATE profiles
  SET 
    fils = fils + v_final_reward,
    xp = xp + p_xp_amount,
    level = CASE WHEN p_game_mode = 'classic' THEN level + 1 ELSE level END,
    mamak_level = CASE WHEN p_game_mode = 'mamak' AND p_completed_level = v_current_level THEN v_current_level + 1 ELSE mamak_level END,
    hard_words_level = CASE WHEN p_game_mode = 'hard_words' AND p_completed_level = v_current_level THEN v_current_level + 1 ELSE hard_words_level END,
    word_fever_level = CASE WHEN p_game_mode = 'word_fever' AND p_completed_level = v_current_level THEN v_current_level + 1 ELSE word_fever_level END,
    secret_word_level = CASE WHEN p_game_mode = 'secret_word' AND p_completed_level = v_current_level THEN v_current_level + 1 ELSE secret_word_level END,
    wins_towards_secret = CASE WHEN p_game_mode != 'secret_word' THEN LEAST(3, wins_towards_secret + 1) ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql;

-- 3. Enhance Leaderboard View
-- Now ranks by total progress (Aggregated levels + XP)
DROP VIEW IF EXISTS leaderboard_view;
CREATE VIEW leaderboard_view AS
SELECT 
  id,
  nickname,
  avatar_url,
  city,
  level AS classic_level,
  mamak_level,
  hard_words_level,
  fils,
  xp,
  (level + mamak_level + hard_words_level + word_fever_level) as total_rank_score
FROM profiles
WHERE nickname IS NOT NULL 
  AND nickname != ''
ORDER BY total_rank_score DESC, xp DESC;

-- 4. Initial User Payload Trigger
-- Ensures new users start with the gift package: 1000 fils, 3 magnets, 5 hints, 2 skips.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    fils, 
    magnets, 
    hints, 
    skips,
    inventory
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nickname', 'یاریکەر'),
    1000, -- 1000 Fils
    3,    -- 3 Magnets
    5,    -- 5 Hints
    2,    -- 2 Skips
    '{"owned_avatars": ["default"], "unlocked_themes": ["default"], "solved_words": []}'::JSONB
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  
-- 5. Social & Communication Tables
-- Global Chat Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_nickname TEXT
);

-- Private Messages (DMs)
CREATE TABLE IF NOT EXISTS public.private_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE
);

-- Friendships & Requests
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' -- 'pending', 'accepted'
);

-- Blocks & Blacklist
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 6. Enable Real-Time for Social Tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- 7. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON public.private_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_pair ON public.private_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);

-- 8. Global Chat View (Joined with Profiles)
-- This ensures the UI always gets the latest nickname and avatar
DROP VIEW IF EXISTS public.global_chat_v;
CREATE VIEW public.global_chat_v AS
SELECT 
    m.id,
    m.content,
    m.created_at,
    m.user_id,
    COALESCE(p.nickname, m.user_nickname, 'یاریکەر') as display_nickname,
    p.avatar_url,
    p.updated_at as profile_updated_at
FROM public.messages m
LEFT JOIN public.profiles p ON m.user_id = p.id
ORDER BY m.created_at ASC;

-- 9. Real-time broadcast for the view (Optional but base tables already enabled)
-- Note: Real-time on views is limited in some Supabase versions, 
-- but we listen to the base 'messages' table anyway and refetch.
