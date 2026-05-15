import fs from 'fs';

// Helper to count word occurrences in a file
function getWords(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/"word":\s*"(.*?)"|word:\s*"(.*?)"/g);
    if (!matches) return [];
    return matches.map(m => {
        const val = m.match(/"(.*?)"/g).pop().replace(/"/g, '');
        return val;
    });
}

const wordListWords = getWords('d:/Peyivcin App/src/data/wordList.js');
const verbsListWords = getWords('d:/Peyivcin App/src/data/verbsList.js');

const allWords = [...wordListWords, ...verbsListWords];
const uniqueWords = new Set(allWords);

console.log(`Total words (including duplicates in code): ${allWords.length}`);
console.log(`Total unique words (Dictionary size): ${uniqueWords.size}`);

// breakdown
const humanNames = wordListWords.filter((_, i, arr) => {
    // This is hard to breakdown precisely by regex, but let's try counting by category mentions
});

// Actually, I'll just check the file content for the word "1500" or similar to see if there's a comment
