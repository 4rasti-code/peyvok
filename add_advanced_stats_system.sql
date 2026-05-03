-- Advanced Stats System for Peyvçîn profiles
-- Adds columns for comprehensive game statistics

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pvp_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_words_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_word_length INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fastest_solve_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS flawless_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mode_play_counts JSONB DEFAULT '{"classic":0, "battle":0, "mamak":0, "hard_words":0, "word_fever":0, "secret_word":0}'::JSONB;

-- Update RPC function to handle advanced stats
CREATE OR REPLACE FUNCTION sync_game_stats(
    p_mode TEXT,
    p_is_win BOOLEAN,
    p_is_pvp_win BOOLEAN,
    p_attempts INTEGER,
    p_word_length INTEGER,
    p_solve_time_ms INTEGER,
    p_is_flawless BOOLEAN
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_current_dist JSONB;
    v_mode_dist JSONB;
BEGIN
    v_user_id := auth.uid();
    
    -- 1. Increment games_played and mode_play_counts
    UPDATE profiles 
    SET 
        games_played = COALESCE(games_played, 0) + 1,
        mode_play_counts = jsonb_set(
            COALESCE(mode_play_counts, '{"classic":0, "battle":0, "mamak":0, "hard_words":0, "word_fever":0, "secret_word":0}'::jsonb),
            ARRAY[p_mode],
            (COALESCE((mode_play_counts->>p_mode)::int, 0) + 1)::text::jsonb
        )
    WHERE id = v_user_id;

    -- 2. Handle Win Logic
    IF p_is_win THEN
        UPDATE profiles
        SET
            games_won = COALESCE(games_won, 0) + 1,
            current_streak = COALESCE(current_streak, 0) + 1,
            total_words_found = COALESCE(total_words_found, 0) + 1,
            max_streak = GREATEST(COALESCE(max_streak, 0), COALESCE(current_streak, 0) + 1),
            longest_word_length = GREATEST(COALESCE(longest_word_length, 0), p_word_length),
            fastest_solve_ms = CASE 
                WHEN p_solve_time_ms > 0 AND (COALESCE(fastest_solve_ms, 0) = 0 OR p_solve_time_ms < fastest_solve_ms) 
                THEN p_solve_time_ms 
                ELSE fastest_solve_ms 
            END
        WHERE id = v_user_id;

        -- Update distribution (nested per mode)
        SELECT guess_distribution INTO v_current_dist FROM profiles WHERE id = v_user_id;
        v_mode_dist := COALESCE(v_current_dist->p_mode, '{}'::jsonb);
        v_mode_dist := jsonb_set(
            v_mode_dist,
            ARRAY[p_attempts::text],
            (COALESCE((v_mode_dist->>(p_attempts::text))::int, 0) + 1)::text::jsonb
        );
        
        UPDATE profiles
        SET guess_distribution = jsonb_set(
            COALESCE(guess_distribution, '{}'::jsonb),
            ARRAY[p_mode],
            v_mode_dist
        )
        WHERE id = v_user_id;

        -- PvP Specific Win
        IF p_is_pvp_win THEN
            UPDATE profiles SET pvp_wins = COALESCE(pvp_wins, 0) + 1 WHERE id = v_user_id;
        END IF;

        -- Flawless Win (0 hints, 0 magnets)
        IF p_is_flawless THEN
            UPDATE profiles SET flawless_wins = COALESCE(flawless_wins, 0) + 1 WHERE id = v_user_id;
        END IF;

    ELSE
        -- Reset Streak on Loss
        UPDATE profiles SET current_streak = 0 WHERE id = v_user_id;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
