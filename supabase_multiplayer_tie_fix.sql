-- ==========================================
-- PEYVÇÎN: MULTIPLAYER TIE LOGIC SCHEMA
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Add failure tracking columns to online_matches
ALTER TABLE public.online_matches 
ADD COLUMN IF NOT EXISTS p1_failed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.online_matches 
ADD COLUMN IF NOT EXISTS p2_failed BOOLEAN DEFAULT FALSE;

-- Ensure colors columns exist (if not already there)
ALTER TABLE public.online_matches 
ADD COLUMN IF NOT EXISTS p1_colors JSONB DEFAULT '[]'::JSONB;

ALTER TABLE public.online_matches 
ADD COLUMN IF NOT EXISTS p2_colors JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN public.online_matches.p1_failed IS 'Tracks if player 1 failed the current round';
COMMENT ON COLUMN public.online_matches.p2_failed IS 'Tracks if player 2 failed the current round';
