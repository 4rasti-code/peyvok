/* global process */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const columns = 'level, xp, last_notified_level, wins_towards_secret, fils, derhem, dinar, magnets, hints, skips, daily_streak, reward_streak, last_reward_claimed_at, inventory, haptic_enabled, nickname, avatar_url, is_kurdistan, country_code, updated_at';
  const { data, error } = await supabase.from('profiles').select(columns).limit(1);
  if (error) {
    console.error('Error fetching profiles:', JSON.stringify(error, null, 2));
  } else if (data && data.length > 0) {
    console.log('Columns in profiles:', Object.keys(data[0]));
  } else {
    console.log('No data in profiles table.');
  }
}

checkColumns();
