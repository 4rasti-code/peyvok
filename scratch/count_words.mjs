import { verbsWords } from '../src/data/verbsList.js';
import { adjectivesWords } from '../src/data/adjectivesList.js';
import { humanNames } from '../src/data/humanNamesList.js';
import { cityWords } from '../src/data/cityList.js';
import { animalsWords } from '../src/data/animalsList.js';
import { householdWords } from '../src/data/householdList.js';
import { clothingWords } from '../src/data/clothingList.js';
import { bodyPartsWords } from '../src/data/bodyPartsList.js';
import { jobsWords } from '../src/data/jobsList.js';
import { foodWords } from '../src/data/foodList.js';
import { natureWords } from '../src/data/natureList.js';
import { feelingsWords } from '../src/data/feelingsList.js';
import { familyWords } from '../src/data/familyList.js';
import { countryWords } from '../src/data/countryWordsList.js';
import { sportsWords } from '../src/data/sportsList.js';
import { placesWords } from '../src/data/placesList.js';
import { mamakWords } from '../src/data/mamakList.js';
import { artWords } from '../src/data/artList.js';
import { fruitWords } from '../src/data/fruitList.js';
import { vegetablesWords } from '../src/data/vegetablesList.js';
import { timeWords } from '../src/data/timeList.js';

const lists = {
  "کار (چاوگ)": verbsWords,
  "وەسف (هەڤالناڤ)": adjectivesWords,
  "ناڤێ مرۆڤان": humanNames,
  "باژێڕ": cityWords,
  "گیانەوەر": animalsWords,
  "کەلوپەل": householdWords,
  "جلوبەرگ": clothingWords,
  "ئەندامێ لەشی": bodyPartsWords,
  "پیشە": jobsWords,
  "خوارن": foodWords,
  "سرۆشت": natureWords,
  "هەست": feelingsWords,
  "خێزان": familyWords,
  "وەلات": countryWords,
  "وەرزش": sportsWords,
  "جهـ": placesWords,
  "مامک": mamakWords,
  "هونەر": artWords,
  "میوە": fruitWords,
  "زەرزەوات": vegetablesWords,
  "دەم": timeWords
};

let total = 0;
console.log("--- ژمارەیا پەیڤان ب پێی کاتاگۆرییان ---");
for (const [name, list] of Object.entries(lists)) {
  console.log(`${name}: ${list.length}`);
  total += list.length;
}
console.log("---------------------------------------");
console.log(`کۆمێ گشتی یێ پەیڤان: ${total}`);
