import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { FilsIcon } from './CurrencyIcon';
import { playBackSfx } from '../utils/audio';
import { generateWordleGrid, shareGameResult } from '../utils/share';
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

const DefeatOverlay = ({ 
  isVisible, 
  onRetry, 
  onHome,
  breakdown,
  gameMode = 'classic',
  playStartSound,
  guesses = [],
  solvedWord = "",
  profileData,
  playerStats,
  streak = 0
}) => {
  const [shareStatus, setShareStatus] = useState(null); // null, 'success', 'copied'
  const hasTriggeredRef = React.useRef(false);
  
  useEffect(() => {
    if (isVisible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerHaptic(200);
      
      const timer = setTimeout(() => {
        onHome();
      }, 10000);
      return () => clearTimeout(timer);
    }

    if (!isVisible) {
      hasTriggeredRef.current = false;
    }
  }, [isVisible, onHome]);

  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-1000 flex items-center justify-center bg-mono-white/90 dark:bg-mono-950/95 backdrop-blur-md p-6 overflow-y-auto"
        >
          <Motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-[320px] bg-mono-white dark:bg-mono-950 border border-red-500/20 rounded-lg p-4 flex flex-col items-center gap-2 relative transition-colors duration-500 shadow-2xl my-2"
          >
            {/* Status Icon Hub */}
            <div className="relative flex flex-col items-center">
              <Motion.div 
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-12 h-12 rounded flex items-center justify-center relative z-10 bg-red-500/10 text-red-500 border border-red-500/20"
              >
                <span className="material-symbols-outlined text-[40px]">
                   heart_broken
                </span>
              </Motion.div>
            </div>

            {/* Message Area */}
            <div className="text-center space-y-3 w-full">
              <h2 className="text-xl font-black font-heading text-red-500">
                 تو سەرنەکەڤتی!
              </h2>

              {solvedWord && (
                <div className="bg-mono-100 dark:bg-[#141414] border border-mono-200 dark:border-white/5 px-3 py-1.5 rounded-sm inline-block">
                  <span className="text-mono-400 dark:text-white/40 text-[9px] font-bold uppercase  block mb-0.5">پەیڤا ڕاست</span>
                  <span className="text-base font-black text-mono-900 dark:text-white font-heading tracking-normal">{solvedWord}</span>
                </div>
              )}

              {/* Stats & Penalties Table */}
              <div className="w-full space-y-1.5 mt-0.5 bg-mono-100 dark:bg-mono-900/60 p-2 rounded border border-red-500/10 text-right">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-mono-600 dark:text-white/80">سزایێ دۆڕاندنێ</span>
                  <div className="flex items-center gap-1.5 text-red-400">
                    <div className="flex flex-col items-end leading-none">
                      <AnimatedNumber value={breakdown?.base || 0} prefix="-" />
                      <span className="text-[7px] font-black uppercase  opacity-60">فلس</span>
                    </div>
                    <FilsIcon size={12} className="opacity-80" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-mono-600 dark:text-white/80">سزایێ شاشیان</span>
                  <div className="flex items-center gap-1.5 text-red-500">
                    <div className="flex flex-col items-end leading-none">
                      <AnimatedNumber value={breakdown?.mistakes || 0} prefix="-" />
                      <span className="text-[7px] font-black uppercase  opacity-60">فلس</span>
                    </div>
                    <FilsIcon size={12} className="opacity-80" />
                  </div>
                </div>
                <div className="h-px bg-mono-200 dark:bg-white/5 my-1" />
                <div className="flex justify-between items-center text-sm font-black">
                  <span className="text-mono-900 dark:text-white">سەرجەم</span>
                  <div className="flex items-center gap-1.5 text-red-500">
                    <div className="flex flex-col items-end leading-none">
                      <AnimatedNumber value={breakdown?.total || 0} prefix="-" />
                      <span className="text-[8px] font-black uppercase  opacity-70">فلس</span>
                    </div>
                    <FilsIcon size={16} />
                  </div>
                </div>
              </div>

              {/* Word Fever Streak Banner */}
              {gameMode === 'word_fever' && streak > 0 && (
                <div className="w-full mt-2 bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5 flex items-center justify-between overflow-hidden relative group">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-lg">local_fire_department</span>
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-amber-700 dark:text-amber-400 font-black text-xs tracking-tight">زنجیرەیا پەیڤان</span>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-1">
                    <span className="text-amber-600 dark:text-amber-400 font-black text-xl tabular-nums">{streak}</span>
                    <span className="text-amber-600/50 dark:text-amber-400/50 text-[10px] font-bold">پەیڤ</span>
                  </div>
                </div>
              )}

              {/* Stats Section */}
              <ResultStats 
                profileData={profileData}
                playerStats={playerStats}
                gameMode={gameMode}
                currentGuessCount={-1} // No highlight for loss
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 mt-2">
              {gameMode !== 'secret_word' && (
                <button 
                  onClick={() => { triggerHaptic(10); playStartSound?.(); onRetry(); }}
                  className="w-full h-9 bg-red-500 text-white rounded font-black text-base active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg">restart_alt</span>
                  بەردەوام بە
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { triggerHaptic(10); playBackSfx(); onHome(); }}
                  className="h-9 bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/5 text-mono-600 dark:text-white/50 rounded font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">home</span>
                  ڤەگەڕیان
                </button>

                <button
                  onClick={async () => {
                    triggerHaptic(10);
                    const grid = generateWordleGrid(guesses, solvedWord);
                    const result = await shareGameResult({
                      title: 'من نەشیا ڤێ پەیڤێ بدۆزم د پەیڤۆک دا! 💔',
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
                  className="h-9 bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/5 text-mono-600 dark:text-white/50 rounded font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    {shareStatus === 'copied' ? 'content_paste_go' : shareStatus === 'success' ? 'check_circle' : 'share'}
                  </span>
                  {shareStatus === 'copied' ? 'کۆپی!' : shareStatus === 'success' ? 'نارد!' : 'بەلاڤ بکە'}
                </button>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default DefeatOverlay;


