import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { STATUS } from '../data/constants';
import { motion as Motion, useTransform } from 'framer-motion';
import { useAudio } from '../context/AudioContext';

const fastArrayEqual = (a, b) => {
 if (a === b) return true;
 if (!a || !b) return false;
 if (a.length !== b.length) return false;
 for (let i = 0; i < a.length; i++) {
 if (Array.isArray(a[i]) && Array.isArray(b[i])) {
 if (!fastArrayEqual(a[i], b[i])) return false;
 } else if (a[i] !== b[i]) {
 return false;
 }
 }
 return true;
};

const Tile = memo(({ char, hintChar = '', isCurrent, status, wordLength, isRevealed, isHinted, isFocused, isSecretMode, hideLetters = false, flipDelay = 0, isFocusedMV = null, index = 0, isDark = true, rowIndex = 0, gridId = 'main', tutorialColumnHighlight = false, tutorialRowHighlight = -1 }) => {
 const { playRightLetterSound, playWrongPlaceSound } = useAudio();

 // 🎨 COLORS BASED ON THEME (isDark)
 const showStatus = (!isCurrent && status !== STATUS.NONE) || isRevealed || isHinted;
 const isMaskedLive = isCurrent && hideLetters && status !== STATUS.NONE;
 const isFlipped = showStatus && !isMaskedLive;

 const hasPlayedSoundRef = useRef(false);

 // Sound Effect on Correct (Green) or Present (Yellow) state reveal
 useEffect(() => {
 if (isFlipped) {
 if (!hasPlayedSoundRef.current) {
 if (status === STATUS.CORRECT || isRevealed || isHinted) {
 hasPlayedSoundRef.current = true;
 // Small timeout to sync with the middle of the flip animation
 const timer = setTimeout(() => {
 playRightLetterSound(0.7); // Customizable volume
 }, (flipDelay + 300)); // 300ms is halfway through the 600ms flip duration
 return () => clearTimeout(timer);
 } else if (status === STATUS.WRONG_POS) {
 hasPlayedSoundRef.current = true;
 const timer = setTimeout(() => {
 playWrongPlaceSound(0.7); // Customizable volume
 }, (flipDelay + 300));
 return () => clearTimeout(timer);
 }
 }
 } else {
 hasPlayedSoundRef.current = false;
 }
 }, [isFlipped, status, isRevealed, isHinted, flipDelay, playRightLetterSound, playWrongPlaceSound]);

 // Neutral background before flip (Empty/Active Row)
 const neutralBg = isDark ? 'bg-white/25 border-[3px] border-white/40' : 'bg-white border-[3px] border-[#E5E5E5]';
 const neutralText = isDark ? 'text-white' : 'text-black';

 // Determine target colors (for the back side)
 let targetBg = neutralBg;
 
 if (isDark) {
 if ((showStatus || isMaskedLive) && (status === STATUS.CORRECT || isRevealed || isHinted)) {
 targetBg = 'bg-[#538d4e] border-[3px] border-[#3b6b37] shadow-[inset_0_3px_0_rgba(255,255,255,0.3)]';
 } else if ((showStatus || isMaskedLive) && (status === STATUS.WRONG_POS)) {
 targetBg = 'bg-[#f59e0b] border-[3px] border-[#b45309] shadow-[inset_0_3px_0_rgba(255,255,255,0.4)]';
 } else if ((showStatus || isMaskedLive) && status === STATUS.INCORRECT) {
 targetBg = 'bg-[#706d78] border-[3px] border-[#504e57] shadow-[inset_0_3px_0_rgba(255,255,255,0.25)]';
 } else if (char && isCurrent) {
 targetBg = 'bg-white/10 border-[3px] border-white/30';
 } else if (isFocused) {
 targetBg = 'bg-white/10 border-[3px] border-white/50';
 }
 } else {
 if ((showStatus || isMaskedLive) && (status === STATUS.CORRECT || isRevealed || isHinted)) {
 targetBg = 'bg-[#6aaa64] border-[3px] border-[#6aaa64]';
 } else if ((showStatus || isMaskedLive) && (status === STATUS.WRONG_POS)) {
 targetBg = 'bg-[#c9b458] border-[3px] border-[#c9b458]';
 } else if ((showStatus || isMaskedLive) && status === STATUS.INCORRECT) {
 targetBg = 'bg-[#D4D4D4] border-[3px] border-[#D4D4D4]';
 } else if (char && isCurrent) {
 targetBg = 'bg-white border-[3px] border-[#878a8c]';
 } else if (isFocused) {
 targetBg = 'bg-white border-[3px] border-[#878a8c]';
 }
 }

 // 🎨 HOOKS
 const dummyMV = { get: () => -1, onChange: () => (() => {}), on: () => (() => {}) };
 const safeMV = isFocusedMV || dummyMV;
 const mvOpacity = useTransform(safeMV, (val) => (val === index ? 1 : 0));

 const shouldHideText = (isSecretMode || hideLetters) && !showStatus;

 // Determine what to show on the front side (typing state)
 let activeFrontBg = neutralBg;
 let activeFrontText = neutralText;
 
 if (isMaskedLive) {
 // APPLY REAL-TIME STATUS COLORS TO FRONT SIDE FOR MASKED TYPING
 if (status === STATUS.CORRECT) {
 activeFrontBg = isDark ? 'bg-[#538d4e] border-[3px] border-[#3b6b37] shadow-[inset_0_3px_0_rgba(255,255,255,0.3)]' : 'bg-[#6aaa64] border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.3),0_4px_0_#4e8a49]';
 activeFrontText = 'text-white';
 } else if (status === STATUS.WRONG_POS) {
 activeFrontBg = isDark ? 'bg-[#f59e0b] border-[3px] border-[#b45309] shadow-[inset_0_3px_0_rgba(255,255,255,0.4)]' : 'bg-[#f59e0b] border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.4),0_4px_0_#b45309]';
 activeFrontText = 'text-white';
 } else if (status === STATUS.INCORRECT) {
 activeFrontBg = isDark ? 'bg-[#706d78] border-[3px] border-[#504e57] shadow-[inset_0_3px_0_rgba(255,255,255,0.25)]' : 'bg-[#D4D4D4] border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.8),0_4px_0_#A3A3A3]';
 activeFrontText = 'text-white';
 }
 } else if (char && isCurrent) {
 activeFrontBg = isDark ? 'bg-[#d8ccd8] border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.2)]' : 'bg-white border-[3px] border-mono-900';
 activeFrontText = isDark ? 'text-black' : 'text-black';
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
 rotateX: { type: 'tween', duration: 0.6, ease: "easeInOut", delay: flipDelay / 1000 },
 scale: { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }
 }}
 style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
 className="rounded-md items-center justify-center flex"
 >
 {/* Front Side (Typing/Neutral) */}
 <div 
 style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateX(0deg)' }}
 className={`${activeFrontBg} rounded-md z-10 flex items-center justify-center`}
 >
 <span className={`font-bold ${activeFrontText} select-none`} style={{ fontSize: wordLength > 8 ? '0.9rem' : '1.1rem' }}>
 {(isMaskedLive || (isSecretMode && char)) ? '•' : char}
 </span>
 </div>

 {/* Back Side */}
 <div 
 style={{ 
 backfaceVisibility: 'hidden', 
 WebkitBackfaceVisibility: 'hidden',
 position: 'absolute', 
 inset: 0, 
 transform: 'rotateX(180deg)' 
 }}
 className={`${targetBg} rounded-md z-20 flex items-center justify-center`}
 >
 <span 
 className={`font-bold ${isHinted && !char ? 'text-black/70' : 'text-white'} select-none leading-none block ${(shouldHideText || hideLetters) ? 'opacity-0' : 'opacity-100'}`}
 style={{ 
 fontSize: wordLength > 8 ? '0.9rem' : '1.1rem',
 lineHeight: 1
 }}
 >
 {char || (isHinted ? hintChar : '')}
 </span>
 </div>

 {/* Focused State Indicator */}
 <Motion.div 
 className={`absolute inset-0 border-2 ${isDark ? 'border-white/20' : 'border-slate-300'} rounded-md z-30 pointer-events-none`}
 style={{ 
 opacity: isFocusedMV ? mvOpacity : 0
 }}
 />

 {/* Tutorial Highlight Overlays */}
 {(tutorialColumnHighlight && index === 0) || (tutorialRowHighlight === rowIndex) ? (
 <Motion.div
 key={tutorialColumnHighlight ? 'col' : 'row'}
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: tutorialColumnHighlight ? rowIndex * 0.2 : index * 0.2, type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
 className="absolute inset-0 z-50 shadow-[0_0_20px_rgba(59,130,246,0.6)] border-[3px] border-blue-500 bg-blue-500/10 pointer-events-none"
 />
 ) : null}
 </Motion.div>
 </Motion.div>
 );
}, (prev, next) => {
 return prev.char === next.char &&
 prev.hintChar === next.hintChar &&
 prev.status === next.status &&
 prev.isFocused === next.isFocused &&
 prev.isFocusedMV === next.isFocusedMV &&
 prev.isCurrent === next.isCurrent &&
 prev.isRevealed === next.isRevealed &&
 prev.isHinted === next.isHinted &&
 prev.isSecretMode === next.isSecretMode &&
 prev.isDark === next.isDark &&
 prev.hideLetters === next.hideLetters &&
 prev.tutorialColumnHighlight === next.tutorialColumnHighlight &&
 prev.tutorialRowHighlight === next.tutorialRowHighlight;
});

const Row = memo(({ guess, targetWord = '', wordLength, getLetterStatus = () => '', isCurrent, revealedIndices, hintIndices = [], isShaking, isSecretMode, hideLetters = false, forcedStatuses = null, gap = '8px', forcedFocusIndex = null, isDark = true, rowIndex = 0, gridId = 'main', tutorialColumnHighlight = false, tutorialRowHighlight = -1 }) => {
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
 let hintChar = targetWord ? targetWord[i] : '';
 
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
 hintChar={hintChar}
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
 tutorialColumnHighlight={tutorialColumnHighlight}
 tutorialRowHighlight={tutorialRowHighlight}
 />
 );
 })}
 </div>
 );

}, (prev, next) => {
 const prevStr = Array.isArray(prev.guess) ? prev.guess.join('') : prev.guess;
 const nextStr = Array.isArray(next.guess) ? next.guess.join('') : next.guess;

 return prevStr === nextStr &&
 prev.targetWord === next.targetWord &&
 prev.isCurrent === next.isCurrent &&
 prev.isShaking === next.isShaking &&
 prev.isSecretMode === next.isSecretMode &&
 prev.wordLength === next.wordLength &&
 prev.isDark === next.isDark &&
 prev.forcedFocusIndex === next.forcedFocusIndex &&
 fastArrayEqual(prev.forcedStatuses, next.forcedStatuses) &&
 fastArrayEqual(prev.revealedIndices, next.revealedIndices) &&
 fastArrayEqual(prev.hintIndices, next.hintIndices) &&
 prev.tutorialColumnHighlight === next.tutorialColumnHighlight &&
 prev.tutorialRowHighlight === next.tutorialRowHighlight;
});

const Grid = memo(({ targetWord = '', guesses = [], currentGuess = [], wordLength = 0, getLetterStatus, revealedIndices = [], hintIndices = [], maxRows = 6, isSecretMode = false, isShaking = false, hideLetters = false, opponentStatuses = [], compact = false, activeRowIndex = null, opponentLiveStatuses = [], opponentLiveCursor = null, isDark = true, gridId = 'main', tutorialColumnHighlight = false, tutorialRowHighlight = -1 }) => {
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
 <div className="w-full flex-1 min-h-75 flex items-center justify-center" />
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
 className="p-2 sm:p-3 mx-auto animate-in zoom-in-95 duration-700 transition-all origin-center relative bg-[#2d1155] rounded-md shadow-lg border border-black/20" 
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
 targetWord={targetWord}
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
 tutorialColumnHighlight={tutorialColumnHighlight}
 tutorialRowHighlight={tutorialRowHighlight}
 />
 );
 })}
 </div>
 </div>
 );
}, (prev, next) => {
 return fastArrayEqual(prev.guesses, next.guesses) &&
 prev.currentGuess?.join('') === next.currentGuess?.join('') &&
 prev.wordLength === next.wordLength &&
 prev.maxRows === next.maxRows &&
 prev.activeRowIndex === next.activeRowIndex &&
 prev.isDark === next.isDark &&
 fastArrayEqual(prev.opponentStatuses, next.opponentStatuses) &&
 fastArrayEqual(prev.opponentLiveStatuses, next.opponentLiveStatuses) &&
 prev.opponentLiveCursor === next.opponentLiveCursor &&
 prev.isShaking === next.isShaking &&
 prev.targetWord === next.targetWord &&
 fastArrayEqual(prev.revealedIndices, next.revealedIndices) &&
 fastArrayEqual(prev.hintIndices, next.hintIndices) &&
 prev.tutorialColumnHighlight === next.tutorialColumnHighlight &&
 prev.tutorialRowHighlight === next.tutorialRowHighlight;
});

export default Grid;


