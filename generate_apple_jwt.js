/* eslint-env node */
const fs = require('fs');
const jwt = require('jsonwebtoken'); // You need to run: npm install jsonwebtoken

// ⚠️ تکایە ئەڤان زانیاریان ل خوارێ پڕ بکە ب دروستی:

const TEAM_ID = 'YOUR_TEAM_ID_HERE'; // وەکی: ABCD123456 (ژ هەژمارا ئەپڵ)
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // وەکی: com.peyvcin.app.auth (یان ئەو کۆدێ تە ل خانا Client ID دانا بوو)
const KEY_ID = 'YOUR_KEY_ID_HERE'; // وەکی: 123ABC456D (ئەو کلیلێ تە ل ئەپڵ دروستکری)

// ناڤێ فایلێ .p8 یێ تە دابەزاندی. دڤێت د ناڤ هەمان فۆلدەرا ڤی فایلیدا بیت.
// بۆ نموونە: './AuthKey_123ABC456D.p8'
const PRIVATE_KEY_PATH = './AuthKey_YOUR_KEY_ID.p8';

try {
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d', // کۆد دێ بۆ ماوێ 6 هەیڤان کار کەت (زۆرترین ماوەیێ ئەپڵ ڕێپێدای)
    audience: 'https://appleid.apple.com',
    issuer: TEAM_ID,
    subject: CLIENT_ID,
    keyid: KEY_ID,
  });

  console.log('\n✅ ئەڤە کۆدێ تە یێ JWT یە (Secret Key):\n');
  console.log(token);
  console.log('\n👉 ئەڤی کۆدی کۆپی بکە و ل خانا "Secret Key" ل Supabase دانێ و Save بکە.');

} catch (error) {
  console.error('\n❌ کێشەیەک چێبوو:');
  console.error(error.message);
  console.log('پشتڕاستبە کو فایلێ .p8 ل ناڤ فۆلدەرێ یە و ناڤێ وی تە یێ ڕاست نڤێسیە.');
}
