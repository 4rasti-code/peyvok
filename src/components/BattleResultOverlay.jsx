import React, { useEffect, useState, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { fireConfetti as confetti, resetConfetti } from '../utils/confettiHelper';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import Avatar from './Avatar';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessSfx, playRewardSfx, playDefeatSfx } from '../utils/audio';
import { toKuDigits } from '../utils/formatters';
import { NAME_FONTS } from '../constants/nameFonts';
import { NAME_STYLES } from '../constants/nameStyles';
import PremiumName from './PremiumName';
import { BUNDLES } from '../constants/bundles';
import { generateWordleGrid, shareGameResult } from '../utils/share';
import ResultStats from './ResultStats';

const AnimatedNumber = ({ value, prefix = "" }) => {
 const [displayValue, setDisplayValue] = useState(0);

 useEffect(() => {
 let start = 0;
 const end = parseInt(value) || 0;
 const duration = 1500;
 const startTime = performance.now();

 const update = (now) => {
 const elapsed = now - startTime;
 const progress = Math.min(elapsed / duration, 1);
 const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
 setDisplayValue(Math.floor(start + (end - start) * easeProgress));
 if (progress < 1) requestAnimationFrame(update);
 };

 requestAnimationFrame(update);
 }, [value]);

 return <span>{prefix}{displayValue}</span>;
};

const BattleResultOverlay = ({
 isVisible,
 result = 'victory', // 'victory', 'defeat', 'draw'
 scores = { p1: 0, p2: 0 },
 opponent = null,
 user = null,
 isPlayer1 = true,
 breakdown = null,
 xp = 0,
 playerStats = null,
 onNext,
 isDark,
 guesses = [],
 solvedWord = "",
 onShareToGlobal
}) => {
 const [shareStatus, setShareStatus] = useState(null); // null, 'success', 'copied'
 const [globalShareStatus, setGlobalShareStatus] = useState(null);
 const [snapshot, setSnapshot] = useState(null);
 const hasTriggeredRef = useRef(false);
 const isVictory = result === 'victory';
 const isDefeat = result === 'defeat';

 useEffect(() => {
 if (isVisible && !snapshot && opponent) {
 const timer = setTimeout(() => setSnapshot({ scores, opponent, user, isPlayer1 }), 0);
 return () => clearTimeout(timer);
 } else if (!isVisible && snapshot) {
 const timer = setTimeout(() => setSnapshot(null), 500); // clear after animation
 return () => clearTimeout(timer);
 }
 }, [isVisible, opponent, scores, user, isPlayer1, snapshot]);

 useEffect(() => {
 return () => {
 resetConfetti();
 };
 }, []);

 useEffect(() => {
 let timeoutId;

 if (isVisible && !hasTriggeredRef.current) {
 hasTriggeredRef.current = true;
 triggerHaptic(200);

 if (result === 'victory') {
 playSuccessSfx();
 playRewardSfx();
 
 const colors = [isDark ? '#ffffff' : '#171717', '#facc15', '#3b82f6', '#ffffff'];
 timeoutId = setTimeout(() => {
 confetti({
 particleCount: 60,
 spread: 60,
 origin: { x: 0.5, y: 0.6 },
 colors: colors,
 zIndex: 3000
 });
 }, 300);
 } else if (result === 'defeat') {
 playDefeatSfx();
 }
 } else if (!isVisible) {
 // Reset trigger flag and share status when overlay is hidden
 hasTriggeredRef.current = false;
 setTimeout(() => {
 setShareStatus(null);
 setGlobalShareStatus(null);
 }, 0);
 }

 return () => {
 if (timeoutId) clearTimeout(timeoutId);
 };
 }, [isVisible, result, isDark]);

 const displayScores = snapshot?.scores || scores;
 const displayOpponent = snapshot?.opponent || opponent;
 const displayIsP1 = snapshot?.isPlayer1 ?? isPlayer1;
 const displayUser = snapshot?.user || user;

 const myScore = displayIsP1 ? displayScores.p1 : displayScores.p2;
 const oppScore = displayIsP1 ? displayScores.p2 : displayScores.p1;

 return (
 <AnimatePresence>
 {isVisible && (
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-black/90 "
 >
 <Motion.div
 initial={{ scale: 0.9, y: 20, opacity: 0 }}
 animate={{ scale: 1, y: 0, opacity: 1 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className={`w-full max-w-[320px] sm:max-w-85 bg-mono-white dark:bg-[#0a0a0a] border-2 ${isVictory
 ? 'border-black/10 dark:border-white/10'
 : isDefeat
 ? 'border-red-500/20 dark:border-red-500/30'
 : 'border-blue-500/20 dark:border-blue-500/30'
 } rounded-md p-4 sm:p-5 flex flex-col items-center gap-6 relative transition-colors duration-500 shadow-2xl modal-zoom-fit`}
 >
 {/* Status Icon */}


 {/* Title */}
 <div className="text-center">
 <h2 className={`text-4xl font-black font-heading ${isVictory
 ? 'text-mono-900 dark:text-white'
 : isDefeat
 ? 'text-red-600 dark:text-red-500'
 : 'text-blue-600 dark:text-blue-400'
 }`}>
 {isVictory ? 'سەرکەفتن!' : isDefeat ? 'خوسارەتی!' : 'یەکسانبوون!'}
 </h2>

 </div>

 {/* VS SECTION (Premium Look) */}
 <div className="w-full bg-mono-50 dark:bg-[#141414] rounded-md border border-mono-200 dark:border-white/10 py-5 px-6 sm:px-12">
 <div className="grid grid-cols-3 gap-y-3 items-center">
 
 {/* ROW 1: Avatars & VS separator */}
 <div className="flex justify-center z-10">
 <div className="p-0.5 rounded-full border border-sky-500/30">
 <Avatar src={user?.avatar_url} size="lg" />
 </div>
 </div>
 
 <div className="flex justify-center z-10">
 <span className="text-xs font-black text-mono-300 dark:text-white/20 italic">و</span>
 </div>
 
 <div className="flex justify-center z-10">
 <div className="p-0.5 rounded-full border border-red-500/30">
 <Avatar src={displayOpponent?.avatar_url} size="lg" />
 </div>
 </div>

 {/* ROW 2: Names */}
 <div className="flex justify-center items-center z-10 min-h-10">
 {(() => {
 const targetObj = displayUser || {};
 const myFont = NAME_FONTS[targetObj.equipped_font] || NAME_FONTS['default-ku'];
 const myStyle = NAME_STYLES[targetObj.equipped_name_style] || {};
 const myBundle = BUNDLES[targetObj.equipped_bundle] || BUNDLES['default'];
 
 const name = displayUser?.nickname || 'تۆ';
 const nameLen = Math.max(name.length, 1);
 const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
 const isWideFont = wideFonts.includes(targetObj.equipped_font);
 
 const baselineLen = isWideFont ? 2.5 : 4.5;
 const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
 const baseSize = myFont.style?.fontSize ? parseFloat(myFont.style.fontSize) : 1.4;
 const dynamicFontSize = `${baseSize * scaleFactor}em`;

 return (
 <PremiumName 
 text={name}
 styleId={myBundle.id !== 'default' ? null : myStyle.id}
 dir="auto"
 className={`font-black text-sm block w-full max-w-30 overflow-visible py-2 whitespace-nowrap text-center mx-auto ${myBundle.id !== 'default' ? (myBundle.fontKurdish + ' ' + myBundle.textStyle) : 'text-white'}`}
 style={{
 ...(myBundle.id !== 'default' ? {} : myFont.style),
 fontSize: dynamicFontSize
 }}
 />
 );
 })()}
 </div>
 
 <div className="flex justify-center z-10"></div>
 
 <div className="flex justify-center items-center z-10 min-h-10">
 {(() => {
 const targetObj = displayOpponent || {};
 const oppFont = NAME_FONTS[targetObj.equipped_font] || NAME_FONTS['default-ku'];
 const oppStyle = NAME_STYLES[targetObj.equipped_name_style] || {};
 const oppBundle = BUNDLES[targetObj.equipped_bundle] || BUNDLES['default'];
 
 const name = displayOpponent?.nickname || 'بەرامبەر';
 const nameLen = Math.max(name.length, 1);
 const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
 const isWideFont = wideFonts.includes(targetObj.equipped_font);
 
 const baselineLen = isWideFont ? 2.5 : 4.5;
 const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
 const baseSize = oppFont.style?.fontSize ? parseFloat(oppFont.style.fontSize) : 1.4;
 const dynamicFontSize = `${baseSize * scaleFactor}em`;

 return (
 <PremiumName 
 text={name}
 styleId={oppBundle.id !== 'default' ? null : oppStyle.id}
 dir="auto"
 className={`font-black text-sm block w-full max-w-30 overflow-visible py-2 whitespace-nowrap text-center mx-auto ${oppBundle.id !== 'default' ? (oppBundle.fontKurdish + ' ' + oppBundle.textStyle) : 'text-white/40'}`}
 style={{
 ...(oppBundle.id !== 'default' ? {} : oppFont.style),
 fontSize: dynamicFontSize
 }}
 />
 );
 })()}
 </div>

 {/* ROW 3: Scores */}
 <div className="flex justify-center z-10">
 <span className={`text-3xl font-black ${isVictory ? 'text-sky-500 dark:text-sky-400' : 'text-mono-900 dark:text-white'}`}>{toKuDigits(myScore)}</span>
 </div>
 
 <div className="flex justify-center z-10"></div>
 
 <div className="flex justify-center z-10">
 <span className={`text-3xl font-black ${isDefeat ? 'text-red-500' : 'text-mono-900 dark:text-white'}`}>{toKuDigits(oppScore)}</span>
 </div>
 
 </div>
 </div>

 {/* REWARDS SECTION */}
 <div className="w-full space-y-2 bg-mono-50 dark:bg-[#141414] p-4 rounded-md border border-mono-200 dark:border-white/5">
 <div className="flex justify-between items-center text-sm font-bold">
 <span className="text-mono-600 dark:text-white/60">خەڵاتێ تە</span>
 <div className={`flex items-center gap-2 ${isVictory ? 'text-emerald-600 dark:text-emerald-400' : 'text-mono-400 dark:text-white/20'}`}>
 <div className="flex flex-col items-end leading-none">
 <AnimatedNumber value={breakdown?.awardAmount || 0} prefix={isVictory ? "+" : ""} />
 <span className="text-[7px] font-bold uppercase opacity-60">
 {breakdown?.awardType === 'fils' ? 'فلس' : breakdown?.awardType === 'derhem' ? 'دەرهەم' : 'دینار'}
 </span>
 </div>
 {breakdown?.awardType === 'fils' && <FilsIcon size={24} />}
 {breakdown?.awardType === 'derhem' && <DerhemIcon size={24} />}
 {breakdown?.awardType === 'dinar' && <DinarIcon size={24} />}
 </div>
 </div>

 <div className="h-px bg-mono-200 dark:bg-white/5" />

 <div className="flex justify-between items-center text-sm font-bold">
 <span className="text-mono-600 dark:text-white/60">خەڵاتێ ئێکەم یاری</span>
 <div className={`flex items-center gap-2 ${isVictory ? 'text-yellow-600 dark:text-yellow-500' : 'text-mono-400 dark:text-white/20'}`}>
 <div className="flex flex-col items-end leading-none">
 <AnimatedNumber value={breakdown?.xpAdded || xp || (isVictory ? 100 : 20)} prefix="+" />
 <span className="text-[7px] font-bold opacity-60">XP</span>
 </div>
 </div>
 </div>

 {/* Progress Dots */}
 <div className="pt-4 mt-2 border-t border-mono-200 dark:border-white/5 flex flex-col items-center gap-2">
 <div className="flex items-center gap-3">
 {[...Array(5)].map((_, i) => {
 let colorClass = "bg-mono-200 dark:bg-white/10";
 if (i < myScore) colorClass = "bg-sky-500";
 else if (i < myScore + oppScore) colorClass = "bg-red-500";

 return (
 <Motion.div
 key={i}
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ delay: 0.5 + i * 0.1 }}
 className={`w-2.5 h-2.5 rounded-full ${colorClass}`}
 />
 );
 })}
 </div>
 <span className="text-[7px] font-bold text-mono-400 dark:text-white/20 uppercase">پلەیا نوی</span>
 </div>
 </div>

 {/* Unified Stats Section */}
 <ResultStats 
 profileData={displayUser}
 playerStats={playerStats}
 gameMode="battle"
 currentGuessCount={-1}
 />


 {/* Buttons */}
 <div className="w-full flex flex-col gap-3">
 <button
 onClick={() => { onNext(); }}
 className="w-full h-12 bg-mono-100 dark:bg-white/10 hover:bg-mono-200 dark:hover:bg-white/20 text-mono-900 dark:text-white font-black text-lg rounded-md border border-mono-200 dark:border-white/10 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3 group"
 >
 ڤەگەڕە
 <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
 </button>

 <div className="flex items-center gap-2 w-full mt-2">
 <button
 onClick={async () => {
 triggerHaptic(10);
 const shareGrid = generateWordleGrid(guesses, solvedWord, 6);
 const result = await shareGameResult({
 title: isVictory ? `من سەرکەفتن ئینا ل سەر ${displayOpponent?.nickname || 'یەکیتر'}! 🏆` : `من خوسارەت کر بەرامبەر ${displayOpponent?.nickname || 'یەکیتر'}! 😔`,
 grid: shareGrid
 });

 if (result === 'clipboard') {
 setShareStatus('copied');
 setTimeout(() => setShareStatus(null), 2000);
 } else if (result) {
 setShareStatus('success');
 setTimeout(() => setShareStatus(null), 2000);
 }
 }}
 className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
 >
 <span className="material-symbols-outlined text-base">
 {shareStatus === 'copied' ? 'content_paste_go' : shareStatus === 'success' ? 'check_circle' : 'share'}
 </span>
 {shareStatus === 'copied' ? 'کۆپی بوو!' : shareStatus === 'success' ? 'هاتە ناردن!' : 'بەلاڤ بکە'}
 </button>

 {onShareToGlobal && (
 <button
 onClick={async () => {
 triggerHaptic(10);
 const battleData = {
 myId: displayUser?.id,
 myXP: displayUser?.xp || 0,
 myAvatar: displayUser?.avatar_url || 'default',
 myName: displayUser?.nickname || 'من',
 myScore: myScore,
 myLevel: displayUser?.level || 1,
 oppId: displayOpponent?.id,
 oppXP: displayOpponent?.xp || 0,
 oppAvatar: displayOpponent?.avatar_url || 'default',
 oppName: displayOpponent?.nickname || 'یەکیتر',
 oppScore: oppScore,
 oppLevel: displayOpponent?.level || 1,
 result: isVictory ? 'victory' : isDefeat ? 'defeat' : 'draw'
 };
 const text = `[BATTLE_RESULT] ${JSON.stringify(battleData)}`;
 const success = await onShareToGlobal(text);
 if (success) {
 setGlobalShareStatus('success');
 // setTimeout(() => setGlobalShareStatus(null), 2000);
 }
 }}
 disabled={globalShareStatus === 'success'}
 className="flex-1 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
 >
 <span className="material-symbols-outlined text-base">
 {globalShareStatus === 'success' ? 'check_circle' : 'forum'}
 </span>
 {globalShareStatus === 'success' ? 'هاتەهنارتن بۆ چاتی' : 'هنارتن بۆ چاتێ گشتی'}
 </button>
 )}
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>
 );
};

export default BattleResultOverlay;


