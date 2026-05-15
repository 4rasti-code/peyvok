import { verbsWords } from './verbsList.js';
import { adjectivesWords } from './adjectivesList.js';
import { humanNames } from './humanNamesList.js';
import { cityWords } from './cityList.js';
import { animalsWords } from './animalsList.js';
import { householdWords } from './householdList.js';
import { clothingWords } from './clothingList.js';
import { bodyPartsWords } from './bodyPartsList.js';
import { jobsWords } from './jobsList.js';
import { foodWords } from './foodList.js';
import { natureWords } from './natureList.js';
import { feelingsWords } from './feelingsList.js';
import { familyWords } from './familyList.js';
import { countryWords } from './countryWordsList.js';
import { sportsWords } from './sportsList.js';
import { placesWords } from './placesList.js';
import { mamakWords } from './mamakList.js';
import { fruitWords } from './fruitList.js';
import { vegetablesWords } from './vegetablesList.js';
import { timeWords } from './timeList.js';

// --- Master Pool (Excluding Riddles/Mamak) ---
export const allWordsMaster = [
  ...verbsWords,
  ...adjectivesWords,
  ...humanNames,
  ...cityWords,
  ...animalsWords,
  ...householdWords,
  ...clothingWords,
  ...bodyPartsWords,
  ...timeWords,
  ...jobsWords,
  ...foodWords,
  ...natureWords,
  ...feelingsWords,
  ...familyWords,
  ...countryWords,
  ...sportsWords,
  ...placesWords,
  ...fruitWords,
  ...vegetablesWords
];

// --- Specialized Export for Logic ---
export const officialWordList = {
  verbs: verbsWords,
  adjectives: adjectivesWords,
  names: humanNames,
  cities: cityWords,
  animals: animalsWords,
  household: householdWords,
  clothing: clothingWords,
  bodyParts: bodyPartsWords,
  time: timeWords,
  jobs: jobsWords,
  food: foodWords,
  nature: natureWords,
  feelings: feelingsWords,
  family: familyWords,
  countries: countryWords,
  sports: sportsWords,
  places: placesWords,
  fruit: fruitWords,
  vegetables: vegetablesWords,
  mamak: mamakWords
};

// --- Category Whitelist ---
export const OFFICIAL_CATEGORIES = [
  "دەم", "خێزان", "هەستێن دەروونی", "هەست", "پێشە", "ناڤێ مرۆڤان",
  "وەسف (هەڤالناڤ)", "کار (چاوگ)", "کەلوپەل", "گیانەوەر", "میوە",
  "زەرزەوات", "ڕەنگ", "وەلات", "باژێڕ", "ئەندامێ لەشی", "جلوبەرگ",
  "سرۆشت", "خوارن", "وەرزش", "جهـ", "مامک"
];

export const categories = OFFICIAL_CATEGORIES;
export const gameWordLists = officialWordList;
export const allWordsWithCategories = allWordsMaster;


/**
 * Gets a random word based on the mode rules:
 * - classic: 2-5 letters
 * - hard_words: 6+ letters
 * - word_fever: exactly 5 letters
 * - secret_word: 2+ letters
 * - battle: exactly 5 letters
 * - mamak: category 'مامک', 2-15 letters
 */
export const getRandomWordFromCategory = (category, level, solvedWords = [], mode = 'classic') => {
  let pool = [];

  if (mode === 'mamak') {
    pool = mamakWords;
  } else if (category && category !== 'ھەموو' && category !== 'generalWordPool') {
    // Find the list by category name (localized)
    const catMap = {
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
      "میوە": fruitWords,
      "زەرزەوات": vegetablesWords,
      "دەم": timeWords
    };
    pool = catMap[category] || allWordsMaster;
  } else {
    pool = allWordsMaster;
  }

  // Filter pool by mode rules (Letter Count)
  let filtered = pool.filter(w => {
    const len = w.word.length;
    if (mode === 'classic') return len >= 2 && len <= 5;
    if (mode === 'hard_words') return len >= 6;
    if (mode === 'word_fever') return len === 5;
    if (mode === 'battle') return len === 5;
    if (mode === 'secret_word') return len >= 2;
    if (mode === 'mamak') return len >= 2 && len <= 15;
    return true;
  });

  // Exclude solved words if possible
  const unsolved = filtered.filter(w => !solvedWords.includes(w.word));
  const finalPool = unsolved.length > 0 ? unsolved : filtered;

  if (finalPool.length === 0) return null;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
};

/**
 * Gets a set of random words for multiplayer matches.
 * Defaults to 5 words of length 5.
 */
export const getUnifiedWords = (count = 5, length = 5) => {
  const pool = allWordsMaster.filter(w => w.word.length === length);
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(w => ({
    word: w.word,
    hint: w.hint,
    category: w.category
  }));
};