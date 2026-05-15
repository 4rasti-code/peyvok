import fs from 'fs';
import path from 'path';

// Import existing modular files to keep their data
import { verbsWords } from '../src/data/verbsList.js';
import { adjectivesWords } from '../src/data/adjectivesList.js';
import { humanNames } from '../src/data/humanNamesList.js';

// Paths
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const WORD_LIST_PATH = path.join(DATA_DIR, 'wordList.js');

// Helper to clean word objects
const cleanWord = (w) => ({
    word: w.word.trim(),
    hint: w.hint.trim(),
    category: w.category.trim()
});

// Since we can't easily import the monolithic wordList.js due to its side effects,
// we will parse the text for the raw objects.
const wordListContent = fs.readFileSync(WORD_LIST_PATH, 'utf8');

// Regex to find all { word: "...", hint: "...", category: "..." } blocks
const wordRegex = /\{\s*word:\s*"([^"]+)",\s*hint:\s*"([^"]+)",\s*category:\s*"([^"]+)"\s*\}/g;
const wordsFromWordList = [];
let match;
while ((match = wordRegex.exec(wordListContent)) !== null) {
    wordsFromWordList.push({
        word: match[1],
        hint: match[2],
        category: match[3]
    });
}

// Special handling for Mamak (it has double quotes for keys in some places)
const mamakRegex = /\{\s*"word":\s*"([^"]+)",\s*"hint":\s*"([^"]+)",\s*"category":\s*"([^"]+)"\s*\}/g;
while ((match = mamakRegex.exec(wordListContent)) !== null) {
    wordsFromWordList.push({
        word: match[1],
        hint: match[2],
        category: match[3]
    });
}

// Combine everything
const allWordsRaw = [
    ...humanNames,
    ...adjectivesWords,
    ...verbsWords,
    ...wordsFromWordList
];

// Deduplicate by word string (keeping first occurrence)
const seen = new Set();
const allWordsUnique = [];
for (const w of allWordsRaw) {
    const cleaned = cleanWord(w);
    if (!seen.has(cleaned.word)) {
        seen.add(cleaned.word);
        allWordsUnique.push(cleaned);
    }
}

// Map categories to files
const categoryMap = {
    "ناڤێ مرۆڤان": "humanNamesList.js",
    "وەسف(هەڤالناڤ)": "adjectivesList.js",
    "کار (چاوگ)": "verbsList.js",
    "باژێڕ": "cityList.js",
    "گیانەوەر": "animalsList.js",
    "کەلوپەل": "householdList.js",
    "جلوبەرگ": "clothingList.js",
    "ئەندامێ لەشی": "bodyPartsList.js",
    "پیشە": "jobsList.js",
    "خوارن": "foodList.js",
    "میوە": "foodList.js",
    "سرۆشت": "natureList.js",
    "ڕەنگ": "natureList.js",
    "وەلات": "natureList.js",
    "هەست": "feelingsList.js",
    "خێزان": "familyList.js",
    "کات": "natureList.js",
    "مامک": "mamakList.js"
};

const collections = {};
Object.values(categoryMap).forEach(file => collections[file] = []);

allWordsUnique.forEach(w => {
    const fileName = categoryMap[w.category] || "otherList.js";
    if (!collections[fileName]) collections[fileName] = [];
    collections[fileName].push(w);
});

// Save all files
const exportNames = {
    "humanNamesList.js": "humanNames",
    "adjectivesList.js": "adjectivesWords",
    "verbsList.js": "verbsWords",
    "cityList.js": "cityWords",
    "animalsList.js": "animalsWords",
    "householdList.js": "householdWords",
    "clothingList.js": "clothingWords",
    "bodyPartsList.js": "bodyPartsWords",
    "jobsList.js": "jobsWords",
    "foodList.js": "foodWords",
    "natureList.js": "natureWords",
    "feelingsList.js": "feelingsWords",
    "familyList.js": "familyWords",
    "mamakList.js": "mamakWords",
    "otherList.js": "otherWords"
};

for (const [fileName, words] of Object.entries(collections)) {
    if (words.length === 0 && fileName !== "mamakList.js") continue;
    
    const exportName = exportNames[fileName];
    const content = `export const ${exportName} = ${JSON.stringify(words, null, 2)};\n`;
    fs.writeFileSync(path.join(DATA_DIR, fileName), content, 'utf8');
    console.log(`Saved ${words.length} words to ${fileName}`);
}

console.log("Migration complete!");
