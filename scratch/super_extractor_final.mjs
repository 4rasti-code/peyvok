import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

function getOldFile(filePath) {
    try {
        return execSync(`git show HEAD:${filePath}`, { encoding: 'utf8' });
    } catch (e) {
        console.error(`Could not read ${filePath} from Git`);
        return "";
    }
}

const wordList = getOldFile('src/data/wordList.js');
const verbsList = getOldFile('src/data/verbsList.js');
const adjectivesList = getOldFile('src/data/adjectivesList.js');

// Very inclusive regex
const wordRegex = /\{\s*["']?word["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?hint["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?category["']?\s*:\s*["']([^"']+)["']\s*/g;

const allWords = [];
const seenWords = new Set();

function extract(text) {
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

extract(wordList);
extract(verbsList);
extract(adjectivesList);

// Also extract from current files just in case
const currentFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.js'));
currentFiles.forEach(file => {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    extract(content);
});

console.log(`Final Extracted total unique words: ${allWords.length}`);

// Category mapping
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
}

console.log("Migration restored and finalized!");
