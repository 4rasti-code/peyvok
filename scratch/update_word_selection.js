import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/data/wordList.js');
let content = fs.readFileSync(filePath, 'utf8');

const oldLogic = `  if (category && category !== 'ھەموو' && category !== 'generalWordPool') {
    const filtered = pool.filter(w => w.category === category);
    if (filtered.length > 0) pool = filtered;
  }

  if (!pool || pool.length === 0) return null;

  const normSolved = solvedWords.map(sw => sw.toLowerCase().trim());

  let availableWords = pool.filter(item => {
    const normWord = item.word.toLowerCase().trim();
    return !normSolved.includes(normWord);
  });

  if (availableWords.length === 0) {
    availableWords = pool;
  }

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}`;

const newLogic = `  if (category && category !== 'ھەموو' && category !== 'generalWordPool') {
    const filtered = pool.filter(w => w.category === category);
    if (filtered.length > 0) pool = filtered;
  } else if (!category || category === 'ھەموو') {
    // --- BALANCED CATEGORY SELECTION ---
    const normSolved = (solvedWords || []).map(sw => sw.toLowerCase().trim());
    const categoryMap = {};
    pool.forEach(item => {
      const normWord = item.word.toLowerCase().trim();
      if (!normSolved.includes(normWord)) {
        if (!categoryMap[item.category]) categoryMap[item.category] = [];
        categoryMap[item.category].push(item);
      }
    });

    const availableCats = Object.keys(categoryMap);
    if (availableCats.length > 0) {
      const randomCat = availableCats[Math.floor(Math.random() * availableCats.length)];
      pool = categoryMap[randomCat];
    } else {
      const fallbackCats = [...new Set(pool.map(w => w.category))];
      if (fallbackCats.length > 0) {
        const randomCat = fallbackCats[Math.floor(Math.random() * fallbackCats.length)];
        pool = pool.filter(w => w.category === randomCat);
      }
    }
  }

  if (!pool || pool.length === 0) return null;

  const normSolved = (solvedWords || []).map(sw => sw.toLowerCase().trim());

  let availableWords = pool.filter(item => {
    const normWord = item.word.toLowerCase().trim();
    return !normSolved.includes(normWord);
  });

  if (availableWords.length === 0) {
    availableWords = pool;
  }

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}`;

if (content.includes(oldLogic)) {
    content = content.replace(oldLogic, newLogic);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated wordList.js');
} else {
    console.log('Target logic block not found or already updated.');
}
