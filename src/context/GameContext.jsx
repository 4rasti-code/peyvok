/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './AuthContext';
import { getLevelFromXP, getLevelData, getRewardForMode } from '../utils/progression';
import { safeJSONParse } from '../utils/safeParse';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { user, loadingAuth, syncProfile, profileData } = useUser();

  const [lastNotifiedLevel, setLastNotifiedLevel] = useState(1);
  const [winsTowardsSecret, setWinsTowardsSecret] = useState(0);
  
  // INITIALIZATION: Priority to localStorage to prevent "Zero-Reset" on re-renders
  const [currentXP, setCurrentXP] = useState(() => {
    const saved = localStorage.getItem('peyvchin_xp');
    return saved ? Number(saved) : 0;
  });

  const [dailyStreak, setDailyStreak] = useState(() => {
    const saved = localStorage.getItem('peyvchin_daily_streak');
    return saved ? Number(saved) : 0;
  });
  const [rewardStreak, setRewardStreak] = useState(0);
  const [lastRewardClaimedAt, setLastRewardClaimedAt] = useState(null);
  const [_userRank, setUserRank] = useState(1);
  const [inventory, setInventory] = useState({ badges: [] });
  const [loading, setLoading] = useState(true);
  const claimRef = useRef(false);

  // Standardized Level Math (Hardcore Hybrid Infinite System)
  const { level, progressPercent, currentLevelBase, nextLevelBase } = useMemo(() => getLevelData(currentXP), [currentXP]);
  const minXPForLevel = currentLevelBase;
  const maxXP = nextLevelBase;
  
  const lastAppliedProfileRef = useRef(null);


  const getInitial = (key, fallback) => {
    const saved = localStorage.getItem(key);
    return (saved !== null) ? Number(saved) : fallback;
  };

  const [fils, setFils] = useState(() => getInitial('peyvchin_fils', 500));
  const [derhem, setDerhem] = useState(() => getInitial('peyvchin_derhem', 10));
  const [dinar, setDinar] = useState(() => getInitial('peyvchin_dinar', 5));
  const [magnetCount, setMagnetCount] = useState(() => getInitial('peyvchin_magnets', 3));
  const [hintCount, setHintCount] = useState(() => getInitial('peyvchin_hints', 3));
  const [skipCount, setSkipCount] = useState(() => getInitial('peyvchin_skips', 3));

  const [solvedWords, setSolvedWords] = useState(() => {
    const saved = localStorage.getItem('peyvchin_solved_words');
    return safeJSONParse(saved, [], 'peyvchin_solved_words');
  });
  
  const [playerStats, setPlayerStats] = useState(() => {
    const saved = localStorage.getItem('peyvchin_stats');
    const defaultStats = {
      classic: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
      mamak: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
      secret_word: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
      word_fever: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
      hard_words: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } },
      battle: { score: 0, bestScore: 0, totalXP: 0, solvedCount: 0, guess_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 } }
    };
    return safeJSONParse(saved, defaultStats, 'peyvchin_stats');
  });

  const isSyncingProgressionRef = useRef(false);
  const lastRefreshTime = useRef(0);
  const lastXPRef = useRef(-1);
  const sessionGuardRef = useRef(new Set()); // To prevent double submission in same session

  const gameStateRef = useRef({ 
    user, fils, derhem, dinar, magnetCount, hintCount, skipCount, 
    currentXP, level, inventory,
    dailyStreak, rewardStreak, lastRewardClaimedAt, winsTowardsSecret,
    playerStats, solvedWords
  });

  useEffect(() => {
    gameStateRef.current = { 
      user, fils, derhem, dinar, magnetCount, hintCount, skipCount, 
      currentXP, level, inventory,
      dailyStreak, rewardStreak, lastRewardClaimedAt, winsTowardsSecret,
      playerStats, solvedWords
    };
  }, [
    user, fils, derhem, dinar, magnetCount, hintCount, skipCount, 
    currentXP, level, inventory,
    dailyStreak, rewardStreak, lastRewardClaimedAt, winsTowardsSecret,
    playerStats, solvedWords
  ]);

  // Sync statistics from profileData when it loads
  useEffect(() => {
    if (profileData?.statistics) {
      setPlayerStats(prev => {
        const serverStats = profileData.statistics;
        const merged = { ...prev };
        let hasChanged = false;

        Object.entries(serverStats).forEach(([mode, sData]) => {
          const pData = prev[mode] || {};
          
          // Deep merge the mode data
          const mergedMode = {
            ...pData,
            ...sData,
            // Preserve/Merge guess_distribution
            guess_distribution: sData.guess_distribution || pData.guess_distribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 }
          };

          if (JSON.stringify(pData) !== JSON.stringify(mergedMode)) {
            merged[mode] = mergedMode;
            hasChanged = true;
          }
        });

        if (hasChanged) {
          localStorage.setItem('peyvchin_stats', JSON.stringify(merged));
          return merged;
        }
        return prev;
      });
    }
  }, [profileData]);

  const refreshRank = useCallback(async (xpValue, force = false, signal = null) => {
    const val = xpValue !== undefined ? xpValue : gameStateRef.current.currentXP;
    const now = Date.now();
    if (!force && val === lastXPRef.current && (now - lastRefreshTime.current < 2000)) return;
    try {
      lastRefreshTime.current = now;
      lastXPRef.current = val;
      let query = supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('xp', val);
      if (signal) query = query.abortSignal(signal);
      const { count, error } = await query;
      if (!error && count !== null) setUserRank(count + 1);
    } catch (err) { 
      const isAbort = err.name === 'AbortError' || 
                      err.message?.includes('AbortError') || 
                      err.code === '20' || 
                      err.code === 'ABORT_ERR';
      if (isAbort) return;
      console.warn("Rank refresh failed:", err); 
    }
  }, []); // Stable: uses refs for values

  // Track initialization: Moved below refreshRank to avoid TDZ (Temporal Dead Zone) error
  useEffect(() => {
    const controller = new AbortController();
    if (!loadingAuth && profileData) {
      // If we have profile data, apply it to local states ONLY IF it changed meaningfully
      // Use a stringified comparison for a stable "deep" check on the profile object
      // Use a more stable signature to prevent loops. We only apply if values change.
      const profileSignature = `${profileData.xp}-${profileData.fils}-${profileData.derhem}-${profileData.dinar}-${profileData.magnets}-${profileData.hints}-${profileData.skips}`;
      
      if (profileSignature !== lastAppliedProfileRef.current) {
        console.log("[GameContext] Applying profile progression sync...");
        lastAppliedProfileRef.current = profileSignature;
        
        // Safety: Only overwrite local XP if the remote XP is higher OR if local XP is 0
        const remoteXP = Number(profileData.xp || 0);
        
        // Batch updates: React 18+ will batch these automatically, 
        // but the checks prevent redundant state triggers.
        setCurrentXP(prev => (prev === 0 || remoteXP > prev) ? remoteXP : prev);
        
        const serverNotifiedLevel = profileData.last_notified_level;
        const currentLevelFromXP = getLevelFromXP(remoteXP);
        setLastNotifiedLevel(prev => {
          if (serverNotifiedLevel !== undefined) return Math.max(prev, serverNotifiedLevel);
          // If no server record, initialize to current level to prevent "catch-up" spam
          return Math.max(prev, currentLevelFromXP);
        });
        setFils(prev => {
          const next = profileData.fils ?? 500;
          return prev !== next ? next : prev;
        });
        setDerhem(prev => {
          const next = profileData.derhem ?? 10;
          return prev !== next ? next : prev;
        });
        setDinar(prev => {
          const next = profileData.dinar ?? 5;
          return prev !== next ? next : prev;
        });
        setMagnetCount(prev => prev !== (profileData.magnets ?? 3) ? (profileData.magnets ?? 3) : prev);
        setHintCount(prev => prev !== (profileData.hints ?? 3) ? (profileData.hints ?? 3) : prev);
        setSkipCount(prev => prev !== (profileData.skips ?? 3) ? (profileData.skips ?? 3) : prev);
        setDailyStreak(prev => prev !== (profileData.daily_streak || 0) ? (profileData.daily_streak || 0) : prev);
        setRewardStreak(prev => prev !== (profileData.reward_streak || 0) ? (profileData.reward_streak || 0) : prev);
        setLastRewardClaimedAt(prev => prev !== profileData.last_reward_claimed_at ? profileData.last_reward_claimed_at : prev);
        
        const localWins = Number(localStorage.getItem('peyvchin_wins_towards_secret') || 0);
        const dbWins = profileData.wins_towards_secret || 0;
        setWinsTowardsSecret(prev => {
          const next = Math.max(prev, dbWins, localWins);
          if (next !== prev) localStorage.setItem('peyvchin_wins_towards_secret', next.toString());
          return next;
        });

        // --- CONSOLIDATED SOLVED WORDS SYNC (MERGE STRATEGY) ---
        const remoteWords = Array.isArray(profileData.solved_words) ? profileData.solved_words : [];
        const inventoryWords = (profileData.inventory && Array.isArray(profileData.inventory.solved_words)) 
          ? profileData.inventory.solved_words 
          : [];
        
        setSolvedWords(prev => {
          const local = Array.isArray(prev) ? prev : [];
          // Merge local, remote, and inventory words to prevent any data loss
          const merged = [...new Set([...local, ...remoteWords, ...inventoryWords])];
          
          if (JSON.stringify(local) !== JSON.stringify(merged)) {
            localStorage.setItem('peyvchin_solved_words', JSON.stringify(merged));
            return merged;
          }
          return prev;
        });
        
        if (profileData.inventory) {
          setInventory(prev => JSON.stringify(prev) !== JSON.stringify(profileData.inventory) ? profileData.inventory : prev);
        }
        
        // --- HYBRID LEVEL RECALIBRATION ---
        // Ignore the level stored in DB if it's inconsistent with the new Hardcore math
        
        // If we needed to set state for the profile object, it would happen here based on the instructions
        // Assuming the logic intended is to ensure the UI uses the recalculated level
        
        refreshRank(remoteXP, true, controller.signal);
      }
      
      setLoading(false);
    } else if (!loadingAuth && !profileData) {
      setLoading(false);
    }
    return () => controller.abort();
  }, [loadingAuth, profileData, refreshRank]);

  // REAL-TIME SUBSCRIPTION: Listen for profile changes from Supabase (HARDENED)
  useEffect(() => {
    if (!user?.id) return;

    console.log("[GameContext] Initializing real-time sync for:", user.id);
    const profileChannel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const data = payload.new;
          console.log("⚡ [GameContext] Real-time profile update detected:", data);
          
          // Atomic updates for immediate UI sync
          if (data.xp !== undefined) {
             setCurrentXP(prev => {
                const next = Math.max(prev, data.xp);
                if (prev !== next) {
                   refreshRank(next, true);
                   return next;
                }
                return prev;
             });
          }
          
          if (data.daily_streak !== undefined) setDailyStreak(prev => prev !== data.daily_streak ? data.daily_streak : prev);
          if (data.fils !== undefined) setFils(prev => prev !== data.fils ? data.fils : prev);
          if (data.derhem !== undefined) setDerhem(prev => prev !== data.derhem ? data.derhem : prev);
          if (data.dinar !== undefined || data.dinars !== undefined) {
             const dValue = data.dinar !== undefined ? data.dinar : data.dinars;
             setDinar(prev => prev !== dValue ? dValue : prev);
          }
          if (data.magnets !== undefined) setMagnetCount(prev => prev !== data.magnets ? data.magnets : prev);
          if (data.hints !== undefined) setHintCount(prev => prev !== data.hints ? data.hints : prev);
          if (data.skips !== undefined) setSkipCount(prev => prev !== data.skips ? data.skips : prev);

          // Deep merge for inventory/stats
          if (data.inventory) {
             setInventory(data.inventory);
             if (data.inventory.stats) {
                setPlayerStats(prev => ({ ...prev, ...data.inventory.stats }));
             }
             if (data.inventory.solved_words) {
                setSolvedWords(prev => {
                  const local = Array.isArray(prev) ? prev : [];
                  const remote = Array.isArray(data.inventory.solved_words) ? data.inventory.solved_words : [];
                  return [...new Set([...local, ...remote])];
                });
             }
          }
        }
      )
      .subscribe((status) => {
         console.log(`[GameContext] Real-time sync status: ${status}`);
      });

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id, refreshRank]);

  // --- AUTO-SYNC REMOVED TO PREVENT INFINITE LOOP ---
  // Progression sync is now EXCLUSIVELY handled by explicit game events (wins) 
  // via the syncProgressToDatabase function. This prevents "ping-pong" loops.

  // Heartbeat is handled by secure RPCs on every action, so manual update is removed to avoid RLS/Trigger conflicts.

  const updateInventory = useCallback(async (updates, isAdditive = true, syncToDB = true) => {
    const calculateNext = (current, offset, additive) => additive ? (current + offset) : offset;
    const { user: currentUser, fils: currFils, derhem: currDerhem, dinar: currDinar, magnetCount: currMags, hintCount: currHints, skipCount: currSkips } = gameStateRef.current;
    
    const nextValues = {
      fils: updates.fils !== undefined ? calculateNext(currFils, updates.fils, isAdditive) : undefined,
      derhem: updates.derhem !== undefined ? calculateNext(currDerhem, updates.derhem, isAdditive) : undefined,
      dinar: updates.dinar !== undefined ? calculateNext(currDinar, updates.dinar, isAdditive) : undefined,
      magnets: updates.magnetCount !== undefined ? calculateNext(currMags, updates.magnetCount, isAdditive) : undefined,
      hints: updates.hintCount !== undefined ? calculateNext(currHints, updates.hintCount, isAdditive) : undefined,
      skips: updates.skipCount !== undefined ? calculateNext(currSkips, updates.skipCount, isAdditive) : undefined
    };

    if (nextValues.fils !== undefined) setFils(nextValues.fils);
    if (nextValues.derhem !== undefined) setDerhem(nextValues.derhem);
    if (nextValues.dinar !== undefined) setDinar(nextValues.dinar);
    if (nextValues.magnets !== undefined) setMagnetCount(nextValues.magnets);
    if (nextValues.hints !== undefined) setHintCount(nextValues.hints);
    if (nextValues.skips !== undefined) setSkipCount(nextValues.skips);

    Object.entries(updates).forEach(([key, val]) => {
      const storageKey = key === 'magnetCount' ? 'peyvchin_magnets' : key === 'hintCount' ? 'peyvchin_hints' : key === 'skipCount' ? 'peyvchin_skips' : `peyvchin_${key}`;
      const current = getInitial(storageKey, 0);
      localStorage.setItem(storageKey, (isAdditive ? (current + val) : val).toString());
    });

    if (currentUser && syncToDB) {
      try { 
        await supabase.rpc('sync_profile_inventory', {
          p_magnets: nextValues.magnets,
          p_hints: nextValues.hints,
          p_skips: nextValues.skips,
          p_fils: nextValues.fils,
          p_derhem: nextValues.derhem,
          p_dinar: nextValues.dinar
        }); 
      }
      catch (err) { console.warn("DB Inventory Sync Failed:", err); }
    }
  }, []);

  const processPurchase = useCallback(async (item) => {
    const { user: currentUser, fils: currFils, derhem: currDerhem, dinar: currDinar, hintCount: currHints, magnetCount: currMags, skipCount: currSkips } = gameStateRef.current;
    if (!currentUser) return { success: false, error: "Must be logged in" };

    // --- OPTIMISTIC UPDATE START ---
    // Save current values to revert if needed
    const oldValues = { fils: currFils, derhem: currDerhem, dinar: currDinar, hints: currHints, magnets: currMags, skips: currSkips };
    
    const itemType = item.type || (item.price_usd ? 'currency' : 'powerup');
    const currency = item.currency || 'fils';
    const price = item.price || 0;

    // Apply visual deduction immediately
    if (currency === 'fils') setFils(prev => prev - price);
    if (currency === 'derhem') setDerhem(prev => prev - price);
    if (currency === 'dinar') setDinar(prev => prev - price);

    // If it's a powerup, add it immediately to UI
    if (itemType === 'powerup') {
      if (item.id === 'hint_pack') setHintCount(prev => prev + 1);
      if (item.id === 'attractor_field') setMagnetCount(prev => prev + 1);
      if (item.id === 'full_skip') setSkipCount(prev => prev + 1);
    }
    // --- OPTIMISTIC UPDATE END ---

    try {
      // Execute atomic transaction on server
      const { error } = await supabase.rpc('process_purchase', {
        p_item_id: item.id,
        p_item_type: itemType,
        p_currency_used: currency,
        p_price: price,
        p_amount: item.amount || 0
      });

      if (error) throw error;
      
      // Final sync to ensure parity
      await syncProfile(currentUser.id);
      return { success: true };
    } catch (err) {
      console.error("Purchase failed, reverting:", err.message);
      // REVERT on failure
      setFils(oldValues.fils);
      setDerhem(oldValues.derhem);
      setDinar(oldValues.dinar);
      setHintCount(oldValues.hints);
      setMagnetCount(oldValues.magnets);
      setSkipCount(oldValues.skips);
      return { success: false, error: err.message };
    }
  }, [syncProfile]);

  const syncProgressToDatabase = useCallback(async (lettersCount, mode = 'classic', additionalData = {}) => {
    const { user: currentUser, currentXP: currXP, playerStats: currStats } = gameStateRef.current;
    
    // 1. SESSION GUARD: Prevent duplicate submissions for same session ID if provided
    if (additionalData.sessionId) {
      if (sessionGuardRef.current.has(additionalData.sessionId)) {
        console.warn("[GameContext] Duplicate session submission blocked:", additionalData.sessionId);
        return null;
      }
      sessionGuardRef.current.add(additionalData.sessionId);
    }    
    
    const currentAward = getRewardForMode(mode);
    
    // --- ASSISTANCE PENALTY CALCULATION ---
    // Deduct 2 XP for every Hint or Magnet used (Minimum floor 2 XP)
    const hintsUsed = additionalData.hintsUsed || 0;
    const magnetsUsed = additionalData.magnetsUsed || 0;
    const totalAssistance = hintsUsed + magnetsUsed;
    const penaltyXP = totalAssistance * 2;
    
    let xpToAdd = Math.max(2, currentAward.xp - penaltyXP);
    const newLocalXP = Number(currXP) + xpToAdd;

    // --- HYBRID INFINITE LEVEL CALCULATION ---
    const newLevel = getLevelFromXP(newLocalXP);

    // --- UPDATE STATISTICS (LOCAL) ---
    const score = additionalData.score || 0;
    const isWin = additionalData.isWin !== undefined ? additionalData.isWin : true;
    const updatedStats = { ...currStats };
    if (!updatedStats[mode]) {
      updatedStats[mode] = { 
        score: 0, 
        bestScore: 0, 
        totalXP: 0, 
        solvedCount: 0, 
        playedCount: 0,
        current_streak: 0,
        max_streak: 0
      };
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

    // --- UPDATE GUESS DISTRIBUTION (LOCAL) ---
    if (additionalData.isWin && additionalData.attempts) {
      if (!updatedStats[mode].guess_distribution) {
        updatedStats[mode].guess_distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
      }
      const attemptsKey = additionalData.attempts.toString();
      updatedStats[mode].guess_distribution[attemptsKey] = (updatedStats[mode].guess_distribution[attemptsKey] || 0) + 1;
    }

    setPlayerStats(updatedStats);
    localStorage.setItem('peyvchin_stats', JSON.stringify(updatedStats));

    setCurrentXP(newLocalXP);
    localStorage.setItem('peyvchin_xp', newLocalXP.toString());
    
    if (currentAward.type === 'fils') setFils(prev => Number(prev) + (additionalData.filsBonus || currentAward.amount));
    if (currentAward.type === 'derhem') setDerhem(prev => Number(prev) + currentAward.amount);
    if (currentAward.type === 'dinar') setDinar(prev => Number(prev) + currentAward.amount);

    // Daily Streak local logic removed - Now handled server-side via RPC to ensure date-accuracy


    // --- UPDATE SOLVED WORDS (LOCAL) ---
    const currentSolved = Array.isArray(gameStateRef.current.solvedWords) ? gameStateRef.current.solvedWords : [];
    const newSolved = Array.isArray(additionalData.solvedWords) ? additionalData.solvedWords : [];
    
    // OPTIMISTIC UPDATE: Update state immediately so UI (Dictionary/Stats) responds instantly
    const nextSolvedWords = [...new Set([...currentSolved, ...newSolved])];

    if (newSolved.length > 0) {
      setSolvedWords(nextSolvedWords);
      localStorage.setItem('peyvchin_solved_words', JSON.stringify(nextSolvedWords));
      
      // Update inventory stats optimistically if provided
      if (additionalData.filsBonus) setFils(prev => prev + additionalData.filsBonus);
      if (xpToAdd) setCurrentXP(prev => prev + xpToAdd);
    }

    if (!currentUser) {
       return { xpAdded: xpToAdd, newLevel: newLevel, awards: currentAward, isGuest: true };
    }

    // --- SYNC TO SUPABASE (RPC) ---
    if (isSyncingProgressionRef.current) return;
    isSyncingProgressionRef.current = true;

    try {
      const { data, error } = await supabase.rpc('sync_profile_progression', {
        p_xp_to_add: xpToAdd,
        p_fils_to_add: currentAward.type === 'fils' ? (additionalData.filsBonus || currentAward.amount) : 0,
        p_derhem_to_add: currentAward.type === 'derhem' ? currentAward.amount : 0,
        p_dinar_to_add: currentAward.type === 'dinar' ? currentAward.amount : 0,
        p_level: newLevel,
        p_solved_words: nextSolvedWords,
        p_mode: mode,
        p_score: score,
        p_is_win: additionalData.isWin !== undefined ? additionalData.isWin : true,
        p_attempts: additionalData.attempts || 0,
        p_is_flawless: (additionalData.hintsUsed === 0 && additionalData.magnetsUsed === 0),
        p_is_secret_win: mode === 'secret_word',
        p_is_riddle_no_skip: (mode === 'mamak' && additionalData.hintsUsed === 0),
        p_is_pvp_flawless: additionalData.isPvPFlawless || false
      });

      if (error) throw error;

      // --- DIRECT DATABASE SYNC (BACKUP) ---
      try {
        const dbGuessDist = {};
        Object.entries(updatedStats).forEach(([m, data]) => {
          if (data.guess_distribution) dbGuessDist[m] = data.guess_distribution;
        });

        const isWin = additionalData.isWin !== undefined ? additionalData.isWin : true;
        const isPvPWin = mode === 'battle' && isWin;
        const isFlawless = isWin && additionalData.hintsUsed === 0 && additionalData.magnetsUsed === 0;
        const solveTimeMs = additionalData.durationMs || 0;
        const wordsToAdd = Array.isArray(additionalData.solvedWords) ? additionalData.solvedWords.length : (isWin ? 1 : 0);
        
        const newFeverHighscore = mode === 'word_fever' ? Math.max(profileData?.fever_highscore || 0, score) : (profileData?.fever_highscore || 0);
        const newLongestWord = isWin ? Math.max(profileData?.longest_word_length || 0, lettersCount) : (profileData?.longest_word_length || 0);
        
        let newFastestSolve = profileData?.fastest_solve_ms || 0;
        if (isWin && solveTimeMs > 0) {
           newFastestSolve = newFastestSolve > 0 ? Math.min(newFastestSolve, solveTimeMs) : solveTimeMs;
        }

        const currentModePlayCounts = profileData?.mode_play_counts || {};
        const todayStr = new Date().toISOString().split('T')[0];
        const lastActiveDate = profileData?.last_active_date;
        const activeDaysIncrement = (!lastActiveDate || lastActiveDate < todayStr) ? 1 : 0;

        const newCurrentStreak = isWin ? (profileData?.current_streak || 0) + 1 : 0;
        const newMaxStreak = Math.max(profileData?.max_streak || 0, newCurrentStreak);

        await supabase
          .from('profiles')
          .update({
            statistics: updatedStats,
            guess_distribution: dbGuessDist,
            games_played: (profileData?.games_played || 0) + 1,
            games_won: (profileData?.games_won || 0) + (isWin ? 1 : 0),
            pvp_wins: (profileData?.pvp_wins || 0) + (isPvPWin ? 1 : 0),
            total_words_found: (profileData?.total_words_found || 0) + wordsToAdd,
            longest_word_length: newLongestWord,
            fastest_solve_ms: newFastestSolve,
            flawless_wins: (profileData?.flawless_wins || 0) + (isFlawless ? 1 : 0),
            fever_highscore: newFeverHighscore,
            total_active_days: (profileData?.total_active_days || 0) + activeDaysIncrement,
            last_active_date: todayStr,
            current_streak: newCurrentStreak,
            max_streak: newMaxStreak,
            mode_play_counts: {
              ...currentModePlayCounts,
              [mode]: (currentModePlayCounts[mode] || 0) + 1
            }
          })
          .eq('id', currentUser.id);
      } catch (dbErr) {
        console.warn("Direct DB stats update failed:", dbErr.message);
      }

      if (data) {
        const { new_level, new_xp, award_xp, daily_streak } = data;
        if (daily_streak !== undefined) {
          setDailyStreak(daily_streak);
          localStorage.setItem('peyvchin_daily_streak', daily_streak.toString());
        }
        await syncProfile(currentUser.id); 
        refreshRank(new_xp, true);

        return { 
          xpAdded: award_xp, 
          newLevel: new_level, 
          awards: currentAward, 
          bahdiniMsg: `سەرکەفتنەکا نوی! ✨ (پاراستی)` 
        };
      }
    } catch (err) { 
      console.error("Secured Sync Failed:", err.message); 
      return null; 
    } finally {
      isSyncingProgressionRef.current = false;
    }
    return null;
  }, [refreshRank, syncProfile, profileData?.games_played, profileData?.games_won, profileData?.fastest_solve_ms, profileData?.fever_highscore, profileData?.flawless_wins, profileData?.last_active_date, profileData?.longest_word_length, profileData?.mode_play_counts, profileData?.pvp_wins, profileData?.total_active_days, profileData?.total_words_found, profileData?.current_streak, profileData?.max_streak]);

  const addXP = useCallback((amount) => { if (amount) setCurrentXP(prev => prev + amount); }, []);

  const incrementSecretWordProgress = useCallback(async () => {
    
    setWinsTowardsSecret(prev => {
      const nextValue = Math.min(3, prev + 1);
      localStorage.setItem('peyvchin_wins_towards_secret', nextValue.toString());
      
      // Note: Direct DB update is currently blocked by a server-side trigger bug
      // (record 'new' has no field 'owned_avatars'). 
      // Progress is persisted locally to ensure the mode unlocks correctly.
      
      return nextValue;
    });
  }, []);

  const resetSecretWordProgress = useCallback(async () => {
    setWinsTowardsSecret(0);
    localStorage.setItem('peyvchin_wins_towards_secret', '0');
    // Note: DB reset is blocked by server-side trigger issue
  }, []);

  const applyPenalty = useCallback(async (xpAmount = 20, filsAmount = 50) => {
    const { user: currentUser, currentXP: currXP } = gameStateRef.current;
    if (!currentUser) return;

    const newXP = Math.max(0, Number(currXP) - xpAmount);
    const newLevel = getLevelFromXP(newXP);
    
    // Optimistic Update
    setCurrentXP(newXP);
    setFils(prev => Math.max(0, Number(prev) - filsAmount));

    try {
      await supabase.rpc('sync_profile_progression', {
        p_xp_to_add: -xpAmount,
        p_fils_to_add: -filsAmount,
        p_derhem_to_add: 0,
        p_dinar_to_add: 0,
        p_level: newLevel,
        p_solved_words: gameStateRef.current.solvedWords,
        p_mode: 'penalty',
        p_is_win: false,
        p_score: 0,
        p_attempts: 0
      });
      await syncProfile(currentUser.id);
    } catch (err) {
      console.warn("Penalty sync failed:", err);
    }
  }, [syncProfile]);

  const claimDailyReward = useCallback(async () => {
    if (!user) return { error: 'Login required' };
    if (claimRef.current) {
      console.warn('[GameContext] Claim blocked: RPC already in progress');
      return { error: 'Action in progress' };
    }
    
    claimRef.current = true;
    console.log('[GameContext] Triggering secure RPC claim...');
    
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward');
      console.log('[GameContext] RPC Response Data:', data);
      if (error) {
        console.error('[GameContext] RPC Response Error:', error);
        return { error: error.message };
      }

      if (data && data.success) {
        // Atomic local state sync
        if (data.rewards) {
          setFils(prev => prev + (data.rewards.fils || 0));
          setDerhem(prev => prev + (data.rewards.derhem || 0));
          setDinar(prev => prev + (data.rewards.dinar || 0));
          setMagnetCount(prev => prev + (data.rewards.magnets || 0));
          setHintCount(prev => prev + (data.rewards.hints || 0));
          setSkipCount(prev => prev + (data.rewards.skips || 0));
        }
        
        setRewardStreak(data.streak);
        setLastRewardClaimedAt(new Date().toISOString());
        
        await syncProfile(user.id, null, true);
        return { success: true, rewards: data.rewards, streak: data.streak };
      }

      return { success: false, error: data?.message || "Claim failed" };
    } catch (err) { 
      console.error("[GameContext] Fatal Claim Error:", err); 
      return { success: false, error: "ئاریشەیەک د سێرڤەری دا ھەبوو" }; 
    } finally {
      claimRef.current = false;
    }
  }, [user, syncProfile]);

  const setNotifiedLevelDB = useCallback(async (newLevel) => {
    setLastNotifiedLevel(newLevel);
    if (user?.id) {
      try {
        await supabase.from('profiles').update({ last_notified_level: newLevel }).eq('id', user.id);
      } catch (err) {
        console.error("[GameContext] Failed to sync last_notified_level:", err);
      }
    }
  }, [user]);

  const value = useMemo(() => ({
    level, currentXP, maxXP, minXPForLevel, fils, derhem, dinar, addXP,
    dailyStreak, setDailyStreak, rewardStreak, lastRewardClaimedAt, claimDailyReward,
    inventory, magnetCount, hintCount, skipCount,
    solvedWords, playerStats, winsTowardsSecret, incrementSecretWordProgress, resetSecretWordProgress,
    userRank: _userRank, updateInventory, setCurrentXP, setLastNotifiedLevel, lastNotifiedLevel, setNotifiedLevelDB,
    syncProgressToDatabase, applyPenalty, processPurchase, refreshRank, getLevelData, progressPercent,
    getFreshWord: async (mode, category) => {
      const { user: currentUser } = gameStateRef.current;
      if (currentUser?.id) {
        try {
          // If category is "All" (ھەموو), use the balanced randomization RPC
          const isAll = !category || category === 'ھەموو' || category === 'generalWordPool';
          const rpcName = isAll ? 'get_balanced_random_word' : 'get_random_fresh_word';
          
          const rpcParams = {
            p_user_id: currentUser.id,
            p_mode_tag: mode === 'classic' ? 'classic' : (mode === 'hard_words' ? 'hard_words' : (mode === 'mamak' ? 'mamak' : mode))
          };

          if (!isAll) {
            rpcParams.p_category = category;
          }

          const { data, error } = await supabase.rpc(rpcName, rpcParams);
          if (error) throw error;
          if (data && data.length > 0) return { word: data[0].word, hint: data[0].hint, category: data[0].category, id: data[0].id };
        } catch (err) { console.warn("[GameContext] Failed to fetch fresh word from DB, falling back to local:", err); }
      }
      const { level: currLevel, solvedWords: sWords } = gameStateRef.current;
      const { getRandomWordFromCategory } = await import('../data/wordList');
      return getRandomWordFromCategory(category, currLevel, sWords, mode);
    },
    initializeStatsInDB: async () => {
      const { user: currentUser } = gameStateRef.current;
      if (!currentUser) return { error: "Login required" };
      
      const dummyStats = [
        { mode: 'classic', score: 40, best: 50, xp: 200 },
        { mode: 'mamak', score: 30, best: 45, xp: 150 },
        { mode: 'secret_word', score: 1, best: 1, xp: 100 },
        { mode: 'word_fever', score: 5, best: 8, xp: 300 },
        { mode: 'hard_words', score: 20, best: 35, xp: 120 },
        { mode: 'battle', score: 100, best: 100, xp: 500 }
      ];

      for (const stat of dummyStats) {
        await supabase.rpc('sync_game_session', {
          p_user_id: currentUser.id,
          p_mode: stat.mode,
          p_magnets_used: 0,
          p_hints_used: 0,
          p_skips_used: 0,
          p_solved_words: []
        });
      }
      await syncProfile();
      return { success: true };
    },
    loading
  }), [
    level, currentXP, maxXP, minXPForLevel, fils, derhem, dinar, addXP,
    dailyStreak, rewardStreak, lastRewardClaimedAt, claimDailyReward,
    inventory, magnetCount, hintCount, skipCount, solvedWords, playerStats,
    winsTowardsSecret, incrementSecretWordProgress, resetSecretWordProgress, _userRank,
    updateInventory, syncProgressToDatabase, applyPenalty, processPurchase, refreshRank, loading,
    syncProfile, lastNotifiedLevel, progressPercent, setNotifiedLevelDB
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
