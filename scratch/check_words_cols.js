import fs from 'fs';
import path from 'path';
import process from 'process';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '..', '.env');
const envData = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envData.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envData.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWords() {
  console.log("Checking words table...");
  const { data, error } = await supabase.from('words').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
    if (error.message.includes("permission denied")) {
        console.log("RLS might be enabled. Trying to fetch public schema info...");
        // Cannot easily check schema info via anon key if RLS is on and no rows are public
    }
  } else {
    console.log("Columns:", Object.keys(data[0] || {}));
  }
}

checkWords();
