import fs from 'fs';
const content = fs.readFileSync('./dist/assets/wordList-DV_shevD.js', 'utf8');
const words = [];
const regex = /word:`([^`]+)`/g;
let match;
while ((match = regex.exec(content)) !== null) {
  words.push(match[1]);
}
const unique = new Set(words);
console.log('Total matches:', words.length);
console.log('Unique words:', unique.size);

// Print first 10 for verification
console.log('Sample:', words.slice(0, 10));
