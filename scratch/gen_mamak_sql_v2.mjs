import fs from 'fs';

const filePath = 'd:/Peyivcin App/src/data/wordList.js';
const content = fs.readFileSync(filePath, 'utf8');

// Use regex to extract the mamakWords array
const match = content.match(/const mamakWords = (\[[\s\S]*?\]);/);
if (!match) {
  console.error("Could not find mamakWords array");
  process.exit(1);
}

// Clean up the string to make it valid JSON-ish (removing trailing commas if any, but since it's JS it's fine)
// We'll use a safer way: Eval or just parse it manually since we know the structure.
// Actually, I'll just use regex to extract each object.
const items = [];
const itemRegex = /\{[\s\S]*?"word":\s*"(.*?)",[\s\S]*?"hint":\s*"(.*?)",[\s\S]*?"category":\s*"(.*?)"[\s\S]*?\}/g;
let m;
while ((m = itemRegex.exec(match[1])) !== null) {
  items.push({ word: m[1], hint: m[2], category: m[3] });
}

console.log(`Found ${items.length} items`);

let sql = `-- PEYVOK MAMAK STANDARDIZATION
-- This script synchronizes the standardized Mamak riddle dataset to Supabase.
-- It ensures all riddles have the correct hint, category, and mode_tags.

INSERT INTO public.words (word, hint, category, mode_tags)
VALUES
`;

const values = items.map(item => {
  const escapedHint = item.hint.replace(/'/g, "''");
  const escapedWord = item.word.replace(/'/g, "''");
  return `  ('${escapedWord}', '${escapedHint}', 'مامک', ARRAY['mamak']::TEXT[])`;
}).join(',\n');

sql += values + `\nON CONFLICT (word) 
DO UPDATE SET 
  hint = EXCLUDED.hint,
  category = EXCLUDED.category,
  mode_tags = EXCLUDED.mode_tags;\n`;

fs.writeFileSync('d:/Peyivcin App/sync_mamak_standardization.sql', sql, 'utf8');
console.log("Successfully updated sync_mamak_standardization.sql");
