import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { fireConfetti as confetti } from '../utils/confettiHelper';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/AuthContext';
import { useGameStore } from '../store/gameStore';
import { triggerHaptic } from '../utils/haptics';
import { playBackSfx, playChestOpenSfx, playRewardPopSfx, playChestCreakSfx } from '../utils/audio';
import { toKuDigits } from '../utils/formatters';
import MysteryBoxIcon from './MysteryBoxIcon';
import { FilsIcon, HintIcon, SkipIcon, MagnetIcon, DerhemIcon, DinarIcon, SpinTicketIcon, PowerUpBadge } from './CurrencyIcon';
import CloseButton from './CloseButton';
import { MagicalDust } from './GiftPopup';

const MYSTERY_REWARDS = [
 { id: 0, type: 'dinar', amount: 1, label: '١ دینار', weight: 2 },
 { id: 1, type: 'derhem', amount: 5, label: '٥ دەرهەم', weight: 10 },
 { id: 2, type: 'spinTicket', amount: 1, label: '١ بلێتا چەرخی', weight: 8 },
 { id: 3, type: 'skip', amount: 1, label: '١ دەربازبوون', weight: 10 },
 { id: 4, type: 'hint', amount: 1, label: '١ ھاریکاری', weight: 15 },
 { id: 5, type: 'magnet', amount: 2, label: '٢ پیتژێبرک', weight: 15 },
 { id: 6, type: 'fils', amount: 500, label: '٥٠٠ فلس', weight: 40 },
];

export default function MysteryBoxModal({ isOpen, onClose }) {
 const { user, syncProfile } = useUser();
 const updateInventory = useGameStore(s => s.updateInventory);

 const [boxCount, setBoxCount] = useState(0);
 const [canOpenFree, setCanOpenFree] = useState(false);
 const [timeLeftStr, setTimeLeftStr] = useState('');
 const timerRef = useRef(null);
 const [isOpening, setIsOpening] = useState(false);
 const [isLidOpen, setIsLidOpen] = useState(false);
 const [showReward, setShowReward] = useState(false);
 const [wonReward, setWonReward] = useState(null);
 const [loadingCheck, setLoadingCheck] = useState(true);
 const [isClaiming, setIsClaiming] = useState(false);

 useEffect(() => {
 if (!isOpen || !user) return;

 const fetchStatus = async () => {
 setLoadingCheck(true);
 try {
 const { data, error } = await supabase
 .from('profiles')
 .select('mystery_boxes_count, last_mystery_box_date')
 .eq('id', user.id)
 .single();

 if (error) throw error;
 setBoxCount(data?.mystery_boxes_count || 0);

 if (!data.last_mystery_box_date) {
 setCanOpenFree(true);
 } else {
 const lastOpen = new Date(data.last_mystery_box_date);
 const now = new Date();
 const diffMs = now - lastOpen;
 const hours24 = 24 * 60 * 60 * 1000;

 if (diffMs >= hours24) {
 setCanOpenFree(true);
 } else {
 setCanOpenFree(false);
 startCountdown(hours24 - diffMs);
 }
 }
 } catch (err) {
 console.error("Failed to fetch status:", err);
 } finally {
 setLoadingCheck(false);
 }
 };

 fetchStatus();

 return () => {
 if (timerRef.current) clearInterval(timerRef.current);
 };
 }, [isOpen, user]);

 const startCountdown = (initialDiffMs) => {
 const updateTimer = (diff) => {
 if (diff <= 0) {
 setCanOpenFree(true);
 setTimeLeftStr('');
 return;
 }
 const h = Math.floor(diff / (1000 * 60 * 60));
 const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
 const s = Math.floor((diff % (1000 * 60)) / 1000);

 const hStr = h.toString().padStart(2, '0');
 const mStr = m.toString().padStart(2, '0');
 const sStr = s.toString().padStart(2, '0');

 setTimeLeftStr(toKuDigits(`${hStr}:${mStr}:${sStr}`));
 };

 let currentDiff = initialDiffMs;
 updateTimer(currentDiff);

 if (timerRef.current) clearInterval(timerRef.current);

 timerRef.current = setInterval(() => {
 currentDiff -= 1000;
 updateTimer(currentDiff);
 if (currentDiff <= 0) {
 clearInterval(timerRef.current);
 timerRef.current = null;
 }
 }, 1000);
 };

 // Reset state when closing
 const handleClose = () => {
 setShowReward(false);
 setIsLidOpen(false);
 setIsClaiming(false);
 setTimeout(() => {
 setWonReward(null);
 setIsOpening(false);
 }, 300); // Wait for exit animation
 onClose();
 };

 const isBoxAvailable = boxCount > 0;
 const canActuallyOpen = canOpenFree || isBoxAvailable;

 const handleOpen = async () => {
 if (!canActuallyOpen || isOpening || loadingCheck || isLidOpen) return;

 const usingBoxTicket = !canOpenFree && isBoxAvailable;

 playChestCreakSfx();
 triggerHaptic(15);
 setIsOpening(true);

 // Weighted random selection
 const totalWeight = MYSTERY_REWARDS.reduce((sum, r) => sum + r.weight, 0);
 let randomNum = Math.random() * totalWeight;
 let reward = MYSTERY_REWARDS[0];

 for (const r of MYSTERY_REWARDS) {
 if (randomNum < r.weight) {
 reward = r;
 break;
 }
 randomNum -= r.weight;
 }

 setWonReward(reward);

 // Simulate shake and opening delay
 setTimeout(async () => {
 playChestOpenSfx();
 triggerHaptic(50);
 setIsLidOpen(true);

 confetti({
 particleCount: 60,
 spread: 100,
 origin: { y: 0.6 },
 colors: ['#A855F7', '#EC4899', '#3B82F6'] // Purple, Pink, Blue theme
 });

 setTimeout(() => {
 playRewardPopSfx();
 setShowReward(true);
 }, 500);
 setIsOpening(false);
 if (usingBoxTicket) {
 setBoxCount(prev => Math.max(0, prev - 1));
 } else {
 setCanOpenFree(false);
 startCountdown(24 * 60 * 60 * 1000);
 }

 // Update Database
 try {
 if (usingBoxTicket) {
 await supabase
 .from('profiles')
 .update({ mystery_boxes_count: boxCount - 1 })
 .eq('id', user.id);
 } else {
 await supabase
 .from('profiles')
 .update({ last_mystery_box_date: new Date().toISOString() })
 .eq('id', user.id);
 }
 syncProfile(user.id, null, true);
 } catch (err) {
 console.error("Failed to update status:", err);
 }

 }, 1500); // 1.5s shake animation
 };

 const handleClaim = () => {
 if (!wonReward) return;

 setShowReward(false);
 setIsClaiming(true);
 
 window.dispatchEvent(new CustomEvent('fire-coins', { 
 detail: { type: wonReward.type, amount: wonReward.amount } 
 }));
 
 triggerHaptic(50);

 // Signal TopAppBar to defer visual wallet updates until coins fly
 window.isAnimatingReward = true;

 // Update inventory instantly in the background
 if (wonReward.type === 'fils') updateInventory({ fils: wonReward.amount }, true, true);
 if (wonReward.type === 'derhem') updateInventory({ derhem: wonReward.amount }, true, true);
 if (wonReward.type === 'dinar') updateInventory({ dinar: wonReward.amount }, true, true);
 if (wonReward.type === 'hint') updateInventory({ hintCount: wonReward.amount }, true, true);
 if (wonReward.type === 'skip') updateInventory({ skipCount: wonReward.amount }, true, true);
 if (wonReward.type === 'magnet') updateInventory({ magnetCount: wonReward.amount }, true, true);
 if (wonReward.type === 'spinTicket') updateInventory({ spinTicketCount: wonReward.amount }, true, true);

 setIsLidOpen(false);

 setTimeout(() => {
 setIsClaiming(false);
 window.isAnimatingReward = false; // Reset after animation
 if (boxCount === 0) handleClose();
 }, 3000);
 };

  // Clash Royale Background Optimization
  useEffect(() => {
    const el = document.getElementById('main-app-content');
    if (isOpen) {
      if (el) el.style.display = 'none';
    } else {
      if (el) el.style.display = 'flex';
    }
    return () => {
      if (el) el.style.display = 'flex';
    };
  }, [isOpen]);


 if (!isOpen) return null;

 return ReactDOM.createPortal(
 <AnimatePresence>
 {isOpen && (
 <React.Fragment key="mystery-box-modal">
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: isClaiming ? 0 : 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3 }}
 className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden transition-colors duration-700 font-noto-sans-arabic text-mono-900 dark:text-mono-50 ${!showReward ? 'bg-[#0a0b10] ' : ''}`} dir="rtl"
 style={{ 
 pointerEvents: isClaiming ? 'none' : 'auto',
 ...(showReward ? {
 backgroundColor: '#3b0764',
 backgroundImage: `
 radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.6) 110%),
 radial-gradient(circle at center, rgba(168, 85, 247, 0.45) 0%, transparent 65%),
 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%233b0764'/%3E%3Cg transform='translate(0, 1.5)' fill='%231f0436'%3E%3Crect x='-27.75' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 0 0)'/%3E%3Crect x='52.25' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 80 0)'/%3E%3Crect x='-27.75' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 0 80)'/%3E%3Crect x='52.25' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 80 80)'/%3E%3Crect x='12.25' y='12.25' width='55.5' height='55.5' rx='4' transform='rotate(45 40 40)'/%3E%3C/g%3E%3Cg fill='%237e22ce'%3E%3Crect x='-27.75' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 0 0)'/%3E%3Crect x='52.25' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 80 0)'/%3E%3Crect x='-27.75' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 0 80)'/%3E%3Crect x='52.25' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 80 80)'/%3E%3C/g%3E%3Crect x='12.25' y='12.25' width='55.5' height='55.5' rx='4' transform='rotate(45 40 40)' fill='%239333ea'/%3E%3Cg fill='%233b0764'%3E%3Ccircle cx='40' cy='0' r='2'/%3E%3Ccircle cx='0' cy='40' r='2'/%3E%3Ccircle cx='80' cy='40' r='2'/%3E%3Ccircle cx='40' cy='80' r='2'/%3E%3C/g%3E%3C/svg%3E")
 `,
 backgroundSize: '100% 100%, 100% 100%, 65px 65px',
 backgroundPosition: 'center center, center center, 0 0',
 } : {})
 }}
 >
 {/* Close Button Top Right */}
 {!isOpening && !showReward && (
 <CloseButton onClick={() => { playBackSfx(); handleClose(); }} className="fixed top-[calc(env(safe-area-inset-top)+24px)] right-6 z-50" />
 )}

 {!showReward && (
 <div className="fixed top-[calc(env(safe-area-inset-top)+24px)] left-6 flex items-center gap-2 h-11 bg-mono-100 dark:bg-white/10 rounded-md px-4 shadow-xl border border-mono-200 dark:border-white/10 z-50">
 <span className="text-[19px] font-black text-mono-900 dark:text-white font-sans mt-px">
 {toKuDigits(boxCount)}
 </span>
 <div className="w-[1.5px] h-4 bg-mono-300 dark:bg-white/20 rounded-full" />
 <MysteryBoxIcon isOpen={false} className="w-6 h-6" />
 </div>
 )}

 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-sm relative p-6 flex flex-col items-center"
 >

 {/* Ambient Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none" />

 <h2 className={`text-3xl font-black text-mono-900 dark:text-white ${!canOpenFree && !loadingCheck && timeLeftStr ? 'mb-1' : 'mb-2'} relative z-10 drop-shadow-md uppercase`}>سندۆقا نهێنی</h2>

 {!canOpenFree && !loadingCheck && timeLeftStr && (
 <span className="font-black text-xl text-fuchsia-500 font-sans tracking-normal mb-6 relative z-10 tabular-nums" dir="ltr">{timeLeftStr}</span>
 )}


 {/* Box Container */}
 <div className="relative w-48 h-48 mt-6 mb-8 flex items-center justify-center z-10">

 {/* Idle Magical Dust */}
 {canActuallyOpen && !isOpening && !isLidOpen && (
 <MagicalDust spread={150} count={25} zIndex={40} />
 )}

 {/* Premium Dimming Overlay to make the reward pop */}
 <AnimatePresence>
 {showReward && (
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 bg-white/40 dark:bg-black/90 pointer-events-none z-0"
 />
 )}
 </AnimatePresence>

 <Motion.div
 animate={isOpening ? {
 x: [-5, 5, -5, 5, -3, 3, 0],
 scale: [1, 1.05, 1.1, 1.15, 1.2],
 rotate: [0, -2, 2, -2, 0]
 } : {}}
 transition={isOpening ? { duration: 1.5, ease: "easeInOut" } : (canActuallyOpen && !isLidOpen ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {})}
 className={`w-full h-full flex items-center justify-center ${canActuallyOpen && !isOpening ? 'cursor-pointer' : ''}`}
 onClick={canActuallyOpen && !isOpening && !isLidOpen ? handleOpen : undefined}
 whileTap={canActuallyOpen && !isOpening ? { scale: 0.95 } : {}}
 >
 <MysteryBoxIcon isIdleAnimated={canActuallyOpen && !isOpening} isOpen={isLidOpen} className={`w-full h-full relative z-10 ${!canActuallyOpen && !isOpening ? 'grayscale opacity-40' : ''}`} />
 </Motion.div>

 {/* Reward Icon floating out of chest */}
 <AnimatePresence>
 {showReward && wonReward && (
 <Motion.div
 initial={{ opacity: 0, scale: 0.5, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: -40 }}
 exit={{ opacity: 0, scale: 0.8 }}
 className="absolute z-20 flex flex-col items-center pointer-events-auto"
 style={{ top: '10%' }}
 >
 <div className="relative flex items-center justify-center mb-4">
 {/* Premium Aura (Clean, Sharp, Elegant) */}
 <div
 className="absolute w-62.5 h-62.5 bg-[radial-gradient(circle,rgba(217,70,239,0.4)_0%,transparent_70%)] pointer-events-none"
 style={{ zIndex: -1 }}
 />

 {/* Core intense bright glow directly behind the icon */}
 <div className="absolute w-32 h-32 bg-white/90 dark:bg-white/40 rounded-full blur-xl pointer-events-none shadow-[0_0_50px_rgba(255,255,255,1)]" style={{ zIndex: -1 }} />

 <Motion.div
 animate={{
 scale: [1, 1.1, 1],
 rotate: [0, 3, -3, 0],
 y: [-5, 5, -5]
 }}
 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
 className="relative flex items-center justify-center z-10"
 >
 {wonReward.type === 'fils' ? <FilsIcon size={80} /> :
 wonReward.type === 'derhem' ? <DerhemIcon size={80} /> :
 wonReward.type === 'dinar' ? <DinarIcon size={80} /> :
 wonReward.type === 'hint' ? <PowerUpBadge type="hint" size={80} /> :
 wonReward.type === 'skip' ? <PowerUpBadge type="skip" size={80} /> :
 wonReward.type === 'magnet' ? <PowerUpBadge type="magnet" size={80} /> :
 wonReward.type === 'spinTicket' ? <SpinTicketIcon size={80} /> : null}
 </Motion.div>
 </div>

 {/* Elegant Clean Typography with Purple Glow Behind It */}
 <div className="relative mt-6">
 <div className="absolute -inset-4 bg-purple-600 blur-xl opacity-80 pointer-events-none rounded-full" style={{ zIndex: -1 }}></div>
 <p className="text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap relative z-10">
 {wonReward.label}
 </p>
 </div>
 {/* Action Buttons */}
 <Motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="mt-6 w-full flex gap-3 z-20"
 >
 <button
 onClick={handleClaim}
 className="w-40 py-2.5 mx-auto bg-linear-to-r from-green-500 to-emerald-600 text-white font-black text-lg uppercase rounded-md hover:scale-105 active:scale-95 transition-all shadow-md border-2 border-emerald-400"
 >
 وەرگرتن
 </button>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Controls / Info */}
 <div className="w-full relative z-10 flex flex-col items-center gap-4">
 {showReward ? null : (
 loadingCheck ? (
 <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
 ) : (
 <button
 onClick={handleOpen}
 disabled={isOpening || (!canActuallyOpen && !loadingCheck)}
 className={`w-48 h-12 rounded-md bg-linear-to-b from-yellow-200 via-amber-400 to-orange-500 text-amber-950 border border-yellow-200 font-black text-lg shadow-[0_5px_15px_rgba(245,158,11,0.4)] transition-all uppercase flex items-center justify-center mx-auto ${(!isOpening && canActuallyOpen) ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'opacity-80 grayscale-50 cursor-not-allowed'}`}
 >
 {isOpening ? 'یا ڤەدبیت...' : 'ڤەکە!'}
 </button>
 )
 )}
 </div>

 </Motion.div>
 </Motion.div>
 </React.Fragment>
 )}
 </AnimatePresence>,
 document.body
 );
}
