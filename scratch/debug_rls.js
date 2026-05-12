import fs from 'fs';
import path from 'path';
import process from 'process';
import { createClient } from '@supabase/supabase-js';

// Load .env from the project root
const envPath = path.join(process.cwd(), '.env');
const envData = fs.readFileSync(envPath, 'utf8');

const supabaseUrl = envData.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envData.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  console.log("Checking words table RLS...");
  
  // 1. Try to fetch one word
  const { data, error } = await supabase.from('words').select('*').limit(1);
  
  if (error) {
    console.error("❌ SELECT Error:", error.message);
  } else {
    console.log("✅ SELECT Success! Found:", data.length, "rows.");
    if (data.length > 0) {
      console.log("Sample row keys:", Object.keys(data[0]));
    }
  }

  // 2. Try to insert a dummy word
  const dummyWord = {
    word: 'TEST_RLS_CHECK',
    hint: 'DEBUG',
    category: 'debug',
    mode_tags: ['classic']
  };
  
  const { error: insertError } = await supabase.from('words').insert([dummyWord]);
  
  if (insertError) {
    console.error("❌ INSERT Error:", insertError.message);
  } else {
    console.log("✅ INSERT Success! (RLS for INSERT might be open or you have special permissions)");
    // Cleanup
    await supabase.from('words').delete().eq('word', 'TEST_RLS_CHECK');
  }
}

checkRLS();
