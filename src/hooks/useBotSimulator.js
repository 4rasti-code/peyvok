import { useEffect, useRef } from 'react';

import { STATUS } from "../data/constants";

// Helper to evaluate colors exactly like Wordle
function evaluateGuess(guessString, targetString) {
  const guess = guessString.split('');
  const target = targetString.split('');
  const len = targetString.length;
  const colors = Array(len).fill(STATUS.INCORRECT); 
  const statuses = Array(len).fill(3); // 3 = absent
  const targetLetterCount = {};

  target.forEach(l => {
    targetLetterCount[l] = (targetLetterCount[l] || 0) + 1;
  });

  // First pass: Correct (Green)
  guess.forEach((letter, i) => {
    if (letter === target[i]) {
      colors[i] = STATUS.CORRECT; 
      statuses[i] = 1; // Correct
      targetLetterCount[letter] -= 1;
    }
  });

  // Second pass: Wrong Position (Yellow)
  guess.forEach((letter, i) => {
    if (colors[i] !== STATUS.CORRECT && targetLetterCount[letter] > 0) {
      colors[i] = STATUS.WRONG_POS; 
      statuses[i] = 2; // Wrong Pos
      targetLetterCount[letter] -= 1;
    }
  });

  return { colors, statuses };
}

export default function useBotSimulator({
  isBot,
  multiplayerState,
  isGameActive,
  targetWord,
  userLevel,
  setOpponentGuesses,
  setOpponentLiveStatuses,
  setOpponentLiveCursor,
  setActiveMatch,
  activeMatch,
  setWinnerNickname,
  opponentGuessesLength
}) {
  const dictionaryRef = useRef([]);
  const guessCountRef = useRef(0);
  const isTypingRef = useRef(false);
  const roundIndexRef = useRef(-1);
  const typeTimeoutRef = useRef(null);
  const currentTimeoutRef = useRef(null);
  const activeMatchRef = useRef(activeMatch);
  useEffect(() => { activeMatchRef.current = activeMatch; }, [activeMatch]);

  // Load dictionary once
  useEffect(() => {
    if (isBot && dictionaryRef.current.length === 0) {
      import('../data/wordList').then(module => {
        if (module.allWordsMaster) {
          dictionaryRef.current = module.allWordsMaster.map(w => w.word);
        }
      });
    }
  }, [isBot]);

  // Reset bot state when round advances
  useEffect(() => {
    if (activeMatch && activeMatch.current_word_index !== roundIndexRef.current) {
      roundIndexRef.current = activeMatch.current_word_index;
      guessCountRef.current = 0;
      isTypingRef.current = false;
      setOpponentLiveStatuses([]);
      setOpponentLiveCursor?.(0);
      if (currentTimeoutRef.current) clearTimeout(currentTimeoutRef.current);
      if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
    }
  }, [activeMatch, setOpponentLiveCursor, setOpponentLiveStatuses]);

  useEffect(() => {
    if (!isBot || !isGameActive || !targetWord || isTypingRef.current) return;
    if (activeMatchRef.current?.p2_failed) return;

    const normalizedLevel = Math.min(Math.max(userLevel || 1, 1), 50);
    
    const isFirstAttempt = guessCountRef.current === 0;
    
    // First attempt takes longer to simulate initial human thought
    // Level 1: ~7s, Level 50: ~3s
    const initialDelay = 4000;
    
    // Subsequent attempts are faster
    // Level 1: ~4s, Level 50: ~1s
    const subsequentDelay = Math.max(1000, 4000 - (normalizedLevel * 60));
    
    const baseDelay = isFirstAttempt ? initialDelay : subsequentDelay;
    const thinkingDelay = isFirstAttempt ? initialDelay : (Math.random() * 1000 + baseDelay);

    currentTimeoutRef.current = setTimeout(() => {
      if (multiplayerState !== 'playing') return;
      isTypingRef.current = true;
      
      const currentAttempt = guessCountRef.current + 1;
      let pickedWord = '';
      
      // Dynamic win chance based on attempt and level (Gradual smooth scaling)
      let winChance = 0;
      if (currentAttempt > 1) {
        // levelProgress goes from 0 (Level 1) to 1 (Level 50)
        const levelProgress = (normalizedLevel - 1) / 49;
        
        // Base chance based on attempt number (Multiplayer is max 3 attempts per round)
        let baseChance = 0;
        if (currentAttempt === 2) baseChance = 0.25;
        else if (currentAttempt >= 3) baseChance = 0.70;

        // Level scaling multiplier: 
        // At L1, it uses 0.6x the base chance. At L50, it uses 1.8x the base chance.
        const levelMultiplier = 0.6 + (levelProgress * 1.2); 
        winChance = baseChance * levelMultiplier;
      }
      
      if (currentAttempt > 1 && Math.random() < winChance) {
        pickedWord = targetWord;
      } else {
        const lengthAppropriateDict = dictionaryRef.current.filter(w => w.length === targetWord.length);
        const pool = lengthAppropriateDict.length > 0 ? lengthAppropriateDict : [targetWord];
        
        // Smart guess logic - Continuous gradual scaling based on level
        const maxOverlap = targetWord.length;
        const levelProgress = (normalizedLevel - 1) / 49;
        
        // Quadratic curve makes it start slow (dumb) and accelerate at higher levels
        const expectedOverlap = Math.pow(levelProgress, 1.5) * maxOverlap; 
        
        // Add slight randomness around the expected overlap
        let overlapTarget = Math.round(expectedOverlap + (Math.random() * 2 - 1));
        overlapTarget = Math.max(0, Math.min(overlapTarget, maxOverlap));

        let foundWord = null;
        for (let i = 0; i < 30; i++) {
          const candidate = pool[Math.floor(Math.random() * pool.length)];
          let overlap = 0;
          for (const char of targetWord) {
            if (candidate.includes(char)) overlap++;
          }
          if (overlap >= overlapTarget) {
            foundWord = candidate;
            break;
          }
        }
        pickedWord = foundWord || pool[Math.floor(Math.random() * pool.length)];
      }

      const { colors } = evaluateGuess(pickedWord, targetWord);

      // Human-like typing simulation
      let charIndex = 0;
      const liveArr = Array(targetWord.length).fill(3); // 3 = empty

      const typeNextChar = () => {
        if (multiplayerState !== 'playing') {
           isTypingRef.current = false;
           return;
        }

        if (targetWord && charIndex < targetWord.length) {
          // Occasional hesitation (10% chance to pause)
          const hesitation = Math.random() < 0.15 ? (Math.random() * 500 + 1500) : 0;
          
          typeTimeoutRef.current = setTimeout(() => {
            // Send the actual evaluated color live to match the human broadcast logic
            const letterColor = colors[charIndex];
            let statusCode = 0;
            if (letterColor === 'CORRECT') statusCode = 1;
            else if (letterColor === 'WRONG_POS') statusCode = 2;
            else if (letterColor === 'INCORRECT') statusCode = 3;
            
            liveArr[charIndex] = statusCode; 
            setOpponentLiveStatuses([...liveArr]);
            setOpponentLiveCursor?.(Math.min(charIndex + 1, targetWord.length - 1));
            charIndex++;
            typeNextChar();
          }, (Math.random() * 250 + 150) + hesitation); // 150-400ms per keystroke
        } else {
          // Finished typing, wait slightly before submitting
          typeTimeoutRef.current = setTimeout(() => {
            setOpponentLiveStatuses([]);
            setOpponentLiveCursor?.(0);
            setOpponentGuesses(prev => [...prev, colors]);
            
            const isWin = pickedWord === targetWord;
            if (isWin) {
              setWinnerNickname('Opponent');
              setTimeout(() => setWinnerNickname(''), 3000);

              setActiveMatch(prev => {
                if (!prev) return prev;
                const newP1Score = prev.p1_score || 0;
                const newP2Score = (prev.p2_score || 0) + 1;
                const newIndex = (prev.current_word_index || 0) + 1;
                const totalWords = prev.words?.length || 5;
                const scoreDiff = Math.abs(newP1Score - newP2Score);
                const isMatchEnd = scoreDiff >= 2 || newIndex >= totalWords;

                return {
                   ...prev,
                   p2_score: newP2Score,
                   current_word_index: newIndex,
                   status: isMatchEnd ? 'finished' : prev.status,
                   p1_failed: false,
                   p2_failed: false
                };
              });
            } else {
               guessCountRef.current += 1;
               if (guessCountRef.current >= 3) {
                  // Bot failed 3 times
                  setActiveMatch(prev => {
                    if (!prev) return prev;
                    if (prev.p1_failed) {
                       const newIndex = (prev.current_word_index || 0) + 1;
                       const totalWords = prev.words?.length || 5;
                       const scoreDiff = Math.abs((prev.p1_score || 0) - (prev.p2_score || 0));
                       const isMatchEnd = scoreDiff >= 2 || newIndex >= totalWords;

                       return { 
                         ...prev, 
                         p1_failed: false, 
                         p2_failed: false, 
                         current_word_index: newIndex,
                         status: isMatchEnd ? 'finished' : prev.status
                       };
                    }
                    return { ...prev, p2_failed: true };
                  });
               }
            }
            isTypingRef.current = false;
          }, Math.random() * 500 + 400); // 400-900ms submission delay
        }
      };

      typeNextChar();

    }, thinkingDelay);

    return () => {
      if (currentTimeoutRef.current) clearTimeout(currentTimeoutRef.current);
      if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
    };
  }, [
    isBot, multiplayerState,
  isGameActive, targetWord, userLevel, 
    setOpponentLiveCursor, setActiveMatch, setOpponentGuesses, setOpponentLiveStatuses,
    setWinnerNickname, opponentGuessesLength
  ]);
}




