import process from 'node:process';
import { createClient } from '@supabase/supabase-js'

import path from 'path'
import fs from 'fs'

// Load .env from the project root
const envPath = path.join(process.cwd(), '.env');
const envData = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envData.match(/VITE_SUPABASE_URL=(.*)/)?.[1];
const supabaseKey = envData.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking Supabase Schema...");
  
  // Check profiles table
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, xp, level')
    .limit(1);
    
  if (pError) {
    console.error("Profiles table error:", pError.message);
  } else {
    console.log(`Profiles table confirmed (Found ${profiles?.length || 0} sample): ✅`);
  }

  // Check online_matches table
  const { data: matches, error: mError } = await supabase
    .from('online_matches')
    .select('id, words, riddles, current_word_index, p1_score, p2_score')
    .limit(1);

  if (mError) {
    console.error("Online_matches table error:", (mError.message || mError));
  } else {
    console.log(`Online_matches table confirmed (Found ${matches?.length || 0} sample): ✅`);
  }
}

checkSchema();

