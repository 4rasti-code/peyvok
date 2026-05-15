const fs = require('fs');

function countWords(filePath, pattern) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(pattern);
        return matches ? matches.length : 0;
    } catch (e) {
        return e.message;
    }
}

console.log('wordList.js:', countWords('src/data/wordList.js', /word: "/g));
console.log('verbsList.js:', countWords('src/data/verbsList.js', /"word": "/g));
