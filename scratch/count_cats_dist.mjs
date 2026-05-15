import fs from 'fs';
const content = fs.readFileSync('./dist/assets/wordList-DV_shevD.js', 'utf8');
const cats = new Map();
const regex = /word:`([^`]+)`,hint:`[^`]+`,category:`([^`]+)`/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const cat = match[2];
  cats.set(cat, (cats.get(cat) || 0) + 1);
}
console.log('Categories in dist:', Object.fromEntries(cats));
