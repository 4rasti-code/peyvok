import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = path.join(process.cwd(), 'scratch');

function readUtf16Le(filePath) {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('utf16le');
}

const verbs = readUtf16Le(path.join(SCRATCH_DIR, 'source_verbsList.js'));
const wordList = readUtf16Le(path.join(SCRATCH_DIR, 'source_wordList.js'));

// Use a very liberal regex to catch anything with a "word" property
// This handles any quote style, any property order, and any spacing
const universalRegex = /\{\s*["']?word["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?hint["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?category["']?\s*:\s*["']([^"']+)["']\s*/g;

let count = 0;
let match;
const found = [];

while ((match = universalRegex.exec(verbs)) !== null) {
    found.push({ word: match[1], hint: match[2], category: match[3] });
    count++;
}
while ((match = universalRegex.exec(wordList)) !== null) {
    found.push({ word: match[1], hint: match[2], category: match[3] });
    count++;
}

console.log(`Found ${count} words using universal regex`);

// Deduplicate
const unique = [];
const seen = new Set();
found.forEach(w => {
    if (!seen.has(w.word)) {
        seen.add(w.word);
        unique.push(w);
    }
});

console.log(`Unique words: ${unique.length}`);
if (unique.length > 0) {
    console.log("First 5 words:", unique.slice(0, 5));
}
