import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Grid from './Grid';
import Keyboard from './Keyboard';
import TopAppBar from './TopAppBar';
import InventoryBar from './InventoryBar';
import { useGameStore } from '../store/gameStore';
import { getLevelFromXP } from '../utils/progression';
import InfoBar from './InfoBar';
import { useUser } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { STATUS } from '../data/constants';
import { playKeyClickSfx } from '../utils/audio';
import VictoryOverlay from './VictoryOverlay';
import { FilsIcon, HintIcon, MagnetIcon, SkipIcon } from './CurrencyIcon';

import TypewriterText from './TypewriterText';

const SPECIAL_KEYS = {
 ENTER: 'تەمام',
 DELETE: 'backspace'
};

const TUTORIAL_STEPS = [
 { id: 'intro_hints_main', target: 'hints', top: '45%', text: "د یاریێ دا مە سێ جۆرێن هاریکاریان هەنە.\n\nهەردەما پەیڤا ڤەشارتی زەحمەت بوو،\nتو دشێی ئەڤان هاریکاریان بکار بهینی.\n\nل گەل من بە دا ئێک ب ئێک\nبۆ تە بدەمە نیاسین.", advanceOnClick: true },
 { id: 'intro_hints_bulb', target: 'hints', top: '45%', icon: 'bulb', text: "پیتبین: پیتەکا دروست یا پەیڤێ بۆ تە ئاشکرا دکەت.", advanceOnClick: true },
 { id: 'intro_hints_magnet', target: 'hints', top: '45%', icon: 'magnet', text: "پیتژێبرک: هندەک پیتێن شاش کو د پەیڤێ دا نینن ژ تەختەکلیکی ڕادکەت.", advanceOnClick: true },
 { id: 'intro_hints_skip', target: 'hints', top: '45%', icon: 'skip', text: "دەربازبوون: ئەگەر گەلەک زەحمەت بوو، دکاری قۆناغێ ب تەمامی دەرباز بکەی.", advanceOnClick: true },
 { id: 'intro_game_goal', target: 'none', top: '30%', text: "یاری ل مۆدێ پەیڤۆک پەیڤەکا ڤەشارتی ددەتە تە، دڤێت پیشبینیا ئەوێ پەیڤا ڤەشارتی بکەی کا چ پەیڤە.", advanceOnClick: true },
 { id: 'intro_attempts_col', target: 'grid_column', top: '65%', pointerDir: 'up', text: "مۆدێ پەیڤۆک ژ شەش بزاڤان پێکدهێت و دڤێت پەیڤا ڤەشارتی د شەش بزاڤاندا ببینی.", advanceOnClick: true },
 { id: 'intro_row', target: 'active_row', top: '65%', pointerDir: 'up', text: "بۆ زانینا ژمارەیا پیتێن پەیڤا ڤەشارتی، پێدڤیە خانەیان ب شێوەیەکێ ئاسوویی بژمێری.", advanceOnClick: true },
 { id: 'intro_word_length', target: 'none', top: '45%', text: "پێدڤیە پێشبینیا پەیڤەکا کوردی یا دوو پیتی بکەی، چونکی خانەیێن ئاسوویی دوو خانەنە، بۆ نموونە: وەکی پەیڤا 'سێ'.", advanceOnClick: true },
 { id: 'attempt_1_1', target: 'keyboard', top: '62%', text: "وەکی مە ژبەری ڤێ پێنگاڤێ گۆتی پەیڤا مە پێشبینی کری پەیڤا 'سێ'یە، نۆکە پیتا 'س' بنڤیسە", allowed: ['س'], pointer: 'س' },
 { id: 'attempt_1_2', target: 'keyboard', top: '62%', text: "نۆکە پیتا 'ێ' بنڤیسە.", allowed: ['س', 'ێ'], pointer: 'ێ' },
 { id: 'attempt_1_3', target: 'keyboard', top: '62%', text: "نۆکە دوگمەیا 'تەمام' کلیک بکە.", allowed: ['س', 'ێ', SPECIAL_KEYS.ENTER], pointer: SPECIAL_KEYS.ENTER },
 { id: 'attempt_1_explain', target: 'active_row', top: '65%', pointerDir: 'up', text: "نۆکە هەردوو خانە د ڕساسینە، هەر دەما خانە ڕەنگێ وێ ڕساسی بوو، ئانکو ئەڤ پیتە د ناڤ پەیڤا ڤەشارتیدا نینە.", advanceOnClick: true },

 { id: 'attempt_2_1', target: 'keyboard', top: '62%', text: "نۆکە پەیڤا مە پێشبینی کری پەیڤا 'لق'ە، نۆکە پیتا 'ل' بنڤیسە.", allowed: ['ل'], pointer: 'ل' },
 { id: 'attempt_2_2', target: 'keyboard', top: '62%', text: "نۆکە پیتا 'ق' بنڤیسە.", allowed: ['ل', 'ق'], pointer: 'ق' },
 { id: 'attempt_2_3', target: 'keyboard', top: '62%', text: "نۆکە دوگمەیا 'تەمام' کلیک بکە.", allowed: ['ل', 'ق', SPECIAL_KEYS.ENTER], pointer: SPECIAL_KEYS.ENTER },
 { id: 'attempt_2_explain', target: 'active_row', top: '65%', pointerDir: 'up', text: "ڕەنگێ خانەیا پیتا 'ل' زەرە، ئانکو پیتا 'ل' د وێ پەیڤا ڤەشارتیدا هەیە، لێ جهێ وێ یێ شاشە.", advanceOnClick: true },

 { id: 'attempt_3_1', target: 'keyboard', top: '62%', text: "نۆکە پەیڤا مە پێشبینی کری پەیڤا 'شل'ە، نۆکە پیتا 'ش' بنڤیسە.", allowed: ['ش'], pointer: 'ش' },
 { id: 'attempt_3_2', target: 'keyboard', top: '62%', text: "نۆکە پیتا 'ل' بنڤیسە.", allowed: ['ش', 'ل'], pointer: 'ل' },
 { id: 'attempt_3_3', target: 'keyboard', top: '62%', text: "نۆکە دوگمەیا 'تەمام' کلیک بکە.", allowed: ['ش', 'ل', SPECIAL_KEYS.ENTER], pointer: SPECIAL_KEYS.ENTER },
 { id: 'attempt_3_explain', target: 'active_row', top: '65%', pointerDir: 'up', text: "ڕەنگێ خانەیا پیتا 'ل' کەسکە، ئانکو پیتا 'ل' د پەیڤێ دا هەیە و جهێ وێ د پەیڤا ڤەشارتیدا دروستە.", advanceOnClick: true },

 { id: 'attempt_4_1', target: 'keyboard', top: '62%', text: "نۆکە پەیڤا مە پێشبینی کری پەیڤا 'دل'ە، نۆکە پیتا 'د' بنڤیسە.", allowed: ['د'], pointer: 'د' },
 { id: 'attempt_4_2', target: 'keyboard', top: '62%', text: "نۆکە پیتا 'ل' بنڤیسە.", allowed: ['د', 'ل'], pointer: 'ل' },
 { id: 'attempt_4_3', target: 'keyboard', top: '62%', text: "نۆکە دوگمەیا 'تەمام' کلیک بکە.", allowed: ['د', 'ل', SPECIAL_KEYS.ENTER], pointer: SPECIAL_KEYS.ENTER },
 { id: 'attempt_4_explain', target: 'active_row', top: '65%', pointerDir: 'up', text: "دەستخۆش! پەیڤا 'دل' ئەو پەیڤا ڤەشارتی بوو یا کو یاریێ دایە مە و مە پێشبینی کری.", advanceOnClick: true },
 { id: 'finish', target: 'none', top: '45%', text: "" },
];

export default function TutorialGameView({ onBackToLobby, onStartClassic, topAppBarProps }) {
 const { user, profileData } = useUser();
 const updateInventory = useGameStore(s => s.updateInventory);
 const setCurrentXP = useGameStore(s => s.setCurrentXP);
 const currentXP = useGameStore(s => s.currentXP);
 const playerStats = useGameStore(s => s.playerStats);
 const isDark = true; // Forced dark mode
 const [stepIndex, setStepIndex] = useState(0);
 const [guesses, setGuesses] = useState([]);
 const [currentGuess, setCurrentGuess] = useState([]);
 const [usedKeys, setUsedKeys] = useState({});
 const [isVictory, setIsVictory] = useState(false);
 const [isReady, setIsReady] = useState(false);
 const [isTypingComplete, setIsTypingComplete] = useState(false);
 const [ipadScale, setIpadScale] = useState(1);

 useEffect(() => {
 const checkSize = () => {
 // Specifically target iPad Mini and mid-sized tablets (700px - 1024px width)
 // where the screen height is too short (< 1250px) to fit the huge 2-column grid + keyboard
 if (typeof window !== 'undefined' && window.innerWidth >= 700 && window.innerWidth <= 1024) {
 const requiredHeight = 1250;
 if (window.innerHeight < requiredHeight) {
 setIpadScale(window.innerHeight / requiredHeight);
 } else {
 setIpadScale(1);
 }
 } else {
 setIpadScale(1);
 }
 };
 checkSize();
 window.addEventListener('resize', checkSize);
 return () => window.removeEventListener('resize', checkSize);
 }, []);

 const step = TUTORIAL_STEPS[stepIndex] || TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1];

 const containerRef = useRef(null);
 const hintsRef = useRef(null);
 const keyboardRef = useRef(null);
 const gridRef = useRef(null);
 const [tooltipNode, setTooltipNode] = useState(null);
 const [dynamicTop, setDynamicTop] = useState(null);

 const updatePosition = useCallback(() => {
 if (!tooltipNode || !containerRef.current) return;

 let targetRef = null;
 let position = 'above';

 if (step.target === 'hints') {
 targetRef = hintsRef;
 position = 'above';
 } else if (step.target === 'keyboard') {
 targetRef = keyboardRef;
 position = 'above';
 } else if (step.target === 'grid_column' || step.target === 'active_row') {
 targetRef = gridRef;
 position = 'below';
 }

 if (targetRef && targetRef.current) {
 const targetRect = targetRef.current.getBoundingClientRect();
 const containerRect = containerRef.current.getBoundingClientRect();
 const tooltipHeight = tooltipNode.offsetHeight;

 const relativeTop = targetRect.top - containerRect.top;
 const relativeBottom = targetRect.bottom - containerRect.top;

 let gap = 16;
 if (step.target === 'keyboard') {
 gap = 64; // Increased gap to leave room for the bouncing hand icon on top row keys
 }

 if (position === 'above') {
 setDynamicTop(`${relativeTop - gap - (tooltipHeight / 2)}px`);
 } else {
 setDynamicTop(`${relativeBottom + gap + (tooltipHeight / 2)}px`);
 }
 } else {
 setDynamicTop(null);
 }
 }, [step, tooltipNode]);

 useEffect(() => {
 updatePosition();
 window.addEventListener('resize', updatePosition);
 return () => window.removeEventListener('resize', updatePosition);
 }, [updatePosition]);

 useEffect(() => {
 if (!tooltipNode) return;
 const observer = new ResizeObserver(updatePosition);
 observer.observe(tooltipNode);
 return () => observer.disconnect();
 }, [tooltipNode, updatePosition]);

 // Removed cascading render useEffect
 const targetWord = "دل";
 const wordLength = 2;

 // Add 0.8s delay before showing the tutorial to let the game components finish their mount animations
 useEffect(() => {
 const timer = setTimeout(() => {
 setIsReady(true);
 }, 800);
 return () => clearTimeout(timer);
 }, []);

 // Ensure window is at top
 useEffect(() => {
 window.scrollTo(0, 0);
 }, []);

 const handleNextStep = useCallback(() => {
 if (stepIndex < TUTORIAL_STEPS.length - 1) {
 setStepIndex(prev => prev + 1);
 setIsTypingComplete(false);
 playKeyClickSfx();
 }
 }, [stepIndex]);

 const onKey = useCallback((key) => {
 if (step.pointer === key && currentGuess.length < wordLength) {
 setCurrentGuess(prev => [...prev, key]);
 handleNextStep();
 }
 }, [step, currentGuess, handleNextStep, wordLength]);

 const onDelete = useCallback(() => {
 // Disabled in tutorial
 }, []);

 const getLetterStatus = useCallback((guess, index) => {
 const letter = guess[index];
 if (targetWord[index] === letter) return STATUS.CORRECT;
 if (targetWord.includes(letter)) return STATUS.WRONG_POS;
 return STATUS.INCORRECT;
 }, [targetWord]);

 const onEnter = useCallback(() => {
 if (step.pointer === SPECIAL_KEYS.ENTER && currentGuess.length === wordLength) {
 const newGuesses = [...guesses, currentGuess];
 setGuesses(newGuesses);

 // Update Used Keys for colors
 const newUsedKeys = { ...usedKeys };
 currentGuess.forEach((letter, i) => {
 const status = getLetterStatus(currentGuess, i);
 if (status === STATUS.CORRECT) {
 newUsedKeys[letter] = STATUS.CORRECT;
 } else if (status === STATUS.WRONG_POS && newUsedKeys[letter] !== STATUS.CORRECT) {
 newUsedKeys[letter] = STATUS.WRONG_POS;
 } else if (status === STATUS.INCORRECT && newUsedKeys[letter] !== STATUS.CORRECT && newUsedKeys[letter] !== STATUS.WRONG_POS) {
 newUsedKeys[letter] = STATUS.INCORRECT;
 }
 });
 setUsedKeys(newUsedKeys);

 if (currentGuess.join('') === targetWord) {
 setIsVictory(true);
 }

 setCurrentGuess([]);
 handleNextStep();
 }
 }, [step, currentGuess, guesses, handleNextStep, getLetterStatus, targetWord, usedKeys]);

 // Save reward to Supabase when they reach the finish step (after clicking continue)
 useEffect(() => {
 if (step.id === 'finish' && isVictory) {
 const completeTutorial = async () => {
 if (user && profileData?.has_completed_tutorial === false && localStorage.getItem(`peyvok_tutorial_completed_${user?.id}`) !== 'true') {
 // Local storage fallback to immediately stop the loop and prevent duplicate rewards
 localStorage.setItem(`peyvok_tutorial_completed_${user?.id}`, 'true');

 // Use Context to update states immediately
 updateInventory({ fils: 10 });
 setCurrentXP(currentXP + 10);

 // DB update for Tutorial Flag (Progression fields removed to prevent RLS trigger error)
 const { error } = await supabase.from('profiles').update({
 has_completed_tutorial: true
 }).eq('id', user?.id);

 if (error) {
 console.error("Failed to update tutorial status:", error.message);
 }
 }
 };
 completeTutorial();
 }
 }, [step.id, isVictory, user, profileData, updateInventory, currentXP, setCurrentXP]);


 return (
 <div ref={containerRef} className="flex-1 flex flex-col h-full relative overflow-hidden select-none">
 <TopAppBar {...topAppBarProps} />
 {/* GLOBAL DARK OVERLAY to dim background UI during tutorial */}
 {isReady && step.id !== 'finish' && (
 <div className="fixed inset-0 bg-black/50 ] z-40 pointer-events-none transition-all duration-500" />
 )}

 {/* INVISIBLE CLICK CATCHER to speed up typing */}
 {!isTypingComplete && isReady && step.id !== 'finish' && (
 <div
 className="fixed inset-0 z-100"
 onClick={(e) => {
 e.stopPropagation();
 setIsTypingComplete(true);
 }}
 />
 )}

 {/* INVISIBLE CLICK CATCHER for advanceOnClick steps */}
 {isReady && step.id !== 'finish' && step.advanceOnClick && (
 <div
 className="absolute inset-0 z-45"
 onClick={handleNextStep}
 />
 )}

 {/* Tooltip moved to bottom of DOM to prevent z-index clipping */}

 <div className="flex-1 flex flex-col items-center min-h-0 w-full overflow-hidden no-scrollbar" ref={containerRef}>
 {/* Tier 1 & 2: Info & Grid (Flex Grow) */}
 <div className="flex-1 flex flex-col items-center min-h-0 overflow-hidden no-scrollbar w-full">
 {/* Question Section */}
 <div className="w-full md:max-w-lg md:mx-auto shrink-0 flex flex-col items-center my-1">
 <InfoBar
 targetHint={null}
 category="فێرکاری"
 gameMode="classic"
 guessesCount={guesses.length}
 maxGuesses={6}
 fils={0}
 currentXP={0}
 minXP={0}
 maxXP={100}
 level={1}
 targetDifficultyLevel={1}
 timeLeft={0}
 showSuccessSplash={false}
 isDark={isDark}
 />
 </div>

 {/* Grid Section */}
 <div className={`grid-protection-wrapper flex-1 flex flex-col justify-center items-center overflow-hidden w-full md:max-w-lg md:mx-auto transition-all duration-500 ${isReady && (step.target === 'grid_column' || step.target === 'active_row' || step.target === 'keyboard' || step.id === 'intro_word_length') ? 'relative z-50' : ''}`}>
 <div ref={gridRef}
 className="game-grid-core w-full flex justify-center items-center relative transition-transform duration-300"
 style={{ transform: `scale(${ipadScale})`, transformOrigin: 'center center' }}
 >
 <Grid
 targetWord={targetWord}
 guesses={guesses}
 currentGuess={currentGuess}
 wordLength={wordLength}
 getLetterStatus={getLetterStatus}
 maxRows={6}
 isDark={isDark}
 activeRowIndex={guesses.length}
 compact={false}
 revealedIndices={[]}
 hintIndices={[]}
 lastHintIndex={-1}
 isShaking={false}
 tutorialColumnHighlight={isReady && step.target === 'grid_column'}
 tutorialRowHighlight={isReady && step.id === 'intro_row' ? (guesses.length === 0 ? 0 : guesses.length - 1) : -1}
 />
 {/* Tutorial Highlights are now handled natively inside Grid component to inherit --tile-size */}
 </div>
 </div>
 </div>

 {/* Tier 3: Keyboard & Hints (Pinned to bottom) */}
 <div className={`shrink-0 w-full md:max-w-lg md:mx-auto mt-auto px-2 pt-8 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-[#2d1155] border-none rounded-t-2xl transition-all duration-500`}>

 {/* Extracted InventoryBar for independent z-index control */}
 <Motion.div
 ref={hintsRef}
 className={`transition-all duration-500 ${isReady && step.target === 'hints' ? 'w-fit mx-auto relative z-50 bg-mono-100 dark:bg-mono-800 rounded-xl px-4 py-2 shadow-2xl' : 'w-full mb-3'}`}
 animate={isReady && step.target === 'hints' ? {
 boxShadow: ['0 0 0px 0px rgba(59, 130, 246, 0.4)', '0 0 20px 4px rgba(59, 130, 246, 0.8)', '0 0 0px 0px rgba(59, 130, 246, 0.4)'],
 borderColor: ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0.4)']
 } : {}}
 transition={isReady && step.target === 'hints' ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
 style={isReady && step.target === 'hints' ? { border: '2px solid transparent' } : {}}
 >
 <InventoryBar
 magnetCount={1}
 hintCount={1}
 skipCount={1}
 onHint={() => { }}
 onMagnet={() => { }}
 onSkip={() => { }}
 hintTaps={0}
 hintLimit={3}
 magnetUsedInRound={false}
 skipsUsedInRound={0}
 skipLimit={1}
 hideSkip={false}
 isTutorialFocus={isReady && step.target === 'hints'}
 tutorialHighlightItem={isReady && step.target === 'hints' ? step.id.replace('intro_hints_', '') : null}
 className={isReady && step.target === 'hints' ? '' : 'mb-1'}
 isDark={isDark}
 />
 {(!isReady || step.target !== 'hints') && (
 <div className={`w-[40%] h-px ${isDark ? 'bg-white/5' : 'bg-slate-200'} mx-auto`} />
 )}
 </Motion.div>

 <div ref={keyboardRef} className={`transition-all duration-500 ${isReady && step.target === 'keyboard' ? 'relative z-50' : ''}`}>
 <Keyboard
 onKey={onKey}
 onDelete={onDelete}
 onEnter={onEnter}
 usedKeys={usedKeys}
 isDark={isDark}
 gameState={isVictory ? 'won' : 'playing'}
 allowedKeys={step.allowed || null}
 pointerKey={step.pointer || null}
 hidePowerups={true}
 forceShowPowerups={false}
 />
 </div>
 </div>
 </div>


 {/* FLOATING TEXT TOOLTIP (Always above everything) */}
 <AnimatePresence mode="wait">
 {isReady && step.text && step.id !== 'finish' && (
 <Motion.div
 ref={setTooltipNode}
 key="tutorial-card"
 initial={{ opacity: 0, scale: 0.3, x: "-50%", y: "-50%" }}
 animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
 exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
 transition={{ type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
 className="absolute left-1/2 w-[90%] max-w-[320px] sm:max-w-85 md:max-w-sm pointer-events-none transition-[top] duration-700 ease-in-out"
 style={{ zIndex: 60, top: dynamicTop !== null ? dynamicTop : (step.top || '22%') }}
 >
 <div className="bg-[#f8fafc] p-4 sm:p-5 md:p-6 rounded-[18px] shadow-[inset_0_-8px_0_#cbd5e1,0_15px_35px_rgba(0,0,0,0.5)] border-4 border-[#121316] text-right relative w-full flex flex-col gap-3" dir="rtl">
 {/* Inner 3D Highlight Layer */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-t-white border-x-transparent border-b-transparent pointer-events-none z-0" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}></div>

 {/* Inner 3D Shadow Layer */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/10 border-x-black/5 border-t-transparent pointer-events-none z-0"></div>

 {/* Conditional Triangle Pointer */}
 {step.pointerDir === 'up' ? (
 <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8fafc] border-t-4 border-l-4 border-[#121316] transform rotate-45 z-0 rounded-sm"></div>
 ) : (
 <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8fafc] border-b-4 border-r-4 border-[#121316] transform rotate-45 z-0 rounded-sm"></div>
 )}

 {/* Text Container: Keeps fixed height dynamically */}
 <div className="relative z-20 w-full text-right" dir="rtl">
 {/* Hidden text to force exact dimensions from the start */}
 <span
 className="text-[15px] sm:text-[17px] md:text-[20px] font-black font-rabar leading-normal md:leading-relaxed block px-2 whitespace-pre-line invisible pointer-events-none text-right!"
 >
 {step.icon && (
 <span className="inline-flex align-middle ml-1.5 sm:ml-2 -mt-1">
 {step.icon === 'bulb' && <HintIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6.5 md:h-6.5" />}
 {step.icon === 'magnet' && <MagnetIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6.5 md:h-6.5" />}
 {step.icon === 'skip' && <SkipIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6.5 md:h-6.5" />}
 </span>
 )}
 {step.text}
 </span>

 {/* Visible typing text positioned absolutely over the hidden text */}
 <span
 className="text-[15px] sm:text-[17px] md:text-[20px] font-black font-rabar text-[#181a20] leading-normal md:leading-relaxed absolute inset-0 block px-2 whitespace-pre-line text-right!"
 style={{ textShadow: `0px 1px 0px white` }}
 >
 {step.icon && (
 <span className="inline-flex align-middle ml-1.5 sm:ml-2 -mt-1">
 {step.icon === 'bulb' && <HintIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6.5 md:h-6.5" />}
 {step.icon === 'magnet' && <MagnetIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6.5 md:h-6.5" />}
 {step.icon === 'skip' && <SkipIcon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6.5 md:h-6.5" />}
 </span>
 )}
 <TypewriterText
 text={step.text}
 isTypingComplete={isTypingComplete}
 onComplete={() => setIsTypingComplete(true)}
 />
 </span>
 </div>

 {/* Button Container: Preserves height so card doesn't jump */}
 {step.advanceOnClick && (
 <div className="relative h-10 sm:h-11 mt-2 sm:mt-3 w-full flex justify-center pointer-events-none">
 <Motion.button
 onClick={handleNextStep}
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: isTypingComplete ? 1 : 0, scale: isTypingComplete ? 1 : 0.8 }}
 transition={{ type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
 whileHover={isTypingComplete ? { scale: 1.03 } : {}}
 whileTap={isTypingComplete ? { scale: 0.95 } : {}}
 className={`px-6 py-2 sm:px-8 sm:py-2.5 bg-[#3b82f6] text-white font-rabar font-black text-[14px] sm:text-[16px] rounded-xl shadow-[0_4px_0_#2563eb] hover:brightness-110 transition-[filter] duration-200 outline-none focus:outline-none active:outline-none relative z-20 flex items-center justify-center w-fit border-none select-none ${isTypingComplete ? 'pointer-events-auto' : 'pointer-events-none'}`}
 style={{ WebkitTapHighlightColor: 'transparent' }}
 >
 بەردەوامبە
 </Motion.button>
 </div>
 )}
 </div>
 </Motion.div>
 )}
 </AnimatePresence>

 <VictoryOverlay
 isVisible={step.id === 'finish'}
 solvedWord={targetWord}
 breakdown={{ awardAmount: profileData?.has_completed_tutorial === false ? 10 : 0, awardType: 'fils', xpAdded: profileData?.has_completed_tutorial === false ? 10 : 0 }}
 xp={profileData?.has_completed_tutorial === false ? 10 : 0}
 onNext={() => {
 if (onStartClassic) {
 onStartClassic();
 } else {
 onBackToLobby();
 }
 }}
 onHome={onBackToLobby}
 playStartSound={() => { }}
 customTitle="فێرکاری ب دوماهی هات!"
 guesses={guesses}
 isDark={isDark}
 gameMode="classic"
 playerStats={{
 ...playerStats,
 classic: {
 ...playerStats?.classic,
 guess_distribution: {
 ...(playerStats?.classic?.guess_distribution || {}),
 '4': (playerStats?.classic?.guess_distribution?.['4'] || 0) + 1
 }
 }
 }}
 profileData={{
 ...profileData,
 games_played: (profileData?.games_played || 0) + 1,
 games_won: (profileData?.games_won || 0) + 1,
 current_streak: (profileData?.current_streak || 0) + 1,
 max_streak: Math.max(profileData?.max_streak || 0, (profileData?.current_streak || 0) + 1)
 }}
 />
 </div>
 );
}
