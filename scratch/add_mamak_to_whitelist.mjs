import fs from 'fs';

const filePath = 'd:/Peyivcin App/src/data/wordList.js';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const OFFICIAL_CATEGORIES = ['));

if (idx !== -1) {
  // Add 'مامک' after the first bracket
  lines.splice(idx + 1, 0, '  "مامک",');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Added مامک to OFFICIAL_CATEGORIES');
} else {
  console.error('Could not find OFFICIAL_CATEGORIES');
}
