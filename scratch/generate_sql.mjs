import fs from 'fs';
import path from 'path';

const dataDir = './src/data';
const files = [
  'verbsList.js', 'adjectivesList.js', 'humanNamesList.js', 'cityList.js', 
  'animalsList.js', 'householdList.js', 'clothingList.js', 'bodyPartsList.js', 
  'jobsList.js', 'foodList.js', 'natureList.js', 'feelingsList.js', 
  'familyList.js', 'countryWordsList.js', 'sportsList.js', 'placesList.js', 
  'mamakList.js', 'timeList.js', 'fruitList.js', 'vegetablesList.js'
];

let allWords = [];

for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
            try {
                let jsonStr = match[0]
                    .replace(/\/\/.*$/gm, '') 
                    .replace(/,(\s*[\}\]])/g, '$1'); 
                const words = JSON.parse(jsonStr);
                allWords = allWords.concat(words);
            } catch (e) {
                console.error(`Error parsing ${file}:`, e.message);
            }
        }
    }
}

// Deduplicate words (keep the last occurrence)
const uniqueWordsMap = new Map();
allWords.forEach(w => {
    uniqueWordsMap.set(w.word, w);
});
const uniqueWords = Array.from(uniqueWordsMap.values());

// Group by category
const grouped = {};
uniqueWords.forEach(w => {
    if (!grouped[w.category]) grouped[w.category] = [];
    grouped[w.category].push(w);
});

let sql = `-- Peyvok Database Sync Script (Grouped by Category)
-- Created at: ${new Date().toISOString()}

`;

for (const category in grouped) {
    sql += `-- ==========================================\n`;
    sql += `-- Category: ${category} (${grouped[category].length} words)\n`;
    sql += `-- ==========================================\n`;
    sql += `INSERT INTO public.words (word, hint, category)\nVALUES\n`;
    
    const values = grouped[category].map(w => {
        const word = w.word.replace(/'/g, "''");
        const hint = w.hint.replace(/'/g, "''");
        const cat = w.category.replace(/'/g, "''");
        return `('${word}', '${hint}', '${cat}')`;
    });
    
    sql += values.join(',\n') + '\n';
    sql += `ON CONFLICT (word) \nDO UPDATE SET \n    hint = EXCLUDED.hint,\n    category = EXCLUDED.category;\n\n`;
}

fs.writeFileSync('insert_all_words_grouped.sql', sql);
console.log('Successfully generated insert_all_words_grouped.sql');
