/* global process */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env');
let supabaseUrl, supabaseKey;

try {
  const envData = fs.readFileSync(envPath, 'utf8');
  supabaseUrl = envData.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim()?.replace(/['"]/g, '');
  supabaseKey = envData.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)?.[1]?.trim()?.replace(/['"]/g, '');
} catch (_e) {
  console.error("Could not read .env file at", envPath);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncVerbs() {
  console.log("Loading verbs...");
  const dataPath = path.join(process.cwd(), 'scratch', 'verbs_data.json');
  if (!fs.existsSync(dataPath)) {
    console.error("Verbs data file not found at", dataPath);
    return;
  }
  const verbs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log(`Syncing ${verbs.length} verbs to Supabase via RPC...`);
  
  const formattedVerbs = verbs.map(v => {
    const modes = [];
    const len = v.word.length;
    // Standard Peyvcin Mode Logic
    if (len >= 2 && len <= 5) modes.push('classic');
    if (len >= 6) modes.push('hard_words');
    if (len === 5) {
        modes.push('word_fever');
        modes.push('multiplayer');
    }
    if (len >= 2) modes.push('secret_word');
    
    return {
      word: v.word,
      hint: v.hint,
      category: v.category,
      mode_tags: modes
    };
  });

  // RPC can handle larger payloads, but we'll still batch to be safe and avoid timeouts
  const batchSize = 100;
  let totalAffected = 0;

  for (let i = 0; i < formattedVerbs.length; i += batchSize) {
    const batch = formattedVerbs.slice(i, i + batchSize);
    console.log(`Sending batch ${i / batchSize + 1}/${Math.ceil(formattedVerbs.length / batchSize)}...`);
    
    const { data, error } = await supabase.rpc('sync_vocabulary', { p_words: batch });
      
    if (error) {
      console.error(`❌ Error syncing batch ${i / batchSize + 1}:`, error.message);
      if (error.message.includes('function public.sync_vocabulary(jsonb) does not exist')) {
          console.error("CRITICAL: The RPC function 'sync_vocabulary' has not been created in Supabase yet.");
          console.error("Please run the SQL in 'scratch/create_sync_rpc.sql' in the Supabase SQL Editor first.");
          return;
      }
    } else {
      totalAffected += data.affected_count;
      console.log(`✅ Synced batch ${i / batchSize + 1}. Progress: ${totalAffected} words affected.`);
    }
  }

  console.log(`\nSync complete! Total words processed: ${formattedVerbs.length}. Total affected (inserted/updated): ${totalAffected}.`);
}

syncVerbs();
