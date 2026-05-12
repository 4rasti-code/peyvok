import { ACHIEVEMENTS_CONFIG, TIER_NAMES } from '../constants/achievements';

/**
 * Calculates the current tier and progress for a specific achievement.
 * 
 * @param {Object} achievement - Achievement configuration from ACHIEVEMENTS_CONFIG
 * @param {Object} profileData - User profile data from database
 * @returns {Object} { tier, currentProgress, nextThreshold, percent }
 */
export const calculateAchievementProgress = (achievement, profileData) => {
  const statValue = profileData?.[achievement.statKey] || 0;
  const thresholds = achievement.thresholds;
  
  let tierIndex = -1; // -1 = None, 0 = Bronze, 1 = Silver, 2 = Gold, 3 = Diamond
  
  for (let i = 0; i < thresholds.length; i++) {
    if (statValue >= thresholds[i]) {
      tierIndex = i;
    } else {
      break;
    }
  }

  const isMaxTier = tierIndex === thresholds.length - 1;
  const nextThreshold = isMaxTier ? thresholds[tierIndex] : thresholds[tierIndex + 1];
  const currentThreshold = tierIndex === -1 ? 0 : thresholds[tierIndex];
  
  // Calculate progress percent towards the NEXT tier
  // If at max tier, it's 100%
  let percent = 0;
  if (isMaxTier) {
    percent = 100;
  } else {
    const range = nextThreshold - currentThreshold;
    const progressInRange = statValue - currentThreshold;
    percent = Math.min(100, Math.max(0, (progressInRange / range) * 100));
  }

  return {
    tier: tierIndex === -1 ? null : TIER_NAMES[tierIndex],
    tierIndex,
    statValue,
    nextThreshold,
    percent
  };
};

/**
 * Aggregates all achievements for the current user.
 */
export const getAllAchievementsProgress = (profileData) => {
  return ACHIEVEMENTS_CONFIG.map(achievement => ({
    ...achievement,
    ...calculateAchievementProgress(achievement, profileData)
  }));
};
