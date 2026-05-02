import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import Avatar from './Avatar';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessSfx } from '../utils/audio';
import { toKuDigits } from '../utils/formatters';

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
  onNext,
  playStartSound
}) => {
  const hasTriggeredRef = useRef(false);
  const isVictory = result === 'victory';
  const isDefeat = result === 'defeat';

  useEffect(() => {
    if (isVisible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerHaptic(200);

      if (isVictory) {
        playSuccessSfx();
        const colors = ['#10b981', '#facc15', '#3b82f6', '#ffffff'];
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: colors
        });
      }
    }

    if (!isVisible) {
      hasTriggeredRef.current = false;
    }
  }, [isVisible, isVictory]);

  const myScore = isPlayer1 ? scores.p1 : scores.p2;
  const oppScore = isPlayer1 ? scores.p2 : scores.p1;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-mono-white/90 dark:bg-mono-950/95 backdrop-blur-md p-6"
        >

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full max-w-md bg-mono-white dark:bg-mono-950 border-2 ${isVictory ? 'border-emerald-500/30' : isDefeat ? 'border-red-500/30' : 'border-blue-500/30'} rounded-[3.5rem] p-8 flex flex-col items-center gap-6 relative overflow-hidden transition-colors duration-500 shadow-2xl`}
          >
            {/* Status Icon */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 ${isVictory ? 'bg-emerald-500/20 text-emerald-400' : isDefeat ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}
              >
                <span className="material-symbols-outlined text-[56px]">
                  {isVictory ? 'workspace_premium' : isDefeat ? 'sentiment_very_dissatisfied' : 'balance'}
                </span>
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className={`text-4xl font-black font-heading ${isVictory ? 'text-emerald-400' : isDefeat ? 'text-red-500' : 'text-blue-400'}`}>
                {isVictory ? 'سەرکەفتن!' : isDefeat ? 'خوسارەتی!' : 'یەکسانبوون!'}
              </h2>
              <p className="text-mono-400 dark:text-white/40 font-bold mt-1">ئەنجامێ یاریێ</p>
            </div>

            {/* VS SECTION (Premium Look) */}
            <div className="w-full bg-mono-100 dark:bg-[#141414] rounded-2xl border border-mono-200 dark:border-white/10 p-6 flex items-center justify-between relative">
              <div className="absolute inset-0 bg-mono-200 dark:bg-white/5 h-[1px] top-1/2 -translate-y-1/2 w-full" />

              {/* Player 1 (YOU) */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="p-1 rounded-full border border-sky-500/30">
                  <Avatar src={user?.avatar_url} size="xl" />
                </div>
                <span className="text-[10px] font-black text-mono-400 dark:text-white/40 uppercase truncate w-24 text-center">{user?.nickname || 'تۆ'}</span>
                <span className={`text-4xl font-black ${isVictory ? 'text-sky-400' : 'text-mono-900 dark:text-white'}`}>{toKuDigits(myScore)}</span>
              </div>

              <div className="flex flex-col items-center z-10">
                <span className="text-xs font-black text-white/20 italic mb-1">VS</span>
              </div>

              {/* Player 2 (FOE) */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="p-1 rounded-full border border-red-500/30">
                  <Avatar src={opponent?.avatar_url} size="xl" />
                </div>
                <span className="text-[10px] font-black text-mono-400 dark:text-white/40 uppercase truncate w-24 text-center">{opponent?.nickname || 'ھەڤڕک'}</span>
                <span className={`text-4xl font-black ${isDefeat ? 'text-red-500' : 'text-mono-900 dark:text-white'}`}>{toKuDigits(oppScore)}</span>
              </div>
            </div>

            {/* REWARDS SECTION */}
            <div className="w-full space-y-3 bg-mono-50 dark:bg-[#141414] p-5 rounded-2xl border border-mono-100 dark:border-white/5">
              <div className="flex justify-between items-center text-md font-black">
                <span className="text-mono-600 dark:text-white/60">خەلاتێ تە</span>
                <div className={`flex items-center gap-2 ${isVictory ? 'text-emerald-400' : 'text-white/20'}`}>
                  <div className="flex flex-col items-end leading-none">
                    <AnimatedNumber value={breakdown?.awardAmount || 0} prefix={isVictory ? "+" : ""} />
                    <span className="text-[8px] font-black uppercase opacity-60">
                      {breakdown?.awardType === 'fils' ? 'فلس' : breakdown?.awardType === 'derhem' ? 'دەرهەم' : 'دینار'}
                    </span>
                  </div>
                  {breakdown?.awardType === 'fils' && <FilsIcon size={28} />}
                  {breakdown?.awardType === 'derhem' && <DerhemIcon size={28} />}
                  {breakdown?.awardType === 'dinar' && <DinarIcon size={28} />}
                </div>
              </div>

              <div className="h-px bg-mono-200 dark:bg-white/5" />

              <div className="flex justify-between items-center text-md font-black">
                <span className="text-mono-600 dark:text-white/60">خەلاتێ ئێکس پی</span>
                <div className={`flex items-center gap-2 ${isVictory ? 'text-yellow-500' : 'text-mono-400 dark:text-white/20'}`}>
                  <div className="flex flex-col items-end leading-none">
                    <AnimatedNumber value={breakdown?.xpAdded || xp || (isVictory ? 100 : 20)} prefix="+" />
                    <span className="text-[8px] font-black opacity-60">XP</span>
                  </div>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="pt-4 mt-2 border-t border-white/5 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  {[...Array(5)].map((_, i) => {
                    let colorClass = "bg-white/10";
                    if (i < myScore) colorClass = "bg-sky-500";
                    else if (i < myScore + oppScore) colorClass = "bg-red-500";

                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`w-2.5 h-2.5 rounded-full ${colorClass}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[8px] font-black text-mono-400 dark:text-white/20 uppercase tracking-[0.2em]">ئەنجامێ گەڕان</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="w-full">
              <button
                onClick={() => { triggerHaptic(10); playStartSound?.(); onNext(); }}
                className={`w-full ${isVictory ? 'bg-emerald-600' : 'bg-sky-600'} hover:brightness-110 text-white py-5 rounded-3xl font-black text-xl active:scale-95 transition-all flex items-center justify-center gap-3 group`}
              >
                ڤەگەڕە
                <span className="material-symbols-outlined group-hover:translate-x-[-4px] transition-transform">arrow_back</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BattleResultOverlay;
