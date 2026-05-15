import fs from 'fs';
const content = fs.readFileSync('./dist/assets/wordList-DV_shevD.js', 'utf8');
const humanNames = [];
const regex = /word:`([^`]+)`,hint:`[^`]+`,category:`ناڤێ مرۆڤان`/g;
let match;
while ((match = regex.exec(content)) !== null) {
  humanNames.push(match[1]);
}
console.log('Human Names in dist:', humanNames.length);
console.log('Unique Human Names in dist:', new Set(humanNames).size);
