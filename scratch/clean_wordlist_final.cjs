const fs = require('fs');
const path = 'd:/Peyivcin App/src/data/wordList.js';

let content = fs.readFileSync(path, 'utf8');

// Replace English letters inside hint strings
content = content.replace(/hint: "([^"]*)"/g, (match, hintText) => {
    let cleaned = hintText
        .replace(/d/g, 'د')
        .replace(/n/g, 'ن')
        .replace(/b/g, 'ب')
        .replace(/j/g, 'ج')
        .replace(/h/g, 'ھ');
    return `hint: "${cleaned}"`;
});

fs.writeFileSync(path, content, 'utf8');
console.log("Cleaned wordList.js successfully.");
