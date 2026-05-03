import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { FilsIcon } from './CurrencyIcon';
import { useState } from 'react';
import { playBackSfx } from '../utils/audio';

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
  _solvedWord, 
  onRetry, 
  onHome,
  breakdown,
  _gameMode = 'classic',
  playStartSound
}) => {
  useEffect(() => {
    if (isVisible) {
      triggerHaptic(200);
      
      const timer = setTimeout(() => {
        onHome();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHome]);

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
            className="w-full max-w-md bg-mono-white dark:bg-mono-950 border-2 border-red-500/30 rounded-[3.5rem] p-10 flex flex-col items-center gap-8 relative transition-colors duration-500 shadow-2xl"
          >
            {/* Status Icon Hub */}
            <div className="relative flex flex-col items-center">
              <Motion.div 
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-32 h-32 rounded-2xl flex items-center justify-center relative z-10 bg-linear-to-br from-red-500/20 to-orange-600/20 text-red-500 border border-red-500/30"
              >
                <span className="material-symbols-outlined text-[72px] text-red-500">
                   heart_broken
                </span>
              </Motion.div>
            </div>

            {/* Message Area */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black font-heading text-red-500">
                 تو سەرنەکەڤتی!
              </h2>
              <p className="text-lg font-bold font-body text-mono-500 dark:text-white/60 leading-relaxed px-4">
                بی ھێڤی نەبە، دێ جارەکا دی پیکۆلێ کەین و سەرکەڤین!
              </p>

              {/* Stats & Penalties Table */}
              <div className="w-full space-y-1.5 mt-2 bg-mono-100 dark:bg-mono-900/60 p-4 rounded-2xl border border-red-500/10">
                <div className="flex justify-between items-center text-sm font-black  group/row">
                  <span className="text-mono-600 dark:text-white/80 transition-colors group-hover/row:text-mono-900 dark:group-hover/row:text-white">سزایێ دۆڕاندنێ</span>
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="flex flex-col items-end leading-none pt-0.5">
                      <AnimatedNumber value={breakdown?.base || 0} prefix="-" />
                      <span className="text-[7px] font-black uppercase tracking-widest opacity-60">فلس</span>
                    </div>
                    <FilsIcon size={12} className="opacity-80" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-black  group/row">
                  <span className="text-mono-600 dark:text-white/80 transition-colors group-hover/row:text-mono-900 dark:group-hover/row:text-white">سزایێ شاشیان</span>
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="flex flex-col items-end leading-none pt-0.5">
                      <AnimatedNumber value={breakdown?.mistakes || 0} prefix="-" />
                      <span className="text-[7px] font-black uppercase tracking-widest opacity-60">فلس</span>
                    </div>
                    <FilsIcon size={12} className="opacity-80" />
                  </div>
                </div>
                <div className="h-px bg-mono-200 dark:bg-white/5 my-2" />
                <div className="flex justify-between items-center text-lg font-black font-rabar">
                  <span className="text-mono-900 dark:text-white">سەرجەم</span>
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="flex flex-col items-end leading-none pt-1">
                      <AnimatedNumber value={breakdown?.total || 0} prefix="-" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">فلس</span>
                    </div>
                    <FilsIcon size={18} />
                  </div>
                </div>

                {breakdown?.total === 0 && (
                   <div className="mt-2 text-[9px] font-bold text-blue-400 opacity-60 italic">
                     🛡️ پاراستنا بانکڕۆتیێ کار دکەت
                   </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={() => { triggerHaptic(10); playStartSound?.(); onRetry(); }}
                className="w-full bg-linear-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 text-white py-5 rounded-3xl font-black  text-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">restart_alt</span>
                بەردەوام بە
              </button>

              <button 
                onClick={() => { triggerHaptic(10); playBackSfx(); onHome(); }}
                className="w-full bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/10 hover:bg-mono-200 dark:hover:bg-white/10 text-mono-500 dark:text-white/60 hover:text-mono-900 dark:hover:text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined">home</span>
                ڤەگەڕیان
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default DefeatOverlay;
