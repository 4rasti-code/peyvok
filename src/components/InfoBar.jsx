import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { FilsIcon } from './CurrencyIcon';
import CurrencyDecrementEffect from './CurrencyDecrementEffect';

export default function InfoBar({ 
  targetHint, 
  category, 
  gameMode = 'classic',
  guessesCount = 0,
  maxGuesses = 6,
  fils = 0,
  currentXP = 0,
  level = 1,
  minXP = 0,
  maxXP = 100,
  timeLeft = 30,
  showSuccessSplash = false,
  isDark = true
}) {
  const isClassic = gameMode === 'classic';
  const isWordFever = gameMode === 'word_fever';
  const isMamak = gameMode === 'mamak';
  const isHardWords = gameMode === 'hard_words';
  const isSecretWord = gameMode === 'secret_word';
  const displayCategory = category === 'generalWordPool' ? 'گشتی' : (category || 'گشتی');
  const displayText = (isClassic || isHardWords) ? displayCategory : (targetHint || displayCategory || '...');
  
  // Theme-aware styles
  const textMain = isDark ? 'text-white' : 'text-slate-800';
  const textMuted = isDark ? 'text-white/40' : 'text-slate-500';
  const bgSurface = isDark ? 'bg-black/40 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-md';
  const dividerColor = isDark ? 'bg-white/10' : 'bg-slate-300';

  // XP Calculation: Relative Progress within the current level
  const range = maxXP - minXP;
  const relativeXP = Math.max(0, currentXP - minXP);
  const progressPercent = range > 0 ? Math.min(100, (relativeXP / range) * 100) : 0;

  // Word Fever Mode Timer: Electric Purple baseline, Red for Critical end
  const getTimerStyles = (time) => {
    const isCritical = time <= 10;
    return { 
      color: isCritical ? '#ef4444' : '#a855f7', 
      glow: isCritical ? '0 0 25px rgba(239, 68, 68, 0.7)' : '0 0 25px rgba(168, 85, 247, 0.6)', 
      pulse: isCritical ? 'heartbeat-critical' : '' 
    };
  };

  const timerStyle = getTimerStyles(timeLeft);
  const circumference = 2 * Math.PI * 22;
  const offset = (timeLeft / 30) * circumference;

  // Minimalist View for Classic, Word Fever, OR Mamak Mode
  if (isClassic || isWordFever || isMamak || isHardWords || isSecretWord) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-0 px-4 sm:px-8 mt-2 animate-in fade-in duration-700 relative">
        
        <div className="w-full max-w-3xl flex items-center justify-center pt-2 pb-2 text-center relative z-10">
          <p className={`whitespace-nowrap text-[clamp(0.6rem,3.5vw,1.25rem)] font-light ${textMain} leading-none font-noto-sans-arabic ${isDark ? 'drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]' : ''}`}>
            {displayText}
          </p>
        </div>

        {/* NEON VIBRANT CORE (Keshkha Orange Edition) */}
        {isWordFever && (
          <div className={`relative flex items-center justify-center -mt-3 ${timerStyle.pulse} transition-all duration-300`}>
             
             {/* SUCCESS SPLASH EFFECT */}
             <AnimatePresence>
               {showSuccessSplash && (
                 <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[6px] border-current shadow-lg animate-success-splash" 
                         style={{ color: timerStyle.color }} />
                 </div>
               )}
             </AnimatePresence>

             {/* Dynamic Bolt Background Overlay */}
             <Motion.div 
               animate={timeLeft <= 10 ? { 
                 x: [-1, 1, -1, 1, 0],
                 rotate: [-1, 1, -1, 1, 0],
                 filter: [`drop-shadow(0 0 12px ${timerStyle.color})`, `drop-shadow(0 0 25px ${timerStyle.color})`]
               } : {}}
               transition={{ repeat: Infinity, duration: 0.1 }}
               className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
             >
                <span 
                  className="material-symbols-outlined text-[65px] sm:text-[85px] opacity-30 transition-colors duration-1000 select-none"
                  style={{ 
                    color: timerStyle.color,
                    fontVariationSettings: "'FILL' 1",
                    filter: `drop-shadow(0 0 8px ${timerStyle.color})`
                  }}
                >
                  bolt
                </span>
             </Motion.div>

             <Motion.div 
               animate={{ rotate: [0, 360] }}
               transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
               className="relative z-10"
             >
               <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90 overflow-visible">
                  <defs>
                     <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#818cf8" />
                     </linearGradient>
                  </defs>

                  {/* Colored Background Track - Never Colorless */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="22"
                    className="fill-none stroke-[10px]"
                    style={{ stroke: `${timerStyle.color}33` }} // 20% opacity of current theme color
                  />
                  
                  {/* Progress Ring - Vibrant Purple/Red Filling */}
                  <Motion.circle
                    key={displayText} 
                    cx="50%"
                    cy="50%"
                    r="22"
                    fill="none"
                    stroke={timeLeft <= 10 ? '#ef4444' : "url(#purpleGradient)"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ 
                      strokeDashoffset: offset,
                      strokeWidth: timeLeft <= 10 ? [10, 13, 10] : 10,
                    }}
                    style={{
                      strokeDasharray: `${circumference} ${circumference}`,
                      filter: `drop-shadow(0 0 18px ${timerStyle.color}cc)`
                    }}
                    transition={{ 
                      strokeDashoffset: { duration: 0.8, ease: "easeOut" },
                      strokeWidth: { repeat: Infinity, duration: 0.5 }
                    }}
                  />
               </svg>
             </Motion.div>
             
             {/* Centered Numbers */}
             <Motion.span 
               key={timeLeft}
               initial={{ scale: 0.7, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-black font-heading text-white drop-shadow-[0_0_15px_rgba(0,0,0,1)] z-20 select-none"
             >
                {timeLeft}
             </Motion.span>
          </div>
        )}
        
        {/* Minimalist Divider (Classic Only) */}
        {!isWordFever && <div className={`w-[65%] h-[0.5px] ${dividerColor} rounded-full`} />}
      </div>
    );
  }

  // Informative Full View for Other Modes
  return (
    <div className="w-full flex flex-col items-center gap-2 mb-4 px-4 animate-in slide-in-from-top-4 duration-500">
      <div className={`w-full max-w-lg h-14 backdrop-blur-2xl border rounded-3xl grid grid-cols-3 items-center px-4 relative overflow-visible ${bgSurface}`}>
        <div className={`flex items-center justify-center gap-1.5 ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-800'} px-3 h-9 rounded-2xl border ${isDark ? 'border-white/5' : 'border-slate-200'} shadow-sm`}>
          <span className="text-xs font-black mt-0.5">{(guessesCount)}/{(maxGuesses)}</span>
          <span className="material-symbols-outlined text-[16px]">rotate_right</span>
        </div>
        <div className="flex flex-col items-center justify-center overflow-">
          <span className={`text-[8px] font-black ${textMuted} uppercase tracking-widest mb-0.5`}>بابەت</span>
          <span className="text-[12px] font-black font-heading text-primary truncate max-w-full">
            {category || 'گشتی'}
          </span>
        </div>
        <CurrencyDecrementEffect value={fils} currency="fils">
          <div className="flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-500 px-3 h-10 rounded-2xl border border-amber-500/20 shadow-sm transition-all duration-300">
            <div className="flex flex-col items-center leading-none">
              <span className="text-xs font-black">{(fils || 0).toLocaleString('ku-IQ')}</span>
              <span className="text-[7px] font-black uppercase tracking-widest opacity-60">فلس</span>
            </div>
            <div className="scale-75"><FilsIcon /></div>
          </div>
        </CurrencyDecrementEffect>
      </div>
      <div className={`w-full max-w-40 h-1.5 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-200 border-slate-300'} rounded-full overflow-hidden border relative`}>
        <div className="h-full bg-primary shadow-[0_0_15px_rgba(88,204,2,0.5)] transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}

