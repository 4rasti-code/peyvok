import React, { useEffect } from 'react';
import Avatar from './Avatar';

export default function GameOverOverlay({ scores, user, opponent, isPlayer1, onReturn, onPlayAgain }) {
  const myScore = isPlayer1 ? scores.p1 : scores.p2;
  const oppScore = isPlayer1 ? scores.p2 : scores.p1;
  const won = myScore > oppScore;
  const draw = myScore === oppScore;

  // Auto-exit after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onReturn();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onReturn]);

  return (
    <div className="fixed inset-0 z-500 bg-[#020617]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Dynamic Background Glow based on result */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 blur-[100px] rounded-full opacity-30 ${won ? 'bg-emerald-500 animate-pulse' : draw ? 'bg-amber-500' : 'bg-red-500'}`} />

        <h1 className="text-4xl font-black text-white mb-2 font-noto-sans-arabic">یاری ب دوماھیک ھات</h1>
        <p className="text-white/40 mb-12 font-noto-sans-arabic">ئەنجامێن دوماھیێ</p>

        <div className="flex items-center justify-around mb-12">
          {/* YOU */}
          <div className="flex flex-col items-center gap-4">
            <div className={`relative p-1 rounded-full transition-all duration-700 ${won ? 'ring-4 ring-emerald-500/50 scale-110 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}`}>
              <Avatar src={user?.avatar_url} size="md" />
              {won && <span className="absolute -top-3 -right-3 text-3xl drop-shadow-lg">👑</span>}
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-3xl font-black transition-colors ${won ? 'text-emerald-400' : 'text-white'}`}>{myScore}</span>
              <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">تۆ (YOU)</span>
            </div>
          </div>

          <div className="text-white/5 text-5xl font-black italic select-none">VS</div>

          {/* FOE */}
          <div className="flex flex-col items-center gap-4">
            <div className={`relative p-1 rounded-full transition-all duration-700 ${!won && !draw ? 'ring-4 ring-red-500/50 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : ''}`}>
              <Avatar src={opponent?.avatar_url} size="md" />
              {!won && !draw && <span className="absolute -top-3 -right-3 text-3xl drop-shadow-lg">👑</span>}
            </div>
            <div className="flex flex-col items-center">
              <span className={`text-3xl font-black transition-colors ${!won && !draw ? 'text-red-400' : 'text-white'}`}>{oppScore}</span>
              <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">ھەڤڕک (FOE)</span>
            </div>
          </div>
        </div>

        <div className={`rounded-[2rem] p-6 mb-8 border transition-all duration-1000 ${won ? 'bg-emerald-500/10 border-emerald-500/20' : draw ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20'}`}>
          <h2 className={`text-2xl font-black font-noto-sans-arabic ${won ? 'text-emerald-400' : draw ? 'text-amber-400' : 'text-red-400'}`}>
            {won ? 'تە سەرکەفتن ئینا! 🎉' : draw ? 'ھەردووک وەکھەڤ! 🤝' : 'تو دۆڕاندی، جەرباندنەکا دی بکە!'}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">restart_alt</span>
            یارییەکا دی بکە
          </button>

          <button
            onClick={onReturn}
            className="w-full py-4 bg-white/5 text-white/40 font-bold rounded-2xl hover:bg-white/10 transition-all text-sm"
          >
            ڤەگەڕیا سەرەکی
          </button>
        </div>
      </div>
    </div>
  );
}
