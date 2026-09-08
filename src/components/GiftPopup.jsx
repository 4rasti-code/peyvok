import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import { useAudio } from '../context/AudioContext';
import { FilsIcon } from './CurrencyIcon';

// A component to generate the flying magical dust/sparks (Clash Royale style)
export const MagicalDust = ({ spread = 300, count = 40, zIndex = 150, baseScale = 1 }) => {
 const [particles] = useState(() => {
 // Generate continuous floating particles
 return Array.from({ length: count }).map((_, i) => {
 // Spawn them randomly around the center
 const startX = (Math.random() - 0.5) * spread; 
 const startY = (Math.random() - 0.5) * spread;
 
 // Float them slowly upwards and slightly sideways
 const endX = startX + (Math.random() - 0.5) * (spread * 0.3);
 const endY = startY - (spread * 0.3) - Math.random() * (spread * 0.5);
 
 const scale = 0.5 + Math.random() * 1.2;
 const duration = 2 + Math.random() * 3;
 const delay = Math.random() * 4; // Stagger their starts

 return { id: i, startX, startY, endX, endY, scale, duration, delay };
 });
 });

 return (
 <div className="absolute inset-0 pointer-events-none" style={{ zIndex }}>
 {particles.map((p) => (
 <Motion.div
 key={p.id}
 initial={{ x: p.startX, y: p.startY, opacity: 0, scale: 0 }}
 animate={{ x: p.endX, y: p.endY, opacity: [0, 1, 1, 0], scale: [0, p.scale * baseScale, p.scale * 0.8 * baseScale, 0] }}
 transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
 className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-white rounded-full"
 style={{
 boxShadow: '0 0 2px 1px #fef08a, 0 0 5px 2px #eab308, 0 0 10px 3px #d97706',
 }}
 />
 ))}
 </div>
 );
};

export default function GiftPopup({ isVisible, onClose }) {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [claimed, setClaimed] = useState(false);
 const { playRewardSound } = useAudio();

 const handleClaim = async () => {
 try {
 setLoading(true);
 setError(null);
 triggerHaptic(15);
 
 const { error: claimError } = await supabase.rpc('claim_beta_gift');
 if (claimError) throw claimError;

 triggerHaptic(50);
 playRewardSound();
 
 // Trigger the magical dust explosion
 setClaimed(true);

 // Wait for the particles to fly before closing
 setTimeout(() => {
 onClose();
 }, 2000);

 } catch (err) {
 console.error('Failed to claim beta gift:', err);
 setError('ئاریشەیەک چێ بوو. تکایە دووبارە هەولبدە.'); // "An error occurred. Please try again."
 setLoading(false);
 }
 };

 return (
 <AnimatePresence>
 {isVisible && (
 <div className="fixed inset-0 z-9999 flex items-center justify-center p-4" dir="rtl">
 {/* Dark overlay */}
 <Motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/95 "
 />

 <Motion.div 
 initial={{ opacity: 0, scale: 0.8, y: 30 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.8, y: 30 }}
 transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
 className="relative w-full max-w-sm flex flex-col items-center"
 >

 {/* Glowing Aura behind the card (Clash Royale Style) */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-yellow-500/40 blur-[80px] rounded-full pointer-events-none" />

 {/* The Glassmorphic Premium Card */}
 <div className="relative w-full rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden
 bg-linear-to-b from-yellow-500/20 to-amber-900/40
 border-t border-l border-white/30 border-b-amber-500/30 border-r-amber-500/30
 shadow-[0_25px_50px_-12px_rgba(217,119,6,0.5)]">
 
 {/* Glass sheen reflection */}
 <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
 <div className="absolute -inset-1/2 w-[200%] h-[200%] bg-linear-to-br from-white/10 via-transparent to-transparent -rotate-45 pointer-events-none" />

 {/* Central Premium Icon Container */}
 <div className="relative z-10 mb-6">
 {/* Intense backlight for the icon */}
 <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-60 rounded-full animate-pulse" />
 
 <div className="relative w-28 h-28 rounded-full flex items-center justify-center 
 bg-linear-to-br from-yellow-300 via-amber-500 to-yellow-600
 border-[3px] border-white/50 shadow-[0_0_30px_rgba(251,191,36,0.6)]
 overflow-hidden">
 
 {/* Inner shine */}
 <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/40 to-white/80 opacity-60" />
 
 <Motion.div 
 animate={claimed ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : { y: [-5, 5, -5] }}
 transition={claimed ? { duration: 0.5 } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
 className="relative z-10"
 >
 <FilsIcon size={72} className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" />
 </Motion.div>
 </div>
 </div>

 <h3 className="text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-yellow-500 text-[26px] font-black font-rabar mb-3 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
 دیارییا تایبەت!
 </h3>
 
 <p className="text-yellow-50 text-[15px] mb-8 leading-7 relative z-10 font-medium px-2 drop-shadow-md font-rabar">
 سوپاس بۆ پشتەڤانییا تە!
 <br />
 تو بوویە پشکەک ژ خێزانا پەیڤۆک. تە <span className="text-yellow-400 font-black text-[18px] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">٥,٠٠٠ فلس</span> وەکو دیاری ب دەست خۆ ڤە ئینان!
 </p>

 {error && (
 <p className="text-xs text-red-400 font-bold mb-4 relative z-10 bg-black/50 px-3 py-1 rounded-full">{error}</p>
 )}

 <button 
 onClick={handleClaim} 
 disabled={loading || claimed}
 className={`w-full h-14 rounded-2xl font-black text-[#451a03] text-[18px] font-rabar 
 transition-all duration-300 active:scale-95 hover:scale-105
 flex items-center justify-center gap-2 relative overflow-hidden 
 bg-linear-to-b from-yellow-300 to-amber-500 border border-yellow-200
 ${(loading || claimed) ? 'opacity-80 pointer-events-none translate-y-2 shadow-none' : 'shadow-[0_8px_0_#b45309,0_15px_20px_rgba(217,119,6,0.4)]'}`}
 >
 {/* Button Sheen */}
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full opacity-50" />
 
 {loading && !claimed ? (
 <span className="material-symbols-outlined animate-spin relative z-10">progress_activity</span>
 ) : (
 <>
 <span className="relative z-10 pt-1 drop-shadow-sm">{claimed ? 'هاتە وەرگرتن!' : 'وەربگرە'}</span>
 </>
 )}
 </button>
 </div>
 
 <MagicalDust />
 </Motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
