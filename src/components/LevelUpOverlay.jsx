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
            className="relative flex flex-col items-center z-10 w-full max-w-[320px] bg-mono-white dark:bg-mono-950 p-8 rounded-[30px] border border-mono-200 dark:border-mono-800 shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Background Texture/Glow */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FFD700]/20 blur-[60px] rounded-full pointer-events-none" />

            <h2 className="text-3xl font-black font-rabar text-mono-900 dark:text-mono-50 mb-8 leading-tight tracking-tight relative z-10 text-center">
              پیرۆزە!
            </h2>

            {/* Golden Shield Badge */}
            <Motion.div 
              className="relative flex flex-col items-center justify-center mb-10 z-10"
              animate={displayLevel === newLevel ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <svg width="120" height="138" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill="url(#levelMedalGradient)" stroke="white" strokeWidth="3" strokeOpacity="0.4" />
                <defs>
                  <linearGradient id="levelMedalGradient" x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFD700" />
                    <stop offset="1" stopColor="#B8860B" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2" dir="rtl">
                <span className="text-sm font-black text-slate-900 uppercase leading-none mb-1 opacity-90 drop-shadow-sm">ئاست</span>
                <AnimatePresence mode="popLayout">
                  <Motion.span 
                    key={displayLevel}
                    initial={{ y: 20, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="text-[40px] font-black text-slate-950 leading-none tabular-nums drop-shadow-md"
                  >
                    {toKuDigits(displayLevel)}
                  </Motion.span>
                </AnimatePresence>
              </div>
            </Motion.div>

            <button
              onClick={() => { triggerHaptic(10); onClose(); }}
              className="w-full relative flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 active:bg-green-600 transition-colors p-5 rounded-[20px] shadow-lg border-b-4 border-green-700/50 z-10"
            >
              <span className="font-rabar font-black text-white text-lg mt-1">+١٠٠ فلس وەربگرە</span>
              <span className="material-symbols-outlined text-white text-3xl animate-bounce drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
            </button>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
