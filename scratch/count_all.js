import { wordListUnique } from '../src/data/wordList.js';

console.log('--- Peyvok Comprehensive Word Count Report ---');
console.log(`Total Authoritative Words: ${wordListUnique.length}`);

// Counting by Mode Logic
const classic = wordListUnique.filter(w => w.word.length >= 2 && w.word.length <= 5).length;
const hard = wordListUnique.filter(w => w.word.length >= 6).length;
const fever = wordListUnique.filter(w => w.word.length === 5).length;
const multiplayer = fever; // Usually the same as Word Fever
const secret = wordListUnique.filter(w => w.word.length >= 2).length;
const mamak = wordListUnique.filter(w => w.category === 'مامک' || (w.hint && w.hint.length > 10)).length;

console.log(`1. پەیڤۆک کلاسیک: ${classic}`);
console.log(`2. پەیڤێن دژوار: ${hard}`);
console.log(`3. تایا پەیڤان: ${fever}`);
console.log(`4. هەڤڕکی سەرهێل: ${multiplayer}`);
console.log(`5. پەیڤا نهێنی: ${secret}`);
console.log(`6. مامک (Riddles): ${mamak}`);
console.log('----------------------------------------------');
