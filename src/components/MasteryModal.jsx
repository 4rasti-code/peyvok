import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';
import { FilsIcon } from './CurrencyIcon';

const MasteryModal = ({ isOpen, onClose, targetWord, stats, gameMode, isDark }) => {
  useEffect(() => {
    if (isOpen) {
      const colors = [isDark ? '#34d399' : '#059669', '#facc15', '#3b82f6', '#ffffff'];
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors
      });
      // Mastery Triple-Pulse (Extra strong)
      triggerHaptic([50, 70, 50, 70, 100]);
    }
  }, [isOpen, isDark]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-[#1a202c] max-w-sm w-full p-8 rounded-2xl border border-white/10 shadow-2xl text-center relative overflow-hidden">

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center text-primary relative shadow-xl">
          <span className="material-symbols-outlined text-5xl">military_tech</span>
        </div>

        <h2 className="text-4xl font-bold font-heading text-white mb-2">پیرۆزە!</h2>
        <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-8 opacity-80">MASTERY ACHIEVED</p>

        <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">تە پەیڤا دژوار دیت</p>
          <p className="text-4xl font-bold font-heading text-white tracking-widest">{targetWord}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">پەیڤێن تە</span>
            <span className="text-2xl font-bold text-white">{(stats?.solvedCount || 0).toLocaleString('ku-IQ')}</span>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">ئاست</span>
            <span className="text-2xl font-bold text-white">{(stats?.level || 1).toLocaleString('ku-IQ')}</span>
          </div>

          <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 col-span-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                {gameMode === 'secret' ? 'خەلاتێ پەیڤا نھێنی' : 'خەلاتێ پەیڤێن دژوار'}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end leading-none translate-y-1">
                  <span className="text-4xl font-bold text-white">+{(gameMode === 'secret' ? 2500 : 1000).toLocaleString('ku-IQ')}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-primary">فلس</span>
                </div>
                <div className="w-8 h-8 flex items-center justify-center">
                  <FilsIcon size={24} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => { triggerHaptic(10); onClose(); }}
          className="w-full bg-primary text-black py-4 rounded-full font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg"
        >
          بەردەوام بە
        </button>
      </div>
    </div>
  );
};

export default MasteryModal;
