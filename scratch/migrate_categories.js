import fs from 'fs';
const path = 'src/data/verbsList.js';
const path2 = 'src/data/wordList.js';

function migrateFile(filePath) {
    console.log(`Migrating ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace category and hint
    content = content.replace(/"category": "کار"/g, '"category": "کار(چاوگ)"');
    content = content.replace(/"hint": "کار"/g, '"hint": "کار(چاوگ)"');
    content = content.replace(/"category": "چاوگ"/g, '"category": "کار(چاوگ)"');
    
    // Specific for wordList.js key
    if (filePath.includes('wordList.js')) {
        content = content.replace(/"کار": verbsWords/g, '"کار(چاوگ)": verbsWords');
    }
    
    fs.writeFileSync(filePath, content);
}

migrateFile(path);
migrateFile(path2);
console.log('Migration complete!');
