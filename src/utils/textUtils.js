/**
 * Standard Kurdish Text Normalization for Wordle Comparison
 * Handles variants of 'K', 'Y', and 'H' to ensure consistent matching.
 */
export const normalizeKurdishInput = (input) => {
  if (!input) return '';
  return input
    .trim()
    .normalize('NFC')
    .replace(/ك/g, 'ک')
    .replace(/[يى]/g, 'ی')
    .replace(/ة/g, 'ە')
    .replace(/ه/g, 'ھ')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ''); // Remove zero-width spaces
};

/**
 * Enhanced Normalization for Word Fever and complex comparisons
 */
export const feverNormalize = (str) => {
  if (!str) return '';
  return normalizeKurdishInput(str)
    .replace(/ه/g, 'ھ') // Extra insurance for the 'H' variants
    .replace(/ک/g, 'ك') // Normalize back to one preferred form if needed for comparison
    .replace(/ی/g, 'ي');
};
