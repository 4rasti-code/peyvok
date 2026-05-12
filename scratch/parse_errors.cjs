const fs = require('fs');
let raw = fs.readFileSync('d:/Peyivcin App/app_eslint_errors.json', 'utf16le');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);
const errors = data[0].messages.filter(m => m.ruleId === 'no-unused-vars').map(m => `Line ${m.line}: ${m.message}`);
console.log(errors.join('\n'));
