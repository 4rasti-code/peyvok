import { wordListUnique } from '../src/data/wordList.js';
import fs from 'fs';

let sql = `
-- Peyvok Dictionary Synchronization Script
-- Total Unique Words: ${wordListUnique.length}
-- Created At: ${new Date().toISOString()}

-- 1. Clear existing words to prevent duplicates and handle category changes
TRUNCATE TABLE words;

-- 2. Insert all words
INSERT INTO words (word, hint, category)
VALUES
`;

const values = wordListUnique.map(w => {
  const word = w.word.replace(/'/g, "''");
  const hint = w.hint.replace(/'/g, "''");
  const category = w.category.replace(/'/g, "''");
  return `('${word}', '${hint}', '${category}')`;
});

sql += values.join(',\n') + ';';

fs.writeFileSync('./sync_all_words_to_supabase.sql', sql);
console.log('SQL script generated: sync_all_words_to_supabase.sql');
console.log('Total words in SQL:', values.length);
