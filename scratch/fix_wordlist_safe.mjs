import fs from 'fs';

const filePath = 'd:/Peyivcin App/src/data/wordList.js';
let content = fs.readFileSync(filePath, 'utf8');

const mamakWords = [
  { word: "ئەسمان", hint: "چوومە بەحرەکا شین، دوو سوار پێدا خشین، ئێک ھەسپە، ئێک ماھین.", category: "مامک" },
  { word: "بەفر", hint: "دھێت وەک خانەدaنەکێ، دعەوریت وەک سولتانەکێ، دپێچیت وەک حێسیلەکێ، دچیت وەک دێھلەکێ.", category: "مامک" },
  { word: "پانتەڕۆن", hint: "دارا دووتایە، تە ھەلدایە.", category: "مامک" },
  { word: "پیانو", hint: "تژی کلیل و دەرگەھm, لێ چ ژوور پێ ناھێنە ڤەکرن.", category: "مامک" },
  { word: "پیڤاز", hint: "ھەسپێ سپی، بارێ کەسک.", category: "مامک" },
  { word: "پێلاڤ", hint: "ئەگەر تە گرێدا دێ چیت، ئاشکری تە ڤەکر ناچیت.", category: "مامک" },
  { word: "تبل", hint: "چوومە سەرێ ملەکێ، دکەم حشکەھەوارەکێ، پێنج برا دهێن ب جارەکێ، ل سەر پشتێ حەلانەکێ.", category: "مامک" },
  { word: "تزبی", hint: "ھندی دکێشیت خلاس نابیت.", category: "مامک" },
  { word: "تڤەنگ", hint: "کەر زڕى، پشکل فڕى.", category: "مامک" },
  { word: "تەڕازی", hint: "ئەو چ تشتە یێ بێ زمانە, لێ ڕاستیێ دبێژیت؟", category: "مامک" },
  { word: "تەشی", hint: "ستوینەکا سەرستوینەکێ، ل سەر پەحنەدەشتەکێ، دەشت ل سەر بستەکێ، بست ل سەر ڕستەکێ، ڕستە لسەر مستەکێ.", category: "مامک" },
  { word: "تەڵھە", hint: "چوومە د نیڤا ڕێدا، عەجێب یەکا د ڕێدا، چرک، خوە ل باقێدا.", category: "مامک" },
  { word: "تەنیر", hint: "ب سێ لنگە، بارێ ژنکە.", category: "مامک" },
  { word: "چاڤ", hint: "ھینی مینی، یا ڕەشە ل بن کوینی، ئەز دبینم، تو نابینی.", category: "مامک" },
  { word: "چاڵ", hint: "ھەرچەند تو پتر ژ من ببەی, ئەز مەزنتر لێ دھێم.", category: "مامک" },
  { word: "خەم", hint: "نە ل ئەردى نە ل ئەسمانى، دخۆت لەشێ ئینسانى.", category: "مامک" },
  { word: "خەو", hint: "ژ شەکری شرینترە، ژ ئاسنی گرانترە.", category: "مامک" },
  { word: "دستار", hint: "سەبەتا ل سەر سەبەتێ، کلیلا ل دەستێ مەتێ.", category: "مامک" },
  { word: "دل", hint: "تڕشە مزە، ھنار نینە، د بەحرێدا، غەواس نینە، ب حوکمە، حاکم نینە.", category: "مامک" },
  { word: "دەڤ", hint: "ڤی ڕەخی دیوارە، وی ڕەخی دیوارە، دنیڤەکێدا سەیێ ھارە.", category: "مامک" },
  { word: "دەمژمێر", hint: "بێ وەستیان دەمی بۆ مە دھەژمێریت", category: "مامک" },
  { word: "دەنگ", hint: "سەر ئاڤێ ڕا دچیت و سیبەرێ نادەت.", category: "مامک" },
  { word: "دووپشک", hint: "گیانەوەرێ ژەھراوی کو مەترسییا وی د کوریا ویدایە", category: "مامک" },
  { word: "دووگیانی", hint: "ئێک ڕازایە، ئێک ڕوینشتییە، ئێک بڕێڤە دچیت.", category: "مامک" },
  { word: "زارۆک", hint: "تشتێ من و تشتانی، ل سەر مێزەرا سولتانی، ژ خودێ پێڤە نزانی.", category: "مامک" },
  { word: "زمان", hint: "تشتەک من یێ ھەی، ھەر دەم ل مالە، جار شرینە، جار تالە.", category: "مامک" },
  { word: "زەبەش", hint: "گوندەکێ کەسکە، ئاڤا وێ یا سۆرە، خەلکێ وێ یێ ڕەشە، کلیلا وی ئاسنە.", category: "مامک" },
  { word: "ژوژی", hint: "ئەز چوومە دەشتێ، من دیت پیرەمێرەک، پشتیەکێ گوینیکا ل سەر پشتێ، گوت من: ئەزێ دچمە بەحشتێ.", category: "مامک" },
  { word: "ستێنگ", hint: "ھەسپێ سۆرە، یێ ناڤچاڤ بەلەکە.", category: "مامک" },
  { word: "سۆپە", hint: "گەرم دکەت، ساڕ دکەت، شین و شادیێ وەکھەڤ دکەت، قۆناغا درێژ کورت دکەت.", category: "مامک" },
  { word: "سیبەر", hint: "ناڤێ مرۆڤان", category: "مامک" },
  { word: "سیتاڤک", hint: "من دیت و تە نەدیت، تە دیت و من نەدیت.", category: "مامک" },
  { word: "سێل", hint: "عەبدێ ڕەشێ ب گوھارەکێ.", category: "مامک" },
  { word: "فانۆس", hint: "ئاڤە، نە ئاڤە، نانێ میری د ناڤە، تەیرێ زێرین ل ھندaڤە.", category: "مامک" },
  { word: "فەرھەنگ", hint: "ناڤێ مرۆڤان", category: "مامک" },
  { word: "قایش", hint: "دۆر تە دھێت, تنێ تە نامێت.", category: "مامک" },
  { word: "قەشقەلانک", hint: "ژ بەفرێ سپیترە، ژ تەنیێ ڕەشترە.", category: "مامک" },
  { word: "کەزوان", hint: "بەحرا شینە، ئاڤ تێ نینە.", category: "مامک" },
  { word: "کولاڤ", hint: "باژێڕە، باژێڕ نینە، سیبەرە، ھەتاڤ نینە.", category: "مامک" },
  { word: "کیسەلە", hint: "ڕەقە، نە بەرە، ھێکا دکەت، نە مریشکە، گیای دخوت، نە پەزە.", category: "مامک" },
  { word: "کێڤریشک", hint: "خودان گوھێن درێژ", category: "مامک" },
  { word: "گەنم", hint: "چاڤڕەشێ دەشتێ، دوو پێ گەھشتێ، ئێخستە سەر پشتێ.", category: "مامک" },
  { word: "گویزان", hint: "ماھینا مەلای، بەردا چیایی، زلکەک نەھێلای.", category: "مامک" },
  { word: "گۆڕستان", hint: "باژێرە، بازار نینە، سیبەرە، ھەتاڤ نینە.", category: "مامک" },
  { word: "گێزک", hint: "خشت، مشت، چوو وێرا ھە ڕوینشت.", category: "مامک" },
  { word: "ماسی", hint: "سنگێ شێرا، چاڤێت مارا، عەجایبە.. درندەیە.", category: "مامک" },
  { word: "مشار", hint: "ھێڤە دارە، وێڤە دارە، د نیڤێدا گورگێ ھارە.", category: "مامک" },
  { word: "مشک", hint: "گاسمە، دیوار سمە.", category: "مامک" },
  { word: "مەمک", hint: "کانیکا ل نزارى، ھەمیان ئاڤ ژێ ڤەخارى.", category: "مامک" },
  { word: "مەنجەل", hint: "ئامانێ مەزن یا چێکرنا خوارنێ ل سەر ئاگری", category: "مامک" },
  { word: "مووخەل", hint: "دخۆت و ب سەرێ خوە وەردکەت.", category: "مامک" },
  { word: "مێری", hint: "یێ ل سەرێ زویرى، سەر مەزنترە ژعویرى.", category: "مامک" },
  { word: "مێشھنگڤین", hint: "تاکە گیانەوەرە خوارنێ دروست دکەت", category: "مامک" },
  { word: "ناڤ", hint: "چوومە سەر دارەکێ، دکەم ھشکەھەوارەکێ، سەد مێر دهێن ب جارەکێ، مەلەیە سەر منارەکێ.", category: "مامک" },
  { word: "نەخشە", hint: "چیایێ بێ کەڤر، دەریایا بێ ئاڤ، دارستانا بێ دار، باژێرێ بێ مرۆڤ.", category: "مامک" },
  { word: "ھاڤین", hint: "مەنجەلا عەندەلى، پڕچ-پڕچ دکەلى، نە ئاگرە، نە خوەلى.", category: "مامک" },
  { word: "ھنار", hint: "سفۆرە، سکی سکی، سەر دارەکا پندکی، ھزار و ئێک ل زکی.", category: "مامک" }
];

const mamakWordsJS = JSON.stringify(mamakWords, null, 2);

// Find the line index of 'const mamakWords ='
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('const mamakWords = ['));
if (startIdx === -1) {
  console.error('Could not find const mamakWords');
  process.exit(1);
}

// Find the closing bracket '];' after startIdx
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].trim() === '];') {
    endIdx = i;
    break;
  }
}

if (endIdx === -1) {
  console.error('Could not find closing bracket for mamakWords');
  process.exit(1);
}

// Replace the block
lines.splice(startIdx, endIdx - startIdx + 1, 'const mamakWords = ' + mamakWordsJS + ';');

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Successfully updated wordList.js');
