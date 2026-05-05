import React, { useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { DerhemIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import FloatingLetterBackground from './FloatingLetterBackground';

const LobbyView = React.memo(({
  onStartClassic,
  onStartMamak,
  onStartHardWords,
  onStartSecretWord,
  onStartWordFever,
  onStartMultiplayer, // Handle matchmaking
  _onDailyRewardClick,
  _dailyStreak,
  onViewChange,
  _notificationCount = 0,
  winsTowardsSecret = 0,
  onOpenHowToPlay
}) => {
  const bgRef = useRef(null);

  const handleBackgroundClick = (e) => {
    // Only trigger if clicking the direct container to avoid button double-triggers
    if (e.target === e.currentTarget || e.target.classList.contains('bg-trigger-zone')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      bgRef.current?.pulse(x, y);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  const bentoMotionProps = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  };

  const isSecretUnlocked = winsTowardsSecret >= 3;

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onClick={handleBackgroundClick}
      className="flex-1 w-full max-w-full px-4 pt-4 pb-4 overflow-x-hidden bg-mono-white dark:bg-mono-950 relative h-full bg-trigger-zone transition-colors duration-500"
    >
      <FloatingLetterBackground ref={bgRef} />

      <div className="relative z-10">
        {/* Header (Simplified) */}
        <div className="flex flex-col mb-8 px-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {/* Stats Button */}
              {/* Stats Button */}
              <Motion.button
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic(15); onViewChange('stats'); }}
                className="w-10 h-10 flex items-center justify-center group transition-all"
              >
                <span className="material-symbols-outlined text-mono-500 dark:text-mono-400 text-[24px] group-hover:text-mono-900 dark:group-hover:text-white transition-colors">
                  bar_chart
                </span>
              </Motion.button>

              {/* Achievement/Trophy Button */}
              <Motion.button
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic(15); onViewChange('achievements'); }}
                className="w-10 h-10 flex items-center justify-center group transition-all"
              >
                <span className="material-symbols-outlined text-mono-500 dark:text-mono-400 text-[24px] group-hover:text-mono-900 dark:group-hover:text-white transition-colors">
                  emoji_events
                </span>
              </Motion.button>

              {/* Dictionary Button */}
              <Motion.button
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic(15); onViewChange('dictionary'); }}
                className="w-10 h-10 flex items-center justify-center group transition-all"
              >
                <span className="material-symbols-outlined text-mono-500 dark:text-mono-400 text-[24px] group-hover:text-mono-900 dark:group-hover:text-white transition-colors">
                  menu_book
                </span>
              </Motion.button>

              <div className="w-px h-6 bg-mono-200 dark:bg-white/10 mx-1" />

              {/* Help Button */}
              <Motion.button
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic(10); onOpenHowToPlay?.(); }}
                className="w-10 h-10 flex items-center justify-center group transition-all"
              >
                <span className="material-symbols-outlined text-mono-500 dark:text-mono-400 text-[24px] group-hover:text-mono-900 dark:group-hover:text-white transition-colors">
                  help
                </span>
              </Motion.button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* ONLINE MULTIPLAYER */}
          <div className="col-span-2 md:col-span-4 relative group">
            <Motion.button
              variants={itemVariants}
              onClick={() => { triggerHaptic(15); onStartMultiplayer(); }}
              {...bentoMotionProps}
              className="w-full relative h-28 rounded-[6px] overflow-hidden bg-linear-to-r from-emerald-500 to-teal-600 border-none"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
              <div className="relative z-10 flex items-center justify-between px-8 h-full">
                <div className="flex flex-col items-start text-right">
                  <h3 className="text-2xl font-black font-heading text-white">ھەڤڕکی</h3>
                  <span className="text-[11px] font-black font-noto-sans-arabic text-emerald-100/70 leading-none">سەرهێڵ</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>swords</span>
                </div>
              </div>
            </Motion.button>
          </div>

          {/* CLASSIC MODE */}
          <div className="col-span-2 relative group">
            <Motion.button
              variants={itemVariants}
              onClick={() => { triggerHaptic(10); onStartClassic(); }}
              {...bentoMotionProps}
              className="w-full relative h-24 rounded-[6px] overflow-hidden bg-[#ffcc00] border-none"
            >
              <div className="relative z-10 flex items-center justify-between px-8 h-full">
                <div className="flex flex-col items-start text-right">
                  <h3 className="text-xl font-black font-heading text-amber-950">پەیڤچن</h3>
                  <span className="text-[9px] font-medium font-rabar uppercase  text-amber-900/80 leading-none">کلاسیک</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-amber-950" style={{ fontVariationSettings: "'FILL' 1" }}>videogame_asset</span>
                </div>
              </div>
            </Motion.button>
          </div>

          {/* MAMAK MODE */}
          <div className="col-span-2 relative group">
            <Motion.button
              variants={itemVariants}
              onClick={() => { triggerHaptic(10); onStartMamak(); }}
              {...bentoMotionProps}
              className="w-full relative h-24 rounded-[6px] overflow-hidden bg-[#22c55e] border-none"
            >
              <div className="relative z-10 flex items-center justify-between px-8 h-full">
                <div className="flex flex-col items-start text-right">
                  <h3 className="text-xl font-black font-heading text-white">مامک</h3>
                  <span className="text-[9px] font-medium font-rabar uppercase  text-white/50 leading-none">پەیدا بکە</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                </div>
              </div>
            </Motion.button>
          </div>

          {/* HARD MODE */}
          <div className="col-span-1 relative group">
            <Motion.button
              variants={itemVariants}
              onClick={() => { triggerHaptic(10); onStartHardWords(); }}
              {...bentoMotionProps}
              className="w-full relative h-36 rounded-[6px] overflow-hidden bg-[#ef4444] border-none"
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-black font-heading text-white leading-none">پەیڤێن دژوار</h3>
                  <span className="text-[9px] font-medium font-rabar uppercase  text-white/50 mt-1 leading-none">بۆ شارەزایان</span>
                </div>
              </div>
            </Motion.button>
          </div>

          {/* WORD FEVER MODE */}
          <div className="col-span-1 relative group">
            <Motion.button
              variants={itemVariants}
              onClick={() => { triggerHaptic(10); onStartWordFever(); }}
              {...bentoMotionProps}
              className="w-full relative h-36 rounded-[6px] overflow-hidden bg-[#0ea5e9] border-none"
            >
              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-black font-heading text-white leading-none">تایا پەیڤان</h3>
                  <span className="text-[9px] font-medium font-rabar uppercase  text-white/50 mt-1 leading-none">بەرھەڤ بە</span>
                </div>
              </div>
            </Motion.button>
          </div>

          {/* SECRET MODE */}
          <div className="col-span-2 relative group">
            <Motion.button
              variants={itemVariants}
              disabled={!isSecretUnlocked}
              onClick={() => { triggerHaptic(10); if (isSecretUnlocked) onStartSecretWord(); }}
              {...(isSecretUnlocked ? bentoMotionProps : {})}
              className={`w-full relative h-24 rounded-[6px] overflow-hidden transition-all duration-500 border-none ${isSecretUnlocked
                  ? 'bg-linear-to-br from-[#2e1065] to-[#4c1d95] border-2 border-yellow-400/50'
                  : 'bg-mono-200 dark:bg-mono-900 border border-mono-300 dark:border-white/10'
                }`}
            >
              <div className="relative z-10 flex items-center justify-between px-8 h-full">
                <div className="flex flex-col items-start text-right">
                  <h3 className={`text-xl font-black font-heading ${isSecretUnlocked ? 'text-white' : 'text-mono-600 dark:text-mono-300'}`}>پەیڤا نھێنی</h3>
                  <div className={`flex items-center gap-1 mt-1 px-2.5 py-1 rounded-[4px] border transition-colors ${isSecretUnlocked ? 'bg-black/40 border-white/20' : 'bg-mono-200/50 dark:bg-black/40 border-mono-300 dark:border-white/10'}`}>
                    {[1, 2, 3].map((dot) => (
                      <span
                        key={dot}
                        className={`material-symbols-outlined text-[10px] transition-all duration-500 ${dot <= winsTowardsSecret
                            ? 'text-emerald-500 font-black'
                            : 'text-mono-400 dark:text-mono-800'
                          }`}
                      >
                        {dot <= winsTowardsSecret ? 'check' : 'circle'}
                      </span>
                    ))}
                    {!isSecretUnlocked && (
                      <span className="text-[8px] font-bold text-mono-500 dark:text-mono-400 mr-2 uppercase tracking-widest">
                        {winsTowardsSecret}/٣
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`material-symbols-outlined text-4xl transition-all ${isSecretUnlocked ? 'text-yellow-400 scale-110' : 'text-mono-500 dark:text-mono-400'
                    }`} style={{ fontVariationSettings: isSecretUnlocked ? "'FILL' 1" : "''" }}>
                    {isSecretUnlocked ? 'vpn_key' : 'lock'}
                  </span>
                </div>
              </div>
            </Motion.button>
          </div>
        </div>
      </div>
    </Motion.div>
  );
});

export default LobbyView;


