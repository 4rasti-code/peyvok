-- ==========================================
-- PEYVÇÎN: SAFE COLUMN MIGRATION PATCH
-- Run this in your Supabase SQL Editor
-- This will safely add any missing columns to your 'profiles' table
-- without affecting your existing data.
-- ==========================================

-- 1. Daily Rewards System
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reward_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reward_claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. New Currencies
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS derhem INTEGER DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dinar INTEGER DEFAULT 5;

-- 3. Game Progression & Inventory
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_notified_level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wins_towards_secret INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS haptic_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hint_count INTEGER DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS magnet_count INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skip_count INTEGER DEFAULT 1;

-- 4. Social & Profile Information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '{"badges": [], "owned_avatars": ["default"], "unlocked_themes": ["default"], "equipped_theme": "default", "solved_words": [], "stats": {"classic": {"bestStreak": 0, "totalCorrect": 0}}}'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'IQ';

-- Note: We are not removing any old columns to ensure 100% safety.
