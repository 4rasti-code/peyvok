import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const SCRATCH_DIR = path.join(process.cwd(), 'scratch');

// Regex that is very loose to catch all word objects
// Matches: { word: "...", hint: "...", category: "..." } with any quotes and spacing
const wordRegex = /\{\s*["']?word["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?hint["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?category["']?\s*:\s*["']([^"']+)["']\s*\}?/g;

const allWords = [];
const seenWords = new Set();

function extractFromText(text) {
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
        const word = match[1].trim();
        const hint = match[2].trim();
        const category = match[3].trim();
        
        if (!seenWords.has(word)) {
            seenWords.add(word);
            allWords.push({ word, hint, category });
        }
    }
}

// 1. Scan the current modular files
const currentFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.js'));
currentFiles.forEach(file => {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    extractFromText(content);
});

// 2. Scan the source files from Git (backups)
const sourceFiles = ['source_wordList.js', 'source_verbsList.js', 'source_adjectivesList.js', 'old_wordlist.js'];
sourceFiles.forEach(file => {
    const p = path.join(SCRATCH_DIR, file);
    if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        extractFromText(content);
    }
});

console.log(`Extracted total unique words: ${allWords.length}`);

// Map categories to files (same map as before)
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
    "وەلات": "countryWordsList.js",
    "هەست": "feelingsList.js",
    "خێزان": "familyList.js",
    "کات": "natureList.js",
    "مامک": "mamakList.js",
    "جهـ": "natureList.js",
    "هونەر": "otherList.js",
    "مۆزیک": "otherList.js"
};

const collections = {};
allWords.forEach(w => {
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
    "countryWordsList.js": "countryWords",
    "mamakList.js": "mamakWords",
    "otherList.js": "otherWords"
};

for (const [fileName, words] of Object.entries(collections)) {
    const exportName = exportNames[fileName] || "otherWords";
    const content = `export const ${exportName} = ${JSON.stringify(words, null, 2)};\n`;
    fs.writeFileSync(path.join(DATA_DIR, fileName), content, 'utf8');
    console.log(`Re-saved ${words.length} words to ${fileName}`);
}

console.log("Super Extraction complete!");
