import React from 'react';
import { motion as Motion } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';

const StatItem = ({ label, value, suffix = "" }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-black text-mono-900 dark:text-white tabular-nums">
      {toKuDigits(value)}{suffix}
    </span>
    <span className="text-[10px] font-bold text-mono-400 dark:text-mono-500 uppercase tracking-tighter text-center leading-none mt-1">
      {label}
    </span>
  </div>
);

const GuessBar = ({ label, value, maxValue, isCurrent }) => {
  const percentage = Math.max((value / maxValue) * 100, 7); // Min width to show the number
  
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs font-bold text-mono-500 dark:text-mono-400 w-3">{toKuDigits(label)}</span>
      <div className="flex-1 h-5 flex items-center">
        <Motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full flex items-center justify-end px-2 rounded-sm ${
            isCurrent 
              ? 'bg-emerald-500 text-white' 
              : 'bg-mono-200 dark:bg-mono-800 text-mono-700 dark:text-mono-300'
          }`}
        >
          <span className="text-[10px] font-black tabular-nums">{toKuDigits(value)}</span>
        </Motion.div>
      </div>
    </div>
  );
};

export default function ResultStats({ profileData, playerStats, gameMode, currentGuessCount }) {
  // 1. Calculate Stats
  const played = profileData?.games_played || 0;
  const won = profileData?.games_won || 0;
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
  const currentStreak = profileData?.current_streak || 0;
  const maxStreak = profileData?.max_streak || 0;

  // 2. Calculate Distribution for current mode or global
  // NYT usually shows it for the mode played.
  const rawDistribution = playerStats || profileData?.guess_distribution || {};
  const modeData = rawDistribution[gameMode] || {};
  const distribution = modeData.guess_distribution || modeData || {};

  // Fill in missing values 1-6
  const fullDist = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
  Object.entries(distribution).forEach(([key, val]) => {
    if (fullDist[key] !== undefined) fullDist[key] = val;
  });

  const maxValue = Math.max(...Object.values(fullDist), 1);

  return (
    <div className="w-full flex flex-col items-center gap-6 py-4 border-t border-mono-200 dark:border-white/5 mt-2">
      {/* Statistics Section */}
      <div className="w-full">
        <h3 className="text-[11px] font-black text-mono-400 dark:text-mono-500 uppercase ] mb-4 text-center">ئامار</h3>
        <div className="grid grid-cols-4 gap-2">
          <StatItem label="یاریێن کرین" value={played} />
          <StatItem label="ڕێژەیا سەرکەفتنێ" value={winRate} suffix="%" />
          <StatItem label="زنجیرەیا نۆکە" value={currentStreak} />
          <StatItem label="مەزنترین زنجیرە" value={maxStreak} />
        </div>
      </div>

      {/* Guess Distribution Section */}
      <div className="w-full">
        <h3 className="text-[11px] font-black text-mono-400 dark:text-mono-500 uppercase ] mb-4 text-center">دابەشکرنا پێکۆلان</h3>
        <div className="flex flex-col gap-1.5 w-full max-w-[280px] mx-auto">
          {Object.entries(fullDist).map(([key, val]) => (
            <GuessBar 
              key={key} 
              label={key} 
              value={val} 
              maxValue={maxValue} 
              isCurrent={parseInt(key) === currentGuessCount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


