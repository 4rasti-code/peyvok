import fs from 'fs';
import { wordListUnique } from '../src/data/wordList.js';

const allWords = wordListUnique;

let sql = `-- Sync all words from code to Supabase (Reconstructed Taxonomy)\n`;
sql += `DELETE FROM words; -- Clear old entries to ensure clean taxonomy\n\n`;
sql += `INSERT INTO words (word, hint, category)\nVALUES\n`;

const values = allWords.map(w => {
    const safeWord = w.word.replace(/'/g, "''");
    const safeHint = w.hint.replace(/'/g, "''");
    const safeCat = (w.category || 'هەمەجۆر').replace(/'/g, "''");
    return `('${safeWord}', '${safeHint}', '${safeCat}')`;
});

sql += values.join(',\n') + `;\n`;

fs.writeFileSync('sync_all_words_to_supabase.sql', sql);
console.log(`Successfully generated sync_all_words_to_supabase.sql with ${allWords.length} words.`);
