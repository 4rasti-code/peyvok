import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';
import AchievementsView from './AchievementsView';

export default function StatsView({ 
  profileData,
  playerStats, 
  onViewChange,
  initialTab = 'stats'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync with initialTab if it changes (e.g. when opening from different menu buttons)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const modeConfigs = [
    { id: 'classic', name: 'کلاسیك', icon: 'videogame_asset', color: 'bg-amber-500', textColor: 'text-amber-500', maxAttempts: 6 },
    { id: 'mamak', name: 'مامک', icon: 'quiz', color: 'bg-emerald-500', textColor: 'text-emerald-500', maxAttempts: 6 },
    { id: 'hard_words', name: 'پەیڤێن دژوار', icon: 'psychology', color: 'bg-rose-500', textColor: 'text-rose-500', maxAttempts: 6 },
    { id: 'word_fever', name: 'تایا پەیڤان', icon: 'timer', color: 'bg-sky-500', textColor: 'text-sky-500', maxAttempts: 3 },
    { id: 'battle', name: 'هەڤڕکی سەرهێل', icon: 'swords', color: 'bg-orange-500', textColor: 'text-orange-500', maxAttempts: 3 },
    { id: 'secret_word', name: 'پەیڤا نەهێنی', icon: 'lock', color: 'bg-mono-400', textColor: 'text-mono-400', maxAttempts: 1 }
  ];

  // Core Stats
  const stats = {
    played: profileData?.games_played || 0,
    won: profileData?.games_won || 0,
    currentStreak: profileData?.current_streak || 0,
    maxStreak: profileData?.max_streak || 0,
    rawDistribution: playerStats || profileData?.guess_distribution || {}
  };

  // Advanced Stats
  const advancedStats = {
    pvpWins: profileData?.pvp_wins || 0,
    totalWords: profileData?.total_words_found || 0,
    longestWord: profileData?.longest_word_length || 0,
    fastestSolve: profileData?.fastest_solve_ms || 0,
    flawlessWins: profileData?.flawless_wins || 0,
    totalActiveDays: profileData?.total_active_days || 0,
    feverHighscore: profileData?.fever_highscore || 0,
    modePlayCounts: profileData?.mode_play_counts || {}
  };

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  // Calculate Most Played Mode
  const mostPlayedMode = useMemo(() => {
    let max = -1;
    let modeId = 'classic';
    Object.entries(advancedStats.modePlayCounts).forEach(([id, count]) => {
      if (count > max) {
        max = count;
        modeId = id;
      }
    });
    return modeConfigs.find(m => m.id === modeId)?.name || 'کلاسیك';
  }, [advancedStats.modePlayCounts]);

  // Global distribution calculation
  const globalDist = useMemo(() => {
    const dist = { "1":0, "2":0, "3":0, "4":0, "5":0, "6":0 };
    Object.values(stats.rawDistribution).forEach(modeData => {
      // Handle both old flat structure and new nested playerStats structure
      const modeDist = modeData?.guess_distribution || modeData || {};
      Object.entries(modeDist).forEach(([key, val]) => {
        if (dist[key] !== undefined && typeof val === 'number') dist[key] += val;
      });
    });
    return dist;
  }, [stats.rawDistribution]);

  const maxGlobalDist = Math.max(...Object.values(globalDist), 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const ChartSection = ({ title, dist, maxValue, color, textColor, icon, modeId }) => (
    <div className="bg-mono-white dark:bg-mono-900/30 rounded-[6px] border border-mono-200 dark:border-mono-800 p-5 backdrop-blur-sm transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <span className={`material-symbols-outlined ${textColor} text-2xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon || 'bar_chart'}</span>
        <h4 className="text-[11px] font-black text-mono-800 dark:text-mono-200 uppercase tracking-widest font-rabar">{title}</h4>
      </div>
      <div className="space-y-3">
        {Object.entries(dist).map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <span className="text-[11px] font-black text-mono-400 w-3 tabular-nums text-left">{toKuDigits(key)}</span>
            <div className="flex-1 h-6 bg-mono-100/50 dark:bg-mono-800/40 rounded-[4px] overflow-hidden relative border border-mono-200/30 dark:border-mono-700/20">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(value / maxValue) * 100}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full min-w-[28px] flex items-center justify-end px-2.5 relative ${value > 0 ? color : 'bg-mono-200 dark:bg-mono-800/60'}`}
              >
                {value > 0 && <div className="absolute inset-0 bg-white/10" />}
                <span className="text-[10px] font-black text-white tabular-nums drop-shadow-sm">{toKuDigits(value)}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mono-white dark:bg-mono-950 flex flex-col items-center safe-top safe-bottom overflow-x-hidden transition-colors duration-500" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between px-6 py-4 sticky top-0 z-50 bg-mono-white/80 dark:bg-mono-950/80 backdrop-blur-xl border-b border-mono-100 dark:border-mono-800/30">
        <button 
          onClick={() => { triggerHaptic(10); onViewChange('lobby'); }}
          className="w-10 h-10 rounded-[4px] bg-mono-50 dark:bg-white/5 border border-mono-200 dark:border-white/10 flex items-center justify-center text-mono-600 dark:text-white/60 hover:bg-mono-100 dark:hover:bg-white/10 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <h2 className="text-xl font-black font-rabar text-mono-900 dark:text-white uppercase tracking-tight">ئامار</h2>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-lg overflow-y-auto no-scrollbar pb-40 px-6 pt-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* 1. Core Performance Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
            {[
              { label: 'یاریێن کرین', value: stats.played, icon: 'sports_esports' },
              { label: 'ڕێژەیا سەرکەفتنێ', value: winRate, suffix: '%', icon: 'emoji_events' },
              { label: 'زنجیرەیا نۆکە', value: stats.currentStreak, icon: 'local_fire_department' },
              { label: 'مەزنترین زنجیرە', value: stats.maxStreak, icon: 'military_tech' }
            ].map((item, idx) => (
              <div key={idx} className="bg-mono-white dark:bg-mono-900/40 rounded-[6px] border border-mono-200 dark:border-mono-800/60 p-3.5 flex flex-col items-center gap-1 shadow-sm transition-transform hover:scale-[1.02]">
                <span className="text-base font-black text-mono-900 dark:text-white tabular-nums tracking-tight">
                  {toKuDigits(item.value)}{item.suffix || ''}
                </span>
                <span className="text-[8px] font-black text-mono-400 dark:text-mono-500 uppercase tracking-widest text-center leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* 2. Advanced Gamer Metrics */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
              <span className="text-[9px] font-black text-mono-400 dark:text-mono-500 uppercase tracking-[0.3em]">ئامارێن پێشکەفتی</span>
              <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'سەرکەفتنێن سەرهێل', value: advancedStats.pvpWins, icon: 'swords', color: 'text-orange-500' },
                { label: 'کۆما پەیڤێن دیتین', value: advancedStats.totalWords, icon: 'dictionary', color: 'text-emerald-500' },
                { label: 'درێژترین پەیڤ', value: advancedStats.longestWord, icon: 'straighten', color: 'text-sky-500' },
                { label: 'سەرکەفتنێن بێ هاریکاری', value: advancedStats.flawlessWins, icon: 'auto_awesome', color: 'text-amber-500' },
                { label: 'کۆما ڕۆژێن بەشداریێ', value: advancedStats.totalActiveDays, icon: 'calendar_month', color: 'text-rose-500' },
                { label: 'ڕیکۆردێ تایا پەیڤان', value: advancedStats.feverHighscore, icon: 'bolt', color: 'text-sky-500' }
              ].map((metric, idx) => (
                <div key={idx} className="bg-mono-white dark:bg-mono-900/40 rounded-[6px] border border-mono-200 dark:border-mono-800 p-4 flex items-center justify-between shadow-sm transition-all hover:border-mono-300 dark:hover:border-mono-700">
                  <div className="flex items-center gap-4">
                    <span className={`material-symbols-outlined ${metric.color} text-2xl`}>{metric.icon}</span>
                    <span className="text-[10px] font-bold text-mono-400 dark:text-mono-500 uppercase tracking-tight">{metric.label}</span>
                  </div>
                  <span className="text-base font-black text-mono-900 dark:text-white tabular-nums">{toKuDigits(metric.value)}</span>
                </div>
              ))}
            </div>

            <div className="bg-mono-white dark:bg-mono-900/40 rounded-[6px] border border-mono-200 dark:border-mono-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-rose-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <span className="text-[10px] font-bold text-mono-400 dark:text-mono-500 uppercase tracking-tight">مۆدێ دڵخواز</span>
              </div>
              <span className="text-sm font-black text-mono-900 dark:text-white">{mostPlayedMode}</span>
            </div>

            {advancedStats.fastestSolve > 0 && (
              <div className="bg-mono-white dark:bg-mono-900/40 rounded-[6px] border border-mono-200 dark:border-mono-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-sky-500 text-2xl">timer</span>
                  <span className="text-[10px] font-bold text-mono-400 dark:text-mono-500 uppercase tracking-tight">خێراترین سەرکەفتن</span>
                </div>
                <span className="text-sm font-black text-mono-900 dark:text-white tabular-nums">{toKuDigits((advancedStats.fastestSolve / 1000).toFixed(2))} چرکە</span>
              </div>
            )}
          </motion.div>

          {/* 3. Global Distribution Chart */}
          <motion.div variants={itemVariants}>
            <ChartSection 
              title="دابەشکرنا هەوڵدانان (گشتی)" 
              dist={globalDist} 
              maxValue={maxGlobalDist} 
              color="bg-primary" 
              textColor="text-primary"
              icon="analytics"
            />
          </motion.div>

          {/* 4. Individual Mode Distributions */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 px-1 mt-4">
              <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
              <span className="text-[9px] font-black text-mono-400 dark:text-mono-500 uppercase tracking-[0.3em]">دابەشکرنا مۆدان</span>
              <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
            </div>
            
            {modeConfigs.map((mode) => {
              const dist = {};
              for (let i = 1; i <= mode.maxAttempts; i++) dist[i.toString()] = 0;
              
              const modeData = stats.rawDistribution[mode.id] || {};
              const rawModeDist = modeData.guess_distribution || modeData || {};

              Object.entries(rawModeDist).forEach(([key, val]) => {
                if (dist[key] !== undefined && typeof val === 'number') dist[key] = val;
              });
              const maxValue = Math.max(...Object.values(dist), 1);

              return (
                <motion.div key={mode.id} variants={itemVariants}>
                  <ChartSection 
                    title={`دابەشکرنا: ${mode.name}`} 
                    dist={dist} 
                    maxValue={maxValue} 
                    color={mode.color} 
                    textColor={mode.textColor}
                    icon={mode.icon}
                    modeId={mode.id}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
