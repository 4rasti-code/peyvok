import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion as Motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { fireConfetti as confetti } from '../utils/confettiHelper';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/AuthContext';
import { useGameStore } from '../store/gameStore';
import { triggerHaptic } from '../utils/haptics';
import { playBackSfx, playChestOpenSfx, playWheelSpinSfx } from '../utils/audio';
import { toKuDigits } from '../utils/formatters';
import LuckyWheelIcon, { LuckyWheelInner, LuckyWheelFrame } from './LuckyWheelIcon';
import { WHEEL_REWARDS } from '../constants/wheelRewards';
import { FilsIcon, HintIcon, DerhemIcon, SkipIcon, MagnetIcon, DinarIcon, SpinTicketIcon } from './CurrencyIcon';
import MysteryBoxIcon from './MysteryBoxIcon';
import CloseButton from './CloseButton';

export default function LuckyWheelModal({ isOpen, onClose }) {
 const { user, syncProfile } = useUser();
 const updateInventory = useGameStore(s => s.updateInventory);
  const spinTicketCount = useGameStore(s => s.spinTicketCount);

 const [canSpin, setCanSpin] = useState(false);
 const [timeLeftStr, setTimeLeftStr] = useState('');
 const [isSpinning, setIsSpinning] = useState(false);
 const spinRotationMotion = useMotionValue(0);
 const [showReward, setShowReward] = useState(false);
 const [wonReward, setWonReward] = useState(null);
 const [loadingCheck, setLoadingCheck] = useState(true);
 const [isClaiming, setIsClaiming] = useState(false);
 const timerRef = useRef(null);

 useEffect(() => {
 if (!isOpen || !user) return;

 const checkSpinStatus = async () => {
 if (!user) return;

 // === TEST MODE ===
 // Disabled for production to enforce once-a-day limit
 const isTestMode = false;
 if (isTestMode) {
 setCanSpin(true);
 setLoadingCheck(false);
 return;
 }
 // =================

 try {
 const { data, error } = await supabase
 .from('profiles')
 .select('last_spin_date')
 .eq('id', user.id)
 .single();

 if (error) throw error;

 if (!data.last_spin_date) {
 setCanSpin(true);
 } else {
 const lastSpin = new Date(data.last_spin_date);
 const now = new Date();
 const diffMs = now - lastSpin;
 const hours24 = 24 * 60 * 60 * 1000;

 if (diffMs >= hours24) {
 setCanSpin(true);
 } else {
 setCanSpin(false);
 startCountdown(hours24 - diffMs);
 }
 }
 } catch (err) {
 console.error("Failed to check spin status:", err);
 } finally {
 setLoadingCheck(false);
 }
 };

 checkSpinStatus();

 // Reset state on open
 setShowReward(false);
 setWonReward(null);
 setIsClaiming(false);

 return () => {
 if (timerRef.current) clearInterval(timerRef.current);
 };
 }, [isOpen, user]);



 const startCountdown = (initialDiffMs) => {
 const updateTimer = (diff) => {
 if (diff <= 0) {
 setCanSpin(true);
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

 return () => {
 if (timerRef.current) {
 clearInterval(timerRef.current);
 timerRef.current = null;
 }
 };
 };

 const isTicketAvailable = spinTicketCount > 0;
 const canActuallySpin = canSpin || isTicketAvailable;

 const handleSpin = async () => {
 if (isSpinning || !canActuallySpin) return;

 // Determine if we are using a ticket or a free spin
 const usingTicket = !canSpin && isTicketAvailable;

 triggerHaptic(15);
 setIsSpinning(true);
 if (!usingTicket) setCanSpin(false); // Only disable normal spin if we didn't use a ticket
 playWheelSpinSfx();

 if (usingTicket) {
 updateInventory({ spinTicketCount: -1 }, true, true);
 }

 // Random reward based on weight (only from winnable ones)
 const winnableRewards = WHEEL_REWARDS.filter(r => r.winnable);
 const totalWeight = winnableRewards.reduce((sum, r) => sum + (r.weight || 1), 0);
 let randomNum = Math.random() * totalWeight;
 let reward = winnableRewards[0];

 for (const r of winnableRewards) {
 const weight = r.weight || 1;
 if (randomNum < weight) {
 reward = r;
 break;
 }
 randomNum -= weight;
 }

 // Store selected reward
 setWonReward(reward);

 // Calculate final rotation
 const numSegments = WHEEL_REWARDS.length;
 const segmentAngle = 360 / numSegments;
 const rewardIndex = WHEEL_REWARDS.findIndex(r => r.id === reward.id);
 const extraSpins = 360 * 5;

 const currentRot = spinRotationMotion.get();
 const currentMod = currentRot % 360;
 const targetAbsolute = 360 - (rewardIndex * segmentAngle);
 let rotationDiff = targetAbsolute - currentMod;
 if (rotationDiff <= 0) rotationDiff += 360;

 const targetRotation = currentRot + extraSpins + rotationDiff;

 animate(spinRotationMotion, targetRotation, {
 duration: 6.8,
 ease: [0.2, 0.8, 0.2, 1], // Custom cubic-bezier to precisely match audio mechanical friction
 });

 setWonReward(reward);

 // Wait for animation to finish
 setTimeout(async () => {
 triggerHaptic(50);
 playChestOpenSfx();

 confetti({
 particleCount: 60,
 spread: 100,
 origin: { y: 0.6 },
 colors: ['#FFD700', '#F59E0B', '#FCD34D']
 });

 setShowReward(true);
 setIsSpinning(false);

 // Update Database only if using a free spin
 if (!usingTicket) {
 try {
 await supabase
 .from('profiles')
 .update({ last_spin_date: new Date().toISOString() })
 .eq('id', user.id);
 syncProfile(user.id, null, true);
 } catch (err) {
 console.error("Failed to update spin date:", err);
 }
 }

 }, 6800);
 };

 const handleClaim = () => {
 if (!wonReward) return;

 // Hide the modal visually
 setIsClaiming(true);

 // Trigger flying animation
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
 if (wonReward.type === 'mystery_box') {
 const fetchAndAddBox = async () => {
 try {
 const { data, error } = await supabase.from('profiles').select('mystery_boxes_count').eq('id', user.id).single();
 if (error) throw error;

 const newCount = (data?.mystery_boxes_count || 0) + wonReward.amount;
 const { error: updateError } = await supabase.from('profiles').update({ mystery_boxes_count: newCount }).eq('id', user.id);
 if (updateError) throw updateError;
 } catch (err) {
 console.error("Failed to safely save mystery box:", err);
 }
 };
 fetchAndAddBox();
 }

 // Close reward overlay internally
 setShowReward(false);

 // Completely unmount modal after animation finishes
 setTimeout(() => {
 setIsClaiming(false);
 window.isAnimatingReward = false; // Reset after animation
 onClose();
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
 <React.Fragment key="lucky-wheel-modal">
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: isClaiming ? 0 : 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3 }}
 className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-mono-100 dark:bg-[#0a0b10] font-noto-sans-arabic text-mono-900 dark:text-mono-50" dir="rtl"
 style={{ pointerEvents: isClaiming ? 'none' : 'auto' }}
 >
 {/* Close Button Top Right */}
 {!isSpinning && (
 <CloseButton onClick={() => { playBackSfx(); onClose(); }} className="fixed top-[calc(env(safe-area-inset-top)+24px)] right-6 z-[999999]" />
 )}

 {/* Spin Ticket Pill Counter */}
 <div className="fixed top-[calc(env(safe-area-inset-top)+24px)] left-6 flex items-center gap-2 h-11 bg-mono-100 dark:bg-white/10 rounded-md px-4 shadow-xl border border-mono-200 dark:border-white/10 z-[999999]">
 <span className="text-[19px] font-black text-mono-900 dark:text-white font-sans mt-px">
 {toKuDigits(spinTicketCount || 0)}
 </span>
 <div className="w-[1.5px] h-4 bg-mono-300 dark:bg-white/20 rounded-full" />
 <SpinTicketIcon size={24} className="relative z-10" />
 </div>

 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-sm relative p-6 flex flex-col items-center"
 >


 {/* Ambient Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)' }} />

 <h2 className={`text-3xl font-black text-mono-900 dark:text-white relative z-[999999] ${!canSpin && !loadingCheck && timeLeftStr ? 'mb-1' : 'mb-6'} relative z-10 uppercase`}>چەرخێ بەختی</h2>
 {!canSpin && !loadingCheck && timeLeftStr && (
 <span className="font-black text-xl text-amber-500 font-sans tracking-normal mb-6 relative z-10 tabular-nums" dir="ltr">{timeLeftStr}</span>
 )}



 {/* Wheel Container with Dimming Effect (Optimized for GPU safety) */}
 <Motion.div
 initial={false}
 animate={showReward ? { scale: 0.9, opacity: 0.3 } : { scale: 1, opacity: 1 }}
 transition={{ duration: 0.3, ease: "easeOut" }}
 className="relative w-64 h-64 mb-8 mt-6 flex items-center justify-center z-10"
 >

 {/* Static Outer Frame with Pointer */}
 <LuckyWheelFrame rotation={spinRotationMotion} className="absolute inset-0 w-full h-full z-20 pointer-events-none" idSuffix="-modal" />

 {/* The Spinning Inner Wheel */}
 <Motion.div
 style={{
 rotate: spinRotationMotion,
 willChange: 'transform',
 WebkitTransform: 'translateZ(0)',
 transform: 'translateZ(0)'
 }}
 className="absolute inset-0 w-full h-full z-10 flex items-center justify-center"
 >
 <LuckyWheelInner className="w-full h-full" />
 </Motion.div>

 {/* Center Spin Button (Flat Blue) */}
 <button
 onClick={handleSpin}
 disabled={isSpinning || (!canActuallySpin && !loadingCheck)}
 className={`absolute z-30 w-12.5 h-12.5 rounded-full bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-500 text-amber-950 text-[13px] font-black shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_2px_5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center transition-all border border-yellow-200 ${(!isSpinning && canActuallySpin) ? 'hover:scale-105 hover:brightness-110 cursor-pointer' : 'opacity-80 grayscale-50 cursor-not-allowed'}`}
 >
 {isSpinning ? '...' : (!canActuallySpin && !loadingCheck ? <span className="material-symbols-outlined text-[20px] opacity-70">lock</span> : 'بزڤڕینە')}
 </button>
 </Motion.div>

 {/* Reward Overlay */}
 <AnimatePresence mode="wait">
 {showReward && wonReward && (
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.4 }}
 className="fixed inset-0 z-120 flex flex-col items-center justify-center overflow-hidden"
 style={{
 backgroundColor: '#78350f',
 backgroundImage: `
 radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.6) 110%),
 radial-gradient(circle at center, rgba(245, 158, 11, 0.45) 0%, transparent 65%),
 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%2378350f'/%3E%3Cg transform='translate(0, 1.5)' fill='%23451a03'%3E%3Crect x='-27.75' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 0 0)'/%3E%3Crect x='52.25' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 80 0)'/%3E%3Crect x='-27.75' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 0 80)'/%3E%3Crect x='52.25' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 80 80)'/%3E%3Crect x='12.25' y='12.25' width='55.5' height='55.5' rx='4' transform='rotate(45 40 40)'/%3E%3C/g%3E%3Cg fill='%23d97706'%3E%3Crect x='-27.75' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 0 0)'/%3E%3Crect x='52.25' y='-27.75' width='55.5' height='55.5' rx='4' transform='rotate(45 80 0)'/%3E%3Crect x='-27.75' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 0 80)'/%3E%3Crect x='52.25' y='52.25' width='55.5' height='55.5' rx='4' transform='rotate(45 80 80)'/%3E%3C/g%3E%3Crect x='12.25' y='12.25' width='55.5' height='55.5' rx='4' transform='rotate(45 40 40)' fill='%23f59e0b'/%3E%3Cg fill='%2378350f'%3E%3Ccircle cx='40' cy='0' r='2'/%3E%3Ccircle cx='0' cy='40' r='2'/%3E%3Ccircle cx='80' cy='40' r='2'/%3E%3Ccircle cx='40' cy='80' r='2'/%3E%3C/g%3E%3C/svg%3E")
 `,
 backgroundSize: '100% 100%, 100% 100%, 65px 65px',
 backgroundPosition: 'center center, center center, 0 0',
 }}
 >
 {/* Floating Reward Container */}
 <Motion.div
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5, ease: "backOut" }}
 className="relative flex flex-col items-center justify-center z-10"
 style={{ WebkitTransform: 'translateZ(0)' }}
 >
 {/* Icon */}
 <div className="relative flex justify-center items-center mb-4">
 {/* Premium Aura (Clean, Sharp, Elegant) */}
 <div
 className="absolute w-62.5 h-62.5 bg-[radial-gradient(circle,rgba(245,158,11,0.4)_0%,transparent_70%)] pointer-events-none"
 style={{ zIndex: -1 }}
 />

 {/* Core intense bright glow directly behind the icon */}
 <div className="absolute w-48 h-48 bg-white/90 dark:bg-white/40 rounded-full blur-xl pointer-events-none shadow-[0_0_50px_rgba(255,255,255,1)]" style={{ zIndex: -1 }} />

 <wonReward.Icon
 size={150}
 className={`relative z-10 ${wonReward.type === 'mystery_box' ? 'w-40 h-40' : ''}`}
 />
 </div>

 {/* Elegant Clean Typography with Gold Glow Behind It */}
 <div className="relative mt-8 mb-10">
 <div className="absolute -inset-4 bg-yellow-500 blur-xl opacity-80 pointer-events-none rounded-full" style={{ zIndex: -1 }}></div>
 <p className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap relative z-10">
 {(() => {
 const nameMap = {
 fils: 'فلس',
 derhem: 'درهەم',
 dinar: 'دینار',
 skip: 'پاس',
 hint: 'هاریکاری',
 magnet: 'پیتژێبرک',
 mystery_box: 'سندۆق',
 spinTicket: 'بلیت'
 };
 const rewardName = nameMap[wonReward.type] || '';
 return (
 <span className="inline-flex items-center gap-2" dir="rtl">
 <span dir="ltr">+{toKuDigits(wonReward.amount)}</span>
 <span>{rewardName}</span>
 </span>
 );
 })()}
 </p>
 </div>
 </Motion.div>

 {/* Premium Claim Button */}
 <Motion.button
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.2 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleClaim}
 className="w-40 py-2.5 mx-auto bg-linear-to-r from-green-500 to-emerald-600 text-white font-black text-lg uppercase rounded-md hover:scale-105 active:scale-95 transition-all shadow-md border-2 border-emerald-400"
 >
 وەرگرتن
 </Motion.button>
 </Motion.div>
 )}
 </AnimatePresence>
 </Motion.div>
 </Motion.div>
 </React.Fragment>
 )}
 </AnimatePresence>,
 document.body
 );
}
