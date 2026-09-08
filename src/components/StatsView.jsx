import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { useAudio } from '../context/AudioContext';
import { toKuDigits } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';
import StatCard from './StatCard';
import StatsDistributionChart from './StatsDistributionChart';
import AdvancedStatsList from './AdvancedStatsList';

import ClashingSwords from './ClashingSwords';
import ClassicIcon from './ClassicIcon';
import MamakIcon from './MamakIcon';
import CubeIcon from './CubeIcon';
import TimerIcon from './TimerIcon';

const modeConfigs = [
 { id: 'battle', name: 'هەڤڕکی سەرهێل', icon: ClashingSwords, iconProps: {}, color: 'bg-orange-500', textColor: 'text-orange-500', maxAttempts: 3, bgColor: 'bg-mono-100 dark:bg-mono-900 shadow-[0_5px_0_#e5e5e5] dark:shadow-[0_5px_0_#111111]', theme: 'adaptive' },
 { id: 'classic', name: 'کلاسیك', icon: ClassicIcon, iconProps: { continuous: true }, color: 'bg-amber-500', textColor: 'text-amber-500', maxAttempts: 6, bgColor: 'bg-[#ffcc00] shadow-[0_5px_0_#cc9900]', theme: 'light' },
 { id: 'mamak', name: 'مامک', icon: MamakIcon, iconProps: {}, color: 'bg-emerald-500', textColor: 'text-emerald-500', maxAttempts: 6, bgColor: 'bg-[#22c55e] shadow-[0_5px_0_#16a34a]', theme: 'dark' },
 { id: 'hard_words', name: 'پەیڤێن دژوار', icon: CubeIcon, iconProps: {}, color: 'bg-rose-500', textColor: 'text-rose-500', maxAttempts: 6, bgColor: 'bg-[#ef4444] shadow-[0_5px_0_#dc2626]', theme: 'dark' },
 { id: 'word_fever', name: 'تایا پەیڤان', icon: TimerIcon, iconProps: {}, color: 'bg-sky-500', textColor: 'text-sky-500', maxAttempts: 3, bgColor: 'bg-[#0ea5e9] shadow-[0_5px_0_#0284c7]', theme: 'dark' }
];

export default function StatsView({ 
 profileData,
 playerStats, 
 onViewChange
}) {

 const { playSettingsCloseSound } = useAudio();
 
 // --- LEGACY FALLBACK FOR PUBLIC VIEWING ---
 const { legacyStats, advancedLegacyStats } = useMemo(() => {
 let played = profileData?.games_played || 0;
 let won = profileData?.games_won || 0;
 let totalWords = profileData?.total_words_found || 0;
 let rawDist = playerStats || profileData?.guess_distribution || profileData?.statistics || {};

 const oldStats = profileData?.inventory?.stats || profileData?.statistics;
 
 if (oldStats) {
 let legacyWon = 0;
 let legacyPlayed = 0;
 Object.values(oldStats).forEach(m => {
 legacyWon += (Number(m.solvedCount) || 0);
 legacyPlayed += (Number(m.playedCount) || Number(m.solvedCount) || 0);
 });
 
 // If legacy wins are higher, it means the DB hasn't been migrated yet for this user
 if (legacyWon > won) {
 won = Math.max(won, legacyWon);
 played = Math.max(played, legacyPlayed, legacyWon);
 
 const inventoryWordsCount = Array.isArray(profileData?.inventory?.solved_words) ? profileData.inventory.solved_words.length : 0;
 const remoteWordsCount = Array.isArray(profileData?.solved_words) ? profileData.solved_words.length : 0;
 totalWords = Math.max(totalWords, inventoryWordsCount, remoteWordsCount, legacyWon);
 
 if (Object.keys(rawDist).length === 0) {
 rawDist = oldStats;
 }
 }
 }
 
 return {
 legacyStats: {
 played,
 won,
 currentStreak: profileData?.current_streak || 0,
 maxStreak: profileData?.max_streak || 0,
 rawDistribution: rawDist
 },
 advancedLegacyStats: {
 pvpWins: Math.max(profileData?.mode_play_counts?.battle || 0, profileData?.pvp_wins || 0, oldStats?.battle?.solvedCount || 0),
 totalWords,
 longestWord: profileData?.longest_word_length || 0,
 fastestSolve: profileData?.fastest_solve_ms || 0,
 flawlessWins: profileData?.flawless_wins || 0,
 totalActiveDays: Math.max((played > 0 || profileData?.pvp_wins > 0) ? 1 : 0, profileData?.total_active_days || 0),
 feverHighscore: Math.max(profileData?.fever_highscore || 0, oldStats?.word_fever?.bestScore || 0),
 modePlayCounts: profileData?.mode_play_counts || {},
 secretWins: profileData?.secret_wins || 0,
 riddlesNoSkip: profileData?.riddles_no_skip || 0,
 pvpFlawlessWins: profileData?.pvp_flawless_wins || 0,
 assistedWins: profileData?.assisted_wins || 0
 }
 };
 }, [profileData, playerStats]);

 const stats = legacyStats;
 const advancedStats = advancedLegacyStats;

 // Combine Single Player and Multiplayer Stats for Unified Display
 const pvpWins = advancedStats.pvpWins || 0;
 const pvpLosses = advancedStats.modePlayCounts?.battle_loss || 0;
 const pvpDraws = advancedStats.modePlayCounts?.battle_draw || 0;
 const pvpPlayed = pvpWins + pvpLosses + pvpDraws;

 const totalPlayed = stats.played + pvpPlayed;
 const totalWon = stats.won + pvpWins;
 const totalLost = Math.max(0, totalPlayed - totalWon - pvpDraws);
 const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;



 const globalDist = useMemo(() => {
 const dist = { "1":0, "2":0, "3":0, "4":0, "5":0, "6":0 };
 
 Object.entries(stats.rawDistribution).forEach(([key, modeData]) => {
 // If the key is a direct guess number (old flat structure)
 if (['1','2','3','4','5','6'].includes(key)) {
 if (typeof modeData === 'number') dist[key] += modeData;
 } else {
 // Handle nested mode structures
 const modeDist = modeData?.guess_distribution || modeData || {};
 Object.entries(modeDist).forEach(([k, val]) => {
 if (dist[k] !== undefined && typeof val === 'number') dist[k] += val;
 });
 }
 });
 return dist;
 }, [stats.rawDistribution]);

 const maxGlobalDist = Math.max(1, ...Object.values(globalDist));

 const modeUsage = useMemo(() => {
 // Battle plays correctly counts wins, losses, and draws
 const battlePlays = (advancedStats.pvpWins || 0) + 
 (advancedStats.modePlayCounts?.battle_loss || 0) + 
 (advancedStats.modePlayCounts?.battle_draw || 0);

 // stats.played reliably holds ALL single-player games (wins + losses)
 const singlePlayerTotalPlayed = stats.played || 0;

 const mamak = advancedStats.modePlayCounts?.mamak || 0;
 const hard_words = advancedStats.modePlayCounts?.hard_words || 0;
 const word_fever = advancedStats.modePlayCounts?.word_fever || 0;

 // DEDUCE true classic games by subtracting other single-player modes from the reliable total
 let trueClassicCount = singlePlayerTotalPlayed - (mamak + hard_words + word_fever);

 // Fallback safety: ensure it never drops below the raw recorded classic count
 trueClassicCount = Math.max(trueClassicCount, advancedStats.modePlayCounts?.classic || 0);

 const counts = {
 classic: trueClassicCount,
 mamak,
 hard_words,
 word_fever,
 battle: battlePlays
 };
 
 // The sum of these counts will now perfectly equal totalPlayed
 const total = Object.values(counts).reduce((a, b) => a + b, 0);
 
 let max = -1;
 let dominant = 'classic';
 Object.entries(counts).forEach(([id, val]) => {
 if (val > max) { max = val; dominant = id; }
 });

 const archetypes = {
 classic: { title: 'پەیڤدۆستێ گشتی 🌟', color: 'text-amber-500' },
 mamak: { title: 'مێشکێ ڤەکۆلەر 🕵️', color: 'text-emerald-500' },
 hard_words: { title: 'مێشکێ زێڕین 🧠', color: 'text-rose-500' },
 word_fever: { title: 'یاریزانێ بلەز ⚡', color: 'text-sky-500' },
 battle: { title: 'شەڕکەرێ مەیدانێ ⚔️', color: 'text-orange-500' }
 };

 return {
 counts,
 total,
 dominant,
 archetype: archetypes[dominant]
 };
 }, [advancedStats, stats.played]);

 const containerVariants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
 };

 const itemVariants = {
 hidden: { y: 15, opacity: 0 },
 visible: { y: 0, opacity: 1 }
 };

 return (
 <div className="min-h-screen bg-mono-white dark:bg-black flex flex-col items-center safe-top safe-bottom overflow-x-hidden transition-colors duration-500" dir="rtl">
 {/* Header */}
 <div className="w-full max-w-lg flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+8px)] pb-2 sticky top-0 z-50 bg-mono-white/80 dark:bg-black/95 border-b border-mono-100 dark:border-mono-800/30">
 <button 
 onClick={() => { triggerHaptic(10); playSettingsCloseSound(); onViewChange('profile'); }}
 className="w-10 h-10 rounded-sm bg-mono-50 dark:bg-white/5 border border-mono-200 dark:border-white/10 flex items-center justify-center text-mono-600 dark:text-white/60 hover:bg-mono-100 dark:hover:bg-white/10 transition-all active:scale-90"
 >
 <span className="material-symbols-outlined">arrow_forward</span>
 </button>
 <div className="flex flex-col items-center">
 <h2 className="text-xl font-black font-rabar text-mono-900 dark:text-white uppercase leading-none mt-1">
 {profileData?.nickname ? `ئامارێن ${profileData.nickname}` : 'ئامار'}
 </h2>
 </div>
 <div className="w-10" />
 </div>

 <div className="w-full max-w-lg overflow-y-auto no-scrollbar pb-40 px-6 pt-6">
 <Motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="flex flex-col gap-6"
 >
 {/* 1. Core Performance Grid */}
 <Motion.div variants={itemVariants} className="grid grid-cols-4 gap-3 mb-4">
 <StatCard label="یاریێن کرین" value={totalPlayed} icon="sports_esports" />
 <StatCard label="ڕێژەیا سەرکەفتنێ" value={winRate} suffix="٪" icon="emoji_events" />
 <StatCard label="زنجیرەیا نۆکە" value={stats.currentStreak} icon="local_fire_department" />
 <StatCard label="مەزنترین زنجیرە" value={stats.maxStreak} icon="military_tech" />
 </Motion.div>

 <div className="flex flex-col gap-4">
 {/* Advanced Stats Pass totalLost */}
 <AdvancedStatsList advancedStats={advancedStats} gamesLost={totalLost} />
 </div>

 {/* 3. Global Distribution Chart */}
 <Motion.div variants={itemVariants}>
 <StatsDistributionChart 
 title="دابەشکرنا پێکۆلان (گشتی)" 
 dist={globalDist} 
 maxValue={maxGlobalDist} 
 color="bg-white" 
 textColor="text-white"
 bgColor="bg-indigo-500 shadow-[0_5px_0_#4338ca]"
 theme="dark"
 icon="analytics"
 />
 </Motion.div>

 {/* 4. Mode Preference Bar */}
 {modeUsage.total > 0 && (
 <Motion.div variants={itemVariants} className="mt-2 mb-2">
 <div className="bg-mono-white dark:bg-mono-900/40 rounded-[12px] p-4 shadow-sm border border-mono-200 dark:border-mono-800/60 relative overflow-hidden">
 {/* Background glow based on archetype color */}
 <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] pointer-events-none rounded-bl-full ${modeUsage.archetype.color.replace('text-', 'bg-')}`}></div>

 <div className="flex items-center justify-between mb-4 relative z-10">
 <span className="text-[13px] font-black text-mono-900 dark:text-white uppercase font-rabar drop-shadow-sm">حەزێن یاریزانی</span>
 <div className={`text-[11px] font-black uppercase tracking-wider ${modeUsage.archetype.color} drop-shadow-sm flex items-center gap-1`}>
 ناسنامە: {modeUsage.archetype.title}
 </div>
 </div>
 
 {/* Segmented Bar */}
 <div className="w-full h-4 bg-mono-200/50 dark:bg-black/50 rounded-full overflow-hidden flex shadow-inner border border-mono-300/30 dark:border-white/5 relative z-10">
 {modeConfigs.map(mode => {
 const count = modeUsage.counts[mode.id] || 0;
 if (count === 0) return null;
 const percentage = (count / modeUsage.total) * 100;
 
 const bgColors = {
 classic: 'bg-amber-400',
 mamak: 'bg-emerald-400',
 hard_words: 'bg-rose-500',
 word_fever: 'bg-sky-400',
 battle: 'bg-orange-500'
 };

 return (
 <div 
 key={mode.id} 
 className={`h-full ${bgColors[mode.id] || 'bg-mono-300'} transition-all duration-1000 ease-out`}
 style={{ width: `${percentage}%` }}
 title={`${mode.name}: ${count}`}
 />
 );
 })}
 </div>

 {/* Legend */}
 <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 relative z-10">
 {modeConfigs.map(mode => {
 const count = modeUsage.counts[mode.id] || 0;
 if (count === 0) return null;
 const percentage = Math.round((count / modeUsage.total) * 100);

 return (
 <div key={mode.id} className="flex items-center gap-1.5 px-1">
 <div className={`flex items-center justify-center ${mode.id === 'classic' ? 'w-8' : 'w-4'} h-4`}>
 <div className="scale-[0.25] origin-center flex items-center justify-center pointer-events-none w-16 h-16">
 <mode.icon className="w-16 h-16" {...(mode.iconProps || {})} />
 </div>
 </div>
 <span className="text-[11px] font-bold text-mono-700 dark:text-mono-300 mt-0.5">
 {mode.name} <span className="opacity-60 ml-0.5 tabular-nums">({percentage}%)</span>
 </span>
 </div>
 );
 })}
 </div>
 </div>
 </Motion.div>
 )}

 {/* 5. Individual Mode Distributions */}
 <div className="flex flex-col gap-4 mt-4">
 <div className="flex items-center gap-3 px-1 mt-4">
 <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
 <span className="text-[9px] font-black text-mono-400 dark:text-mono-500 uppercase">دابەشکرنا مۆدان</span>
 <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
 </div>
 
 {modeConfigs.map((mode) => {
 if (mode.id === 'battle') {
 const wins = advancedStats.pvpWins || 0;
 const losses = advancedStats.modePlayCounts?.['battle_loss'] || 0;
 const draws = advancedStats.modePlayCounts?.['battle_draw'] || 0;
 
 return (
 <Motion.div key={mode.id} variants={itemVariants}>
 <div className={`${mode.bgColor} mb-1 rounded-[12px] p-4 transition-all duration-300`}>
 <div className="flex items-center justify-center gap-2 mb-4">
 <mode.icon className={`h-6 ${mode.id === 'classic' ? 'w-16' : 'w-6'}`} />
 <h4 className={`text-[14px] font-black uppercase font-rabar drop-shadow-sm ${mode.theme === 'light' ? 'text-amber-950' : mode.theme === 'adaptive' ? 'text-mono-900 dark:text-white' : 'text-white'}`}>ئامارێن: {mode.name}</h4>
 </div>
 
 <div className="flex items-stretch justify-center gap-2 h-24">
 <div className="flex-1 flex flex-col items-center justify-center rounded-[8px] bg-[#2563EB] text-white shadow-sm overflow-hidden relative">
 <div className="flex items-center gap-1.5 mb-1 z-10">
 <div className="w-1.5 h-1.5 bg-white rotate-45"></div>
 <span className="text-[11px] font-black uppercase mt-1">سەرکەفتن</span>
 </div>
 <span className="text-3xl font-black tabular-nums z-10 leading-none">{toKuDigits(wins)}</span>
 <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
 </div>
 
 <div className="w-21.25 flex flex-col items-center justify-center rounded-[8px] bg-slate-400 dark:bg-slate-600 text-white shadow-sm overflow-hidden relative">
 <div className="flex items-center gap-1.5 mb-1 z-10">
 <div className="w-1 h-1 bg-white/80 rotate-45"></div>
 <span className="text-[9px] font-black uppercase mt-1 text-white/90">یەکسانبوون</span>
 </div>
 <span className="text-xl font-black tabular-nums z-10 leading-none">{toKuDigits(draws)}</span>
 <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
 </div>

 <div className="flex-1 flex flex-col items-center justify-center rounded-[8px] bg-[#DC2626] text-white shadow-sm overflow-hidden relative">
 <div className="flex items-center gap-1.5 mb-1 z-10">
 <div className="w-1.5 h-1.5 bg-white rotate-45"></div>
 <span className="text-[11px] font-black uppercase mt-1">سەرنەکەفتن</span>
 </div>
 <span className="text-3xl font-black tabular-nums z-10 leading-none">{toKuDigits(losses)}</span>
 <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
 </div>
 </div>
 </div>
 </Motion.div>
 );
 }
 
 const dist = {};
 for (let i = 1; i <= mode.maxAttempts; i++) dist[i.toString()] = 0;
 
 if (mode.id === 'classic') {
 const newClassicDist = stats.rawDistribution['classic']?.guess_distribution || stats.rawDistribution['classic'] || {};
 for (let i = 1; i <= mode.maxAttempts; i++) {
 const key = i.toString();
 const oldVal = typeof stats.rawDistribution[key] === 'number' ? stats.rawDistribution[key] : 0;
 const newVal = typeof newClassicDist[key] === 'number' ? newClassicDist[key] : 0;
 dist[key] = oldVal + newVal;
 }
 } else {
 const modeData = stats.rawDistribution[mode.id] || {};
 const rawModeDist = modeData.guess_distribution || modeData || {};
 Object.entries(rawModeDist).forEach(([key, val]) => {
 if (dist[key] !== undefined && typeof val === 'number') dist[key] = val;
 });
 }
 
 const maxValue = Math.max(...Object.values(dist), 1);

 return (
 <Motion.div key={mode.id} variants={itemVariants}>
 <StatsDistributionChart 
 title={`دابەشکرنا: ${mode.name}`} 
 dist={dist} 
 maxValue={maxValue} 
 color={mode.color} 
 textColor={mode.textColor}
 icon={mode.icon}
 iconProps={mode.iconProps}
 modeId={mode.id}
 bgColor={mode.bgColor}
 theme={mode.theme}
 />
 </Motion.div>
 );
 })}
 </div>
 </Motion.div>
 </div>
 </div>
 );
}
