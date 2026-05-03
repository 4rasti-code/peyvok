import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { useAudio } from '../context/AudioContext';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits, getLocalDateString } from '../utils/formatters';
import { playBackSfx } from '../utils/audio';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';

const REWARDS_CONFIG = [
  { day: 1, label: '٢٠٠ فلس', type: 'fils', reward: { fils: 200 }, color: '#CD7F32' },
  { day: 2, label: '١ ھاریکاری', icon: 'lightbulb', reward: { hintCount: 1 }, color: '#f97316' },
  { day: 3, label: '٥ دەرھەم', type: 'derhem', reward: { derhem: 5 }, color: '#A0A0A0' },
  { day: 4, label: '١ موگناتیس', icon: 'auto_fix_high', reward: { magnetCount: 1 }, color: '#f43f5e' },
  { day: 5, label: '١٥ دەرھەم', type: 'derhem', reward: { derhem: 15 }, color: '#A0A0A0' },
  { day: 6, label: '١ دەربازبوون', icon: 'fast_forward', reward: { skipCount: 1 }, color: '#0ea5e9' },
  { day: 7, label: '٢٠٠٠ فلس + ١ دینار', type: 'fils', reward: { fils: 2000, dinar: 1 }, color: '#FFD700', isGrand: true }
];

// COLOR MAP FOR DAYS
const DAY_COLORS = {
  1: "border-cyan-500/50 text-cyan-500 dark:text-cyan-400 bg-cyan-500/15",
  2: "border-blue-500/50 text-blue-500 dark:text-blue-400 bg-blue-500/15",
  3: "border-amber-500/50 text-amber-500 dark:text-amber-400 bg-amber-500/15",
  4: "border-rose-500/50 text-rose-500 dark:text-rose-400 bg-rose-500/15",
  5: "border-emerald-500/50 text-emerald-500 dark:text-emerald-400 bg-emerald-500/15",
  6: "border-violet-500/50 text-violet-500 dark:text-violet-400 bg-violet-500/15",
  7: "border-orange-500/60 text-orange-500 dark:text-orange-400 bg-orange-500/20",
};

const DAY_STYLES = {
  available: "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-2xl z-10 cursor-pointer",
  claimed: "bg-mono-100 dark:bg-white/5 border-mono-200 dark:border-white/10 text-mono-500 dark:text-white/40 opacity-90",
};

export default function DailyRewardModal({ isOpen, onClose, isDark }) {
  const {
    rewardStreak,
    lastRewardClaimedAt,
    claimDailyReward,
    hapticEnabled
  } = useGame();

  const { playDailyOpenSfx, playDailyClaimSfx } = useAudio();
  const [claiming, setClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimedDayInfo, setClaimedDayInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      playDailyOpenSfx();
      if (hapticEnabled) triggerHaptic(10);
    }
  }, [isOpen, playDailyOpenSfx, hapticEnabled]);

  // --- LOGIC HELPERS ---
  const hasClaimedToday = () => {
    if (!lastRewardClaimedAt) return false;
    
    const now = new Date();
    const lastClaim = new Date(lastRewardClaimedAt);
    
    // Compare UTC dates (YYYY-MM-DD) to match server 00:00 UTC reset
    const lastClaimStr = lastClaim.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    
    return lastClaimStr === todayStr;
  };
  
  const claimedToday = hasClaimedToday();
  const effectiveStreak = (rewardStreak === 7 && !claimedToday) ? 0 : rewardStreak;
  const activeDay = claimedToday ? -1 : (effectiveStreak % 7) + 1;

  const handleClaim = async () => {
    if (claiming || claimedToday) return;
    console.log('[DailyRewardModal] handleClaim triggered');
    setClaiming(true);

    try {
      const result = await claimDailyReward();
      if (result && result.success) {
        setClaimedDayInfo(REWARDS_CONFIG.find(r => r.day === result.streak));
        setShowSuccess(true);
        if (hapticEnabled) triggerHaptic([30, 60, 30]);
        playDailyClaimSfx();
        
        if (result.streak === 7) {
          confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#FFD700', isDark ? '#ffffff' : '#000000', '#ffffff']
          });
        }
        
        setTimeout(() => {
          onClose();
          setShowSuccess(false);
        }, 3500);
      } else {
        const errorMsg = result?.error || "خەلات ناهێتە وەرگرتن، دبیت تو یێ ل هیڤیا دەمێ نوو بی.";
        alert(errorMsg);
      }
    } catch (err) {
      console.error('[DailyRewardModal] Claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen && !showSuccess) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 dark:bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-black border border-mono-200 dark:border-white/10 rounded-md shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />

              <div className="flex flex-col items-center mb-8 text-center relative z-10">
                <div className="w-16 h-16 rounded-md bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/10 flex items-center justify-center text-mono-900 dark:text-white mb-4 shadow-lg">
                  <span className="material-symbols-outlined text-4xl">redeem</span>
                </div>
                <h2 className="text-3xl font-black text-mono-900 dark:text-white tracking-normal">خەلاتێن ڕۆژانە</h2>
                <p className="text-mono-500 dark:text-white/50 text-sm font-medium mt-1">٧ ڕۆژ - خەلاتێن بەردەوام و نایاب</p>
              </div>

              <div className="grid grid-cols-3 gap-3 relative z-10">
                {REWARDS_CONFIG.map((item) => {
                  const isClaimed = item.day <= effectiveStreak;
                  const isNext = item.day === activeDay;
                  const isFuture = item.day > (claimedToday ? rewardStreak : activeDay);
                  const isDay7 = item.day === 7;
                  
                  return (
                    <motion.div
                      key={item.day}
                      onClick={isNext && !claiming ? handleClaim : undefined}
                      // STOP ALL ANIMATION IF CLAIMED
                      animate={isNext && !isClaimed ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={isNext && !isClaimed ? { scale: { duration: 2, repeat: Infinity } } : { duration: 0.2 }}
                      className={`
                        relative p-3 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all
                        ${isDay7 ? 'col-span-3 h-28 flex-row justify-between px-8 overflow-hidden' : 'aspect-square'}
                        
                        ${isClaimed ? DAY_STYLES.claimed : (isNext ? DAY_STYLES.available : `border-transparent ${DAY_COLORS[item.day]}`)}
                        ${isFuture && !isClaimed ? 'opacity-80' : ''}
                      `}
                    >
                      <div className={`flex flex-col ${isDay7 ? 'items-start' : 'items-center'}`}>
                        <span className={`font-black text-[10px] uppercase tracking-normal ${isNext && !isClaimed ? '' : 'opacity-80'}`}>
                          ڕۆژا {toKuDigits(item.day)}
                        </span>
                        {isDay7 && (
                          <span className={`font-black text-2xl italic mt-1`}>
                            {item.label}
                          </span>
                        )}
                      </div>

                      <div className={`relative flex items-center justify-center ${isDay7 ? 'w-24' : 'flex-1'}`}>
                        {/* ICON LOGIC */}
                        {isDay7 ? (
                          <DinarIcon size={isDay7 && isNext ? 85 : 70} />
                        ) : isNext && !isClaimed ? (
                          <span className="material-symbols-outlined !text-4xl">redeem</span>
                        ) : (!isFuture || isClaimed) ? (
                          <>
                            {item.type === 'fils' ? (
                              <FilsIcon size={36} />
                            ) : item.type === 'derhem' ? (
                              <DerhemIcon size={36} />
                            ) : (
                              <span className="material-symbols-outlined !text-4xl">
                                {item.icon || 'redeem'}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center opacity-40">
                            <span className="material-symbols-outlined !text-4xl">
                              lock
                            </span>
                          </div>
                        )}

                        {isClaimed && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg border border-mono-200 dark:border-white/10 scale-110">
                                <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                             </div>
                          </div>
                        )}
                      </div>

                      {!isDay7 && (
                        <div className="w-full text-center">
                          <span className="font-black uppercase tracking-normal text-[11px] leading-tight block truncate">
                            {isFuture ? '' : item.label}
                          </span>
                        </div>
                      )}

                      {isNext && (
                        <div className="absolute -top-1 -left-1">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 relative z-10">
                {/* Only show buttons if already claimed. If not claimed, user MUST click the box above. */}
                {claimedToday ? (
                  <>
                    
                    <button 
                      onClick={() => { playBackSfx(); onClose(); }}
                      className="w-full h-14 flex items-center justify-center rounded-md bg-black dark:bg-white text-white dark:text-black hover:brightness-110 font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                    >
                      داخستن
                    </button>
                  </>
                ) : (
                  <p className="text-center text-mono-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    کلیک ل سەر دیارییا ئەڤرۆ بکە بۆ وەرگرتنێ
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-110 flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-white dark:bg-black border border-mono-200 dark:border-white/10 rounded-md shadow-2xl p-10 flex flex-col items-center relative overflow-hidden"
            >
              <h3 className="text-4xl font-black text-mono-900 dark:text-white mb-2">پیرۆزە!</h3>
              <p className="text-mono-500 dark:text-white/50 text-lg font-medium mb-8">تە خەلاتێ ڕۆژا {toKuDigits(claimedDayInfo?.day || 1)} وەرگرت</p>
              
              <div className="mb-10">
                {claimedDayInfo?.isGrand ? (
                  <DinarIcon size={100} />
                ) : (
                  <span className="material-symbols-outlined !text-[80px] text-black dark:text-white">redeem</span>
                )}
                <div className="mt-4 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md font-black text-xl">
                  + {claimedDayInfo?.label}
                </div>
              </div>

              <button
                onClick={() => { setShowSuccess(false); onClose(); }}
                className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-md font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                بەردەوام بە
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
