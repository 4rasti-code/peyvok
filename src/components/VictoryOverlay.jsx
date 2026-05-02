import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessSfx, playBackSfx } from '../utils/audio';

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
  customDescription
}) => {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isVisible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerHaptic(200);
      playSuccessSfx();
      
      const colors = ['#10b981', '#facc15', '#3b82f6', '#ffffff'];
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors
      });
    }

    if (isVisible) {
      const timer = setTimeout(() => {
        onHome();
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      // Reset trigger flag when overlay is hidden
      hasTriggeredRef.current = false;
    }
  }, [isVisible, onNext, onHome]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-1000 flex items-center justify-center bg-mono-white/90 dark:bg-mono-950/95 backdrop-blur-md p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-[340px] bg-mono-white dark:bg-mono-950 border border-mono-200 dark:border-white/10 rounded-[2rem] p-6 flex flex-col items-center gap-4 relative transition-colors duration-500 shadow-2xl"
          >

            {/* Status Icon Hub */}
            <div className="relative flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.5, rotate: 15 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-20 h-20 rounded-xl flex items-center justify-center relative z-10 bg-mono-100 dark:bg-white/5 text-mono-900 dark:text-white border border-mono-200 dark:border-white/10"
              >
                <span className="material-symbols-outlined text-[72px]">
                   workspace_premium
                </span>
              </motion.div>
            </div>

            {/* Message Area */}
            <div className="text-center space-y-4 w-full">
              <h2 className="text-3xl font-black font-heading text-mono-900 dark:text-white">
                 {customTitle || "تە سەرکەفتن ئینا!"}
              </h2>
              <p className="text-lg font-bold font-body text-mono-500 dark:text-white/60 leading-relaxed px-4">
                 {customDescription || ""}
              </p>

              {solvedWord && (
                <div className="bg-mono-100 dark:bg-[#141414] border border-mono-200 dark:border-white/5 px-5 py-3 rounded-2xl mt-1 inline-block">
                  <span className="text-mono-400 dark:text-white/40 text-[10px] font-bold uppercase tracking-normal block mb-0.5">پەیڤا ڕاست</span>
                  <span className="text-xl font-black text-mono-900 dark:text-white font-heading tracking-normal">{solvedWord}</span>
                </div>
              )}

            {/* Stats & Rewards Table */}
            <div className="w-full space-y-3 mt-1 bg-mono-100 dark:bg-[#141414] p-4 rounded-[1.5rem] border border-mono-200 dark:border-white/5">
              <div className="flex justify-between items-center text-lg font-black group/row">
                <span className="text-mono-600 dark:text-white/70 transition-colors group-hover/row:text-mono-900 dark:group-hover/row:text-white">خەلاتێ تە</span>
                <div className="flex items-center gap-3 text-mono-900 dark:text-white">
                  <div className="flex flex-col items-end leading-none pt-0.5">
                    <AnimatedNumber 
                      value={breakdown?.awardAmount || 50} 
                      prefix="+" 
                    />
                    <span className="text-[9px] font-black uppercase tracking-normal opacity-60">
                      {(breakdown?.awardType || 'fils') === 'derhem' ? 'دەرهەم' : (breakdown?.awardType || 'fils') === 'dinar' ? 'دینار' : 'فلس'}
                    </span>
                  </div>
                  {(breakdown?.awardType || 'fils') === 'derhem' ? (
                    <DerhemIcon size={24} className="opacity-90" />
                  ) : (breakdown?.awardType || 'fils') === 'dinar' ? (
                    <DinarIcon size={24} className="opacity-90" />
                  ) : (
                    <FilsIcon size={24} className="opacity-90" />
                  )}
                </div>
              </div>

              <div className="h-px bg-mono-200 dark:bg-white/5 my-1" />

              <div className="flex justify-between items-center text-base font-black group/row mt-1">
                <span className="text-mono-600 dark:text-white/70 transition-colors group-hover/row:text-mono-900 dark:group-hover/row:text-white">خەلاتێ ئێکس پی</span>
                <div className="flex items-center gap-2 text-mono-900 dark:text-white">
                  <div className="flex flex-col items-end leading-none">
                    <AnimatedNumber value={breakdown?.xpAdded || xp || 25} prefix="+" />
                    <span className="text-[9px] font-black tracking-tighter opacity-60">XP</span>
                  </div>
                </div>
              </div>

              {/* Minimalist Stats Summary (Horizontal & Reordered) */}
              <div className="flex items-center justify-center gap-4 pt-3 mt-1 border-t border-mono-200 dark:border-white/5 opacity-50">
                {/* Yellow (Wrong Position) */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-[9px] font-bold text-mono-500 dark:text-white/60">ڕاست/جهێ شاش</span>
                  <span className="text-[10px] font-black text-mono-900 dark:text-white">{breakdown?.yellowCount || 0}</span>
                </div>
                
                {/* Green (Correct) */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-mono-500 dark:text-white/60">پیت ڕاست</span>
                  <span className="text-[10px] font-black text-mono-900 dark:text-white">{breakdown?.greenCount || 0}</span>
                </div>

                {/* Gray (Wrong) */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-[9px] font-bold text-mono-500 dark:text-white/60">پیت شاش</span>
                  <span className="text-[10px] font-black text-mono-900 dark:text-white">{breakdown?.grayCount || 0}</span>
                </div>
              </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={() => { triggerHaptic(10); playStartSound?.(); onNext(); }}
                className="w-full h-12 bg-primary text-white rounded-xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-xl">arrow_left</span>
                بەردەوام بە
              </button>

              <button 
                onClick={() => { triggerHaptic(10); playBackSfx(); onHome(); }}
                className="w-full h-11 bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/5 text-mono-400 dark:text-white/50 py-3 rounded-xl font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">home</span>
                ڤەگەڕیان
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VictoryOverlay;
