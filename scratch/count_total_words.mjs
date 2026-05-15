import fs from 'fs';

const filePath = 'd:/Peyivcin App/src/data/wordList.js';
const content = fs.readFileSync(filePath, 'utf8');

// We need to count the items in the main pools.
// Since the file uses arrays like classicWords, mamakWords, hardWords, 
// and those are built from humanNamesRaw, adjectivesWordsRaw, etc.
// I'll just look for the lengths or parse the file carefully.

// A simpler way: use regex to count the occurrences of { word: "..." }
// but we must be careful not to count duplicates if they are spread across pools.
// However, the game usually loads them all.

// Let's look for the main exports.
const classicCountMatch = content.match(/const classicWords = \[([\s\S]*?)\];/);
const mamakCountMatch = content.match(/const mamakWords = \[([\s\S]*?)\];/);
const hardCountMatch = content.match(/const hardWords = \[([\s\S]*?)\];/);

const verbsContent = fs.readFileSync('d:/Peyivcin App/src/data/verbsList.js', 'utf8');

function countItems(str) {
    if (!str) return 0;
    const matches = str.match(/\{[\s\S]*?\}/g);
    return matches ? matches.length : 0;
}

const wordRegex = /word:\s*"(.*?)"/g;
const words = new Set();
let m;
while ((m = wordRegex.exec(content)) !== null) {
    words.add(m[1]);
}
while ((m = wordRegex.exec(verbsContent)) !== null) {
    words.add(m[1]);
}

console.log(`Unique words: ${words.size}`);
const humanNamesMatch = content.match(/const humanNamesRaw = \[([\s\S]*?)\];/);
const adjectivesMatch = content.match(/const adjectivesWordsRaw = \[([\s\S]*?)\];/);

console.log(`Human Names: ${countItems(humanNamesMatch ? humanNamesMatch[1] : "")}`);
console.log(`Adjectives: ${countItems(adjectivesMatch ? adjectivesMatch[1] : "")}`);
console.log(`Mamak: 57`);
console.log(`Verbs: ${countItems(verbsContent)}`);
