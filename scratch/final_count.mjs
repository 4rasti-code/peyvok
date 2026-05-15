import { classicWords, hardWords, wordFeverWords, mamakWords } from '../src/data/wordList.js';
import { verbsWords } from '../src/data/verbsList.js';

const all = [
  ...classicWords,
  ...hardWords,
  ...wordFeverWords,
  ...mamakWords,
  ...verbsWords
];

const uniqueWords = new Set();
all.forEach(w => uniqueWords.add(w.word));

console.log('Total words:', all.length);
console.log('Unique words:', uniqueWords.size);

// Check for categories
const categories = new Set();
all.forEach(w => categories.add(w.category));
console.log('Categories:', Array.from(categories));
