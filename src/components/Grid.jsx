import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { STATUS } from '../data/constants';
import { motion as Motion, useTransform } from 'framer-motion';

const Tile = memo(({ char, isCurrent, status, wordLength, isRevealed, isHinted, isFocused, isSecretMode, hideLetters = false, flipDelay = 0, isFocusedMV = null, index = 0, isDark = true, rowIndex = 0, gridId = 'main' }) => {
  
  // 🎨 COLORS BASED ON THEME (isDark)
  const showStatus = (!isCurrent && status !== STATUS.NONE) || isRevealed || isHinted;
  const isMaskedLive = isCurrent && hideLetters && status !== STATUS.NONE;
  const isFlipped = showStatus && !isMaskedLive;

  // Neutral background before flip (Empty/Active Row)
  const neutralBg = isDark ? 'bg-transparent border-2 border-[#373737]' : 'bg-white border-2 border-[#E5E5E5]';
  const neutralText = isDark ? 'text-white' : 'text-black';

  // Determine target colors (for the back side)
  let targetBg = neutralBg;
  
  if (isDark) {
    if ((showStatus || isMaskedLive) && (status === STATUS.CORRECT || isRevealed || isHinted)) {
      targetBg = 'bg-[#538d4e] border-2 border-[#538d4e]';
    } else if ((showStatus || isMaskedLive) && (status === STATUS.WRONG_POS)) {
      targetBg = 'bg-[#b59f3b] border-2 border-[#b59f3b]';
    } else if ((showStatus || isMaskedLive) && status === STATUS.INCORRECT) {
      targetBg = 'bg-[#262626] border-2 border-[#262626]';
    } else if (char && isCurrent) {
      targetBg = 'bg-white/30 border-2 border-white/50';
    } else if (isFocused) {
      targetBg = 'bg-transparent border-2 border-white/50';
    }
  } else {
    if ((showStatus || isMaskedLive) && (status === STATUS.CORRECT || isRevealed || isHinted)) {
      targetBg = 'bg-[#6aaa64] border-2 border-[#6aaa64]';
    } else if ((showStatus || isMaskedLive) && (status === STATUS.WRONG_POS)) {
      targetBg = 'bg-[#c9b458] border-2 border-[#c9b458]';
    } else if ((showStatus || isMaskedLive) && status === STATUS.INCORRECT) {
      targetBg = 'bg-[#D4D4D4] border-2 border-[#D4D4D4]';
    } else if (char && isCurrent) {
      targetBg = 'bg-white border-2 border-[#878a8c]';
    } else if (isFocused) {
      targetBg = 'bg-white border-2 border-[#878a8c]';
    }
  }

  // 🎨 HOOKS
  const dummyMV = { get: () => -1, onChange: () => (() => {}), on: () => (() => {}) };
  const safeMV = isFocusedMV || dummyMV;
  const mvOpacity = useTransform(safeMV, (val) => (val === index ? 1 : 0));

  const shouldHideText = (isSecretMode || hideLetters) && !showStatus;

  // Determine what to show on the front side (typing state)
  let activeFrontBg = neutralBg;
  
  if (isMaskedLive) {
    // APPLY REAL-TIME STATUS COLORS TO FRONT SIDE FOR MASKED TYPING
    if (status === STATUS.CORRECT) {
      activeFrontBg = isDark ? 'bg-[#538d4e] border-2 border-[#538d4e]' : 'bg-[#6aaa64] border-2 border-[#6aaa64]';
    } else if (status === STATUS.WRONG_POS) {
      activeFrontBg = isDark ? 'bg-[#b59f3b] border-2 border-[#b59f3b]' : 'bg-[#c9b458] border-2 border-[#c9b458]';
    } else if (status === STATUS.INCORRECT) {
      activeFrontBg = isDark ? 'bg-[#262626] border-2 border-[#262626]' : 'bg-[#D4D4D4] border-2 border-[#D4D4D4]';
    }
  } else if (char && isCurrent) {
    activeFrontBg = isDark ? 'bg-white/30 border-2 border-white' : 'bg-white border-2 border-mono-900';
  }

  return (
    <Motion.div 
      initial={false}
      style={{ 
        perspective: '1000px',
        width: 'var(--tile-size)',
        height: 'var(--tile-size)',
        minWidth: 'var(--min-tile-size)',
        minHeight: 'var(--min-tile-size)',
        aspectRatio: '1 / 1'
      }} 
      className="shrink-0"
      id={`cell-${gridId}-${rowIndex}-${index}`}
      aria-label={`Row ${rowIndex + 1} Letter ${index + 1}: ${char || 'Empty'}`}
    >
      <Motion.div 
        initial={false}
        animate={{ 
          rotateX: isFlipped ? 180 : 0,
          y: 0,
          scale: isCurrent ? (char ? [1, 1.05, 1] : [1, 0.95, 1]) : 1
        }}
        transition={{ 
          rotateX: { duration: 0.5, delay: flipDelay / 1000 },
          scale: { duration: 0.15, times: [0, 0.5, 1] }
        }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
        className="rounded-none items-center justify-center flex"
      >
        {/* Front Side (Typing/Neutral) */}
        <div 
          style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
          className={`${activeFrontBg} z-10 flex items-center justify-center`}
        >
           <span className={`font-extralight ${neutralText} select-none`} style={{ fontSize: wordLength > 8 ? '0.9rem' : '1.1rem' }}>
             {(isMaskedLive || (isSecretMode && char)) ? '•' : char}
           </span>
        </div>

        {/* Back Side */}
        <div 
          style={{ 
            backfaceVisibility: 'hidden', 
            position: 'absolute', 
            inset: 0, 
            transform: 'rotateX(180deg)' 
          }}
          className={`${targetBg} z-20 flex items-center justify-center`}
        >
           <span 
            className={`font-bold text-white select-none leading-none block ${(shouldHideText || hideLetters) ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
              fontSize: wordLength > 8 ? '0.9rem' : '1.1rem',
              lineHeight: 1
            }}
          >
            {char}
          </span>
        </div>

        {/* Focused State Indicator */}
        <Motion.div 
          className={`absolute inset-0 border-2 ${isDark ? 'border-white/20' : 'border-slate-300'} z-30 pointer-events-none`}
          style={{ 
            opacity: isFocusedMV ? mvOpacity : 0
          }}
        />
      </Motion.div>
    </Motion.div>
  );
}, (prev, next) => {
  return prev.char === next.char &&
         prev.status === next.status &&
         prev.isFocused === next.isFocused &&
         prev.isFocusedMV === next.isFocusedMV &&
         prev.isCurrent === next.isCurrent &&
         prev.isRevealed === next.isRevealed &&
         prev.isHinted === next.isHinted &&
         prev.isSecretMode === next.isSecretMode &&
         prev.isDark === next.isDark &&
         prev.hideLetters === next.hideLetters;
});

const Row = memo(({ guess, wordLength, getLetterStatus = () => '', isCurrent, revealedIndices, hintIndices = [], isShaking, isSecretMode, hideLetters = false, forcedStatuses = null, gap = '8px', forcedFocusIndex = null, isDark = true, rowIndex = 0, gridId = 'main' }) => {
  const activeClass = '';

  // PRE-CALCULATE CONSTANTS for the row maps
  const guessArr = Array.isArray(guess) ? guess : (typeof guess === 'string' ? guess.split('') : []);
  const firstEmptyIndex = guessArr.findIndex(c => c === '');
  
  const isMV = forcedFocusIndex && typeof forcedFocusIndex === 'object' && forcedFocusIndex.get;
  const actualFocusIndex = isMV ? null : (forcedFocusIndex !== null ? forcedFocusIndex : (firstEmptyIndex === 0 ? -1 : (firstEmptyIndex === -1 ? wordLength - 1 : firstEmptyIndex - 1)));

  const rowRef = useRef(null);
  
  useEffect(() => {
    if (isShaking > 0 && rowRef.current) {
      const el = rowRef.current;
      el.classList.remove('shake-anim');
      void el.offsetWidth; // Force reflow
      el.classList.add('shake-anim');
    }
  }, [isShaking]);

  return (
    <div 
      ref={rowRef}
      className={`transition-all duration-300 ${activeClass} flex items-center justify-center`}
      dir="rtl"
      style={{ 
        gap: gap,
        width: '100%',
        justifyContent: 'center'
      }}
    >
      {Array.from({ length: wordLength }).map((_, i) => {
        let char = guessArr[i] || '';
        let status = STATUS.NONE;
        let isRevealed = (revealedIndices || []).includes(i);
        let isHinted = isCurrent && (hintIndices || []).includes(i);
        
        const isFocused = !isMV && isCurrent && i === actualFocusIndex;
        
        if (forcedStatuses) {
          status = forcedStatuses[i] || STATUS.NONE;
        } else if (!isCurrent && guessArr.length > 0) {
          status = getLetterStatus(guess, i);
        }

        return (
          <Tile 
            key={`cell-${gridId}-${rowIndex}-${i}`} 
            char={char} 
            isCurrent={isCurrent}
            status={status}
            wordLength={wordLength}
            isRevealed={isRevealed}
            isHinted={isHinted}
            isFocused={isFocused}
            isFocusedMV={isMV ? forcedFocusIndex : null}
            index={i}
            rowIndex={rowIndex}
            isSecretMode={isSecretMode}
            hideLetters={hideLetters}
            flipDelay={isCurrent ? 0 : i * 100}
            isDark={isDark}
            gridId={gridId}
          />
        );
      })}
    </div>
  );
}, (prev, next) => {
  const prevStr = Array.isArray(prev.guess) ? prev.guess.join('') : prev.guess;
  const nextStr = Array.isArray(next.guess) ? next.guess.join('') : next.guess;

  return prevStr === nextStr &&
         prev.isCurrent === next.isCurrent &&
         prev.isShaking === next.isShaking &&
         prev.isSecretMode === next.isSecretMode &&
         prev.wordLength === next.wordLength &&
         prev.isDark === next.isDark &&
         prev.forcedFocusIndex === next.forcedFocusIndex &&
         JSON.stringify(prev.forcedStatuses) === JSON.stringify(next.forcedStatuses) &&
         prev.revealedIndices?.length === next.revealedIndices?.length &&
         prev.hintIndices?.length === next.hintIndices?.length;
});

const Grid = memo(({ guesses = [], currentGuess = [], wordLength = 0, getLetterStatus, revealedIndices = [], hintIndices = [], maxRows = 6, isSecretMode = false, isShaking = false, hideLetters = false, opponentStatuses = [], compact = false, activeRowIndex = null, opponentLiveStatuses = [], opponentLiveCursor = null, isDark = true, gridId = 'main' }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 📐 MEMOIZED DIMENSIONS: Calculated once per wordLength change
  const gridStyle = useMemo(() => {
    if (wordLength === 0) return {};

    const gapValue = compact ? 4 : (wordLength > 10 ? 2 : (wordLength > 7 ? 4 : (isMobile ? 6 : 10)));
    const minTileSizeVal = wordLength > 10 ? '16px' : (wordLength > 8 ? '22px' : '28px');
    
    // Calculate size using CSS clamp for responsiveness
    const vwSize = `((90vw - ${(wordLength - 1) * gapValue}px) / ${wordLength})`;
    const tileSize = compact 
      ? `clamp(16px, min(3.8vh, ${vwSize}), 34px)` 
      : `clamp(${minTileSizeVal}, min(5.5vh, ${vwSize}), 54px)`;

    return {
      '--tile-size': tileSize,
      '--tile-gap': `${gapValue}px`,
      '--min-tile-size': compact ? '16px' : minTileSizeVal,
      gap: `${gapValue}px`,
      gridTemplateRows: `repeat(${maxRows}, auto)`,
    };
  }, [wordLength, maxRows, compact, isMobile]);

  if (wordLength === 0) return (
    <div className="w-full flex-1 min-h-[300px] flex items-center justify-center" />
  );

  const rows = [...guesses];
  while (rows.length < maxRows) {
    rows.push(null);
  }

  return (
    <div 
      className="w-full flex-1 min-h-0 flex flex-col items-center justify-center py-1 relative overflow-visible" 
      dir="rtl"
      style={gridStyle}
    >
      <div 
        className="p-1 sm:p-2 mx-auto animate-in zoom-in-95 duration-700 transition-all origin-center" 
        style={{ 
          width: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'grid',
          gridTemplateRows: gridStyle.gridTemplateRows,
          gap: gridStyle.gap,
          justifyContent: 'center',
          alignContent: 'center',
          justifyItems: 'center',
          alignItems: 'center',
          padding: compact ? '4px' : '8px'
        }}
      >
          {rows.map((guess, i) => {
            const isCurrent = activeRowIndex !== null ? i === activeRowIndex : i === guesses.length;
            if (i >= maxRows) return null;

            let forcedStatuses = opponentStatuses[i] || null;
            if (isCurrent && opponentLiveStatuses && opponentLiveStatuses.length > 0) {
              forcedStatuses = opponentLiveStatuses.map(code => {
                if (code === 1) return STATUS.CORRECT;
                if (code === 2) return STATUS.WRONG_POS;
                if (code === 3) return STATUS.INCORRECT;
                return STATUS.NONE;
              });
            }
            
            return (
              <Row 
                key={`row-${gridId}-${i}`} 
                guess={isCurrent ? currentGuess : (guess || '')} 
                wordLength={wordLength}
                getLetterStatus={getLetterStatus}
                isCurrent={isCurrent}
                revealedIndices={isCurrent ? revealedIndices : []}
                hintIndices={isCurrent ? hintIndices : []}
                isMobile={isMobile}
                isShaking={isCurrent ? isShaking : 0}
                isSecretMode={isSecretMode}
                hideLetters={hideLetters}
                forcedStatuses={forcedStatuses}
                forcedFocusIndex={isCurrent ? opponentLiveCursor : null}
                gap={gridStyle.gap}
                isDark={isDark}
                gridId={gridId}
                rowIndex={i}
              />
            );
          })}
      </div>
    </div>
  );
}, (prev, next) => {
  return JSON.stringify(prev.guesses) === JSON.stringify(next.guesses) &&
         prev.currentGuess?.join('') === next.currentGuess?.join('') &&
         prev.wordLength === next.wordLength &&
         prev.maxRows === next.maxRows &&
         prev.activeRowIndex === next.activeRowIndex &&
         prev.isDark === next.isDark &&
         JSON.stringify(prev.opponentStatuses) === JSON.stringify(next.opponentStatuses) &&
         JSON.stringify(prev.opponentLiveStatuses) === JSON.stringify(next.opponentLiveStatuses) &&
         prev.opponentLiveCursor === next.opponentLiveCursor &&
         prev.isShaking === next.isShaking &&
         prev.targetWord === next.targetWord &&
         prev.revealedIndices?.length === next.revealedIndices?.length &&
         prev.hintIndices?.length === next.hintIndices?.length;
});

export default Grid;
