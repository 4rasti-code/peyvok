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
