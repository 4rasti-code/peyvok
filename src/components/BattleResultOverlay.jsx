import React, { useEffect, useState, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import Avatar from './Avatar';
import { triggerHaptic } from '../utils/haptics';
import { playSuccessSfx, playRewardSfx } from '../utils/audio';
import { toKuDigits } from '../utils/formatters';
import { shareGameResult } from '../utils/share';
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
  shareGrid = ""
}) => {
  const [shareStatus, setShareStatus] = useState(null); // null, 'success', 'copied'
  const hasTriggeredRef = useRef(false);
  const isVictory = result === 'victory';
  const isDefeat = result === 'defeat';

  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  const lastResultRef = useRef(null);
  useEffect(() => {
    if (result !== lastResultRef.current) {
      hasTriggeredRef.current = false;
      lastResultRef.current = result;
    }

    if (isVisible && result && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerHaptic(200);

      if (isVictory) {
        playSuccessSfx();
        playRewardSfx();
        const colors = [isDark ? '#ffffff' : '#171717', '#facc15', '#3b82f6', '#ffffff'];
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: colors
        });
      }
    }
  }, [isVisible, result, isDark, isVictory]);

  const myScore = isPlayer1 ? scores.p1 : scores.p2;
  const oppScore = isPlayer1 ? scores.p2 : scores.p1;

  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-2000 flex items-center justify-center bg-mono-white/90 dark:bg-mono-950/95 backdrop-blur-md p-6"
        >

          <Motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full max-w-md bg-mono-white dark:bg-mono-950 border-2 ${isVictory
              ? 'border-black/20 dark:border-white/20'
              : isDefeat
                ? 'border-red-500/20 dark:border-red-500/30'
                : 'border-blue-500/20 dark:border-blue-500/30'
              } rounded-md p-8 flex flex-col items-center gap-6 relative overflow-hidden transition-colors duration-500 shadow-2xl`}
          >
            {/* Status Icon */}


            {/* Title */}
            <div className="text-center">
              <h2 className={`text-4xl font-black font-heading ${isVictory
                ? 'text-black dark:text-white'
                : isDefeat
                  ? 'text-red-700 dark:text-red-500'
                  : 'text-blue-700 dark:text-blue-400'
                }`}>
                {isVictory ? 'سەرکەفتن!' : isDefeat ? 'خوسارەتی!' : 'یەکسانبوون!'}
              </h2>

            </div>

            {/* VS SECTION (Premium Look) */}
            <div className="w-full bg-mono-100 dark:bg-[#141414] rounded-md border border-mono-200 dark:border-white/10 p-4 flex items-center justify-between relative">
              <div className="absolute inset-0 bg-mono-200 dark:bg-white/5 h-px top-1/2 -translate-y-1/2 w-full" />

              {/* Player 1 (YOU) */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="p-0.5 rounded-full border border-sky-500/30">
                  <Avatar src={user?.avatar_url} size="lg" />
                </div>
                <span className="text-[9px] font-black text-mono-400 dark:text-white/40 uppercase truncate w-20 text-center">{user?.nickname || 'تۆ'}</span>
                <span className={`text-2xl font-black ${isVictory ? 'text-sky-400' : 'text-mono-900 dark:text-white'}`}>{toKuDigits(myScore)}</span>
              </div>

              <div className="flex flex-col items-center z-10">
                <span className="text-xs font-black text-white/20 italic mb-1">VS</span>
              </div>

              {/* Player 2 (FOE) */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="p-0.5 rounded-full border border-red-500/30">
                  <Avatar src={opponent?.avatar_url} size="lg" />
                </div>
                <span className="text-[9px] font-black text-mono-400 dark:text-white/40 uppercase truncate w-20 text-center">{opponent?.nickname || 'ھەڤڕک'}</span>
                <span className={`text-2xl font-black ${isDefeat ? 'text-red-500' : 'text-mono-900 dark:text-white'}`}>{toKuDigits(oppScore)}</span>
              </div>
            </div>

            {/* REWARDS SECTION */}
            <div className="w-full space-y-2 bg-mono-50 dark:bg-[#141414] p-4 rounded-md border border-mono-100 dark:border-white/5">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-mono-600 dark:text-white/60">خەلاتێ تە</span>
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
                <span className="text-mono-600 dark:text-white/60">خەلاتێ ئێکس پی</span>
                <div className={`flex items-center gap-2 ${isVictory ? 'text-yellow-500' : 'text-mono-400 dark:text-white/20'}`}>
                  <div className="flex flex-col items-end leading-none">
                    <AnimatedNumber value={breakdown?.xpAdded || xp || (isVictory ? 100 : 20)} prefix="+" />
                    <span className="text-[7px] font-bold opacity-60">XP</span>
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
                <span className="text-[7px] font-bold text-mono-400 dark:text-white/20 uppercase">ئەنجامێ گەڕان</span>
              </div>
            </div>

            {/* Unified Stats Section */}
            <ResultStats 
              profileData={user}
              playerStats={playerStats}
              gameMode="battle"
              currentGuessCount={-1}
            />


            {/* Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => { onNext(); }}
                className={`w-full h-12 bg-transparent text-mono-900 dark:text-mono-white font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3 group`}
              >
                ڤەگەڕە
                <span className="material-symbols-outlined group-hover:translate-x-[-4px] transition-transform">arrow_back</span>
              </button>

              <button
                onClick={async () => {
                  triggerHaptic(10);
                  const result = await shareGameResult({
                    title: isVictory ? `من سەرکەفتن ئینا ل سەر ${opponent?.nickname || 'ھەڤڕکەکێ'}! 🏆` : `یەکسانبووم دگەل ${opponent?.nickname || 'ھەڤڕکەکێ'}! 🤝`,
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

export default BattleResultOverlay;


