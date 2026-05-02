import { useState, useCallback, useRef, useEffect } from 'react';
import { STATUS } from '../data/constants';
import { normalizeKurdishInput } from '../utils/textUtils';
import { triggerHaptic } from '../utils/haptics';

export default function useGameLogic({ 
  targetWord, 
  maxRows = 6, 
  gameMode = 'classic',
  revealedIndices = [],
  onGuessSubmitted = null,
  onWin = null,
  onLoss = null,
  isLevelingUp = false,
  isActive = false
}) {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(new Array(targetWord?.length || 5).fill(''));
  const [usedKeys, setUsedKeys] = useState({});
  const [isVictory, setIsVictory] = useState(false);
  const [isDefeat, setIsDefeat] = useState(false);
  
   // Use refs for values needed in stable callbacks
   const isSubmittingRef = useRef(false);
   const targetWordRef = useRef(targetWord);
   const revealedIndicesRef = useRef(revealedIndices);
   const isGameStateLockedRef = useRef(false);
   const guessesRef = useRef(guesses);
   const currentGuessRef = useRef(currentGuess);
 
   useEffect(() => {
     targetWordRef.current = targetWord;
   }, [targetWord]);
 
   useEffect(() => {
     revealedIndicesRef.current = revealedIndices;
   }, [revealedIndices]);
 
   useEffect(() => {
     isGameStateLockedRef.current = isLevelingUp || isVictory || isDefeat;
   }, [isLevelingUp, isVictory, isDefeat]);

   useEffect(() => {
     guessesRef.current = guesses;
   }, [guesses]);

   useEffect(() => {
     currentGuessRef.current = currentGuess;
   }, [currentGuess]);

  // Helper to re-initialize the guess array when targetWord changes
  const resetLocalBoard = useCallback((newTargetWord) => {
    setGuesses([]);
    setCurrentGuess(new Array(newTargetWord?.length || 5).fill(''));
    setUsedKeys({});
    setIsVictory(false);
    setIsDefeat(false);
    isSubmittingRef.current = false;
  }, []);

  const getLetterStatus = useCallback((guess, index, customTarget = targetWordRef.current) => {
    if (!customTarget || !guess) return STATUS.NONE;
    const guessString = Array.isArray(guess) ? guess.join('') : guess;
    const targetArr = normalizeKurdishInput(customTarget).split('');
    const guessArr = normalizeKurdishInput(guessString).split('');
    
    // Pass 1: Correct positions
    if (guessArr[index] === targetArr[index]) return STATUS.CORRECT;
    
    // Pass 2: Wrong positions (Letter exists but in different spot)
    const targetCounts = {};
    for (const char of targetArr) targetCounts[char] = (targetCounts[char] || 0) + 1;
    
    // Subtract greens
    for (let i = 0; i < guessArr.length; i++) {
        if (guessArr[i] === targetArr[i]) targetCounts[guessArr[i]]--;
    }
    
    // Check if this yellow is available
    let availableYellows = targetCounts[guessArr[index]] || 0;
    if (availableYellows > 0) {
        // Count how many of this same letter appeared before this index as yellows
        let yellowsBefore = 0;
        for (let i = 0; i < index; i++) {
            if (guessArr[i] !== targetArr[i] && guessArr[i] === guessArr[index]) {
                yellowsBefore++;
            }
        }
        if (yellowsAfterNone(guessArr, targetArr, index)) {
             if (yellowsBefore < availableYellows) return STATUS.WRONG_POS;
        }
    }
    
    return STATUS.INCORRECT;
  }, []); // Stable status checker

  // Internal helper for complex yellow logic
  const yellowsAfterNone = () => {
      // This is a simplified check for the classic Wordle double-letter rule
      return true; 
  };

  const onKey = useCallback((key) => {
    if (!targetWordRef.current || isSubmittingRef.current || isGameStateLockedRef.current) return;
    const cleanKey = normalizeKurdishInput(key);
    
    setCurrentGuess(prev => {
      const nextGuess = [...prev];
      let placed = false;
      for (let i = 0; i < nextGuess.length; i++) {
        if (nextGuess[i] === '' && !revealedIndicesRef.current.includes(i)) {
          nextGuess[i] = cleanKey;
          placed = true;
          break;
        }
      }
      return placed ? nextGuess : prev;
    });
  }, []); // COMPLETELY STABLE

  const onDelete = useCallback(() => {
    if (!targetWordRef.current || isSubmittingRef.current || isGameStateLockedRef.current) return;
    
    setCurrentGuess(prev => {
      const nextGuess = [...prev];
      let deleted = false;
      for (let i = nextGuess.length - 1; i >= 0; i--) {
        if (nextGuess[i] !== '' && !revealedIndicesRef.current.includes(i)) {
          nextGuess[i] = '';
          deleted = true;
          break;
        }
      }
      return deleted ? nextGuess : prev;
    });
  }, []); // COMPLETELY STABLE

  // Internal hooks for cleanup and stability
  const onWinRef = useRef(onWin);
  const onLossRef = useRef(onLoss);
  const onGuessSubmittedRef = useRef(onGuessSubmitted);

  useEffect(() => { onWinRef.current = onWin; }, [onWin]);
  useEffect(() => { onLossRef.current = onLoss; }, [onLoss]);
  useEffect(() => { onGuessSubmittedRef.current = onGuessSubmitted; }, [onGuessSubmitted]);

  // ... (rest of the component logic)

  const onEnter = useCallback(async (forcedGuess = null) => {
    const target = targetWordRef.current;
    if (!target || isSubmittingRef.current || isGameStateLockedRef.current) return;
    
    const guessString = forcedGuess || normalizeKurdishInput(currentGuessRef.current.join(''));

    if (guessString.length < target.length) {
      triggerHaptic([50, 30, 50]);
      return { error: 'پەیڤ کێمە!' };
    }

    isSubmittingRef.current = true;
    
    const colors = guessString.split('').map((_, i) => getLetterStatus(guessString, i, target));
    const isWin = normalizeKurdishInput(guessString) === normalizeKurdishInput(target);
    const currentGuesses = guessesRef.current;
    
    // Update Guesses
    setGuesses(prev => [...prev, guessString]);

    // Update used keys
    setUsedKeys(prevKeys => {
      const next = { ...prevKeys };
      guessString.split('').forEach((char, i) => {
        const status = colors[i];
        if (!next[char] || status === STATUS.CORRECT) next[char] = status;
      });
      return next;
    });

    // Trigger Win/Loss Side Effects
    const finalStateGuesses = [...currentGuesses, guessString];
    if (isWin) {
      setIsVictory(true);
      if (onWinRef.current) onWinRef.current(finalStateGuesses, targetWord, gameMode);
    } else if (finalStateGuesses.length >= maxRows) {
      setIsDefeat(true);
      if (onLossRef.current) onLossRef.current(finalStateGuesses, targetWord, gameMode);
    }

    // Notify caller
    if (onGuessSubmittedRef.current) {
      onGuessSubmittedRef.current(colors, isWin);
    }

    if (!isWin) {
      // Prepare next row
      const freshGuess = new Array(target.length).fill('');
      revealedIndicesRef.current.forEach(idx => freshGuess[idx] = target[idx]);
      setCurrentGuess(freshGuess);
    } else {
      // CLEAR for next game/state even if winning
      setCurrentGuess(new Array(target.length).fill(''));
    }

    setTimeout(() => { isSubmittingRef.current = false; }, 300);
    return { success: true, colors, isWin };
  }, [maxRows, getLetterStatus, targetWord, gameMode]); 

  // --- CENTRALIZED PHYSICAL KEYBOARD SUPPORT ---
  useEffect(() => {
    if (!isActive || !targetWordRef.current) return;

    const handleKeyDown = (e) => {
      // 1. Safety Check: Ignore if typing in a real input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
      
      // 2. Modifier Check: Ignore if Ctrl, Alt, or Meta keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const inputKey = e.key;

      // 3. Special Keys Mapping
      if (inputKey === 'Enter') {
        e.preventDefault();
        onEnter();
        return;
      }
      if (inputKey === 'Backspace') {
        e.preventDefault();
        onDelete();
        return;
      }

      // 4. Kurdish Normalization
      let char = inputKey;
      const normalizeMap = {
        'ه': 'ھ', 'ك': 'ک', 'ي': 'ی', 'ة': 'ە'
      };
      const latinMap = { 'h': 'ھ', 'H': 'ھ', 'r': 'ر', 'R': 'ڕ' };
      
      if (normalizeMap[char]) char = normalizeMap[char];
      else if (latinMap[char]) char = latinMap[char];

      // 5. Alphabet Validation
      const alphabet = 'ئابپت جچحخد ر ڕ ز ژ س ش ع غ ف ڤ ق ک گ ل ڵ م ن و ۆ ھ ە ی ێ'.replace(/\s/g, '');
      if (alphabet.includes(char)) {
        onKey(char);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onKey, onDelete, onEnter]);

  return {
    guesses,
    setGuesses,
    currentGuess,
    setCurrentGuess,
    usedKeys,
    setUsedKeys,
    isVictory,
    setIsVictory,
    isDefeat,
    setIsDefeat,
    onKey,
    onDelete,
    onEnter,
    getLetterStatus,
    resetLocalBoard
  };
}
