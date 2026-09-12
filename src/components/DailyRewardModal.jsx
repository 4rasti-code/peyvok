import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { fireConfetti as confetti } from '../utils/confettiHelper';
import { useGameStore } from '../store/gameStore';
import { useAudio } from '../context/AudioContext';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits } from '../utils/formatters';
import { playBackSfx } from '../utils/audio';
import { FilsIcon, DerhemIcon, DinarIcon, HintIcon, MagnetIcon, SkipIcon, SpinTicketIcon, PowerUpBadge } from './CurrencyIcon';
import ClipboardIcon from './ClipboardIcon';
import MysteryBoxIcon from './MysteryBoxIcon';
import CloseButton from './CloseButton';
import { MagicalDust } from './GiftPopup';

const REWARDS_CONFIG = [
 { day: 1, label: '١٠٠ فلس', type: 'fils', reward: { fils: 100 }, color: '#CD7F32' },
 { day: 2, label: '١ پیتبین', icon: 'lightbulb', reward: { hintCount: 1 }, color: '#f97316' },
 { day: 3, label: '١ بلیتێ سپینێ', type: 'spinTicket', reward: { spinTicketCount: 1 }, color: '#10b981' },
 { day: 4, label: '٣ دەرهەم', type: 'derhem', reward: { derhem: 3 }, color: '#A0A0A0' },
 { day: 5, label: '١ مۆگناتیس', icon: 'auto_fix_high', reward: { magnetCount: 1 }, color: '#f43f5e' },
 { day: 6, label: '١ سندۆقا نەدیار', type: 'mystery_box', reward: { mystery_boxes_count: 1 }, color: '#8b5cf6' },
 { day: 7, label: '٢٠٠ فلس + ١ سکیپ + ١ دینار', type: 'grand', reward: { skipCount: 1, dinar: 1, fils: 200 }, color: '#FFD700', isGrand: true }
];

// COLOR MAP FOR DAYS MATCHING SCREENSHOT
const DAY_THEMES = {
 1: { border: 'border-[#2563eb]', banner: 'bg-[#3b82f6]' }, // Blue (Complementary to Bronze/Fils)
 2: { border: 'border-[#7c3aed]', banner: 'bg-[#8b5cf6]' }, // Purple (Complementary to Yellow/Hint)
 3: { border: 'border-[#0284c7]', banner: 'bg-[#0ea5e9]' }, // Sky/Cyan (Complementary to Orange/Ticket)
 4: { border: 'border-[#e11d48]', banner: 'bg-[#f43f5e]' }, // Rose/Pink (Contrast for Silver/Derhem)
 5: { border: 'border-[#059669]', banner: 'bg-[#10b981]' }, // Emerald (Complementary to Red/Magnet)
 6: { border: 'border-[#ea580c]', banner: 'bg-[#f97316]' }, // Orange (Contrast for Wood/Mystery Box)
 7: { border: 'border-[#facc15] bg-[#fef08a]', banner: 'bg-[#f59e0b]' }, // Gold (Grand)
};

export default function DailyRewardModal({ isOpen, onClose, isDark }) {
 const rewardStreak = useGameStore(s => s.rewardStreak);
  const lastRewardClaimedAt = useGameStore(s => s.lastRewardClaimedAt);
  const claimDailyReward = useGameStore(s => s.claimDailyReward);
  const hapticEnabled = useGameStore(s => s.hapticEnabled);

 const { playDailyOpenSfx, playDailyClaimSfx } = useAudio();
 const [claiming, setClaiming] = useState(false);
 const [showSuccess, setShowSuccess] = useState(false);
 const [boxState, setBoxState] = useState('unopened'); // 'unopened', 'opening', 'opened'
 const [animatingReward, setAnimatingReward] = useState(false);
 const [claimedDayInfo, setClaimedDayInfo] = useState(null);
 const [serverReportedClaimed, setServerReportedClaimed] = useState(false);
 const [timeLeftStr, setTimeLeftStr] = useState('');

 useEffect(() => {
 if (isOpen) {
 playDailyOpenSfx();
 if (hapticEnabled) triggerHaptic(10);
 }
 }, [isOpen, playDailyOpenSfx, hapticEnabled]);

 // Reset state when closing
 const handleClose = () => {
 window.isAnimatingReward = false;
 onClose();
 };

 // --- LOGIC HELPERS ---
 const hasClaimedToday = () => {
 if (!lastRewardClaimedAt) return false;

 try {
 // Force calculation using Kurdistan Timezone (Asia/Baghdad)
 const formatter = new Intl.DateTimeFormat('en-CA', {
 timeZone: 'Asia/Baghdad',
 year: 'numeric',
 month: '2-digit',
 day: '2-digit'
 });

 const lastClaimStr = formatter.format(new Date(lastRewardClaimedAt));
 const todayStr = formatter.format(new Date());

 return lastClaimStr === todayStr;
 } catch (e) {
 console.warn("[DailyRewardModal] Date formatting error:", e);
 return false;
 }
 };

 const claimedToday = hasClaimedToday() || serverReportedClaimed;
 const effectiveStreak = (rewardStreak === 7 && !claimedToday) ? 0 : rewardStreak;
 const activeDay = claimedToday ? -1 : (effectiveStreak % 7) + 1;

 useEffect(() => {
 if (!claimedToday) return;

 const calculateTimeLeft = () => {
 const now = new Date();
 // Get current time in Baghdad timezone
 const baghdadTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Baghdad' });
 const baghdadDate = new Date(baghdadTimeStr);

 // Calculate midnight of the next day in Baghdad
 const tomorrowBaghdad = new Date(baghdadTimeStr);
 tomorrowBaghdad.setHours(24, 0, 0, 0);

 const diffMs = tomorrowBaghdad - baghdadDate;

 if (diffMs <= 0) {
 return toKuDigits('00:00:00');
 }

 const h = Math.floor(diffMs / (1000 * 60 * 60));
 const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
 const s = Math.floor((diffMs % (1000 * 60)) / 1000);

 const hStr = h.toString().padStart(2, '0');
 const mStr = m.toString().padStart(2, '0');
 const sStr = s.toString().padStart(2, '0');

 return toKuDigits(`${hStr}:${mStr}:${sStr}`);
 };

 setTimeLeftStr(calculateTimeLeft());
 const interval = setInterval(() => {
 setTimeLeftStr(calculateTimeLeft());
 }, 1000);

 return () => clearInterval(interval);
 }, [claimedToday]);

 const handleClaim = async () => {
 if (claiming || claimedToday) return;
 console.log('[DailyRewardModal] handleClaim triggered');
 setClaiming(true);

 // Signal TopAppBar to defer visual wallet updates until coins fly
 window.isAnimatingReward = true;

 try {
 const result = await claimDailyReward();
 if (result && result.success) {
 setClaimedDayInfo(REWARDS_CONFIG.find(r => r.day === result.streak));
 setBoxState('opened');
 setShowSuccess(true);

 setTimeout(() => {
 playDailyClaimSfx();
 if (hapticEnabled) triggerHaptic([60, 100, 60]);
 const colors = ['#FFD700', isDark ? '#ffffff' : '#000000', '#ffffff'];
 confetti({ particleCount: 60, spread: 90, origin: { x: 0.5, y: 0.5 }, colors, zIndex: 2000, startVelocity: 45 });
 }, 100);
 } else {
 const errorMsg = result?.error || "خەلات ناهێتە وەرگرتن، دبیت تو یێ ل هیڤیا دەمێ نوی بی.";
 if (errorMsg.toLowerCase().includes('already claimed') || errorMsg.includes('claimed today') || errorMsg.includes('بەری نوکە')) {
 setServerReportedClaimed(true);
 } else {
 alert(errorMsg);
 }
 window.isAnimatingReward = false; // Reset on failure
 }
 } catch (err) {
 console.error('[DailyRewardModal] Claim error:', err);
 window.isAnimatingReward = false; // Reset on error
 } finally {
 setClaiming(false);
 }
 };

 if (!isOpen && !showSuccess) return null;

 return ReactDOM.createPortal(
 <>
 <AnimatePresence>
 {isOpen && (
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: animatingReward ? 0 : 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3 }}
 className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-mono-100 dark:bg-[#0a0b10] pointer-events-auto font-noto-sans-arabic text-mono-900 dark:text-mono-50" dir="rtl"
 >
 {/* Screen-level Close Button */}
 <CloseButton onClick={() => { playBackSfx(); handleClose(); }} className="fixed top-[calc(env(safe-area-inset-top)+24px)] right-6 z-110" />

 <Motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-lg p-6 relative"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

 <div className="flex flex-col items-center mb-8 text-center relative z-10">
 <div className="mb-4 flex items-center justify-center">
 <ClipboardIcon className="w-20 h-20" />
 </div>
 <h2 className="text-3xl font-black text-mono-900 dark:text-white mb-2">خەلاتێن ڕۆژانە</h2>
 {claimedToday && (
 <div className="text-mono-500 dark:text-white/50 text-sm font-bold font-sans tracking-widest bg-mono-100 dark:bg-white/5 px-4 py-1 rounded-full border border-mono-200 dark:border-white/10 shadow-sm tabular-nums" dir="ltr">
 {timeLeftStr}
 </div>
 )}
 </div>

 <div className="grid grid-cols-3 gap-3 relative z-10">
 {REWARDS_CONFIG.map((item) => {
 const isClaimed = item.day <= effectiveStreak;
 const isNext = item.day === activeDay;
 const isDay7 = item.day === 7;

 // Compute ribbon text
 const getRibbonText = (r) => {
 return `x${toKuDigits(r.fils || r.hintCount || r.spinTicketCount || r.derhem || r.magnetCount || r.mystery_boxes_count || r.skipCount || r.dinar || 1)}`;
 };

 return (
 <Motion.div
 key={item.day}
 onClick={isNext && !claiming ? handleClaim : undefined}
 animate={isNext && !isClaimed ? { scale: [1, 1.025, 1] } : { scale: 1 }}
 transition={isNext && !isClaimed ? { scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' } } : { duration: 0.2 }}
 className={`
 relative flex flex-col transition-all
 ${isDay7 ? 'col-span-3 h-auto min-h-32 sm:min-h-36 rounded-[20px] border-[5px]' : 'aspect-square rounded-[20px] border-[5px]'}
 ${!isDay7 ? 'bg-[#fff9e6]' : ''}
 ${DAY_THEMES[item.day].border}
 ${isClaimed ? 'opacity-80 scale-[0.98]' : (isNext ? 'ring-2 ring-[#facc15] shadow-[0_0_15px_3px_rgba(250,204,21,0.9)] scale-[1.025] z-30 cursor-pointer' : 'hover:scale-[1.02]')}
 `}
 >
 {/* Active Day Magical Dust */}
 {isNext && !isClaimed && (
 <MagicalDust spread={isDay7 ? 200 : 120} count={isDay7 ? 35 : 20} zIndex={40} />
 )}

 {isDay7 && (
 <div className="absolute inset-0 pointer-events-none rounded-[15px] overflow-hidden z-0">
 <div className="absolute -inset-4 opacity-50" style={{
 backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.4) 15px, rgba(255,255,255,0.4) 30px)'
 }} />
 </div>
 )}

 {isDay7 ? (
 <div className="absolute top-0 left-0 right-0 bottom-8 sm:bottom-10 flex flex-row items-center justify-around px-2 sm:px-4">
 <div className="relative flex flex-col items-center justify-center pt-2">
 <PowerUpBadge type="skip" size={36} />
 <span className="font-black text-[13px] sm:text-[15px] mt-0.5 sm:mt-1 text-gray-800" dir="ltr">
 {getRibbonText({ skipCount: 1 })}
 </span>
 </div>
 <div className="relative flex flex-col items-center justify-center pt-2">
 <DinarIcon className="w-10 h-10 sm:w-14 sm:h-14" />
 <span className="font-black text-[13px] sm:text-[15px] mt-0.5 sm:mt-1 text-gray-800" dir="ltr">
 {getRibbonText({ dinar: 1 })}
 </span>
 </div>
 <div className="relative flex flex-col items-center justify-center pt-2">
 <FilsIcon className="w-10 h-10 sm:w-11 sm:h-11" />
 <span className="font-black text-[13px] sm:text-[15px] mt-0.5 sm:mt-1 text-gray-800" dir="ltr">
 {getRibbonText({ fils: 200 })}
 </span>
 </div>
 </div>
 ) : (
 <div className="absolute top-0 left-0 right-0 bottom-7 sm:bottom-10 flex flex-col items-center justify-center">
 <div className="relative flex flex-col items-center justify-center">
 <div className="flex items-center justify-center">
 {item.type === 'fils' ? <FilsIcon className="w-9 h-9 sm:w-10 sm:h-10" /> :
 item.type === 'derhem' ? <DerhemIcon className="w-9 h-9 sm:w-10 sm:h-10" /> :
 item.type === 'spinTicket' ? <SpinTicketIcon className="w-14 h-14 sm:w-16 sm:h-16" /> :
 item.type === 'mystery_box' ? <MysteryBoxIcon className="w-14 h-14 sm:w-14 sm:h-14" /> :
 item.icon === 'lightbulb' ? <PowerUpBadge type="hint" size={38} /> :
 item.icon === 'auto_fix_high' ? <PowerUpBadge type="magnet" size={38} /> : null}
 </div>

 <span className={`font-black text-[13px] sm:text-[15px] ${item.type === 'spinTicket' ? '-mt-3 sm:-mt-5 relative z-10' :
 item.type === 'derhem' || item.type === 'fils' ? '-mt-0.5 sm:-mt-1 relative z-10' :
 item.type === 'mystery_box' ? '-mt-1.5 sm:-mt-2 relative z-10' :
 item.icon === 'auto_fix_high' || item.icon === 'lightbulb' ? 'mt-1 relative z-10' :
 '-mt-1 sm:-mt-1.5 relative z-10'
 } text-gray-800`} dir="ltr">
 {getRibbonText(item.reward)}
 </span>
 </div>
 </div>
 )}

 {/* Lower Day Label Section */}
 <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-center text-white font-black z-10 rounded-b-[14px]
 ${isDay7 ? 'h-8 sm:h-10 text-[14px] sm:text-[16px]' : 'h-7 sm:h-10 text-[12px] sm:text-[14px]'}
 ${DAY_THEMES[item.day].banner}
 `}>
 ڕۆژا {toKuDigits(item.day)}
 </div>

 {/* Checkmark overlay */}
 {isClaimed && (
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/10 rounded-[15px]">
 <div className="absolute top-2 right-2 w-8 h-8 bg-[#22c55e] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
 <span className="material-symbols-outlined text-[20px] font-black">check</span>
 </div>
 </div>
 )}
 </Motion.div>
 );
 })}
 </div>

 <div className="mt-8 flex flex-col gap-3 relative z-10">
 {!claimedToday && (
 <p className="text-center text-mono-400 dark:text-white/30 text-[10px] font-bold uppercase animate-pulse">
 کلیک ل سەر دیارییا ئەڤرۆ بکە بۆ وەرگرتنێ
 </p>
 )}
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {showSuccess && (
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-110 flex items-center justify-center p-6"
 >
 <Motion.div
 animate={{ opacity: animatingReward ? 0 : 1 }}
 transition={{ duration: 0.3 }}
 className="absolute inset-0 pointer-events-none"
 style={{
 backgroundColor: '#06213b',
 backgroundImage: `
 radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.6) 110%),
 radial-gradient(circle at center, rgba(34, 211, 238, 0.45) 0%, transparent 65%),
 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%2306213b'/%3E%3Cg transform='translate(0, 1.5)' fill='%23041526'%3E%3Crect x='-27.75' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 0 0)'/%3E%3Crect x='52.25' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 80 0)'/%3E%3Crect x='-27.75' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 0 80)'/%3E%3Crect x='52.25' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 80 80)'/%3E%3Crect x='12.25' y='12.25' width='55.5' height='55.5' rx='4' transform='rotate(45 40 40)'/%3E%3C/g%3E%3Cg fill='%230A3F75'%3E%3Crect x='-27.75' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 0 0)'/%3E%3Crect x='52.25' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 80 0)'/%3E%3Crect x='-27.75' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 0 80)'/%3E%3Crect x='52.25' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 80 80)'/%3E%3C/g%3E%3Crect x='12.25' y='12.25' width='55.5' height='55.5' rx='4' transform='rotate(45 40 40)' fill='%23105485'/%3E%3Cg fill='%2306213b'%3E%3Ccircle cx='40' cy='0' r='2'/%3E%3Ccircle cx='0' cy='40' r='2'/%3E%3Ccircle cx='80' cy='40' r='2'/%3E%3Ccircle cx='40' cy='80' r='2'/%3E%3C/g%3E%3C/svg%3E")
 `,
 backgroundSize: '100% 100%, 100% 100%, 65px 65px',
 backgroundPosition: 'center center, center center, 0 0',
 }}
 />
 <Motion.div
 initial={{ scale: 0.9, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className="text-center p-6 flex flex-col items-center relative min-w-[320px] justify-center w-full max-w-md pointer-events-auto"
 >
 {boxState === 'opened' && (
 <Motion.div
 initial={{ scale: 0.5, opacity: 0 }}
 animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
 transition={{ type: "spring", stiffness: 300, damping: 15 }}
 className="flex flex-col items-center w-full"
 >
 <Motion.div
 animate={{ opacity: animatingReward ? 0 : 1, scale: animatingReward ? 0.95 : 1 }}
 transition={{ duration: 0.3 }}
 className="flex flex-col items-center w-full"
 >
 <h3 className="text-5xl font-black mb-3 bg-linear-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-md">پیرۆزە!</h3>
 <p className="text-white text-xl font-medium mb-12 drop-shadow-md">تە خەلاتێ ڕۆژا {toKuDigits(claimedDayInfo?.day || 1)} وەرگرت</p>

 <div className="mb-10 relative flex flex-col justify-center items-center w-full">
 <Motion.div
 initial={{ rotate: -180, scale: 0 }}
 animate={{ rotate: 0, scale: 1 }}
 transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
 className="relative z-10 flex justify-center"
 >
 <Motion.div
 animate={{ y: [0, -10, 0] }}
 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
 >
 {claimedDayInfo?.isGrand ? (
 <div className="flex gap-2 sm:gap-4 items-center justify-center mx-auto overflow-visible">
 <PowerUpBadge type="skip" size={100} />
 <DinarIcon size={120} />
 <FilsIcon size={100} />
 </div>
 ) : claimedDayInfo?.type === 'fils' ? (
 <FilsIcon size={110} className="block mx-auto overflow-visible" />
 ) : claimedDayInfo?.type === 'derhem' ? (
 <DerhemIcon size={110} className="block mx-auto overflow-visible" />
 ) : claimedDayInfo?.type === 'spinTicket' ? (
 <SpinTicketIcon size={120} className="block mx-auto overflow-visible" />
 ) : claimedDayInfo?.type === 'mystery_box' ? (
 <MysteryBoxIcon size={110} className="block mx-auto overflow-visible" />
 ) : claimedDayInfo?.icon === 'lightbulb' ? (
 <PowerUpBadge type="hint" size={120} animate={true} className="block mx-auto" />
 ) : claimedDayInfo?.icon === 'auto_fix_high' ? (
 <PowerUpBadge type="magnet" size={120} animate={true} className="block mx-auto" />
 ) : (
 <span className="block mx-auto text-center material-symbols-outlined text-[90px]! text-black dark:text-white">
 {claimedDayInfo?.icon || 'redeem'}
 </span>
 )}
 </Motion.div>
 </Motion.div>

 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)' }} />

 <Motion.div
 initial={{ scale: 0, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
 className="mt-6 text-white drop-shadow-md font-black text-3xl relative z-10"
 >
 {claimedDayInfo?.label}
 </Motion.div>

 </div>

 <Motion.button
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.6 }}
 onClick={() => {
 if (animatingReward) return;
 setAnimatingReward(true);
 
 if (claimedDayInfo?.isGrand) {
 window.dispatchEvent(new CustomEvent('fire-coins', { detail: { type: 'skip', amount: claimedDayInfo?.reward?.skipCount || 1, startOffsetX: 100 } }));
 window.dispatchEvent(new CustomEvent('fire-coins', { detail: { type: 'dinar', amount: claimedDayInfo?.reward?.dinar || 1, startOffsetX: 0 } }));
 window.dispatchEvent(new CustomEvent('fire-coins', { detail: { type: 'fils', amount: claimedDayInfo?.reward?.fils || 200, startOffsetX: -100 } }));
 } else {
 const type = claimedDayInfo?.type || (claimedDayInfo?.icon === 'lightbulb' ? 'hint' : claimedDayInfo?.icon === 'auto_fix_high' ? 'magnet' : claimedDayInfo?.icon === 'fast_forward' ? 'skip' : 'fils');
 const amount = claimedDayInfo?.reward?.fils || claimedDayInfo?.reward?.derhem || claimedDayInfo?.reward?.dinar || claimedDayInfo?.reward?.hintCount || claimedDayInfo?.reward?.magnetCount || claimedDayInfo?.reward?.skipCount || 1;
 window.dispatchEvent(new CustomEvent('fire-coins', { detail: { type, amount } }));
 }

 setTimeout(() => {
 setShowSuccess(false);
 setAnimatingReward(false);
 window.isAnimatingReward = false; // Reset after animation completes
 onClose();
 }, 2200);
 }}
 className={`w-40 h-11 flex items-center justify-center mx-auto bg-primary text-white rounded-md font-black text-lg shadow-md transition-all hover:brightness-110 ${animatingReward ? 'opacity-50 cursor-not-allowed scale-95' : 'active:scale-95'}`}
 >
 وەرگرتن
 </Motion.button>
 </Motion.div>
 </Motion.div>
 )}
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>
 </>,
 document.body
 );
}


