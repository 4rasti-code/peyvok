import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error(`.env file not found at ${envPath}`);
  process.exit(1);
}

const envData = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envData.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envData.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  console.log(`\n--- Checking ${tableName} table ---`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  
  if (error) {
    if (error.code === '42P01') {
      console.error(`❌ Table '${tableName}' does not exist.`);
    } else if (error.code === '42501') {
      console.error(`❌ Permission denied for '${tableName}'. Check RLS policies.`);
    } else {
      console.error(`❌ Error checking '${tableName}':`, error.message);
    }
  } else {
    console.log(`✅ Table '${tableName}' found.`);
    if (data && data.length > 0) {
      console.log(`   Sample columns:`, Object.keys(data[0]));
    } else {
      console.log(`   Table is empty.`);
    }
  }
}

async function runChecks() {
  await checkTable('words');
  await checkTable('profiles');
  await checkTable('online_matches');
}

runChecks();
