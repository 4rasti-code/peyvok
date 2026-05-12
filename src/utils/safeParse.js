/**
 * Safely parses a JSON string from localStorage or elsewhere.
 * If the string is corrupted or invalid, it returns the provided fallback value,
 * and optionally removes the corrupted key from localStorage.
 * 
 * @param {string} value - The JSON string to parse
 * @param {any} fallback - The value to return if parsing fails
 * @param {string} [storageKeyToRemove] - Optional localStorage key to remove if corrupted
 * @returns {any} The parsed object or fallback
 */
export const safeJSONParse = (value, fallback, storageKeyToRemove = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.error(`[safeJSONParse] Failed to parse value. Returning fallback. Error:`, err);
    if (storageKeyToRemove) {
      try {
        localStorage.removeItem(storageKeyToRemove);
        console.warn(`[safeJSONParse] Removed corrupted storage key: ${storageKeyToRemove}`);
      } catch (_e) {
        // Ignore localStorage errors
      }
    }
    return fallback;
  }
};
