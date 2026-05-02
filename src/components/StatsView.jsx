import React from 'react';
import { motion } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';

export default function StatsView({ playerStats, rank, onViewChange }) {
  // Trophy Definition
  const trophies = [
    { id: 1, name: 'نۆبەرە', icon: 'emoji_events', color: 'text-orange-400', threshold: 10 },
    { id: 2, name: 'پالەوان', icon: 'military_tech', color: 'text-slate-300', threshold: 100 },
    { id: 3, name: 'مامۆستا', icon: 'workspace_premium', color: 'text-yellow-400', threshold: 250 },
    { id: 4, name: 'شانازیا کوردستانێ', icon: 'stars', color: 'text-purple-400', threshold: 500 },
    { id: 5, name: 'شانازییا جیھانێ', icon: 'diamond', color: 'text-blue-400', threshold: 1000 },
  ];

  const modeConfigs = [
    { id: 'classic', name: 'پەیڤچن کلاسیک', icon: 'history', color: 'bg-[#FDD017]', border: 'border-[#E6BC15]' },
    { id: 'mamak', name: 'مامک', icon: 'psychology', color: 'bg-[#A2E263]', border: 'border-[#8BCF4E]' },
    { id: 'secret_word', name: 'پەیڤا نهێنی', icon: 'vpn_key', color: 'bg-[#98A3F8]', border: 'border-[#7A85D9]' },
    { id: 'word_fever', name: 'تایا پەیڤان', icon: 'bolt', color: 'bg-[#7CA3F0]', border: 'border-[#6A8DDA]' },
    { id: 'hard_words', name: 'پەیڤێن دژوار', icon: 'exercise', color: 'bg-[#FC766F]', border: 'border-[#E65F58]' },
    { id: 'battle', name: 'هەڤڕکی سەرهێل', icon: 'swords', color: 'bg-[#FF9F1C]', border: 'border-[#E68A00]' }
  ];

  const totalWins = Object.values(playerStats || {}).reduce((acc, m) => acc + (m.totalXP ? 1 : 0), 0);
  const earnedTrophies = trophies.filter(t => (playerStats?.classic?.totalXP || 0) / 20 >= t.threshold);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-full pb-6"
    >

      {/* Stats Grid - High Density 2-column layout */}
      <div className="grid grid-cols-2 gap-3 px-3">
        {modeConfigs.map((mode) => {
          const mStats = playerStats?.[mode.id] || { score: 0, bestScore: 0, totalXP: 0 };

          return (
            <motion.div key={mode.id} variants={itemVariants} className="flex flex-col items-center relative overflow-visible h-full">
              <div className={`relative z-10 w-full h-[145px] overflow-hidden rounded-md ${mode.color} dark:opacity-90 border-b-4 ${mode.border} noise-grain flex flex-col transition-all active:border-b-0 active:translate-y-[2px] shadow-md`}>

                {/* Header Row */}
                <div className="flex items-center justify-between p-2.5 border-b border-mono-900/10">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-mono-900 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{mode.icon}</span>
                    <h3 className="text-[12px] font-black font-rabar text-mono-900 leading-tight">{mode.name}</h3>
                  </div>
                </div>

                {/* Stats Data */}
                <div className="flex-1 flex flex-col justify-center gap-0.5 px-3">
                  <div className="flex justify-between items-center py-1 border-b border-mono-900/5">
                    <span className="text-mono-900/60 text-[9px] font-bold uppercase no-stroke">باشترین</span>
                    <span className="text-mono-900 text-[13px] font-black tracking-normal">{toKuDigits(mStats.bestScore || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-mono-900/5">
                    <span className="text-mono-900/60 text-[9px] font-bold uppercase no-stroke">پەیڤێن دیتى</span>
                    <span className="text-mono-900 text-[13px] font-black tracking-normal">{toKuDigits(mStats.solvedCount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-mono-900/60 text-[9px] font-bold uppercase no-stroke">کۆما XP</span>
                    <span className="text-mono-900 text-[13px] font-black tracking-normal">{toKuDigits(mStats.totalXP || 0)}</span>
                  </div>
                </div>

                {/* Mode specific Rank for Battle - Removed as requested */}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trophies Collection Bento Card */}
      <motion.div variants={itemVariants} className="mt-4 mx-2">
        <div className="relative z-10 w-full overflow-hidden rounded-md bg-mono-50 dark:bg-mono-900 border border-mono-200 dark:border-mono-800 noise-grain p-4 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4 relative z-10 w-full">
            <div className="flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <h3 className="text-[13px] font-bold font-rabar text-mono-950 dark:text-mono-50 leading-tight uppercase tracking-normal">میدالیا و دەستکەفتن</h3>
          </div>

          <div className="grid grid-cols-5 gap-2 relative z-10">
            {trophies.map((trophy) => {
              const isEarned = totalWins >= trophy.threshold;
              return (
                <div key={trophy.id} className="flex flex-col items-center gap-1.5 group/trophy">
                  <div className={`w-full aspect-square rounded-md flex items-center justify-center relative transition-all duration-300 noise-grain ${isEarned ? 'bg-amber-500 border border-amber-400/30 shadow-sm' : 'bg-mono-100 dark:bg-mono-800 border border-mono-200 dark:border-mono-700/50 opacity-40'}`}>
                    <span className={`material-symbols-outlined text-lg ${isEarned ? 'text-white' : 'text-mono-400 dark:text-mono-500'}`} style={{ fontVariationSettings: isEarned ? "'FILL' 1" : "''" }}>
                      {trophy.icon}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold font-body uppercase tracking-normal no-stroke text-center truncate w-full mt-0.5 ${isEarned ? 'text-mono-900 dark:text-mono-100' : 'text-mono-400 dark:text-mono-600'}`}>
                    {trophy.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Hero Bento: Dictionary Feature Card */}
      <motion.div variants={itemVariants} className="mt-6 mb-4 mx-2">
        <button
          onClick={() => onViewChange('dictionary')}
          className="w-full min-h-[104px] rounded-2xl flex items-center justify-between px-8 group transition-all duration-500 puzzle-tile relative overflow-hidden border border-white/10"
        >
          {/* Enhanced Mesh Gradient Background */}
          <div className="absolute inset-0 bg-emerald-600/80" />
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500 via-teal-600 to-indigo-900 opacity-90" />

          {/* Central Glowing Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-400/10 rounded-full group-hover:scale-150 transition-transform duration-1000" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              {/* Icon Glow */}
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform duration-700 border border-white/40 relative z-10">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-white/60 text-[9px] font-black  uppercase tracking-normal mb-0.5 no-stroke">گەوھەرا زمانێ مە</span>
              <h3 className="text-2xl font-black font-rabar text-white text-pop">فەرھەنگا من</h3>
              <p className="text-white/40 text-[10px] font-bold font-body mt-0.5">ھەمی پەیڤێن تە د ڤێرێ نە</p>
            </div>
          </div>

          {/* Action Indicator */}
          <div className="flex flex-col items-center gap-1.5 relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:translate-x--1 transition-transform border border-white/10">
              <span className="material-symbols-outlined text-white text-xl font-black">chevron_left</span>
            </div>
            <span className="text-[8px] font-black text-white/50 uppercase tracking-normal hidden sm:block">ڤەکەرە</span>
          </div>

          {/* Premium Glass Highlights */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />

          {/* Animated Shimmer Overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
        </button>
      </motion.div>

    </motion.div>
  );
}
