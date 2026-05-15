import fs from 'fs';
import { wordListUnique } from '../src/data/wordList.js';

console.log(`Generating SQL for ${wordListUnique.length} words...`);

let sql = `-- Authoritative Synchronization Script for Peyvok Dictionary
-- Total Words: ${wordListUnique.length}

-- 1. Wipe old data
TRUNCATE TABLE public.words CASCADE;

-- 2. Insert new words
INSERT INTO public.words (word, category, hint) VALUES
`;

const escape = (str) => str.replace(/'/g, "''");

const values = wordListUnique.map(w => 
    `('${escape(w.word)}', '${escape(w.category)}', '${escape(w.hint || '')}')`
).join(',\n');

sql += values + ';';

fs.writeFileSync('scratch/sync_all_words_to_supabase.sql', sql);
console.log('✅ Done! Created scratch/sync_all_words_to_supabase.sql');
