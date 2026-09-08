
import { create } from 'zustand';
import React, { useEffect, useLayoutEffect } from 'react';

import { supabase } from '../lib/supabase';
import { getLevelFromXP, getRewardForMode } from '../utils/progression';
import { safeJSONParse, safeStorageGet, safeStorageSet } from '../utils/safeParse';
import { allWordsMaster } from '../data/wordList';
import { MEDALS } from '../constants/medals';
import { useUser } from '../context/AuthContext';

// --- MODULE LEVEL REFS ---
let isSyncingProgressionRef = false;
let lastRefreshTime = 0;
let lastXPRef = -1;
let sessionGuardRef = new Set();
let claimRef = false;
let lastPurchaseTimeRef = 0;
let lastAppliedProfileRef = null;

const getInitial = (key, fallback) => {
  const saved = safeStorageGet(key);
  return (saved !== null) ? Number(saved) : fallback;
};

const defaultStats = {
  classic: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
  mamak: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
  word_fever: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
  hard_words: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
  battle: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } }
};

export const useGameStore = create((set, get) => ({
  // Auth dependencies
  user: null,
  profileData: null,
  syncProfile: async () => {},

  // State Initialization
  lastNotifiedLevel: 1,
  currentXP: safeStorageGet('peyvchin_xp') ? Number(safeStorageGet('peyvchin_xp')) : 0,
  lastStreakAt: null,
  dailyStreak: safeStorageGet('peyvchin_daily_streak') ? Number(safeStorageGet('peyvchin_daily_streak')) : 0,
  rewardStreak: 0,
  lastRewardClaimedAt: null,
  userRank: 1,
  inventory: { badges: [] },
  loading: true,
  syncStatus: '',
  claimedMedals: safeJSONParse(safeStorageGet('peyvchin_claimed_medals'), [], 'peyvchin_claimed_medals'),
  
  fils: getInitial('peyvchin_fils', 500),
  derhem: getInitial('peyvchin_derhem', 10),
  dinar: getInitial('peyvchin_dinar', 5),
  magnetCount: getInitial('peyvchin_magnets', 3),
  hintCount: getInitial('peyvchin_hints', 3),
  skipCount: getInitial('peyvchin_skips', 3),
  spinTicketCount: getInitial('peyvchin_spin_tickets', 0),
  
  solvedWords: safeJSONParse(safeStorageGet('peyvchin_solved_words'), [], 'peyvchin_solved_words'),
  playerStats: safeJSONParse(safeStorageGet('peyvchin_stats'), defaultStats, 'peyvchin_stats'),

  // Direct Setters
  setAuthContext: (user, profileData, syncProfile) => set({ user, profileData, syncProfile }),
  setLoading: (loading) => set({ loading }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setCurrentXP: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.currentXP) : val;
    safeStorageSet('peyvchin_xp', next.toString());
    return { currentXP: next };
  }),
  setDailyStreak: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.dailyStreak) : val;
    safeStorageSet('peyvchin_daily_streak', next.toString());
    return { dailyStreak: next };
  }),
  setLastNotifiedLevel: (val) => set((state) => ({ lastNotifiedLevel: typeof val === 'function' ? val(state.lastNotifiedLevel) : val })),
  setFils: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.fils) : val;
    safeStorageSet('peyvchin_fils', next.toString());
    return { fils: next };
  }),
  setDerhem: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.derhem) : val;
    safeStorageSet('peyvchin_derhem', next.toString());
    return { derhem: next };
  }),
  setDinar: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.dinar) : val;
    safeStorageSet('peyvchin_dinar', next.toString());
    return { dinar: next };
  }),
  setMagnetCount: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.magnetCount) : val;
    safeStorageSet('peyvchin_magnets', next.toString());
    return { magnetCount: next };
  }),
  setHintCount: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.hintCount) : val;
    safeStorageSet('peyvchin_hints', next.toString());
    return { hintCount: next };
  }),
  setSkipCount: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.skipCount) : val;
    safeStorageSet('peyvchin_skips', next.toString());
    return { skipCount: next };
  }),
  setSpinTicketCount: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.spinTicketCount) : val;
    safeStorageSet('peyvchin_spin_tickets', next.toString());
    return { spinTicketCount: next };
  }),
  setSolvedWords: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.solvedWords) : val;
    safeStorageSet('peyvchin_solved_words', JSON.stringify(next));
    return { solvedWords: next };
  }),
  setPlayerStats: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.playerStats) : val;
    safeStorageSet('peyvchin_stats', JSON.stringify(next));
    return { playerStats: next };
  }),
  setInventory: (val) => set((state) => ({ inventory: typeof val === 'function' ? val(state.inventory) : val })),
  setClaimedMedals: (val) => set((state) => {
    const next = typeof val === 'function' ? val(state.claimedMedals) : val;
    safeStorageSet('peyvchin_claimed_medals', JSON.stringify(next));
    return { claimedMedals: next };
  }),
  setLastStreakAt: (val) => set((state) => ({ lastStreakAt: typeof val === 'function' ? val(state.lastStreakAt) : val })),
  setRewardStreak: (val) => set((state) => ({ rewardStreak: typeof val === 'function' ? val(state.rewardStreak) : val })),
  setLastRewardClaimedAt: (val) => set((state) => ({ lastRewardClaimedAt: typeof val === 'function' ? val(state.lastRewardClaimedAt) : val })),
  setUserRank: (val) => set((state) => ({ userRank: typeof val === 'function' ? val(state.userRank) : val })),
  addXP: (amount) => { 
    if (amount) {
      set(s => {
        const next = s.currentXP + amount;
        safeStorageSet('peyvchin_xp', next.toString());
        return { currentXP: next };
      });
    }
  },

  // Complex Actions
  refreshRank: async (xpValue, force = false, signal = null) => {
    const val = xpValue !== undefined ? xpValue : get().currentXP;
    const now = Date.now();
    if (!force && val === lastXPRef && (now - lastRefreshTime < 2000)) return;
    try {
      lastRefreshTime = now;
      lastXPRef = val;
      
      let query = supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('xp', val).neq('nickname', 'Admin_4rasti').neq('nickname', 'ADMIN_PEYVOK').neq('nickname', 'پەیڤۆک').neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1').neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4');
      if (signal) query = query.abortSignal(signal);
      const { count, error } = await query;
      
      let finalRank = (count || 0) + 1;

      const currentUserId = get().user?.id;
      if (currentUserId && !error) {
        const { data: myProfile } = await supabase.from('profiles').select('updated_at').eq('id', currentUserId).single();
        if (myProfile?.updated_at) {
          const { count: tieCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
            .eq('xp', val)
            .lt('updated_at', myProfile.updated_at)
            .neq('nickname', 'Admin_4rasti').neq('nickname', 'ADMIN_PEYVOK').neq('nickname', 'پەیڤۆک').neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1').neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4');
          finalRank += (tieCount || 0);
        }
      }

      if (!error) set({ userRank: finalRank });
    } catch (err) { 
      const isAbort = err.name === 'AbortError' || 
                      err.message?.includes('AbortError') || 
                      err.code === '20' || 
                      err.code === 'ABORT_ERR';
      if (isAbort) return;
      console.warn("Rank refresh failed:", err); 
    }
  },

  updateInventory: async (updates, isAdditive = true, syncToDB = true) => {
    const s = get();
    const calculateNext = (current, offset, additive) => additive ? (current + offset) : offset;
    
    const nextValues = {
      fils: updates.fils !== undefined ? calculateNext(s.fils, updates.fils, isAdditive) : undefined,
      derhem: updates.derhem !== undefined ? calculateNext(s.derhem, updates.derhem, isAdditive) : undefined,
      dinar: updates.dinar !== undefined ? calculateNext(s.dinar, updates.dinar, isAdditive) : undefined,
      magnets: updates.magnetCount !== undefined ? calculateNext(s.magnetCount, updates.magnetCount, isAdditive) : undefined,
      hints: updates.hintCount !== undefined ? calculateNext(s.hintCount, updates.hintCount, isAdditive) : undefined,
      skips: updates.skipCount !== undefined ? calculateNext(s.skipCount, updates.skipCount, isAdditive) : undefined,
      spinTickets: updates.spinTicketCount !== undefined ? calculateNext(s.spinTicketCount, updates.spinTicketCount, isAdditive) : undefined
    };

    if (nextValues.fils !== undefined) set({ fils: nextValues.fils });
    if (nextValues.derhem !== undefined) set({ derhem: nextValues.derhem });
    if (nextValues.dinar !== undefined) set({ dinar: nextValues.dinar });
    if (nextValues.magnets !== undefined) set({ magnetCount: nextValues.magnets });
    if (nextValues.hints !== undefined) set({ hintCount: nextValues.hints });
    if (nextValues.skips !== undefined) set({ skipCount: nextValues.skips });
    if (nextValues.spinTickets !== undefined) set({ spinTicketCount: nextValues.spinTickets });

    Object.entries(updates).forEach(([key, val]) => {
      const storageKey = key === 'magnetCount' ? 'peyvchin_magnets' : key === 'hintCount' ? 'peyvchin_hints' : key === 'skipCount' ? 'peyvchin_skips' : key === 'spinTicketCount' ? 'peyvchin_spin_tickets' : `peyvchin_${key}`;
      const current = getInitial(storageKey, 0);
      safeStorageSet(storageKey, (isAdditive ? (current + val) : val).toString());
    });

    if (s.user && syncToDB) {
      try { 
        if (nextValues.spinTickets !== undefined) {
          await supabase.from('profiles').update({ spin_tickets: nextValues.spinTickets }).eq('id', s.user?.id);
        }

        const { error: rpcError } = await supabase.rpc('sync_profile_inventory', {
          p_magnets: nextValues.magnets,
          p_hints: nextValues.hints,
          p_skips: nextValues.skips,
          p_fils: nextValues.fils,
          p_derhem: nextValues.derhem,
          p_dinar: nextValues.dinar
        }); 
        if (rpcError) throw rpcError;
      }
      catch (err) { 
        console.warn("DB Inventory Sync Failed via RPC, trying direct update:", err); 
        try {
          const payload = {};
          if (nextValues.magnets !== undefined) payload.magnets = nextValues.magnets;
          if (nextValues.hints !== undefined) payload.hints = nextValues.hints;
          if (nextValues.skips !== undefined) payload.skips = nextValues.skips;
          if (nextValues.fils !== undefined) payload.fils = nextValues.fils;
          if (nextValues.derhem !== undefined) payload.derhem = nextValues.derhem;
          if (nextValues.dinar !== undefined) payload.dinar = nextValues.dinar;
          
          if (Object.keys(payload).length > 0) {
            await supabase.from('profiles').update(payload).eq('id', s.user?.id);
          }
          
          if (nextValues.spinTickets !== undefined) {
            await supabase.from('profiles').update({ spin_tickets: nextValues.spinTickets }).eq('id', s.user?.id);
          }
        } catch (fallbackErr) {
          console.error("Direct fallback update also failed:", fallbackErr);
        }
      }
    }
  },

  claimMedal: async (medalId, rewardAmount = 1000) => {
    const s = get();
    const currentMedals = s.claimedMedals || [];
    if (currentMedals.includes(medalId)) return;
    
    const next = [...currentMedals, medalId];
    set({ claimedMedals: next });
    safeStorageSet('peyvchin_claimed_medals', JSON.stringify(next));

    if (rewardAmount && rewardAmount > 0) {
      s.updateInventory({ fils: rewardAmount }, true, true);
    }

    if (s.user?.id) {
      try {
        const { error } = await supabase.rpc('claim_medal', { p_medal_id: medalId, p_user_id: s.user?.id });
        if (error) {
          console.warn('claim_medal rpc failed, falling back:', error);
          await supabase.from('profiles').update({ claimed_medals: next }).eq('id', s.user?.id);
        }
      } catch (err) {
        console.warn('claim_medal rpc error, falling back:', err);
        await supabase.from('profiles').update({ claimed_medals: next }).eq('id', s.user?.id);
      }
    }
  },

  processPurchase: async (item) => {
    const s = get();
    if (!s.user) return { success: false, error: "Must be logged in" };

    const itemType = item.type || (item.price_usd ? 'currency' : 'powerup');
    const currency = item.currency || 'fils';
    const price = item.price || 0;

    try {
      let rpcName;
      let rpcArgs = { p_item_id: item.id, p_currency_used: currency, p_price: price };

      if (itemType === 'powerup') rpcName = 'buy_powerup';
      else if (itemType === 'font') rpcName = 'buy_font';
      else if (itemType === 'avatar') rpcName = 'buy_avatar';
      else if (itemType === 'name_style') rpcName = 'buy_name_style';
      else if (itemType === 'bundle') rpcName = 'buy_bundle';
      else throw new Error(`Unknown item type: ${itemType}`);

      const { data, error } = await supabase.rpc(rpcName, rpcArgs);

      if (error) {
        console.error("Supabase RPC Error during purchase:", error);
        return { success: false, error: error.message };
      }
      
      if (data === false || (data && data.success === false) || (data && data.error)) {
        console.error("Purchase rejected by Database! Returned Data:", data, "Args Sent:", rpcArgs);
        return { success: false, error: "Purchase rejected by backend rules" };
      }
      
      console.log("Database successfully completed purchase. Data:", data);
      
      lastPurchaseTimeRef = Date.now();
      
      if (currency === 'fils') set(state => ({ fils: state.fils - price }));
      if (currency === 'derhem') set(state => ({ derhem: state.derhem - price }));
      if (currency === 'dinar') set(state => ({ dinar: state.dinar - price }));

      if (itemType === 'powerup') {
        if (item.id === 'hint_pack') set(state => ({ hintCount: state.hintCount + 1 }));
        if (item.id === 'attractor_field') set(state => ({ magnetCount: state.magnetCount + 1 }));
        if (item.id === 'full_skip') set(state => ({ skipCount: state.skipCount + 1 }));
      }
      
      await s.syncProfile(s.user?.id, true, true);
      return { success: true };
    } catch (err) {
      console.error("Purchase failed:", err.message);
      return { success: false, error: err.message };
    }
  },

  syncProgressToDatabase: async (lettersCount, mode = 'classic', additionalData = {}) => {
    const s = get();
    
    if (additionalData.sessionId) {
      if (sessionGuardRef.has(additionalData.sessionId)) {
        console.warn("[GameStore] Duplicate session submission blocked:", additionalData.sessionId);
        return null;
      }
      sessionGuardRef.add(additionalData.sessionId);
    } 
    
    const isWin = additionalData.isWin !== undefined ? additionalData.isWin : true;
    const currentAward = getRewardForMode(mode);
    
    let baseXP = currentAward.xp;
    
    if (!isWin) {
      const lossXPRewards = { 'classic': 5, 'mamak': 10, 'hard_words': 15, 'word_fever': 2.5 };
      baseXP = lossXPRewards[mode] || 0;
    }

    const hintsUsed = additionalData.hintsUsed || 0;
    const magnetsUsed = additionalData.magnetsUsed || 0;
    const totalAssistance = hintsUsed + magnetsUsed;
    const penaltyXP = totalAssistance * 2;
    
    let xpToAdd = isWin ? Math.max(2, baseXP - penaltyXP) : baseXP;
    xpToAdd = Math.round(xpToAdd);

    const newLocalXP = Number(s.currentXP) + xpToAdd;
    const newLevel = getLevelFromXP(newLocalXP);

    const score = additionalData.score || 0;
    const updatedStats = { ...s.playerStats };
    if (!updatedStats[mode]) {
      updatedStats[mode] = { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, playedCount: 0, current_streak: 0, max_streak: 0 };
    }
    
    updatedStats[mode].playedCount = (updatedStats[mode].playedCount || 0) + 1;
    
    if (isWin) {
      updatedStats[mode].solvedCount = (updatedStats[mode].solvedCount || 0) + 1;
      updatedStats[mode].current_streak = (updatedStats[mode].current_streak || 0) + 1;
      updatedStats[mode].max_streak = Math.max(updatedStats[mode].max_streak || 0, updatedStats[mode].current_streak);
    } else {
      updatedStats[mode].current_streak = 0;
    }

    updatedStats[mode].score = score;
    updatedStats[mode].totalXP = (updatedStats[mode].totalXP || 0) + xpToAdd;
    if (score > (updatedStats[mode].bestScore || 0)) {
      updatedStats[mode].bestScore = score;
    }

    if (additionalData.isWin && additionalData.attempts) {
      if (!updatedStats[mode].guess_distribution) {
        updatedStats[mode].guess_distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
      }
      const attemptsKey = additionalData.attempts.toString();
      updatedStats[mode].guess_distribution[attemptsKey] = (updatedStats[mode].guess_distribution[attemptsKey] || 0) + 1;
    }

    set({ playerStats: updatedStats });
    safeStorageSet('peyvchin_stats', JSON.stringify(updatedStats));

    set({ currentXP: newLocalXP });
    safeStorageSet('peyvchin_xp', newLocalXP.toString());
    
    if (isWin) {
      if (currentAward.type === 'fils') set(state => ({ fils: Number(state.fils) + (additionalData.filsBonus || currentAward.amount) }));
      if (currentAward.type === 'derhem') set(state => ({ derhem: Number(state.derhem) + currentAward.amount }));
      if (currentAward.type === 'dinar') set(state => ({ dinar: Number(state.dinar) + currentAward.amount }));
    }

    const currentSolved = Array.isArray(s.solvedWords) ? s.solvedWords : [];
    const newSolved = Array.isArray(additionalData.solvedWords) ? additionalData.solvedWords : [];
    const nextSolvedWords = [...new Set([...currentSolved, ...newSolved])];

    if (newSolved.length > 0) {
      set({ solvedWords: nextSolvedWords });
      safeStorageSet('peyvchin_solved_words', JSON.stringify(nextSolvedWords));
    }

    if (!s.user) {
      return { xpAdded: xpToAdd, newLevel: newLevel, awards: currentAward, isGuest: true };
    }

    if (isSyncingProgressionRef) return;
    isSyncingProgressionRef = true;

    try {
      const { data, error } = await supabase.rpc('sync_profile_progression', {
        p_xp_to_add: xpToAdd,
        p_fils_to_add: (isWin && currentAward.type === 'fils') ? (additionalData.filsBonus || currentAward.amount) : 0,
        p_derhem_to_add: (isWin && currentAward.type === 'derhem') ? currentAward.amount : 0,
        p_dinar_to_add: (isWin && currentAward.type === 'dinar') ? currentAward.amount : 0,
        p_level: newLevel,
        p_solved_words: nextSolvedWords,
        p_mode: mode,
        p_score: score,
        p_is_win: additionalData.isWin !== undefined ? additionalData.isWin : true,
        p_attempts: additionalData.attempts || 0,
        p_is_flawless: (additionalData.hintsUsed === 0 && additionalData.magnetsUsed === 0),
        p_is_secret_win: false,
        p_is_riddle_no_skip: (mode === 'mamak' && additionalData.hintsUsed === 0),
        p_is_pvp_flawless: additionalData.isPvPFlawless || false,
        p_word_length: lettersCount || 0,
        p_solve_time_ms: additionalData.durationMs || 0,
        p_words_found: additionalData.wordsFound || 1,
        p_is_assisted: additionalData.hintsUsed > 0
      });

      if (error) {
        console.warn("RPC sync_profile_progression failed:", error);
      }

      if (data) {
        const { new_level, new_xp, award_xp, daily_streak } = data;
        if (daily_streak !== undefined) {
          set({ dailyStreak: daily_streak });
          safeStorageSet('peyvchin_daily_streak', daily_streak.toString());
        }
        await s.syncProfile(s.user?.id); 
        s.refreshRank(new_xp, true);

        return { xpAdded: award_xp, newLevel: new_level, awards: currentAward, bahdiniMsg: `سەرکەفتنەکا نوی! ✨ (پاراستی)` };
      } else {
        await s.syncProfile(s.user?.id);
        s.refreshRank(newLocalXP, true);
        return { xpAdded: xpToAdd, newLevel: newLevel, awards: currentAward, bahdiniMsg: `سەرکەفتنەکا نوی! ✨ (پاراستی)` };
      }
    } catch (err) { 
      console.error("Secured Sync Failed:", err.message); 
      return null; 
    } finally {
      isSyncingProgressionRef = false;
    }
  },

  applyPenalty: async (xpAmount = 20, currencyAmount = 50, currencyType = 'fils') => {
    const s = get();
    if (!s.user) return;

    const newXP = Math.max(0, Number(s.currentXP) - xpAmount);
    const newLevel = getLevelFromXP(newXP);
    
    set({ currentXP: newXP });
    
    let p_fils = 0, p_derhem = 0, p_dinar = 0;
    if (currencyType === 'fils') {
      set(state => ({ fils: Math.max(0, Number(state.fils) - currencyAmount) }));
      p_fils = -currencyAmount;
    } else if (currencyType === 'derhem') {
      set(state => ({ derhem: Math.max(0, Number(state.derhem) - currencyAmount) }));
      p_derhem = -currencyAmount;
    } else if (currencyType === 'dinar') {
      set(state => ({ dinar: Math.max(0, Number(state.dinar) - currencyAmount) }));
      p_dinar = -currencyAmount;
    } else {
      set(state => ({ fils: Math.max(0, Number(state.fils) - currencyAmount) }));
      p_fils = -currencyAmount;
    }

    try {
      await supabase.rpc('sync_profile_progression', {
        p_xp_to_add: -xpAmount,
        p_fils_to_add: p_fils,
        p_derhem_to_add: p_derhem,
        p_dinar_to_add: p_dinar,
        p_level: newLevel,
        p_solved_words: s.solvedWords,
        p_mode: 'penalty',
        p_score: 0,
        p_is_win: false,
        p_attempts: 0,
        p_is_flawless: false,
        p_is_secret_win: false,
        p_is_riddle_no_skip: false,
        p_is_pvp_flawless: false,
        p_word_length: 0,
        p_solve_time_ms: 0,
        p_words_found: 0
      });
      await s.syncProfile(s.user?.id);
    } catch (err) {
      console.warn("Penalty sync failed:", err);
    }
  },

  claimDailyReward: async () => {
    const s = get();
    if (!s.user) return { error: 'Login required' };
    if (claimRef) {
      console.warn('[GameStore] Claim blocked: RPC already in progress');
      return { error: 'Action in progress' };
    }
    
    claimRef = true;
    console.log('[GameStore] Triggering secure RPC claim...');
    
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward');
      if (error) {
        console.error('[GameStore] RPC Response Error:', error);
        return { error: error.message };
      }

      if (data && data.success) {
        if (data.rewards) {
          set(state => ({
            fils: state.fils + (data.rewards.fils || 0),
            derhem: state.derhem + (data.rewards.derhem || 0),
            dinar: state.dinar + (data.rewards.dinar || 0),
            magnetCount: state.magnetCount + (data.rewards.magnets || 0),
            hintCount: state.hintCount + (data.rewards.hints || 0),
            skipCount: state.skipCount + (data.rewards.skips || 0),
            spinTicketCount: state.spinTicketCount + (data.rewards.spinTicketCount || data.rewards.spin_tickets || 0)
          }));
        }
        
        set({
          rewardStreak: data.streak,
          lastRewardClaimedAt: new Date().toISOString()
        });
        
        await s.syncProfile(s.user.id, null, true);
        return { success: true, rewards: data.rewards, streak: data.streak };
      }

      return { success: false, error: data?.message || "Claim failed" };
    } catch (err) { 
      console.error("[GameStore] Fatal Claim Error:", err); 
      return { success: false, error: "ئاریشەیەک د سێرڤەری دا ھەبوو" }; 
    } finally {
      claimRef = false;
    }
  },

  setNotifiedLevelDB: async (newLevel) => {
    const s = get();
    set({ lastNotifiedLevel: newLevel });
    if (s.user?.id) {
      try {
        await supabase.from('profiles').update({ last_notified_level: newLevel }).eq('id', s.user.id);
        
        const channel = supabase.channel('public:profiles:welcome_marquee');
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'level_up',
              payload: {
                id: s.user.id,
                nickname: s.profileData?.nickname || 'یاریزانەک',
                level: newLevel
              }
            });
            setTimeout(() => supabase.removeChannel(channel), 1000);
          }
        });
      } catch (err) {
        console.error("[GameStore] Failed to sync last_notified_level:", err);
      }
    }
  },

  getFreshWord: async (mode, category) => {
    const s = get();
    const { getRandomWordFromCategory } = await import('../data/wordList');
    const { mamakWords } = await import('../data/mamakList');

    const currLevel = getLevelFromXP(s.currentXP);

    if (mode === 'mamak') {
      const result = getRandomWordFromCategory('مامک', currLevel, s.solvedWords, mode);
      if (result) {
        safeStorageSet('peyvchin_last_category', result.category);
        return result;
      }
    }

    const lastCategory = safeStorageGet('peyvchin_last_category');

    if (s.user?.id) {
      try {
        const isAll = !category || category === 'گشتی' || category === 'generalWordPool' || category === 'ھەموو';
        const rpcName = isAll ? 'get_balanced_random_word' : 'get_random_fresh_word';
        
        const rpcParams = {
          p_user_id: s.user?.id,
          p_mode_tag: mode === 'classic' ? 'classic' : (mode === 'hard_words' ? 'hard_words' : (mode === 'mamak' ? 'mamak' : mode))
        };

        if (isAll) {
          rpcParams.p_exclude_category = lastCategory;
        } else {
          rpcParams.p_category = category;
        }

        let { data, error } = await supabase.rpc(rpcName, rpcParams);
        
        let finalData = data;
        
        const isMamakRiddle = (w) => w.category === 'مامک' || mamakWords.some(m => m.word === w.word || m.hint === w.hint);
        
        if (finalData && finalData.length > 0 && isMamakRiddle(finalData[0])) {
          for (let i = 0; i < 5; i++) {
            const retry = await supabase.rpc(rpcName, rpcParams);
            if (retry.data && retry.data.length > 0 && !isMamakRiddle(retry.data[0])) {
              finalData = retry.data;
              break;
            }
          }
        }

        if (error) throw error;

        if (finalData && finalData.length > 0) {
          const nextWord = finalData[0];
          safeStorageSet('peyvchin_last_category', nextWord.category);
          return { word: nextWord.word, hint: nextWord.hint, category: nextWord.category, id: nextWord.id };
        }
      } catch (err) { console.warn("[GameStore] Failed to fetch fresh word from DB, falling back to local:", err); }
    }
    
    const result = getRandomWordFromCategory(category, currLevel, s.solvedWords, mode);
    
    if (result) {
      safeStorageSet('peyvchin_last_category', result.category);
      return result;
    }

    console.warn("[GameStore] Local fallback failed to find word, using default safe word");
    return { word: 'سڵاو', hint: 'پەیڤەکا سادە', category: 'گشتی', id: 'default' };
  },

  initializeStatsInDB: async () => {
    const s = get();
    if (!s.user) return { error: "Login required" };
    
    const dummyStats = [
      { mode: 'classic', score: 40, best: 50, xp: 200 },
      { mode: 'mamak', score: 30, best: 45, xp: 150 },
      { mode: 'word_fever', score: 5, best: 8, xp: 300 },
      { mode: 'hard_words', score: 20, best: 35, xp: 120 },
      { mode: 'battle', score: 100, best: 100, xp: 500 }
    ];

    for (const stat of dummyStats) {
      await supabase.rpc('sync_game_session', {
        p_user_id: s.user?.id,
        p_mode: stat.mode,
        p_magnets_used: 0,
        p_hints_used: 0,
        p_skips_used: 0,
        p_solved_words: []
      });
    }
    await s.syncProfile();
    return { success: true };
  }
}));

// Provide identical interface to useGame for backwards compatibility + extra computed values
// WARNING: Avoid using this in new components. Use atomic selectors instead (e.g. `const fils = useGameStore(s => s.fils)`)
// React component to keep Zustand in sync with AuthContext and Supabase Real-time
export const GameEngineSync = () => {
  const { user, loadingAuth, syncProfile, profileData } = useUser();

  // Synchronous injection to avoid 1-render lag and race conditions
  useLayoutEffect(() => {
    useGameStore.getState().setAuthContext(user, profileData, syncProfile);
  }, [user, profileData, syncProfile]);

  useEffect(() => {
    const serverStats = profileData?.statistics || profileData?.inventory?.stats;
    if (serverStats) {
      useGameStore.getState().setPlayerStats(prev => {
        const merged = { ...prev };
        let hasChanged = false;

        Object.entries(serverStats).forEach(([mode, sData]) => {
          const pData = prev[mode] || {};
          const mergedMode = {
            ...pData,
            ...sData,
            guess_distribution: sData.guess_distribution || pData.guess_distribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 }
          };

          if (JSON.stringify(pData) !== JSON.stringify(mergedMode)) {
            merged[mode] = mergedMode;
            hasChanged = true;
          }
        });

        if (hasChanged) {
          safeStorageSet('peyvchin_stats', JSON.stringify(merged));
          return merged;
        }
        return prev;
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (user && !profileData) {
      const store = useGameStore.getState();
      store.setLoading(true);
      store.setSyncStatus('هێنان و پشکنینا پرۆفایلێ...');
    }
  }, [user, profileData]);

  useEffect(() => {
    const controller = new AbortController();
    
    const applyProfileData = async () => {
      if (!loadingAuth && profileData) {
        const profileSignature = `${profileData?.xp}-${profileData?.fils}-${profileData?.derhem}-${profileData?.dinar}-${profileData?.magnets}-${profileData?.hints}-${profileData?.skips}`;
        
        if (profileSignature !== lastAppliedProfileRef) {
          console.log("[GameStore] Applying profile progression sync...");
          lastAppliedProfileRef = profileSignature;
          
          const store = useGameStore.getState();
          store.setSyncStatus('سینککرنا داتایێن یاریزانان...');
          
          const remoteXP = Number(profileData?.xp || 0);
          const prevXP = store.currentXP;

          if (prevXP > remoteXP) {
            console.log(`[GameStore] Local XP (${prevXP}) > Remote XP (${remoteXP}). Triggering force sync.`);
            supabase.rpc('merge_profile_progress', {
              p_xp: prevXP,
              p_fils: getInitial('peyvchin_fils', 500),
              p_derhem: getInitial('peyvchin_derhem', 10),
              p_dinar: getInitial('peyvchin_dinar', 5)
            }).then(({error}) => {
              if(error) console.error("Force sync failed:", error);
              else console.log("Force sync successful.");
            });
          } else if (remoteXP > prevXP) {
            store.setCurrentXP(remoteXP);
          }
          
          const serverNotifiedLevel = profileData?.last_notified_level;
          const currentLevelFromXP = getLevelFromXP(remoteXP);
          
          store.setLastNotifiedLevel(prev => {
            if (serverNotifiedLevel !== undefined) return Math.max(prev, serverNotifiedLevel);
            return Math.max(prev, currentLevelFromXP);
          });
          
          if (Date.now() - lastPurchaseTimeRef > 5000) {
            store.setFils(prev => { const next = profileData?.fils ?? 500; return prev !== next ? next : prev; });
            store.setDerhem(prev => { const next = profileData?.derhem ?? 10; return prev !== next ? next : prev; });
            store.setDinar(prev => { const next = profileData?.dinar ?? 5; return prev !== next ? next : prev; });
            store.setMagnetCount(prev => prev !== (profileData?.magnets ?? 3) ? (profileData?.magnets ?? 3) : prev);
            store.setHintCount(prev => prev !== (profileData?.hints ?? 3) ? (profileData?.hints ?? 3) : prev);
            store.setSkipCount(prev => prev !== (profileData?.skips ?? 3) ? (profileData?.skips ?? 3) : prev);
          }
          
          if (profileData?.spin_tickets !== undefined && profileData?.spin_tickets !== null) {
            store.setSpinTicketCount(prev => prev !== profileData?.spin_tickets ? profileData?.spin_tickets : prev);
          } else if (profileData?.inventory?.spinTickets !== undefined) {
            store.setSpinTicketCount(prev => prev !== profileData?.inventory.spinTickets ? profileData?.inventory.spinTickets : prev);
          }
          store.setDailyStreak(prev => prev !== (profileData?.daily_streak || 0) ? (profileData?.daily_streak || 0) : prev);
          store.setLastStreakAt(prev => prev !== profileData?.last_streak_at ? profileData?.last_streak_at : prev);
          store.setRewardStreak(prev => prev !== (profileData?.reward_streak || 0) ? (profileData?.reward_streak || 0) : prev);
          store.setLastRewardClaimedAt(prev => prev !== profileData?.last_reward_claimed_at ? profileData?.last_reward_claimed_at : prev);
        }

        const remoteWords = Array.isArray(profileData?.solved_words) ? profileData?.solved_words : [];
        let inventoryWords = [];
        if (profileData?.inventory?.solved_words) {
          if (Array.isArray(profileData?.inventory.solved_words)) {
            inventoryWords = profileData?.inventory.solved_words;
          } else if (typeof profileData?.inventory.solved_words === 'string') {
            try { inventoryWords = JSON.parse(profileData?.inventory.solved_words); } catch (_e) { /* ignore */ }
          }
        }
        
        const store = useGameStore.getState();
        store.setSolvedWords(prev => {
          const local = Array.isArray(prev) ? prev : [];
          const merged = [...new Set([...local, ...remoteWords, ...inventoryWords])];
          
          if (JSON.stringify(local) !== JSON.stringify(merged)) {
            safeStorageSet('peyvchin_solved_words', JSON.stringify(merged));
          }
          
          const legacyStats = profileData?.inventory?.stats;
          if (legacyStats) {
            let legacyGamesWon = 0;
            let legacyGamesPlayed = 0;
            let legacyFeverHigh = legacyStats.word_fever?.bestScore || 0;
            
            Object.values(legacyStats).forEach(m => {
              legacyGamesWon += (Number(m.solvedCount) || 0);
              legacyGamesPlayed += (Number(m.playedCount) || Number(m.solvedCount) || 0);
            });

            if (legacyGamesWon > (profileData?.games_won || 0) + 5) {
              console.log("[GameStore] 🚨 MIGRATING LEGACY STATS to top-level columns!");
              const realGamesPlayed = Math.max(legacyGamesPlayed, legacyGamesWon, profileData?.games_played || 0);
              const realGamesWon = Math.max(legacyGamesWon, profileData?.games_won || 0);
              const maxWords = Math.max(merged.length, profileData?.total_words_found || 0, realGamesWon);
              const legacyPvpWins = legacyStats.battle?.solvedCount || 0;
              
              let finalWordsToSave = merged;
              
              if (maxWords > merged.length) {
                console.log(`[GameStore] 🚨 Auto-filling dictionary. Missing ${maxWords - merged.length} words.`);
                const missingCount = maxWords - merged.length;
                const availableWords = allWordsMaster.map(item => item.word).filter(w => !merged.includes(w));
                const randomlySelected = availableWords.sort(() => 0.5 - Math.random()).slice(0, missingCount);
                finalWordsToSave = [...merged, ...randomlySelected];
                store.setSolvedWords(finalWordsToSave);
                safeStorageSet('peyvchin_solved_words', JSON.stringify(finalWordsToSave));
              }

              supabase.from('profiles').update({
                games_played: realGamesPlayed,
                games_won: realGamesWon,
                pvp_wins: Math.max(profileData?.pvp_wins || 0, legacyPvpWins),
                total_words_found: maxWords,
                fever_highscore: Math.max(legacyFeverHigh, profileData?.fever_highscore || 0),
                solved_words: finalWordsToSave,
                statistics: legacyStats
              }).eq('id', user?.id).then(({error}) => {
                if(error) console.error("Legacy migration failed:", error);
                else console.log("Legacy migration successful.");
              });
            }
          }
          
          return merged;
        });
        
        if (profileData?.inventory) {
          store.setInventory(prev => JSON.stringify(prev) !== JSON.stringify(profileData?.inventory) ? profileData?.inventory : prev);
        }

        const remoteMedals = Array.isArray(profileData?.claimed_medals) ? profileData?.claimed_medals : [];
        store.setClaimedMedals(prev => {
          const local = Array.isArray(prev) ? prev : [];
          const merged = [...new Set([...local, ...remoteMedals])];
          if (JSON.stringify(local) !== JSON.stringify(merged)) {
            safeStorageSet('peyvchin_claimed_medals', JSON.stringify(merged));
            return merged;
          }
          return prev;
        });
        
        store.setSyncStatus('پشکنینا ڕیزبەندییا تە...');
        store.refreshRank(Number(profileData?.xp || 0), true, controller.signal);
        
        store.setSyncStatus('کۆتایی پێئینان...');
        store.setLoading(false);
      } else if (!loadingAuth && !profileData) {
        useGameStore.getState().setLoading(false);
      }
    };

    applyProfileData();

    return () => controller.abort();
  }, [loadingAuth, profileData, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    console.log("[GameStore] Initializing real-time sync for:", user?.id);
    const profileChannel = supabase
      .channel(`profile-realtime-${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          const data = payload.new;
          console.log("⚡ [GameStore] Real-time profile update detected:", data);
          const store = useGameStore.getState();
          
          if (data.xp !== undefined) {
            store.setCurrentXP(prev => {
              const next = Math.max(prev, data.xp);
              if (prev !== next) {
                store.refreshRank(next, true);
                return next;
              }
              return prev;
            });
          }
          
          if (data.daily_streak !== undefined) store.setDailyStreak(prev => prev !== data.daily_streak ? data.daily_streak : prev);
          
          if (Date.now() - lastPurchaseTimeRef > 5000) {
            if (data.fils !== undefined) store.setFils(prev => prev !== data.fils ? data.fils : prev);
            if (data.derhem !== undefined) store.setDerhem(prev => prev !== data.derhem ? data.derhem : prev);
            if (data.dinar !== undefined || data.dinars !== undefined) {
              const dValue = data.dinar !== undefined ? data.dinar : data.dinars;
              store.setDinar(prev => prev !== dValue ? dValue : prev);
            }
            if (data.magnets !== undefined) store.setMagnetCount(prev => prev !== data.magnets ? data.magnets : prev);
            if (data.hints !== undefined) store.setHintCount(prev => prev !== data.hints ? data.hints : prev);
            if (data.skips !== undefined) store.setSkipCount(prev => prev !== data.skips ? data.skips : prev);
          }

          if (data.claimed_medals !== undefined) {
            store.setClaimedMedals(prev => {
              const local = Array.isArray(prev) ? prev : [];
              const remote = Array.isArray(data.claimed_medals) ? data.claimed_medals : [];
              const merged = [...new Set([...local, ...remote])];
              if (JSON.stringify(local) !== JSON.stringify(merged)) {
                safeStorageSet('peyvchin_claimed_medals', JSON.stringify(merged));
                return merged;
              }
              return prev;
            });
          }

          if (data.inventory) {
            store.setInventory(data.inventory);
            if (data.spin_tickets !== undefined && data.spin_tickets !== null) store.setSpinTicketCount(prev => prev !== data.spin_tickets ? data.spin_tickets : prev);
            else if (data.inventory?.spinTickets !== undefined) store.setSpinTicketCount(prev => prev !== data.inventory.spinTickets ? data.inventory.spinTickets : prev);
            
            if (data.inventory.stats) {
              store.setPlayerStats(prev => ({ ...prev, ...data.inventory.stats }));
            }
            if (data.inventory.solved_words) {
              store.setSolvedWords(prev => {
                const local = Array.isArray(prev) ? prev : [];
                const remote = Array.isArray(data.inventory.solved_words) ? data.inventory.solved_words : [];
                return [...new Set([...local, ...remote])];
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[GameStore] Real-time sync status: ${status}`);
      });

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id]);

  return null;
};
