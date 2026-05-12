const fs = require('fs');
let raw = fs.readFileSync('d:/Peyivcin App/all_errors.json', 'utf16le');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);
data.forEach(file => {
  const errors = file.messages.filter(m => m.ruleId === 'no-unused-vars').map(m => `Line ${m.line}: ${m.message}`);
  if (errors.length > 0) {
    console.log(`\nFile: ${file.filePath}`);
    console.log(errors.join('\n'));
  }
});
