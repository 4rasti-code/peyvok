import fs from 'fs';
import { wordListUnique } from '../src/data/wordList.js';

const sourceWords = new Set(wordListUnique.map(w => w.word));
const distContent = fs.readFileSync('./dist/assets/wordList-DV_shevD.js', 'utf8');

const distWords = [];
// Match: {word:`...`,hint:`...`,category:`...`}
const regex = /{word:`([^`]+)`,hint:`([^`]+)`,category:`([^`]+)`/g;
let match;
while ((match = regex.exec(distContent)) !== null) {
  const [_, word, hint, category] = match;
  if (!sourceWords.has(word)) {
    distWords.push({ word, hint, category });
  }
}

console.log('Missing words found in dist:', distWords.length);
fs.writeFileSync('./scratch/missing_words.json', JSON.stringify(distWords, null, 2));
console.log('Saved to scratch/missing_words.json');
