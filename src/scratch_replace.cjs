const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      results = results.concat(walk(p));
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      results.push(p);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  if (file.includes('gameStore.js') || file.includes('GameContext.jsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace references to context/GameContext with store/gameStore
  content = content.replace(/(['"])(\.?\.\/[^'"]*)context\/GameContext(['"])/g, "$1$2store/gameStore$3");
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
