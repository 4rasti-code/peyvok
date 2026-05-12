import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load .env from project root
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVersusSchema() {
  console.log("Checking Online Matches Schema for Tie Logic...");
  
  const { data, error } = await supabase
    .from('online_matches')
    .select('id, p1_failed, p2_failed, p1_colors, p2_colors')
    .limit(1);

  if (error) {
    console.log("Error or Missing Columns:", error.message);
    console.log("We likely need to add p1_failed and p2_failed columns.");
  } else {
    console.log("Schema confirmed with failure columns: ✅");
  }
}

checkVersusSchema();
