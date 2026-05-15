import fs from 'fs';
const content = fs.readFileSync('./dist/assets/wordList-DV_shevD.js', 'utf8');
const verbs = [];
const regex = /word:`([^`]+)`,hint:`[^`]+`,category:`کار \(چاوگ\)`/g;
let match;
while ((match = regex.exec(content)) !== null) {
  verbs.push(match[1]);
}
console.log('Verbs in dist:', verbs.length);
console.log('Unique Verbs in dist:', new Set(verbs).size);
