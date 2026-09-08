import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import { triggerHaptic } from '../utils/haptics';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import ResultStats from './ResultStats';

const AnimatedNumber = ({ value, prefix = "" }) => {
 const [displayValue, setDisplayValue] = useState(0);

 useEffect(() => {
 let start = 0;
 const end = parseInt(value) || 0;
 const duration = 1500; // 1.5s
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

export default function MultiplayerResultOverlay({
 isVisible, 
 result, 
 scores, 
 rewards,
 opponent, 
 userAvatar, 
 userNickname,
 onClose,
 isForfeitWin 
}) {
 if (!isVisible) return null;

 const isVictory = result === 'victory';
 const isDraw = result === 'draw';

 return (
 <AnimatePresence>
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-1000 overflow-y-auto bg-mono-white/90 dark:bg-black/95 "
 >
 {/* Cinematic Backdrop Glow */}
 {/* Removed Glow */}

 <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
 <Motion.div
 initial={{ scale: 0.9, y: 20, opacity: 0 }}
 animate={{ scale: 1, y: 0, opacity: 1 }}
 exit={{ scale: 0.9, y: 20, opacity: 0 }}
 className="relative w-full max-w-[320px] sm:max-w-sm bg-mono-white dark:bg-black border border-mono-200 dark:border-white/10 rounded-xl p-4 sm:p-5 transition-colors duration-500 shadow-2xl"
 >
 {/* Close/Exit Button */}
 <button
 onClick={() => {
 triggerHaptic(10);
 onClose();
 }}
 className="absolute top-6 right-6 w-10 h-10 rounded-md bg-mono-100 dark:bg-white/10 flex items-center justify-center text-mono-400 dark:text-white/40 hover:bg-mono-200 dark:hover:bg-white/20 hover:text-mono-900 dark:hover:text-white active:scale-95 transition-all z-50 group border border-mono-200 dark:border-white/10"
 >
 <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">close</span>
 </button>

 {/* Header Status */}
 <div className="flex flex-col items-center mb-8">
 <Motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
 className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
 isVictory ? 'bg-emerald-500/20 text-emerald-400' : isDraw ? 'bg-slate-500/20 text-slate-300' : 'bg-red-500/20 text-red-500'
 }`}
 >
 <span className="material-symbols-outlined text-6xl">
 {isVictory ? 'workspace_premium' : isDraw ? 'balance' : 'sentiment_very_dissatisfied'}
 </span>
 </Motion.div>
 
 <h1 className={`text-4xl font-black font-rabar mb-2 ${
 isVictory ? 'text-emerald-400' : isDraw ? 'text-slate-300' : 'text-red-400'
 }`}>
 {isVictory ? 'سەرکەفتن!' : isDraw ? 'یەکسانبوون!' : 'خوسارەتی!'}
 </h1>

 {isVictory && isForfeitWin && (
 <Motion.div
 initial={{ opacity: 0, y: 5 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-amber-500/10 text-amber-400 px-4 py-1 rounded-full text-sm font-bold font-rabar mb-3 border border-amber-500/20"
 >
 سەرکەفتن ب دەستژێبەردانا ھەڤڕکی!
 </Motion.div>
 )}

 <p className="text-mono-400 dark:text-white/40 font-medium">ئەنجامێ یاریێ</p>
 </div>

 {/* Scores Comparison */}
 <div className="flex items-center justify-between gap-4 mb-4 bg-mono-100 dark:bg-white/5 rounded-lg p-6 border border-mono-200 dark:border-white/5">
 <div className="flex flex-col items-center gap-2 flex-1">
 <Avatar src={userAvatar} size="sm" />
 <span className="text-[10px] font-black text-mono-400 dark:text-white/40 uppercase w-full text-center whitespace-normal break-all line-clamp-2 leading-tight">{userNickname}</span>
 <span className="text-3xl font-black text-mono-900 dark:text-white">{scores.p1}</span>
 </div>

 <div className="flex flex-col items-center">
 <div className="w-8 h-0.5 bg-white/10 rounded-full mb-1" />
 <span className="text-xs font-black text-white/20 italic">و</span>
 <div className="w-8 h-0.5 bg-white/10 rounded-full mt-1" />
 </div>

 <div className="flex flex-col items-center gap-2 flex-1">
 <Avatar src={opponent?.avatar_url} size="sm" />
 <span className="text-[10px] font-black text-mono-400 dark:text-white/40 uppercase w-full text-center whitespace-normal break-all line-clamp-2 leading-tight">{opponent?.nickname || 'Hévrk'}</span>
 <span className="text-3xl font-black text-mono-900 dark:text-white">{scores.p2}</span>
 </div>
 </div>

 {/* Rewards Section (Only for Victory) */}
 {isVictory && (
 <Motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.5 }}
 className="w-full space-y-2 mb-8 bg-mono-50 dark:bg-black/40 p-5 rounded-lg border border-emerald-500/10"
 >
 <div className="flex justify-between items-center text-md font-black">
 <span className="text-mono-600 dark:text-white/60">خەلاتێ تە</span>
 <div className="flex items-center gap-2 text-emerald-400">
 <div className="flex flex-col items-end leading-none">
 <AnimatedNumber value={rewards?.awards?.amount || 1} prefix="+" />
 <span className="text-[8px] font-black uppercase tracking-normal opacity-60">
 {rewards?.awards?.type === 'dinar' ? 'دینار' : rewards?.awards?.type === 'derhem' ? 'دەرهەم' : 'فلس'}
 </span>
 </div>
 {rewards?.awards?.type === 'dinar' ? <DinarIcon size={20} /> : rewards?.awards?.type === 'derhem' ? <DerhemIcon size={20} /> : <FilsIcon size={20} />}
 </div>
 </div>

 <div className="h-px bg-white/5 my-0.5" />

 <div className="flex justify-between items-center text-sm font-black mt-1">
 <span className="text-mono-600 dark:text-white/60">خەلاتێ ئێکس پی</span>
 <div className="flex items-center gap-2 text-yellow-500">
 <div className="flex flex-col items-end leading-none">
 <AnimatedNumber value={rewards?.xpAdded || 100} />
 <span className="text-[8px] font-black tracking-tighter opacity-60">XP</span>
 </div>
 </div>
 </div>

 <div className="h-px bg-white/5 my-1" />

 <div className="flex justify-between items-center text-[13px] font-black mt-1 py-1.5 px-2 rounded-sm bg-purple-500/10 border border-purple-500/20 shadow-inner">
 <div className="flex items-center gap-1.5">
 <span className="material-symbols-outlined text-[16px] text-[#a855f7] animate-pulse">timer</span>
 <span className="text-[#a855f7] dark:text-[#c084fc] text-[11px] font-rabar pt-0.5">زێدەبوو ل سەرکەفتنێن ئەڤرۆ</span>
 </div>
 <div className="flex items-center gap-1 leading-none text-[#a855f7] dark:text-[#c084fc]">
 <AnimatedNumber value={rewards?.xpAdded || 100} />
 </div>
 </div>
 </Motion.div>
 )}

 {/* Unified Stats Section */}
 <ResultStats 
 profileData={{ games_played: 0, games_won: 0 }} // Minimal fallback
 playerStats={rewards?.playerStats}
 gameMode="battle"
 currentGuessCount={-1}
 />

 {/* Action Buttons Removed per User Request */}
 <div className="mt-4">
 {/* Spacing for layout consistency */}
 </div>
 </Motion.div>
 </div>
 </Motion.div>
 </AnimatePresence>
 );
}
