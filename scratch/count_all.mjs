import fs from 'fs';

const content = fs.readFileSync('src/data/wordList.js', 'utf8');

// Count lines that look like word objects
const wordMatches = content.match(/word:\s*"[^"]+"/g) || [];
console.log('Total word: properties found:', wordMatches.length);

// Count entries in arrays if possible
import { classicWords, hardWords, wordFeverWords, mamakWords, wordListUnique } from '../src/data/wordList.js';

console.log('classicWords:', classicWords.length);
console.log('hardWords:', hardWords.length);
console.log('wordFeverWords:', wordFeverWords.length);
console.log('mamakWords:', mamakWords.length);
console.log('wordListUnique:', wordListUnique.length);
