import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import { playSwordComboSfx, playWhooshSfx } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits } from '../utils/formatters';

export default function RoundIntro({ opponent, userAvatar, userNickname, userLevel, currentRound, roundMessage }) {
  // Localization helper
  const getRoundOrdinal = (idx) => {
    const ordinals = ['ئێکێ', 'دوویێ', 'سێیێ'];
    if (idx < 3) return ordinals[idx];
    return toKuDigits(idx + 1);
  };

  // Trigger sounds on start
  useEffect(() => {
    if (roundMessage) {
      playWhooshSfx();
      const sfxTimeout = setTimeout(() => {
        playSwordComboSfx();
        triggerHaptic([100, 100, 100]);
      }, 500);
      return () => clearTimeout(sfxTimeout);
    }
  }, [roundMessage]);

  return (
    <AnimatePresence>
      {roundMessage && (
        <Motion.div
          key="diagonal-arcade-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden bg-[#0f0431]"
        >
          {/* 1. ARCADE BACKGROUND GRID */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.3)_0%,transparent_70%)]" />
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(rgba(124,58,237,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.2) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                transform: 'skewY(-5deg) scale(1.5)'
              }}
            />
          </div>

          {/* 2. TOP BADGE - "هەڤڕکی" */}
          <Motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="absolute top-10 z-50 px-6"
          >
            <div className="relative">
              <div className="px-12 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(124,58,237,0.3)]">
                <span className="text-white font-rabar font-black text-3xl sm:text-4xl uppercase tracking-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  ھەڤڕکی
                </span>
              </div>
              {/* Animated Glow Border */}
              <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500 opacity-50 blur-[2px] -z-10 animate-pulse" />
            </div>
          </Motion.div>

          {/* 3. DIAGONAL ENERGY BEAM */}
          <Motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "circOut" }}
            className="absolute w-[150%] h-[6px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_40px_rgba(251,191,36,0.9)] z-10 origin-center -rotate-[35deg]"
          />
          
          <Motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="absolute w-[150%] h-[12px] bg-white/60 blur-md z-10 -rotate-[35deg] pointer-events-none"
          />

          {/* 4. PLAYER CONTENT (DIAGONAL) */}
          <div className="relative w-full h-full p-8 sm:p-16 z-20 flex flex-col justify-between items-center max-w-5xl mx-auto">
            
            {/* OPPONENT - TOP LEFT */}
            <div className="w-full flex justify-start mt-28 px-8">
              <Motion.div
                initial={{ x: -200, y: -200, opacity: 0, scale: 0.3 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.4 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  {/* Outer Circular Glow Container */}
                  <div className="relative p-2 rounded-full bg-gradient-to-br from-red-600 via-orange-500 to-red-900 shadow-[0_0_60px_rgba(220,38,38,0.5)]">
                    <Avatar 
                      src={opponent?.avatar_url} 
                      size="2xl" 
                      className="border-4 border-white/30 rounded-full" 
                      border={false} 
                      level={opponent?.level} 
                    />
                  </div>
                  {/* Identity Label (Matches mockup position) */}
                  <div className="absolute -bottom-3 -right-3 bg-red-600 text-white font-black px-4 py-1.5 rounded-full text-sm shadow-2xl z-30 border-2 border-white/20">
                    ھەڤڕک
                  </div>
                </div>
                <span className="text-white font-black text-2xl sm:text-3xl tracking-normal drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] font-rabar">
                  {opponent?.nickname || 'ھەڤڕک'}
                </span>
              </Motion.div>
            </div>

            {/* VS CENTER */}
            <Motion.div
              initial={{ scale: 0, opacity: 0, rotate: 90, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, rotate: 0, filter: 'blur(0px)' }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            >
              <div className="relative group">
                {/* Intense Central Flare */}
                <Motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -inset-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full blur-[60px] mix-blend-screen"
                />
                <h1 className="text-9xl sm:text-[13rem] font-black italic tracking-tighter select-none px-12
                  bg-gradient-to-b from-yellow-300 via-yellow-400 to-orange-600 bg-clip-text text-transparent
                  drop-shadow-[0_0_50px_rgba(251,191,36,1)] filter brightness-125">
                  VS
                </h1>
                {/* Ghost Text for Depth */}
                <h1 className="absolute inset-0 text-9xl sm:text-[13rem] font-black italic tracking-tighter select-none px-12
                  text-white/20 blur-[3px] translate-y-1 translate-x-1 -z-10">
                  VS
                </h1>
              </div>
            </Motion.div>

            {/* YOU - BOTTOM RIGHT */}
            <div className="w-full flex justify-end mb-28 px-8">
              <Motion.div
                initial={{ x: 200, y: 200, opacity: 0, scale: 0.3 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.4 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  {/* Outer Circular Glow Container */}
                  <div className="relative p-2 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-900 shadow-[0_0_60px_rgba(34,211,238,0.5)]">
                    <Avatar 
                      src={userAvatar} 
                      size="2xl" 
                      className="border-4 border-white/30 rounded-full" 
                      border={false} 
                      level={userLevel} 
                    />
                  </div>
                  {/* Identity Label (Matches mockup position) */}
                  <div className="absolute -bottom-3 -left-3 bg-cyan-500 text-white font-black px-4 py-1.5 rounded-full text-sm shadow-2xl z-30 border-2 border-white/20">
                    تۆ
                  </div>
                </div>
                <span className="text-white font-black text-2xl sm:text-3xl tracking-normal drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] font-rabar">
                  {userNickname}
                </span>
              </Motion.div>
            </div>

          </div>

          {/* 5. ROUND TEXT (Sleek Bottom Bar) */}
          <Motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 1.2 }}
            className="absolute bottom-16 z-50 text-center px-10"
          >
            <div className="flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-rabar uppercase tracking-normal drop-shadow-2xl">
                {/* CORE TIE MESSAGE: DO NOT REMOVE */}
                {roundMessage === 'ROUND_DRAW' ? (
                  <>یەکسانبوون! <span className="text-amber-400 underline underline-offset-8 decoration-amber-500/50">گەڕا نووی</span></>
                ) : (
                  <>گەڕا {getRoundOrdinal(currentRound)} <span className="text-amber-400 underline underline-offset-8 decoration-amber-500/50">دەستپێکر</span></>
                )}
              </h2>
              <div className="mt-4 w-32 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-50" />
            </div>
          </Motion.div>

        </Motion.div>
      )}
    </AnimatePresence>
  );
}

