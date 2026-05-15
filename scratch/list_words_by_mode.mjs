import fs from 'fs';
import { wordListUnique } from '../src/data/wordList.js';

console.log("Categorizing words by game modes...");

const categories = {
    'پەیڤۆک کلاسیک (2-5 پیت)': wordListUnique.filter(w => w.word.length >= 2 && w.word.length <= 5),
    'پەیڤێن دژوار (6+ پیت)': wordListUnique.filter(w => w.word.length >= 6),
    'تایا پەیڤان و هەڤڕکی (ڕێک 5 پیت)': wordListUnique.filter(w => w.word.length === 5),
    'پەیڤا نهێنی (2+ پیت)': wordListUnique.filter(w => w.word.length >= 2),
    'مامک (کۆدی تایبەت)': wordListUnique.filter(w => w.category === 'مامک' || (w.hint && w.hint.length > 10))
};

let output = "=== Peyvok Game Modes Word List ===\n\n";

for (const [mode, words] of Object.entries(categories)) {
    output += `\n[ ${mode} ] - (کۆی گشتی: ${words.length} پەیڤ)\n`;
    output += "--------------------------------------------------\n";
    output += words.map(w => w.word).join(', ') + "\n";
}

fs.writeFileSync('scratch/game_modes_list.txt', output);
console.log("✅ Done! File created: scratch/game_modes_list.txt");
