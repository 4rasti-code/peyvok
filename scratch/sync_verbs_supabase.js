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
  const verbs = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log(`Syncing ${verbs.length} verbs to Supabase...`);
  
  const formattedVerbs = verbs.map(v => {
    const modes = [];
    const len = v.word.length;
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

  // Upsert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < formattedVerbs.length; i += batchSize) {
    const batch = formattedVerbs.slice(i, i + batchSize);
    const { error } = await supabase
      .from('words')
      .upsert(batch, { onConflict: 'word, hint' });
      
    if (error) {
      console.error(`Error syncing batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`Synced batch ${i / batchSize + 1}/${Math.ceil(formattedVerbs.length / batchSize)}`);
    }
  }

  console.log("Sync complete!");
}

syncVerbs();
