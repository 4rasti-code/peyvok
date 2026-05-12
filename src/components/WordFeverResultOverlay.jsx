import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessSfx, playBackSfx } from '../utils/audio';
import { generateWordleGrid, shareGameResult } from '../utils/share';

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
      // Ease out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayValue(Math.floor(start + (end - start) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{prefix}{displayValue}</span>;
};

const WordFeverResultOverlay = ({
  isVisible,
  type, // 'win' or 'fail'
  solvedWord,
  breakdown,
  xp,
  onContinue, // Resets timer to 60s + new word
  onRepeat,   // Resets timer to 60s + retry board
  onHome,      // Returns to lobby
  playStartSound,
  guesses = []
}) => {
  const [shareStatus, setShareStatus] = useState(null); // null, 'success', 'copied'
  const isWin = type === 'win';
  const hasTriggeredRef = React.useRef(false);

  useEffect(() => {
    if (isVisible && isWin && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      const colors = ['#0ea5e9', '#22d3ee', '#3b82f6', '#ffffff'];
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors
      });
      triggerHaptic([30, 50, 30, 50, 60]);
      playSuccessSfx();
    } else if (isVisible && !isWin && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerHaptic(200);
    }

    if (!isVisible) {
      hasTriggeredRef.current = false;
    }

    if (isVisible) {
      const timer = setTimeout(() => {
        onHome();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isWin, onContinue, onHome]);

  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-1000 flex items-center justify-center bg-mono-white/90 dark:bg-mono-950/95 backdrop-blur-md p-6"
        >
          <Motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full max-w-md bg-mono-white dark:bg-mono-950/80 border-2 rounded-[3.5rem] p-10 flex flex-col items-center gap-8 ${isWin ? 'border-sky-500/30' : 'border-red-500/30'} transition-colors duration-500 shadow-2xl`}
          >
            {/* Status Icon Hub */}
            <div className="relative flex flex-col items-center">
              <Motion.div
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                className={`w-24 h-24 rounded-2xl flex items-center justify-center relative z-10 ${isWin ? 'bg-sky-500/20 text-sky-400' : 'bg-red-500/20 text-red-500'} border ${isWin ? 'border-sky-500/30' : 'border-red-500/30'}`}
              >
                <span className="material-symbols-outlined text-[72px]">
                  {isWin ? 'electric_bolt' : 'timer_off'}
                </span>
              </Motion.div>
            </div>

            {/* Message Area */}
            <div className="text-center space-y-4 w-full">
              <h2 className={`text-4xl font-black font-heading ${isWin ? 'text-sky-400' : 'text-red-500'}`}>
                {isWin ? 'پیرۆزە!' : 'تو سەرنەکەڤتی!'}
              </h2>
              <p className="text-lg font-bold font-body text-mono-500 dark:text-white/60 leading-relaxed px-4">
                {isWin ? '' : 'تە پەیڤا ڕاست نەدیت، دەستا نەداھێلە!'}
              </p>

              {isWin && solvedWord && (
                <div className={`bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/10 px-6 py-4 rounded-3xl mt-2 inline-block`}>
                  <span className="text-mono-400 dark:text-white/40 text-[10px] font-bold uppercase  block mb-1">پەیڤا ڕاست</span>
                  <span className={`text-2xl font-black font-heading tracking-normal text-sky-400`}>{solvedWord}</span>
                </div>
              )}

              {/* Stats & Rewards Table */}
              <div className="w-full flex flex-col gap-3 bg-mono-50 dark:bg-mono-900/60 p-5 rounded-2xl border border-mono-100 dark:border-white/5">
                {/* Main Reward Row */}
                <div className="flex justify-between items-center text-sm font-black group/row">
                  <span className="text-mono-600 dark:text-white/80 transition-colors group-hover/row:text-mono-900 dark:group-hover/row:text-white">
                    {isWin ? 'خەلاتێ سەرکەفتنێ' : 'سزایێ دۆڕاندنێ'}
                  </span>
                  <div className={`flex items-center gap-2 ${isWin ? 'text-sky-400' : 'text-red-500'}`}>
                    <div className="flex flex-col items-end leading-none pt-0.5">
                      <AnimatedNumber value={isWin ? (breakdown?.awardAmount || 75) : 50} prefix={isWin ? "+" : "-"} />
                      <span className="text-[7px] font-black uppercase tracking-normal opacity-60">
                        {breakdown?.awardType === 'fils' ? 'فلس' : breakdown?.awardType === 'derhem' ? 'دەرهەم' : 'دینار'}
                      </span>
                    </div>
                    {breakdown?.awardType === 'fils' || !isWin ? <FilsIcon size={12} className="opacity-80" /> : breakdown?.awardType === 'derhem' ? <DerhemIcon size={12} className="opacity-80" /> : <DinarIcon size={12} className="opacity-80" />}
                  </div>
                </div>

                {/* XP Reward Row */}
                {isWin && (breakdown?.xpAdded || xp) > 0 && (
                  <div className="flex justify-between items-center text-sm font-black group/row pt-1 border-t border-mono-200 dark:border-white/5">
                    <span className="text-mono-600 dark:text-white/80 transition-colors group-hover/row:text-mono-900 dark:group-hover/row:text-white">خەلاتێ XP</span>
                    <div className="flex items-center gap-2 text-yellow-500">
                      <AnimatedNumber value={breakdown?.xpAdded || xp || 0} prefix="+" />
                      <span className="text-[10px] font-black tracking-tighter opacity-80">XP</span>
                    </div>
                  </div>
                )}

                {/* Detailed Stats Breakdown (Horizontal & Reordered below XP) */}
                <div className="flex items-center justify-between gap-1 pt-3 mt-1 border-t border-mono-200 dark:border-white/5">
                  {/* Yellow (Wrong Position) */}
                  <div className="flex flex-col items-center gap-1.5 flex-1 border-r border-mono-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                      <span className="text-[9px] font-black text-yellow-500 whitespace-nowrap">ڕاست/جهێ شاش</span>
                    </div>
                    <span className="text-sm font-black text-mono-900 dark:text-white leading-none">{breakdown?.yellowCount || 0}</span>
                  </div>

                  {/* Green (Correct) */}
                  <div className="flex flex-col items-center gap-1.5 flex-1 border-r border-mono-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="text-[9px] font-black text-emerald-500 whitespace-nowrap">پیت ڕاست</span>
                    </div>
                    <span className="text-sm font-black text-mono-900 dark:text-white leading-none">{breakdown?.greenCount || 0}</span>
                  </div>

                  {/* Gray (Wrong) */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.4)]" />
                      <span className="text-[9px] font-black text-mono-400 dark:text-slate-500 whitespace-nowrap">پیت شاش</span>
                    </div>
                    <span className="text-sm font-black text-mono-900 dark:text-white leading-none">-{breakdown?.grayCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              {isWin ? (
                <button
                  onClick={() => { triggerHaptic(10); playStartSound?.(); onContinue(); }}
                  className="w-full bg-linear-to-r from-sky-500 to-cyan-600 hover:brightness-110 text-white py-5 rounded-3xl font-black text-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  بەردەوام بە
                </button>
              ) : (
                <button
                  onClick={() => { triggerHaptic(10); playStartSound?.(); onRepeat(); }}
                  className={`w-full ${isWin ? 'bg-linear-to-r from-sky-500 to-indigo-600' : 'bg-linear-to-r from-red-500 to-orange-600'} hover:brightness-110 text-white py-5 rounded-3xl font-black text-xl active:scale-95 transition-all flex items-center justify-center gap-3 group`}
                >
                  <span className="material-symbols-outlined">restart_alt</span>
                  بەردەوام بە
                </button>
              )}

              <button
                onClick={() => { triggerHaptic(10); playBackSfx(); onHome(); }}
                className="w-full bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/10 hover:bg-mono-200 dark:hover:bg-white/10 text-mono-500 dark:text-white/60 hover:text-mono-900 dark:hover:text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">home</span>
                ڤەگەڕیان
              </button>

              <button
                onClick={async () => {
                  triggerHaptic(10);
                  const grid = generateWordleGrid(guesses, solvedWord);
                  const result = await shareGameResult({
                    title: isWin ? 'من شیام هەمی پەیڤێن Word Fever بدۆزم! ⚡' : 'من تاقیكرنا Word Fever ئەنجامدا! 🔥',
                    grid: grid
                  });
                  
                  if (result === 'clipboard') {
                    setShareStatus('copied');
                    setTimeout(() => setShareStatus(null), 2000);
                  } else if (result) {
                    setShareStatus('success');
                    setTimeout(() => setShareStatus(null), 2000);
                  }
                }}
                className="w-full h-9 bg-transparent text-mono-400 dark:text-white/30 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:text-mono-600 dark:hover:text-white/50 transition-colors mt-1"
              >
                <span className="material-symbols-outlined text-base">
                  {shareStatus === 'copied' ? 'content_paste_go' : shareStatus === 'success' ? 'check_circle' : 'share'}
                </span>
                {shareStatus === 'copied' ? 'کۆپی بوو!' : shareStatus === 'success' ? 'هاتە ناردن!' : 'بەلاڤ بکە'}
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default WordFeverResultOverlay;


