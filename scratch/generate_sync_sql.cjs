const fs = require('fs');

// Simple parser for wordList.js style (extracts words and hints)
function parseLocalWords(content) {
    const words = [];
    const regex = /\{ word: "([^"]+)", hint: "([^"]+)"(?:, category: "([^"]+)")? \}/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        words.push({ word: match[1], hint: match[2], category: match[3] || null });
    }
    return words;
}

// Simple parser for verbsList.js style (JSON-ish)
function parseVerbs(content) {
    const words = [];
    const regex = /"word": "([^"]+)",\s+"hint": "([^"]+)",\s+"category": "([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        words.push({ word: match[1], hint: match[2], category: match[3] });
    }
    return words;
}

try {
    const wordListContent = fs.readFileSync('src/data/wordList.js', 'utf8');
    const verbsContent = fs.readFileSync('src/data/verbsList.js', 'utf8');

    const allWords = [
        ...parseLocalWords(wordListContent),
        ...parseVerbs(verbsContent)
    ];

    let sql = `-- Sync all words from code to Supabase\n`;
    sql += `INSERT INTO words (word, hint, category)\nVALUES\n`;

    const values = allWords.map(w => {
        const safeWord = w.word.replace(/'/g, "''");
        const safeHint = w.hint.replace(/'/g, "''");
        const safeCat = (w.category || 'بێ کاتاگۆری').replace(/'/g, "''");
        return `('${safeWord}', '${safeHint}', '${safeCat}')`;
    });

    sql += values.join(',\n') + `\n`;
    sql += `ON CONFLICT (word) DO NOTHING;`;

    fs.writeFileSync('sync_all_words_to_supabase.sql', sql);
    console.log(`Generated SQL with ${allWords.length} words.`);
} catch (e) {
    console.error(e.message);
}
