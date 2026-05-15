import { wordListUnique } from '../src/data/wordList.js';
const cats = new Map();
wordListUnique.forEach(w => {
  cats.set(w.category, (cats.get(w.category) || 0) + 1);
});
console.log('Categories in source:', Object.fromEntries(cats));
