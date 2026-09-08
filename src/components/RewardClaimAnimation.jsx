import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';

// A dynamic cinematic animation component for claiming rewards
export default function RewardClaimAnimation({ medal, onClose }) {
 useEffect(() => {
 // Play a dramatic cinematic sound (placeholder if context has one, otherwise rely on the handleClaimMedal sound)
 const timer = setTimeout(onClose, 4000); // Auto close after 4 seconds
 return () => clearTimeout(timer);
 }, [onClose]);

 if (!medal) return null;

 return createPortal(
 <AnimatePresence>
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0, transition: { duration: 0.5 } }}
 className="fixed inset-0 z-99999 flex flex-col items-center justify-center bg-black/90 "
 onClick={onClose}
 dir="rtl"
 >
 {/* Cinematic Light Rays (Rotating Background) */}
 <Motion.div
 initial={{ scale: 0, opacity: 0, rotate: -90 }}
 animate={{ scale: 1.5, opacity: 0.6, rotate: 0 }}
 transition={{ duration: 1.5, ease: "easeOut" }}
 className="absolute w-[600px] h-[600px] pointer-events-none"
 >
 <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_20s_linear_infinite]">
 <defs>
 <radialGradient id="epic-rays" cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
 <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.2" />
 <stop offset="100%" stopColor="#000000" stopOpacity="0" />
 </radialGradient>
 </defs>
 <circle cx="50" cy="50" r="50" fill="url(#epic-rays)" />
 {/* Draw 12 rays */}
 {Array.from({ length: 12 }).map((_, i) => (
 <polygon
 key={i}
 points="50,50 45,0 55,0"
 fill="#FEF3C7"
 opacity="0.3"
 transform={`rotate(${i * 30} 50 50)`}
 style={{ mixBlendMode: 'overlay' }}
 />
 ))}
 </svg>
 </Motion.div>

 {/* Epic Text Drop */}
 <Motion.div
 initial={{ y: -100, opacity: 0, scale: 2 }}
 animate={{ y: 0, opacity: 1, scale: 1 }}
 transition={{ duration: 0.6, type: "spring", bounce: 0.5, delay: 0.2 }}
 className="absolute top-[20%] text-center z-20"
 >
 <h2 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-yellow-500 font-rabar">
 دەستکەفتەکا نوی!
 </h2>
 <p className="text-yellow-100/80 text-lg mt-2">{medal.name}</p>
 </Motion.div>

 {/* The Medal Icon Drop (Like PUBG) */}
 <Motion.div
 initial={{ scale: 0, rotate: -180, y: 100 }}
 animate={{ scale: 2.5, rotate: 0, y: 0 }}
 transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.4 }}
 className="relative z-30 drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]"
 >
 <medal.IconComponent size={120} className="w-32 h-32" />
 
 {/* Sparkle explosion on impact */}
 <Motion.div
 initial={{ scale: 0, opacity: 1 }}
 animate={{ scale: 2, opacity: 0 }}
 transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
 className="absolute inset-0 bg-white rounded-full mix-blend-overlay pointer-events-none"
 />
 </Motion.div>

 {/* Rewards Popup */}
 {medal.reward && (
 <Motion.div
 initial={{ y: 50, opacity: 0, scale: 0.5 }}
 animate={{ y: 0, opacity: 1, scale: 1 }}
 transition={{ type: "spring", bounce: 0.6, delay: 1 }}
 className="absolute bottom-[25%] flex gap-4 z-20"
 >
 {medal.reward.xp && (
 <div className="flex flex-col items-center justify-center bg-black/50 border-2 border-emerald-500/50 rounded-2xl p-4 min-w-[100px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
 <span className="text-emerald-400 font-black text-3xl tabular-nums">+{medal.reward.xp}</span>
 <span className="text-emerald-500/80 text-xs font-bold uppercase mt-1">XP</span>
 </div>
 )}
 {medal.reward.dinar && (
 <div className="flex flex-col items-center justify-center bg-black/50 border-2 border-yellow-500/50 rounded-2xl p-4 min-w-[100px] shadow-[0_0_20px_rgba(245,158,11,0.3)]">
 <span className="text-yellow-400 font-black text-3xl tabular-nums">+{medal.reward.dinar}</span>
 <span className="text-yellow-500/80 text-xs font-bold font-rabar mt-1">دینار</span>
 </div>
 )}
 {medal.reward.fils && (
 <div className="flex flex-col items-center justify-center bg-black/50 border-2 border-cyan-500/50 rounded-2xl p-4 min-w-[100px] shadow-[0_0_20px_rgba(6,182,212,0.3)]">
 <span className="text-cyan-400 font-black text-3xl tabular-nums">+{medal.reward.fils}</span>
 <span className="text-cyan-500/80 text-xs font-bold font-rabar mt-1">فلس</span>
 </div>
 )}
 </Motion.div>
 )}

 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 2, duration: 1 }}
 className="absolute bottom-[10%] text-white/40 text-sm"
 >
 کلیک بکە بۆ بەردەوامبوون
 </Motion.div>
 </Motion.div>
 </AnimatePresence>,
 document.body
 );
}
