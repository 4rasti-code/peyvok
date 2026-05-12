import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';
import { useUser } from '../context/AuthContext';
import { toKuDigits } from '../utils/formatters';

export default function LevelUpOverlay({ isVisible, newLevel, onClose, isDark }) {
  const { user } = useUser();
  const [displayLevel, setDisplayLevel] = useState(Math.max(1, newLevel - 1));

  // Fail-safe: close if session is lost
  useEffect(() => {
    if (!user && isVisible) {
      onClose();
    }
  }, [user, isVisible, onClose]);

  useEffect(() => {
    if (isVisible) {
      // High-saturation celebration
      const colors = [isDark ? '#34d399' : '#059669', '#facc15', '#3b82f6', '#ffffff'];
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors
      });

      // Level Up Triple-Pulse
      triggerHaptic([40, 60, 40, 60, 80]);

      // Ticking animation for the level number
      let isMounted = true;
      setTimeout(() => {
        if (isMounted) setDisplayLevel(Math.max(1, newLevel - 1));
      }, 0);
      
      const timer = setTimeout(() => {
        if (isMounted) {
          setDisplayLevel(newLevel);
          triggerHaptic(50);
        }
      }, 800); // Ticks up after 800ms
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [isVisible, isDark, newLevel]);

  if (!isVisible) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-5000 flex items-center justify-center p-4">
          <Motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          />

          <Motion.div 
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative flex flex-col items-center z-10 w-full max-w-[340px] bg-mono-white dark:bg-mono-950 p-8 rounded-[40px] border border-mono-200 dark:border-mono-800 shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Background Texture/Glow */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none" />
            
            {/* Magic Burst / Glow Effect */}
            <Motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
              animate={{ 
                scale: [0.8, 1.2, 1], 
                opacity: [0, 0.6, 0.4],
                rotate: [0, 90, 180]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="absolute top-[160px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-amber-400/40 via-amber-600/10 to-transparent blur-2xl rounded-full pointer-events-none z-0" 
            />

            <h2 className="text-3xl font-black font-rabar text-mono-900 dark:text-mono-50 mb-8 leading-tight relative z-10 text-center">
              پیرۆزە!
            </h2>

            {/* Premium Golden Shield Badge */}
            <Motion.div 
              className="relative flex flex-col items-center justify-center mb-10 z-10"
              animate={displayLevel === newLevel ? { 
                scale: [1, 1.15, 1],
                rotate: [0, -2, 2, 0]
              } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Outer Glow Shield */}
              <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full scale-125 pointer-events-none" />
              
              <svg width="130" height="150" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_10px_25px_rgba(184,134,11,0.5)]">
                <path 
                  d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" 
                  fill="url(#levelMedalGradientPremium)" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeOpacity="0.6" 
                />
                <path 
                  d="M50 8L87 24V55C87 75 50 105 50 105C50 105 13 75 13 55V24L50 8Z" 
                  fill="url(#innerShieldGradient)" 
                  fillOpacity="0.3"
                />
                <defs>
                  <linearGradient id="levelMedalGradientPremium" x1="0" y1="0" x2="100" y2="115" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFF176" />
                    <stop offset="0.4" stopColor="#FFD700" />
                    <stop offset="0.7" stopColor="#B8860B" />
                    <stop offset="1" stopColor="#8B4513" />
                  </linearGradient>
                  <linearGradient id="innerShieldGradient" x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2" dir="rtl">
                <span className="text-[10px] font-black text-amber-900/80 uppercase leading-none mb-1 drop-shadow-sm">ئاستێ نوی</span>
                <AnimatePresence mode="popLayout">
                  <Motion.span 
                    key={displayLevel}
                    initial={{ y: 25, opacity: 0, scale: 0.3, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ y: -25, opacity: 0, scale: 0.3, filter: 'blur(10px)' }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="text-[48px] font-black text-amber-950 leading-none tabular-nums drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)]"
                  >
                    {toKuDigits(displayLevel)}
                  </Motion.span>
                </AnimatePresence>
              </div>
            </Motion.div>

            <button
              onClick={() => { triggerHaptic(10); onClose(); }}
              className="w-full relative group flex items-center justify-center gap-3 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 transition-all p-5 rounded-[22px] shadow-xl border-b-4 border-green-800/40 z-10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
              <span className="font-rabar font-black text-white text-lg mt-1 relative z-10">+١٠٠ فلس وەربگرە</span>
              <Motion.span 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="material-symbols-outlined text-white text-3xl drop-shadow-md relative z-10" 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                toll
              </Motion.span>
            </button>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
