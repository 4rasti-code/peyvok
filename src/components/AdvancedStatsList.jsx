import React from 'react';
import StatCard from './StatCard';

const FoundWordsGridIcon = () => {
 // Kurdish is RTL, so we place 'پ' on the far right and 'ک' on the far left.
 const letters = ['ک', 'ۆ', 'ڤ', 'ی', 'ە', 'پ'];
 return (
 <svg viewBox="0 0 97 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-22.5 max-w-full h-auto shrink-0 drop-shadow-sm">
 {letters.map((letter, i) => (
 <g key={i} transform={`translate(${i * 16 + 1}, 1)`}>
 <rect width="14" height="14" rx="2.5" fill="currentColor" />
 <text x="7" y="10.5" fontSize="10" fontWeight="900" fill="#fff" textAnchor="middle" style={{ fontFamily: 'system-ui, sans-serif' }}>
 {letter}
 </text>
 </g>
 ))}
 </svg>
 );
};

export default function AdvancedStatsList({ advancedStats, gamesLost = 0 }) {
 const assistedWins = advancedStats.assistedWins || 0;

 const metrics = [
 // Row 1: Word Stats
 { label: 'کۆما پەیڤێن دیتین', value: advancedStats.totalWords, icon: <FoundWordsGridIcon />, color: 'text-emerald-500' },
 { label: 'درێژترین پەیڤ', value: advancedStats.longestWord, icon: 'straighten', color: 'text-sky-500' },
 
 // Row 2: Win Types
 { label: 'سەرکەفتنێن بێ هاریکاری', value: advancedStats.flawlessWins, icon: 'auto_awesome', color: 'text-amber-500' },
 { label: 'سەرکەفتنێن ب هاریکاری', value: assistedWins, icon: 'handshake', color: 'text-violet-500' },
 
 // Row 3: Time Records
 { 
 label: 'بلەزترین سەرکەفتن', 
 value: advancedStats.fastestSolve > 0 ? (advancedStats.fastestSolve / 1000).toFixed(2) : 0, 
 icon: 'timer', 
 color: 'text-sky-500',
 suffix: 'چرکە'
 },
 { 
 label: 'ڕیکۆردێ تایا پەیڤان', 
 value: advancedStats.feverHighscore > 0 ? (advancedStats.feverHighscore / 1000).toFixed(2) : 0, 
 icon: 'bolt', 
 color: 'text-sky-500',
 suffix: 'چرکە'
 },

 // Row 4: General Status
 { label: 'کۆما ڕۆژێن بەشداریێ', value: advancedStats.totalActiveDays, icon: 'calendar_month', color: 'text-rose-500' },
 { label: 'یاریێن دۆڕاندی', value: gamesLost, icon: 'heart_broken', color: 'text-red-500' }
 ];

 return (
 <div className="flex flex-col gap-4">
 <div className="flex items-center gap-3 px-1">
 <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
 <span className="text-[9px] font-black text-mono-400 dark:text-mono-500 uppercase">ئامارێن پێشکەفتی</span>
 <div className="h-px flex-1 bg-mono-100 dark:bg-mono-800" />
 </div>

 <div className="grid grid-cols-2 gap-3">
 {metrics.map((metric, i) => (
 <StatCard
 key={i}
 label={metric.label}
 value={metric.value}
 icon={metric.icon}
 color={metric.color}
 suffix={metric.value > 0 && metric.suffix ? metric.suffix : ''}
 className={metrics.length % 2 !== 0 && i === metrics.length - 1 ? 'col-span-2' : ''}
 />
 ))}
 </div>
 </div>
 );
}
