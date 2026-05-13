const fs = require('fs');

const rawNames = `
چیاڤان
دانا
دلمان
دیدەڤان
دەشتی
زێوەر
سێڤدین
شاهین
ڤەهێل
ڤەگێڕ
قەندیل
کوردۆ
میرزا
هۆشەنگ
هیوا
هونەر
ژڤان
ڕێنجبەر
سەرمەد
باهۆز
بەندەوار
پەروەر
دادڤان
رۆستەم
رێڤینگ
رێوان
زێوە
سامان
شڤان
ڤەژەن
کرێکار
مەلەڤان
نالبەند
یەکبوون
پارێز
پەیڤان
دەڤەر
دارین
سەروەر
کەسەر
بژار
دابین
ڤینوار
گەلهات
نەدیار
نیوار
وار
مەردان
ئاهەنگ
ڕەوشەن
سۆلین
شەهناز
ئاهین
سۆزان
بارین
ژینۆ
سپێدە
هێڤیدار
سەما
پڕڤین
`;

const words = rawNames.trim().split('\n').map(n => n.trim()).filter(n => n.length > 0);
let sqlValues = [];

for (const w of words) {
    let length = w.length;
    let tags = [];

    // کلاسیک: تەنێ پەیڤێن ٢ بۆ ٥ پیت.
    if (length >= 2 && length <= 5) {
        tags.push('classic');
    }
    
    // پەیڤێن دژوار: پەیڤێن ٦ پیت و پتر.
    if (length >= 6) {
        tags.push('hard_words');
    }
    
    // تایا پەیڤان: پەیڤێن ڕێک ٥ پیت.
    if (length === 5) {
        tags.push('word_fever');
    }
    
    // پەیڤا نهێنی: پەیڤێن ٢ پیت و پتر
    if (length >= 2) {
        tags.push('secret_word');
    }
    
    // هەڤڕکی: پەیڤێن ڕێک ٥ پیت
    if (length === 5) {
        tags.push('battle');
    }

    let tagsStr = tags.map(t => `'${t}'`).join(', ');
    sqlValues.push(`  ('${w}', 'ناڤێ مرۆڤان', 'ناڤێ مرۆڤان', ARRAY[${tagsStr}]::text[])`);
}

const newSql = sqlValues.join(',\n');

// Read the existing file
const filePath = 'd:/Peyivcin App/insert_human_names_only.sql';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the last ON CONFLICT line with the new entries
content = content.replace('ON CONFLICT (word, hint) DO NOTHING;', ',\n' + newSql + '\nON CONFLICT (word, hint) DO NOTHING;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added ' + words.length + ' new names to ' + filePath);

// Now update wordList.js as well to keep frontend in sync
const jsFilePath = 'd:/Peyivcin App/src/data/wordList.js';
let jsContent = fs.readFileSync(jsFilePath, 'utf8');

const newJsEntries = words.map(w => `  "${w}": "ناڤێ مرۆڤان",`).join('\n');

// We need to inject these before the closing brace of humanNamesRaw
const jsInjectPos = jsContent.lastIndexOf('};\n\nexport const adjectivesRaw');
if (jsInjectPos !== -1) {
  let before = jsContent.substring(0, jsInjectPos);
  let after = jsContent.substring(jsInjectPos);
  // Remove the trailing comma from the last line before inject if it exists
  if (!before.trim().endsWith(',')) {
    before = before.trimEnd() + ',\n';
  } else {
    before = before.trimEnd() + '\n';
  }
  
  const finalJsContent = before + newJsEntries + '\n' + after;
  fs.writeFileSync(jsFilePath, finalJsContent, 'utf8');
  console.log('Added new names to wordList.js');
}

