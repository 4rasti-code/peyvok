import React from 'react';
import { motion as Motion} from 'framer-motion';
import { ACHIEVEMENTS_CONFIG, TIER_COLORS } from '../constants/achievements';
import { getAllAchievementsProgress } from '../utils/achievementUtils';
import { triggerHaptic } from '../utils/haptics';

const AchievementsView = ({ profileData, onViewChange }) => {
  const achievements = getAllAchievementsProgress(profileData);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

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
        <h2 className="text-xl font-black font-rabar text-mono-900 dark:text-white uppercase tracking-tight">دەستکەفت</h2>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-lg overflow-y-auto no-scrollbar pb-40 px-6 pt-6">
        <Motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4"
        >
          {achievements.map((achievement) => {
            const tierColor = achievement.tier ? TIER_COLORS[achievement.tier] : '#94a3b8'; // gray-400 for locked
            
            return (
              <Motion.div
                key={achievement.id}
                variants={item}
                className="bg-mono-white dark:bg-mono-900/60 border border-mono-200 dark:border-mono-800 rounded-[16px] p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Background Tier Tint */}
                {achievement.tier && (
                  <div 
                    className="absolute top-0 left-0 w-1 h-full" 
                    style={{ backgroundColor: tierColor }}
                  />
                )}

                <div className="flex items-start gap-4">
                  {/* Icon Container */}
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center relative ${!achievement.tier ? 'grayscale opacity-50 bg-mono-100 dark:bg-mono-800' : ''}`}
                    style={{ backgroundColor: achievement.tier ? `${tierColor}20` : undefined }}
                  >
                    <span 
                      className="material-symbols-outlined text-2xl"
                      style={{ color: achievement.tier ? tierColor : undefined }}
                    >
                      {achievement.icon}
                    </span>
                    
                    {/* Tier Indicator Tag */}
                    {achievement.tier && (
                      <div 
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-mono-white dark:border-mono-900 shadow-sm"
                        style={{ backgroundColor: tierColor }}
                      >
                        <span className="text-[8px] font-black text-mono-900">
                          {achievement.tierIndex + 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-mono-900 dark:text-mono-100 leading-tight">
                          {achievement.name}
                        </h3>
                        <p className="text-[11px] text-mono-500 dark:text-mono-400 mt-0.5">
                          {achievement.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-mono-700 dark:text-mono-300">
                          {achievement.statValue}
                        </span>
                        <span className="text-[10px] text-mono-400 dark:text-mono-500 mr-1">
                          / {achievement.nextThreshold}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: tierColor }}>
                          {achievement.tierIndex === -1 ? 'قفل' : 
                          achievement.tierIndex === 0 ? 'برۆنزی' : 
                          achievement.tierIndex === 1 ? 'زیڤی' : 
                          achievement.tierIndex === 2 ? 'زێڕین' : 'ئەڵماسی'}
                        </span>
                        <span className="text-[10px] text-mono-400 dark:text-mono-500 font-mono">
                          {Math.floor(achievement.percent)}%
                        </span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-mono-100 dark:bg-mono-800 rounded-full overflow-hidden">
                        <Motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.percent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                          style={{ 
                            backgroundColor: tierColor,
                            boxShadow: achievement.tier ? `0 0 10px ${tierColor}40` : 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Motion.div>
            );
          })}
        </Motion.div>
      </div>
    </div>
  );
};

export default AchievementsView;

