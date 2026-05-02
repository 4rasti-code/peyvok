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
  { day: 4, label: '١ موگناتیس', icon: 'auto_fix_high', reward: { magnetCount: 1 }, color: '# rose-400' },
  { day: 5, label: '١٥ دەرھەم', type: 'derhem', reward: { derhem: 15 }, color: '#A0A0A0' },
  { day: 6, label: '١ دەربازبوون', icon: 'fast_forward', reward: { skipCount: 1 }, color: '#0ea5e9' },
  { day: 7, label: '٢٠٠٠ فلس + ١ دینار', type: 'fils', reward: { fils: 2000, dinar: 1 }, color: '#FFD700', isGrand: true }
];

// STATIC COLOR MAP TO FIX TAILWIND DYNAMIC CLASS ISSUE
const DAY_COLORS = {
  1: "border-cyan-500/60 text-cyan-400 shadow-cyan-500/10",
  2: "border-blue-500/60 text-blue-400 shadow-blue-500/10",
  3: "border-amber-500/60 text-amber-400 shadow-amber-500/10",
  4: "border-rose-500/60 text-rose-400 shadow-rose-500/10",
  5: "border-emerald-500/60 text-emerald-400 shadow-emerald-500/10",
  6: "border-violet-500/60 text-violet-400 shadow-violet-500/10",
  7: "border-orange-500/60 text-orange-400 shadow-orange-500/20",
};

export default function DailyRewardModal({ isOpen, onClose }) {
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
            colors: ['#FFD700', '#10b981', '#ffffff']
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
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-linear-to-br from-[#0a1425] via-[#0e1b35] to-[#0a1425] border border-white/10 rounded-md shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />

              <div className="flex flex-col items-center mb-8 text-center relative z-10">
                <div className="w-16 h-16 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 shadow-lg">
                  <span className="material-symbols-outlined text-4xl">redeem</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-normal">خەلاتێن ڕۆژانە</h2>
                <p className="text-white/50 text-sm font-medium mt-1">٧ ڕۆژ - خەلاتێن بەردەوام و نایاب</p>
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
                        relative p-3 rounded-md border-2 flex flex-col items-center justify-center gap-1.5 transition-all
                        ${isDay7 ? 'col-span-3 h-28 flex-row justify-between px-8 overflow-hidden' : 'aspect-square'}
                        
                        /* AVAILABLE STATE (Only if NOT claimed) */
                        ${isNext && !isClaimed ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/40 z-10 cursor-pointer' : ''}
                        
                        /* CLAIMED STATE (Grey/Ash and Static - Overrides everything) */
                        ${isClaimed ? 'bg-slate-800/80 border-slate-700 text-slate-500 grayscale opacity-60 shadow-none' : ''}
                        
                        /* LOCKED/FUTURE STATE */
                        ${isFuture && !isClaimed ? `bg-slate-900/40 backdrop-blur-sm ${DAY_COLORS[item.day]} opacity-30 shadow-none` : ''}
                        
                        /* DEFAULT / OTHER */
                        ${!isNext && !isClaimed && !isFuture ? `bg-slate-900/40 backdrop-blur-sm ${DAY_COLORS[item.day]} shadow-none` : ''}
                      `}
                    >
                      <div className={`flex flex-col ${isDay7 ? 'items-start' : 'items-center'}`}>
                        <span className={`font-black text-[10px] uppercase tracking-normal ${isNext && !isClaimed ? 'text-white' : 'opacity-70'}`}>
                          ڕۆژا {toKuDigits(item.day)}
                        </span>
                        {isDay7 && (
                          <span className={`${isNext && !isClaimed ? 'text-white' : 'text-slate-400'} font-black text-2xl italic mt-1`}>
                            {isFuture ? '' : item.label}
                          </span>
                        )}
                      </div>

                      <div className={`relative flex items-center justify-center ${isDay7 ? 'w-24' : 'flex-1'}`}>
                        {/* ICON LOGIC */}
                        {isNext && !isClaimed ? (
                          <span className="material-symbols-outlined !text-4xl text-white">redeem</span>
                        ) : !isFuture || isClaimed ? (
                          <>
                            {isDay7 ? (
                              <DinarIcon size={70} />
                            ) : item.type === 'fils' ? (
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
                          <div className="flex flex-col items-center justify-center opacity-30">
                            <span className="material-symbols-outlined !text-4xl text-inherit">
                              {isDay7 ? 'card_giftcard' : 'redeem'}
                            </span>
                          </div>
                        )}

                        {isClaimed && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white/50 scale-110">
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
                    <div className="w-full h-14 rounded-md bg-slate-800/50 text-slate-500 border border-slate-700/50 flex items-center justify-center gap-3 font-black">
                      <span className="material-symbols-outlined">check_circle</span>
                      خەڵاتێ ئەڤرۆ هاتییە وەرگرتن
                    </div>
                    
                    <button 
                      onClick={() => { playBackSfx(); onClose(); }}
                      className="w-full h-12 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-all"
                    >
                      داخستن
                    </button>
                  </>
                ) : (
                  <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-widest animate-pulse">
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
            className="fixed inset-0 z-110 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-[#0a1425] border border-white/10 rounded-md shadow-2xl p-10 flex flex-col items-center relative overflow-hidden"
            >
              <h3 className="text-4xl font-black text-white mb-2">پیرۆزە!</h3>
              <p className="text-white/50 text-lg font-medium mb-8">تە خەلاتێ ڕۆژا {toKuDigits(claimedDayInfo?.day || 1)} وەرگرت</p>
              
              <div className="mb-10">
                {claimedDayInfo?.isGrand ? (
                  <DinarIcon size={100} />
                ) : (
                  <span className="material-symbols-outlined !text-[80px] text-emerald-500">redeem</span>
                )}
                <div className="mt-4 px-6 py-2 bg-emerald-500 rounded-md text-white font-black text-xl">
                  + {claimedDayInfo?.label}
                </div>
              </div>

              <button
                onClick={() => { setShowSuccess(false); onClose(); }}
                className="w-full h-14 bg-white text-[#0a1425] rounded-md font-black text-lg shadow-xl active:scale-95 transition-all"
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
