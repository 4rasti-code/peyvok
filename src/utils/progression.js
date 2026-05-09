/**
 * RPG PROGRESSION SYSTEM CONSTANTS
 * 
 * Standardized Leveling: 100 XP per level as requested.
 */

/**
 * Calculates the exact Total XP required to REACH a specific level.
 */
export const getTotalXPForLevel = (level) => {
  if (level <= 1) return 0;
  return (level - 1) * 100;
};

// 🏆 HARDCORE XP REWARDS (Nerfed for maximum challenge)
export const XP_REWARDS = {
  classic: 10,
  battle: 30,       // Multiplayer Win
  battle_draw: 5,   // Multiplayer Draw
  mamak: 15,        // Riddles Mode
  hard_words: 20,
  word_fever: 40,
  secret_word: 100
};

/**
 * 📈 HYBRID INFINITE LEVELING MATH
 * Phase 1: Levels 1-100 (Tiered Increments)
 * Phase 2: Levels 101+ (Infinite Exponential)
 */
export const getLevelFromXP = (totalXP) => {
  if (totalXP <= 0) return 1;

  let currentXP = totalXP;
  let level = 1;

  // Level 1-10: 500 XP per level
  for (let i = 1; i <= 10; i++) {
    if (currentXP >= 500) {
      currentXP -= 500;
      level++;
    } else return level;
  }

  // Level 11-25: 1000 XP per level
  for (let i = 11; i <= 25; i++) {
    if (currentXP >= 1000) {
      currentXP -= 1000;
      level++;
    } else return level;
  }

  // Level 26-50: 2500 XP per level
  for (let i = 26; i <= 50; i++) {
    if (currentXP >= 2500) {
      currentXP -= 2500;
      level++;
    } else return level;
  }

  // Level 51-100: 5000 XP per level
  for (let i = 51; i <= 100; i++) {
    if (currentXP >= 5000) {
      currentXP -= 5000;
      level++;
    } else return level;
  }

  // Level 101+: Exponential growth
  while (true) {
    const xpRequired = Math.floor(5000 * Math.pow(1.05, (level - 100)));
    if (currentXP >= xpRequired) {
      currentXP -= xpRequired;
      level++;
    } else break;
  }

  return level;
};

/**
 * Calculates detailed level data including progress percentage
 */
export const getLevelData = (totalXP) => {
  const level = getLevelFromXP(totalXP);
  
  // Calculate boundaries for the current level
  let currentLevelBaseXP = 0;
  
  // Sum up all previous levels
  for (let l = 1; l < level; l++) {
    if (l <= 10) currentLevelBaseXP += 500;
    else if (l <= 25) currentLevelBaseXP += 1000;
    else if (l <= 50) currentLevelBaseXP += 2500;
    else if (l <= 100) currentLevelBaseXP += 5000;
    else currentLevelBaseXP += Math.floor(5000 * Math.pow(1.05, (l - 100)));
  }

  // Calculate requirement for the NEXT level
  let nextLevelReq = 0;
  if (level <= 10) nextLevelReq = 500;
  else if (level <= 25) nextLevelReq = 1000;
  else if (level <= 50) nextLevelReq = 2500;
  else if (level <= 100) nextLevelReq = 5000;
  else nextLevelReq = Math.floor(5000 * Math.pow(1.05, (level - 100)));

  const xpInCurrentLevel = totalXP - currentLevelBaseXP;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / nextLevelReq) * 100));

  return {
    level,
    progressPercent,
    currentLevelBase: currentLevelBaseXP,
    nextLevelBase: currentLevelBaseXP + nextLevelReq,
    xpRequiredForNext: nextLevelReq,
    xpInCurrentLevel
  };
};

export const getRewardForMode = (mode) => {
  const xp = XP_REWARDS[mode] || 10;
  
  // Monetary rewards stay proportional to mode difficulty
  const monetary = {
    classic: { type: 'fils', amount: 50 },
    battle: { type: 'derhem', amount: 1 },
    battle_draw: { type: 'fils', amount: 20 },
    mamak: { type: 'fils', amount: 75 },
    hard_words: { type: 'fils', amount: 100 },
    word_fever: { type: 'fils', amount: 150 },
    secret_word: { type: 'derhem', amount: 5 }
  };

  const reward = monetary[mode] || { type: 'fils', amount: 50 };
  return { ...reward, xp };
};

/**
 * Returns the visual tier (colors) for a given level.
 * Based on the 5-level progression system.
 */
export const getLevelTier = (lvl) => {
  // Legendary Diamond Tier for 100+
  if (lvl > 100) {
    return { 
      name: 'Diamond',
      stop1: '#b4fbff', 
      stop2: '#d1a4ff', 
      shadow: 'rgba(180, 251, 255, 0.6)',
      isLegendary: true 
    };
  }

  const tiers = [
    { name: 'Bronze', stop1: '#cd7f32', stop2: '#f97316', shadow: 'rgba(249, 115, 22, 0.4)' },
    { name: 'Silver', stop1: '#cbd5e1', stop2: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.4)' },
    { name: 'Gold', stop1: '#fbbf24', stop2: '#d97706', shadow: 'rgba(245, 158, 11, 0.4)' },
    { name: 'Emerald', stop1: '#10b981', stop2: '#059669', shadow: 'rgba(16, 185, 129, 0.4)' },
    { name: 'Cyan', stop1: '#22d3ee', stop2: '#0891b2', shadow: 'rgba(6, 182, 212, 0.4)' },
    { name: 'Blue', stop1: '#3b82f6', stop2: '#2563eb', shadow: 'rgba(59, 130, 246, 0.4)' },
    { name: 'Indigo', stop1: '#6366f1', stop2: '#4f46e5', shadow: 'rgba(99, 102, 241, 0.4)' },
    { name: 'Purple', stop1: '#a855f7', stop2: '#7c3aed', shadow: 'rgba(168, 85, 247, 0.4)' },
    { name: 'Fuchsia', stop1: '#d946ef', stop2: '#c026d3', shadow: 'rgba(217, 70, 239, 0.4)' },
    { name: 'Pink', stop1: '#ec4899', stop2: '#db2777', shadow: 'rgba(236, 72, 153, 0.4)' },
    { name: 'Rose', stop1: '#f43f5e', stop2: '#e11d48', shadow: 'rgba(244, 63, 94, 0.4)' },
    { name: 'Red', stop1: '#ef4444', stop2: '#b91c1c', shadow: 'rgba(239, 68, 68, 0.4)' },
    { name: 'Orange', stop1: '#f97316', stop2: '#ea580c', shadow: 'rgba(249, 115, 22, 0.4)' },
    { name: 'Amber', stop1: '#f59e0b', stop2: '#d97706', shadow: 'rgba(245, 158, 11, 0.4)' },
    { name: 'Lime', stop1: '#84cc16', stop2: '#65a30d', shadow: 'rgba(132, 204, 22, 0.4)' },
    { name: 'Teal', stop1: '#14b8a6', stop2: '#0d9488', shadow: 'rgba(20, 184, 166, 0.4)' },
    { name: 'Sky', stop1: '#0ea5e9', stop2: '#0284c7', shadow: 'rgba(14, 165, 233, 0.4)' },
    { name: 'Violet', stop1: '#8b5cf6', stop2: '#7c3aed', shadow: 'rgba(139, 92, 246, 0.4)' },
    { name: 'Slate', stop1: '#64748b', stop2: '#334155', shadow: 'rgba(100, 116, 139, 0.4)' },
    { name: 'Midnight', stop1: '#1e293b', stop2: '#0f172a', shadow: 'rgba(30, 41, 59, 0.4)' },
  ];

  const tierIndex = Math.floor((lvl - 1) / 5);
  return tiers[Math.min(tierIndex, tiers.length - 1)];
};
