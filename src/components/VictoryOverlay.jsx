import React, { useEffect, useState, useRef } from 'react';
import ResultStats from './ResultStats';
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

const VictoryOverlay = ({
  isVisible,
  solvedWord,
  breakdown,
  xp,
  onNext,
  onHome,
  playStartSound,
  customTitle,
  guesses = [],
  isDark,
  profileData,
  playerStats,
  gameMode
}) => {
  const [shareStatus, setShareStatus] = useState(null); // null, 'success', 'copied'
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isVisible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerHaptic(200);
      playSuccessSfx();

      const colors = [isDark ? '#34d399' : '#059669', '#facc15', '#3b82f6', '#ffffff'];
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors
      });
    }

    if (isVisible) {
      // Extended timer to allow reading stats
      const timer = setTimeout(() => {
        onHome();
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      // Reset trigger flag when overlay is hidden
      hasTriggeredRef.current = false;
    }
  }, [isVisible, onNext, onHome, isDark]);

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
            className="w-full max-w-[360px] bg-mono-white dark:bg-mono-950 border border-mono-200 dark:border-white/10 rounded-lg p-6 flex flex-col items-center gap-4 relative transition-colors duration-500 shadow-2xl my-8"
          >

            {/* Status Icon Hub */}
            <div className="relative flex flex-col items-center">
              <Motion.div
                initial={{ scale: 0.5, rotate: 15 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-16 h-16 rounded flex items-center justify-center relative z-10 bg-mono-100 dark:bg-white/5 text-mono-900 dark:text-white border border-mono-200 dark:border-white/10"
              >
                <span className="material-symbols-outlined text-[48px]">
                  workspace_premium
                </span>
              </Motion.div>
            </div>

            {/* Message Area */}
            <div className="text-center space-y-3 w-full">
              <h2 className="text-2xl font-black font-heading text-mono-900 dark:text-white">
                {customTitle || "تە سەرکەفتن ئینا!"}
              </h2>

              {solvedWord && (
                <div className="bg-mono-100 dark:bg-[#141414] border border-mono-200 dark:border-white/5 px-4 py-2 rounded-sm inline-block">
                  <span className="text-mono-400 dark:text-white/40 text-[9px] font-bold uppercase tracking-normal block mb-0.5">پەیڤا ڕاست</span>
                  <span className="text-lg font-black text-mono-900 dark:text-white font-heading tracking-normal">{solvedWord}</span>
                </div>
              )}

              {/* Stats & Rewards Table */}
              <div className="w-full space-y-2 mt-1 bg-mono-100 dark:bg-[#141414] p-4 rounded border border-mono-200 dark:border-white/5">
                <div className="flex justify-between items-center text-base font-black">
                  <span className="text-mono-600 dark:text-white/70">خەلاتێ تە</span>
                  <div className="flex items-center gap-2 text-mono-900 dark:text-white">
                    <div className="flex flex-col items-end leading-none">
                      <AnimatedNumber
                        value={breakdown?.awardAmount || 50}
                        prefix="+"
                      />
                      <span className="text-[8px] font-black uppercase opacity-60">
                        {(breakdown?.awardType || 'fils') === 'derhem' ? 'دەرهەم' : (breakdown?.awardType || 'fils') === 'dinar' ? 'دینار' : 'فلس'}
                      </span>
                    </div>
                    {(breakdown?.awardType || 'fils') === 'derhem' ? (
                      <DerhemIcon size={20} className="opacity-90" />
                    ) : (breakdown?.awardType || 'fils') === 'dinar' ? (
                      <DinarIcon size={20} className="opacity-90" />
                    ) : (
                      <FilsIcon size={20} className="opacity-90" />
                    )}
                  </div>
                </div>

                <div className="h-px bg-mono-200 dark:bg-white/5 my-1" />

                <div className="flex justify-between items-center text-sm font-black">
                  <span className="text-mono-600 dark:text-white/70">خەلاتێ ئێکس پی</span>
                  <div className="flex items-center gap-2 text-mono-900 dark:text-white">
                    <div className="flex flex-col items-end leading-none">
                      <AnimatedNumber value={breakdown?.xpAdded || xp || 25} prefix="+" />
                      <span className="text-[8px] font-black tracking-tighter opacity-60">XP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NYT Style Stats */}
              <ResultStats 
                profileData={profileData}
                playerStats={playerStats}
                gameMode={gameMode}
                currentGuessCount={guesses.length}
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                onClick={() => { triggerHaptic(10); playStartSound?.(); onNext(); }}
                className="w-full h-11 bg-primary text-white rounded font-black text-base active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-lg">arrow_left</span>
                بەردەوام بە
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { triggerHaptic(10); playBackSfx(); onHome(); }}
                  className="h-10 bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/5 text-mono-600 dark:text-white/50 rounded font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">home</span>
                  ڤەگەڕیان
                </button>

                <button
                  onClick={async () => {
                    triggerHaptic(10);
                    const grid = generateWordleGrid(guesses, solvedWord);
                    const result = await shareGameResult({
                      title: 'تە سەرکەفتن ئینا د پەیڤچن دا! 🎉',
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
                  className="h-10 bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/5 text-mono-600 dark:text-white/50 rounded font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
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

export default VictoryOverlay;


