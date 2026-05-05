import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';
import { useUser } from '../context/AuthContext';

export default function LevelUpOverlay({ isVisible, newLevel, onClose, isDark }) {
  const { user } = useUser();

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
    }
  }, [isVisible, isDark]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="level-up-aura" />

      <div className="relative text-center animate-level-up-text px-6 py-10 rounded-2xl bg-[#1a1a1a] border-4 border-secondary shadow-[0_50px_100px_rgba(255,152,0,0.4)] ring-32 ring-secondary/5 max-w-[350px] w-[90%] mx-auto">
        <div className="w-20 h-20 mx-auto mb-5 bg-secondary rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(251,192,45,0.4)]">
          <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
        </div>

        <h2 className="text-4xl font-bold  font-body text-secondary mb-2 leading-tight tracking-tight">
          پیرۆزە!
        </h2>

        <p className="text-xl font-body font-bold  text-white/90 mb-6">
          تو گەھشتیە ئاستێ <br />
          <span className="text-secondary text-6xl drop-shadow-[0_0_15px_rgba(251,192,45,0.3)]">{newLevel}</span>
        </p>

        <button
          onClick={() => { triggerHaptic(10); onClose(); }}
          className="w-full group relative flex flex-col items-center gap-2 bg-secondary hover:bg-secondary/90 active:scale-95 transition-all p-6 rounded-2xl shadow-2xl border-b-8 border-black/20"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-3xl animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            <span className="font-body font-bold  text-white text-xl">+٥٠٠ فلس دیاری</span>
          </div>
          <span className="text-[10px] uppercase font-bold  ] text-white/60 group-hover:text-white transition-colors">وەربگرە</span>
        </button>
      </div>
    </div>
  );
}
