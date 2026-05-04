/**
 * Wordle-style Result Sharing Utility
 * Formats game results into an emoji grid and uses Web Share API or Clipboard.
 */

const EMOJI = {
  CORRECT: '🟩',
  WRONG_POS: '🟨',
  ABSENT: '⬛',
  EMPTY: '⬜'
};

/**
 * Generates a Wordle-style emoji grid from guesses.
 * @param {Array<Array<string>>} guesses - The letters guessed.
 * @param {string} targetWord - The actual word.
 * @returns {string} The emoji grid.
 */
export const generateWordleGrid = (guesses, targetWord) => {
  if (!guesses || !targetWord) return '';
  
  return guesses.map(guess => {
    if (!guess) return '';
    
    // Create a copy of target chars to handle duplicate letters
    const targetChars = [...targetWord];
    const statuses = new Array(targetWord.length).fill(EMOJI.ABSENT);

    // Normalize guess to array of characters
    const guessArr = Array.isArray(guess) ? guess : [...guess];
    const targetArr = Array.isArray(targetWord) ? targetWord : [...targetWord];

    // First pass: Correct letters
    guessArr.forEach((char, i) => {
      if (char === targetArr[i]) {
        statuses[i] = EMOJI.CORRECT;
        targetChars[i] = null;
      }
    });

    // Second pass: Wrong position letters
    guessArr.forEach((char, i) => {
      if (statuses[i] === EMOJI.ABSENT) {
        const foundIndex = targetChars.indexOf(char);
        if (foundIndex !== -1) {
          statuses[i] = EMOJI.WRONG_POS;
          targetChars[foundIndex] = null;
        }
      }
    });

    return statuses.join('');
  }).filter(line => line !== '').join('\n');
};

/**
 * Shares the game result using Web Share API or Clipboard fallback.
 * @param {Object} options - { title, grid }
 * @returns {Promise<boolean>} True if shared/copied, false otherwise.
 */
export const shareGameResult = async ({ title, grid }) => {
  const fullText = `${title}\n\n${grid}\n\nپەیڤچن: یارییا پەیڤان ب کوردی\npeyivcin.vercel.app`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'ئەنجامێ من د پەیڤچن دا',
        text: fullText,
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(fullText);
    return 'clipboard';
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Converts hex color codes to Wordle emojis.
 * @param {Array<Array<string>>} colorGrid - Array of color arrays.
 * @returns {string} Emoji grid.
 */
export const colorsToEmojiGrid = (colorGrid) => {
  if (!colorGrid || !Array.isArray(colorGrid)) return '';
  
  return colorGrid.map(row => {
    return row.map(color => {
      // Map common game colors to emojis
      if (color === '#10b981' || color === 'CORRECT') return EMOJI.CORRECT;
      if (color === '#facc15' || color === 'WRONG_POS') return EMOJI.WRONG_POS;
      if (color === '#334155' || color === 'INCORRECT') return EMOJI.ABSENT;
      return EMOJI.ABSENT;
    }).join('');
  }).join('\n');
};
