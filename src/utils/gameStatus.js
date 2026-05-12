import { STATUS } from '../data/constants';
import { normalizeKurdishInput } from './textUtils';
import { getRewardForMode } from './progression';

/**
 * Pure logic to analyze tile statistics across all guesses.
 * Returns { green, yellow, gray, uniqueGrays }
 */
export const analyzeTileStats = (target, guesses) => {
  let green = 0;
  let yellow = 0;
  let gray = 0;
  const allUniqueGrays = new Set();

  if (!target || !guesses || !Array.isArray(guesses)) {
    return { green: 0, yellow: 0, gray: 0, uniqueGrays: 0 };
  }

  const normTarget = normalizeKurdishInput(target);
  const targetArr = normTarget.split('');

  guesses.forEach(guess => {
    const normGuess = normalizeKurdishInput(guess);
    const guessArr = normGuess.split('');
    
    // Deterministic Win-Guard: If guess matches target visually, force greens and exit the guess analysis
    if (normTarget === normGuess && normTarget.length > 0) {
      green += targetArr.length;
      return;
    }

    const statsLen = Math.max(targetArr.length, guessArr.length);
    const statuses = new Array(statsLen).fill(STATUS.INCORRECT);
    const targetCounts = {};

    for (const char of targetArr) {
      targetCounts[char] = (targetCounts[char] || 0) + 1;
    }

    // Pass 1: Greens (Exact matches)
    const minLen = Math.min(targetArr.length, guessArr.length);
    for (let i = 0; i < minLen; i++) {
      if (guessArr[i] === targetArr[i]) {
        statuses[i] = STATUS.CORRECT;
        targetCounts[guessArr[i]]--;
        green++;
      }
    }

    // Pass 2: Yellows/Grays
    for (let i = 0; i < guessArr.length; i++) {
      if (statuses[i] !== STATUS.CORRECT) {
        const char = guessArr[i];
        if (targetCounts[char] > 0) {
          statuses[i] = STATUS.WRONG_POS;
          targetCounts[char]--;
          yellow++;
        } else {
          statuses[i] = STATUS.INCORRECT;
          gray++;
          allUniqueGrays.add(char);
        }
      }
    }
  });

  return { green, yellow, gray, uniqueGrays: allUniqueGrays.size };
};

/**
 * Calculates current reward breakdown based on mode and stats.
 */
export const calculateLevelRewards = (word, allGuesses, mode = 'classic') => {
  const currentAward = getRewardForMode(mode);
  const stats = analyzeTileStats(word, allGuesses);

  // Safety Fallback: Ensure rewards are never 0 if a win is passed
  const awardAmount = currentAward.amount || 50;
  const xpAdded = currentAward.xp || 25;

  return {
    greenCount: stats.green,
    yellowCount: stats.yellow,
    grayCount: stats.gray,
    xpAdded: xpAdded,
    awardAmount: awardAmount,
    awardType: currentAward.type || 'fils',
    mode
  };
};

/**
 * Calculates penalty for defeat.
 */
export const calculateDefeatPenalty = (word, allGuesses, mode = 'classic') => {
  const stats = analyzeTileStats(word, allGuesses);

  const multipliers = {
    'classic': 0.5,
    'word_fever': 1.0,
    'mamak': 0.2,
    'hard_words': 1.0,
    'battle': 2.0,
    'secret_word': 1.5
  };

  const mult = multipliers[mode] || 0.5;
  const basePenalty = (stats.gray * 2) + (stats.yellow * 1);
  const finalPenalty = Math.max(5, Math.ceil(basePenalty * mult));

  return {
    total: finalPenalty,
    grayCount: stats.gray,
    yellowCount: stats.yellow
  };
};
