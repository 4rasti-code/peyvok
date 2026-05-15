import fs from 'fs';
import { normalizeKurdishInput } from '../src/utils/textUtils.js';

// Read existing wordList.js content
let content = fs.readFileSync('./src/data/wordList.js', 'utf8');

// Read missing words
const missingWords = JSON.parse(fs.readFileSync('./scratch/missing_words.json', 'utf8'));

// Normalize categories
missingWords.forEach(w => {
  if (w.category === 'کات') w.category = 'دەم';
});

// Prepare the new raw data string
const recoveredRawStr = `const recoveredFromDistRaw = ${JSON.stringify(missingWords, null, 2)};\n\n`;

// Find a good place to insert (before classicWords)
const insertionPoint = content.indexOf('export const classicWords = [');
content = content.slice(0, insertionPoint) + recoveredRawStr + content.slice(insertionPoint);

// Update classicWords and hardWords to include recovered words
content = content.replace(
  'export const classicWords = [',
  'export const classicWords = [\n  ...recoveredFromDistRaw.filter(w => w.word.length >= 2 && w.word.length <= 5),'
);

content = content.replace(
  'export const hardWords = [',
  'export const hardWords = [\n  ...recoveredFromDistRaw.filter(w => w.word.length >= 6),'
);

fs.writeFileSync('./src/data/wordList.js', content);
console.log('Successfully merged missing words into wordList.js');
