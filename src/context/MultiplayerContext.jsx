/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMotionValue } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getUnifiedWords } from '../data/wordList';
import { triggerHaptic } from '../utils/haptics';
import { useGame } from './GameContext';
import { useUser } from './AuthContext';
import { useAudio } from './AudioContext';

const MultiplayerContext = createContext();

export const MultiplayerProvider = ({ children }) => {
  const { user, userNickname } = useUser();
  const { 
    startSearchingSound, 
    stopSearchingSound, 
    playStartGameSound: _playStartGameSound,
    playRewardSound 
  } = useAudio();
  const { syncProgressToDatabase, applyPenalty } = useGame();
  const [multiplayerState, setMultiplayerState] = useState('idle');
  const [MatchmakingTime, setMatchmakingTime] = useState(0);
  const [activeMatch, setActiveMatch] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [LastMatchResult, setLastMatchResult] = useState(null);
  const [MatchResultTrigger, setMatchResultTrigger] = useState(0);

  // New Game State
  const [opponentGuesses, setOpponentGuesses] = useState([]);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRoundWinner, setIsRoundWinner] = useState(false);
  const [winnerNickname, setWinnerNickname] = useState('');
  const [roundMessage, setRoundMessage] = useState('');
  const [forfeitStatus, setForfeitStatus] = useState(null); 
  const [forfeitCountdown, setForfeitCountdown] = useState(10);
  const [isForfeitWin, setIsForfeitWin] = useState(false);
  const [MatchReward, setMatchReward] = useState(null);

  const setMultiplayerStateGuarded = useCallback((next) => {
    setMultiplayerState(prev => prev !== next ? next : prev);
  }, []);

  const setActiveMatchGuarded = useCallback((next) => {
    setActiveMatch(prev => {
       if (!prev && !next) return null;
       if (prev && next && prev.id === next.id && prev.status === next.status && prev.current_word_index === next.current_word_index && prev.p1_score === next.p1_score && prev.p2_score === next.p2_score) return prev;
       return next;
    });
  }, []);

  const setOpponentGuarded = useCallback((next) => {
    setOpponent(prev => {
       if (!prev && !next) return null;
       if (prev?.id === next?.id) return prev;
       return next;
    });
  }, []);
  const forfeitTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [opponentLiveStatuses, setOpponentLiveStatuses] = useState([]);
  const opponentLiveCursor = useMotionValue(0);

  const stateRef = useRef(multiplayerState);
  const wordIndexRef = useRef(currentWordIndex);
  const scoresRef = useRef(scores);
  const opponentRef = useRef(opponent);
  const matchIdRef = useRef(matchId);
  const channelRef = useRef(null);
  const matchmakingTimeoutRef = useRef(null);
  const _handshakeTimerRef = useRef(null);
  const isFetchingOpponentRef = useRef(false);
  const isPollingRef = useRef(false);
  const _isFetchingMatchRef = useRef(false);
  const safeClearMatchmakingTimeout = useCallback(() => {
    if (matchmakingTimeoutRef.current) {
      clearTimeout(matchmakingTimeoutRef.current);
      matchmakingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => { stateRef.current = multiplayerState; }, [multiplayerState]);
  useEffect(() => { wordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { opponentRef.current = opponent; }, [opponent]);
  useEffect(() => { matchIdRef.current = matchId; }, [matchId]);

  // UNIFIED AUDIO CONTROLLER: Sync searching SFX with state
  useEffect(() => {
    if (multiplayerState === 'playing' || multiplayerState === 'idle' || multiplayerState === 'game_over') {
      try {
        stopSearchingSound();
      } catch (e) {
        console.warn("[Multiplayer] Audio: Failed to stop searching SFX", e);
      }
    } else if (multiplayerState === 'searching' || multiplayerState === 'waiting') {
      try {
        startSearchingSound();
      } catch (e) {
        console.warn("[Multiplayer] Audio: Failed to start searching SFX", e);
      }
    }
  }, [multiplayerState, stopSearchingSound, startSearchingSound]);

  // TIMER ENGINE: Tracks seconds while searching or waiting
  useEffect(() => {
    let interval;
    if (multiplayerState === 'searching' || multiplayerState === 'waiting') {
      interval = setInterval(async () => {
        setMatchmakingTime(prev => {
          const next = prev + 1;
          // 2.2 DEEP FETCH FALLBACK: If stuck for 12s, force a manual record check
          if (next === 12 && stateRef.current !== 'playing') {
            const mId = matchIdRef.current;
            if (mId && typeof mId === 'string' && mId !== 'undefined') {
              supabase.from('online_matches').select('*').eq('id', mId).maybeSingle().then(({ data }) => {
                if (data && (data.player2_id || data.status === 'playing')) {
                  console.log('[Multiplayer] Deep check found match state change! Force sync.');
                  setActiveMatchGuarded(data);
                }
              });
            }
          }
          return next;
        });
      }, 1000);
    } else {
      setMatchmakingTime(0);
    }
    return () => clearInterval(interval);
  }, [multiplayerState, setActiveMatchGuarded]);

  const broadcastGuess = useCallback((colors, isWin = false) => {
    if (!channelRef.current || !user?.id) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'GUESS_SUBMITTED',
      payload: { senderId: user.id, colors, isWin }
    });
  }, [user?.id]);

  const broadcastLiveAction = useCallback((statuses, cursorIndex) => {
    if (!channelRef.current || !user?.id) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'LIVE_SYNC',
      payload: { senderId: user.id, statuses, cursorIndex }
    });
  }, [user?.id]);

  const submitGuess = useCallback(async (colors, isWin) => {
    if (!matchId || !activeMatch) return;
    broadcastGuess(colors, isWin);

    // Clear live feedback upon submission
    broadcastLiveAction([], 0);

    const isP1 = activeMatch.player1_id === user.id;

    // PERSIST NORMAL GUESS (Ghost Grid Support)
    if (!isWin) {
      const currentColors = isP1 ? (activeMatch.p1_colors || []) : (activeMatch.p2_colors || []);
      const updatedColors = [...currentColors, colors];
      await supabase.from('online_matches')
        .update({ [isP1 ? 'p1_colors' : 'p2_colors']: updatedColors })
        .eq('id', matchId);
    }

    if (isWin) {
      const p1Score = activeMatch.p1_score || 0;
      const p2Score = activeMatch.p2_score || 0;
      const myNewScore = isP1 ? p1Score + 1 : p2Score + 1;
      const currentIdx = activeMatch.current_word_index || 0;
      
      broadcastLiveAction([], 0);
      
      // 1. Prepare update data for immediate advancement
      const scoreDiff = Math.abs(myNewScore - (isP1 ? p2Score : p1Score));
      const totalWords = activeMatch.words?.length || 5;
      
      // VICTORY CONDITION: Lead by 2 points OR reach the end of words
      const isWinByLead = scoreDiff >= 2;
      const isWordsExhausted = (currentIdx + 1 >= totalWords);
      const isMatchEnd = isWinByLead || isWordsExhausted;
      
      const updateData = {
        [isP1 ? 'p1_score' : 'p2_score']: myNewScore,
        p1_failed: false,
        p2_failed: false,
        p1_colors: [],
        p2_colors: []
      };

      if (isMatchEnd) {
        updateData.status = 'finished';
      } else {
        updateData.current_word_index = currentIdx + 1;
      }

      // 2. ADVANCE BOTH IMMEDIATELY (No delay for Win path as requested)
      await supabase.from('online_matches').update(updateData).eq('id', activeMatch.id);

      setIsRoundWinner(true);
      setWinnerNickname(userNickname);
      triggerHaptic([50, 50, 100]);
    }
  }, [matchId, activeMatch, broadcastGuess, broadcastLiveAction, user?.id, userNickname]);

  const submitFailure = useCallback(async () => {
    if (!matchId || !activeMatch) return;
    broadcastLiveAction([], 0);
    const isP1 = activeMatch.player1_id === user?.id;
    const currentIdx = activeMatch.current_word_index || 0;
    const p1Score = activeMatch.p1_score || 0;
    const p2Score = activeMatch.p2_score || 0;
    
    const updates = { 
      [isP1 ? 'p1_colors' : 'p2_colors']: [...(isP1 ? activeMatch.p1_colors : activeMatch.p2_colors || []), ["#334155","#334155","#334155","#334155","#334155"]],
      [isP1 ? 'p1_failed' : 'p2_failed']: true
    };

    // 1. Mark myself as failed
    await supabase.from('online_matches').update(updates).eq('id', matchId);

    // 2. FUNDAMENTAL CHECK: Fetch latest opponent state
    const { data: latest } = await supabase.from('online_matches').select('*').eq('id', activeMatch.id).single();
    if (latest) {
      const otherWonRound = isP1 ? (latest.p2_score > p2Score) : (latest.p1_score > p1Score);
      const otherIsDone = isP1 ? (latest.p2_failed || otherWonRound) : (latest.p1_failed || otherWonRound);

      if (otherIsDone) {
        const scoreDiff = Math.abs(latest.p1_score - latest.p2_score);
        const isMatchEnd = scoreDiff >= 2 || (currentIdx + 1 >= (latest.words?.length || 5));
        
        const nextRoundData = {
          current_word_index: currentIdx + 1,
          p1_failed: false,
          p2_failed: false,
          p1_colors: [],
          p2_colors: []
        };
        if (isMatchEnd) nextRoundData.status = 'finished';

        // ADVANCE BOTH IMMEDIATELY (No delay as requested)
        await supabase.from('online_matches').update(nextRoundData).eq('id', activeMatch.id);
      }
    }
    triggerHaptic([100, 50, 100]);
  }, [matchId, activeMatch, broadcastLiveAction, user?.id]);

  const triggerForfeitVictory = useCallback(async () => {
    const mId = matchId || matchIdRef.current;
    if (!mId) return;

    try {
      setForfeitStatus('confirmed');
      setIsForfeitWin(true);
      const isP1 = activeMatch?.player1_id === user?.id;
      
      // 1. Update DB immediately
      const updates = { 
        status: 'finished',
        // Award the win to the remaining player by setting score 
        // Or just let the result logic handle it
      };
      // To ensure victory, we make sure current player has a 3-0 lead
      if (isP1) {
        updates.p1_score = 3;
        updates.p2_score = 0;
      } else {
        updates.p2_score = 3;
        updates.p1_score = 0;
      }

      await supabase.from('online_matches').update(updates).eq('id', mId);
      
      // Standardized DB Reward Sync (Battle Reward: 1 Dinar, 100 XP)
      const rewardData = await syncProgressToDatabase(5, 'battle');
      if (rewardData) setMatchReward(rewardData);
      // Trigger reward sound
      try { playRewardSound(); } catch(_e) { /* Audio context failure */ }

      // 3. UI Update with specific disconnect message
      setLastMatchResult('victory');
      setMatchResultTrigger(prev => prev + 1);
      
      // Cleanup
      if (forfeitTimerRef.current) {
        clearTimeout(forfeitTimerRef.current);
        forfeitTimerRef.current = null;
      }

      // Transition out of playing state
      setMultiplayerStateGuarded('game_over');
    } catch (err) {
      console.error('[Multiplayer] Forfeit handling failed:', err);
    }
  }, [matchId, activeMatch?.player1_id, user?.id, syncProgressToDatabase, playRewardSound, setMultiplayerStateGuarded]);
  
  const ResetMatchResultTrigger = useCallback(() => {
    setMatchResultTrigger(0);
    setLastMatchResult(null);
    setIsForfeitWin(false);
  }, []);

  const fetchOpponentProfile = useCallback(async (opponentId, signal = null) => {
    if (!opponentId || opponentId === 'undefined' || isFetchingOpponentRef.current) return null;
    
    try {
      isFetchingOpponentRef.current = true;
      let query = supabase
        .from('profiles')
        .select('id, nickname, avatar_url, updated_at, xp')
        .eq('id', opponentId);
      
      if (signal) query = query.abortSignal(signal);
      
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (data) {
        setOpponentGuarded(data);
        return data;
      }
      return null;
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('Abort')) return null;
      console.warn('[Multiplayer] Failed to fetch opponent profile:', err);
      return null;
    } finally {
      isFetchingOpponentRef.current = false;
    }
  }, [setOpponentGuarded]);

  const clearForfeitLogic = useCallback(() => {
    if (forfeitTimerRef.current) {
      clearTimeout(forfeitTimerRef.current);
      forfeitTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startGracePeriod = useCallback(() => {
    setForfeitStatus('pending');
    setForfeitCountdown(10);
    
    clearForfeitLogic();

    // Start countdown interval
    countdownIntervalRef.current = setInterval(() => {
      setForfeitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    forfeitTimerRef.current = setTimeout(() => {
      console.log('[Multiplayer] Grace period expired, triggering forfeit.');
      triggerForfeitVictory();
    }, 10000);
  }, [triggerForfeitVictory, clearForfeitLogic]);

  const cancelMatch = useCallback(async () => {
    const idToCancel = matchId || matchIdRef.current;
    try {
      if (idToCancel) {
          const isP1 = activeMatch?.player1_id === user?.id;
          const updates = { status: 'finished' };
          // Award the win to the OTHER player and reset the leaver's score
          if (isP1) {
            updates.p2_score = 3;
            updates.p1_score = 0;
          } else {
            updates.p1_score = 3;
            updates.p2_score = 0;
          }

          await supabase.from('online_matches').update(updates).eq('id', idToCancel);
          console.log('[Multiplayer] Match marked as FINISHED in DB via Cancel.');

          if (multiplayerState === 'playing') {
            applyPenalty(10, 25); // Very light penalty for leaving mid-game
          }
        } else {
          // If just searching/waiting, delete the record
          await supabase.from('online_matches').delete().eq('id', idToCancel);
          console.log('[Multiplayer] Match DELETED from DB via Cancel.');
        }
    } catch (err) {
      console.warn('[Multiplayer] Cancel/Cleanup failed:', err);
    } finally {
      setMatchId(null);
      setActiveMatchGuarded(null);
      setOpponentGuarded(null);
      setMultiplayerStateGuarded('idle');
      setMatchmakingTime(0);
      setOpponentGuesses([]);
      setScores({ p1: 0, p2: 0 });
      setCurrentWordIndex(0);
      setForfeitStatus(null);
      setMatchResultTrigger(0);
      setLastMatchResult(null);
      setMatchReward(null);
      
      if (forfeitTimerRef.current) {
        clearTimeout(forfeitTimerRef.current);
        forfeitTimerRef.current = null;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // STOP SEARCHING SOUND
      try { 
        stopSearchingSound(false); 
      } catch (e) {
        console.warn("Failed to stop searching sound:", e);
      }
    }
  }, [matchId, multiplayerState, stopSearchingSound, setActiveMatchGuarded, setMultiplayerStateGuarded, setOpponentGuarded, activeMatch?.player1_id, applyPenalty, user?.id]);

  // 1. POLLING FALLBACK: Detect player join automatically
  useEffect(() => {
    const isSearching = multiplayerState === 'waiting' || multiplayerState === 'searching';
    if (!isSearching || !matchId) return;

    const controller = new AbortController();

    const pollInterval = setInterval(async () => {
      if (isPollingRef.current) return;
      
      try {
        isPollingRef.current = true;
        const { data: match } = await supabase
          .from('online_matches')
          .select('*')
          .eq('id', matchId)
          .abortSignal(controller.signal)
          .maybeSingle();

        if (match && (match.player2_id || match.status === 'playing') && stateRef.current !== 'playing' && stateRef.current !== 'game_over') {
          console.log('[Multiplayer] Polling Fallback found opponent! Syncing.');
          setActiveMatchGuarded(match);
          clearInterval(pollInterval);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('[Multiplayer] Polling error:', err);
      } finally {
        isPollingRef.current = false;
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      controller.abort();
    };
  }, [multiplayerState, matchId, setActiveMatchGuarded]);

  // 2. REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!matchId || matchId === 'undefined') return;
    console.log('[Multiplayer] Constructing subscription filter for:', matchId);

    const channel = supabase
      .channel(`match_room_${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'online_matches', filter: `id=eq.${matchId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            console.log('[Multiplayer] Match record deleted (cancelled by opponent).');
            // Give the UI time to show the result or just avoid abrupt pop-out
            setTimeout(() => {
              setMultiplayerStateGuarded('idle');
              setActiveMatchGuarded(null);
              setOpponentGuarded(null);
            }, 10000);
            return;
          }

          const updatedMatch = payload.new;
          if (!updatedMatch) return;

          setActiveMatchGuarded(updatedMatch);

          // 2.1 DIRECT HANDSHAKE RESOLUTION: If we are Host and a Joiner just claimed the room
          const isP1 = updatedMatch.player1_id === user?.id;
          if (isP1 && updatedMatch.player2_id && stateRef.current !== 'playing' && stateRef.current !== 'game_over') {
            console.log('[Multiplayer] Realtime found Joiner! Resolving handshake...');
            fetchOpponentProfile(updatedMatch.player2_id).then(prof => {
              if (prof) {
                setMultiplayerStateGuarded('playing');
                triggerHaptic([50, 50, 100]);
              }
            });
          }
        }
      )
      .on(
        'broadcast',
        { event: 'GUESS_SUBMITTED' },
        (payload) => {
          const data = payload.payload || payload;
          if (user?.id && data.senderId !== user.id) {
            setOpponentGuesses(prev => [...prev, data.colors]);
            if (data.isWin) {
              const winnerName = opponentRef.current?.nickname || 'Opponent';
              setWinnerNickname(winnerName);
              triggerHaptic([100, 100, 100]);
              setTimeout(() => setWinnerNickname(''), 3000);
            }
          }
        }
      )
      .on(
        'broadcast',
        { event: 'LIVE_SYNC' },
        (payload) => {
          // Robust payload extraction for broadcast
          const data = payload.payload || payload;
          if (user?.id && data.senderId && data.senderId !== user.id) {
            setOpponentLiveStatuses(data.statuses || []);
            opponentLiveCursor.set(data.cursorIndex || 0);
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const presences = Object.values(newState).flat();
        const opponentId = opponentRef.current?.id;
        
        // 1. RECOVERY CHECK: If opponent was pending forfeit but is now back in sync
        const isOpponentPresent = presences.some(p => p.user_id === opponentId);
        if (isOpponentPresent && forfeitTimerRef.current) {
          console.log('[Multiplayer] Opponent reconnected (via Sync), cancelling forfeit timer.');
          clearTimeout(forfeitTimerRef.current);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          forfeitTimerRef.current = null;
          countdownIntervalRef.current = null;
          setForfeitStatus(null);
          setForfeitCountdown(10);
        }

        // 2. DISCONNECT DETECTION (Fallback): If we are playing but opponent is missing from sync
        if (stateRef.current === 'playing' && !isOpponentPresent && !forfeitTimerRef.current) {
          console.log('[Multiplayer] Opponent missing from sync, triggering 30s grace period...');
          startGracePeriod();
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const opponentId = opponentRef.current?.id;
        const opponentLeft = leftPresences.some(p => p.user_id === opponentId);
        
        if (opponentLeft && stateRef.current === 'playing' && !forfeitTimerRef.current) {
          console.log('[Multiplayer] Opponent explicitly left, starting 30s grace period...');
          startGracePeriod();
        }
      })
      .subscribe(async (status) => {
        console.log(`[Multiplayer] Realtime Channel (${matchId}):`, status);
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
          await channel.track({
            user_id: user?.id,
            online_at: new Date().toISOString(),
          });
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Multiplayer] Realtime Connection Failed.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      clearForfeitLogic();
    };
  }, [matchId, user?.id, clearForfeitLogic, fetchOpponentProfile, opponentLiveCursor, setActiveMatchGuarded, setMultiplayerStateGuarded, startGracePeriod, setOpponentGuarded]);

  // 2.5 APP STATE VISIBILITY HANDLER (Clinical Recovery)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!user?.id) return; // Guard against unauthenticated syncs
        console.log('[Multiplayer] App returned to foreground, checking sync...');
        // Force re-initialize supabase connection if dropped
        if (supabase.realtime && !supabase.realtime.isConnected()) {
          supabase.realtime.connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  useEffect(() => {
    if (!activeMatch || !user?.id) return;

    const verifyAndStart = async () => {
      try {
        if (activeMatch.player1_id && activeMatch.player2_id) {
          if (opponent) {
            if (multiplayerState !== 'playing' && multiplayerState !== 'game_over' && multiplayerState !== 'found') {
              setMultiplayerState('found');
              setTimeout(() => setMultiplayerState(prev => prev === 'found' ? 'playing' : prev), 2000);
            }
          } else {
            console.warn("[Multiplayer] Handshake: Waiting for opponent profile...");
            const isP1 = activeMatch.player1_id === user.id;
            const oppId = isP1 ? activeMatch.player2_id : activeMatch.player1_id;
            
            const { data: opponentProfile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', oppId)
              .single();

            if (error || !opponentProfile) {
              setMultiplayerState('syncing'); 
            } else {
              setOpponent(opponentProfile);
              setMultiplayerState('found');
              setTimeout(() => setMultiplayerState(prev => prev === 'found' ? 'playing' : prev), 2000);
            }
          }
        } else {
          if (multiplayerState !== 'waiting' && multiplayerState !== 'searching') {
            setMultiplayerState('waiting');
          }
        }
      } catch (err) {
        console.error("[Multiplayer] Handshake verification failed:", err);
        setMultiplayerState('syncing');
      }
    };

    verifyAndStart();
  }, [activeMatch, opponent, user?.id, multiplayerState]);
  
  // 4. GAME SYNC EFFECT: Handle round transitions and match results
  useEffect(() => {
    if (!activeMatch || !user?.id) return;
    
    const isP1 = activeMatch.player1_id === user.id;

    // --- 4.1 DETECT ROUND TRANSITION ---
    if (activeMatch.current_word_index !== undefined && activeMatch.current_word_index !== wordIndexRef.current) {
      const newIndex = activeMatch.current_word_index || 0;
      const wasTie = (activeMatch.p1_score === scoresRef.current.p1 && activeMatch.p2_score === scoresRef.current.p2);

      setCurrentWordIndex(newIndex);
      setOpponentGuesses([]);
      setIsRoundWinner(false);
      setWinnerNickname('');
      
      if (wasTie && newIndex > 0) {
        setRoundMessage('ROUND_DRAW');
      } else {
        setRoundMessage(`ROUND ${newIndex + 1}`);
      }
      setTimeout(() => setRoundMessage(''), 4000);
    }

    // --- 4.3 UPDATE LOCAL REFS (DO THIS LAST) ---
    wordIndexRef.current = activeMatch.current_word_index || 0;
    scoresRef.current = { p1: activeMatch.p1_score || 0, p2: activeMatch.p2_score || 0 };
    setScores(scoresRef.current);

    if (activeMatch.status === 'finished' && multiplayerState !== 'idle') {
      // Logic for anyone who didn't trigger the game_over state locally (e.g. the loser)
      if (multiplayerState !== 'game_over' || LastMatchResult === null) {
        const myScore = isP1 ? activeMatch.p1_score : activeMatch.p2_score;
        const oppScore = isP1 ? activeMatch.p2_score : activeMatch.p1_score;
        
        let result = 'draw';
        if (myScore - oppScore >= 2) result = 'victory';
        else if (oppScore - myScore >= 2) result = 'defeat';
        else result = 'draw';
        
        console.log(`[Multiplayer] Sync found finished match. Scores: ${myScore}-${oppScore}. Result: ${result}.`);
        setLastMatchResult(result);
        setMatchResultTrigger(prev => prev + 1);
        setMultiplayerStateGuarded('game_over');

        // SYNC REWARDS TO DATABASE
        if (result === 'victory') {
          const isFlawless = myScore === 3 && oppScore === 0;
          syncProgressToDatabase(10, 'battle', { isPvPFlawless: isFlawless }).then(rewardData => {
            if (rewardData) setMatchReward(rewardData);
          });
        } else if (result === 'draw') {
          syncProgressToDatabase(10, 'battle_draw').then(rewardData => {
            if (rewardData) setMatchReward(rewardData);
          });
        }
      }
    }

    if (activeMatch.p1_score !== scoresRef.current.p1 || activeMatch.p2_score !== scoresRef.current.p2) {
      setScores({ p1: activeMatch.p1_score, p2: activeMatch.p2_score });
    }

    // NEW: Sync Opponent Colors from DB if missing in local state
    const oppColors = isP1 ? activeMatch.p2_colors : activeMatch.p1_colors;
    if (oppColors && Array.isArray(oppColors) && oppColors.length > opponentGuesses.length) {
      setOpponentGuesses(oppColors);
    }
  }, [activeMatch, user?.id, multiplayerState, opponentGuesses.length, LastMatchResult, setMultiplayerStateGuarded, syncProgressToDatabase]);

  // 5. MOUNT-TIME RECOVERY EFFECT
  useEffect(() => {
    if (!user?.id || multiplayerState !== 'idle') return;
    const controller = new AbortController();

    const recoverActiveMatch = async () => {
      console.log('[Multiplayer] Checking for active match sessions to recover...');
      try {
        const { data, error } = await supabase
          .from('online_matches')
          .select('*')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .eq('status', 'playing')
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal)
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // 4.1 EXPIRATION CHECK: If match is older than 15 minutes, auto-finish it
          const createdAt = new Date(data.created_at);
          const now = new Date();
          const diffInMinutes = (now - createdAt) / (1000 * 60);

          if (diffInMinutes > 15) {
            console.log('[Multiplayer] Found stale match (15m+). Auto-finishing in DB.');
            await supabase.from('online_matches').update({ status: 'finished' }).eq('id', data.id);
            return; // Stay in idle
          }

          console.log('[Multiplayer] Recovering active match:', data.id);
          const oppId = data.player1_id === user.id ? data.player2_id : data.player1_id;
          
          setMatchId(data.id);
          setActiveMatchGuarded(data);
          
          if (oppId) {
            await fetchOpponentProfile(oppId);
          }
          
          setMultiplayerStateGuarded('playing');
          triggerHaptic([100, 50]);
        }
      } catch (err) {
        console.warn('[Multiplayer] Active match recovery failed:', err);
      }
    };

    recoverActiveMatch();
    return () => controller.abort();
  }, [user?.id, fetchOpponentProfile, multiplayerState, setActiveMatchGuarded, setMultiplayerStateGuarded]);

  // UNIFIED ONE-CLICK MATCHMAKING
  const startMatchmaking = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Multiplayer] ONE-CLICK: Searching for rooms...');
    
    // 0. Failsafe Audio Initialization
    try { startSearchingSound(); } catch (e) { console.warn("Searching Sfx fail:", e); }

    // 1. Aggressive Connection Guard (Flush and Re-establish)
    if (supabase.realtime) {
      supabase.realtime.disconnect();
      supabase.realtime.connect();
    }
    
    setMultiplayerStateGuarded('searching');
    setMatchmakingTime(0);
    setOpponent(null);
    setOpponentGuesses([]);
    setMatchReward(null);

    // 2. HARD TIMEOUT FALLBACK (60 Seconds)
    safeClearMatchmakingTimeout();
    matchmakingTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === 'searching' || stateRef.current === 'waiting') {
        setMultiplayerState('idle'); 
        alert("چ یاریزان نەهاتە دیتن ل ڤێ گاڤێ. پشتى دەمەکێ دى تاقی بکە.");
      }
    }, 60000);

    try {
      // PHASE 0: CLEANUP (Ensure no old waiting matches for this user exist)
      await supabase.from('online_matches').delete().eq('player1_id', user.id).eq('status', 'waiting');

      // PHASE 1: SEARCH (DIRECT CLIENT-SIDE JOIN - AUDITED)
      console.log('[Multiplayer] SEARCH: Querying for status=waiting AND player2_id=NULL...');
      const { data: openMatches, error: searchError } = await supabase
        .from('online_matches')
        .select('id, player1_id')
        .eq('status', 'waiting')
        .is('player2_id', null)
        .neq('player1_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (searchError) {
        console.error('[Multiplayer] Search Query Error:', searchError);
      }

      if (openMatches && openMatches.length > 0) {
        const targetMatch = openMatches[0];
        console.log('[Multiplayer] JOINER: Found target room:', targetMatch.id, '. Attempting atomic claim...');

        // ATOMIC CLAIM: Update only if it's still waiting with no p2
        const { data: joinedMatch, error: claimError } = await supabase
          .from('online_matches')
          .update({ 
            player2_id: user.id,
            status: 'playing' // Optional: move to playing immediately OR let handshake decide
          })
          .eq('id', targetMatch.id)
          .is('player2_id', null)
          .select()
          .single();

        if (!claimError && joinedMatch) {
          safeClearMatchmakingTimeout();
          console.log('[Multiplayer] JOINER: Claim SUCCESS! Handshaking with Host:', joinedMatch.player1_id);
          
          setMatchId(joinedMatch.id);
          setActiveMatch(joinedMatch);
          setCurrentWordIndex(joinedMatch.current_word_index || 0);

          // DIRECT JOINER RESOLUTION: Fetch Host profile and transition immediately
          const hostProfile = await fetchOpponentProfile(joinedMatch.player1_id);
          if (hostProfile) {
            setMultiplayerStateGuarded('playing');
            triggerHaptic([50, 50, 100]);
          } else {
            // Fallback to syncing if profile fetch is slow
            setMultiplayerStateGuarded('syncing');
          }
          return;
        } else {
          console.warn('[Multiplayer] JOINER: Claim failed (someone else got it?). Falling back to Host.');
        }
      }

      // PHASE 2: AUTO-HOST (If no room found)
      console.log('[Multiplayer] HOST: No match found, creating room...');
      let selectedWords = [];
      let selectedRiddles = [];

      try {
        const { data: sequencedWords, error: wordError } = await supabase
          .rpc('get_multiplayer_words_sequenced');
          
        if (!wordError && sequencedWords?.length > 0) {
          selectedWords = sequencedWords.map(e => e.word);
          selectedRiddles = sequencedWords.map(e => e.hint || 'No riddle');
        } else {
          throw new Error('DB Sequenced Fetch Error or Empty');
        }
      } catch (_) {
        console.log('[Multiplayer] Using local fallback for sequenced words.');
        const localWords = getUnifiedWords();
        const fiveLetterLocal = localWords.filter(w => w.word && w.word.length === 5);
        // Shuffle local words randomly instead of sorting alphabetically to prevent repetition
        const fallback = [...fiveLetterLocal].sort(() => Math.random() - 0.5).slice(0, 5);
        selectedWords = fallback.map(w => w.word);
        selectedRiddles = fallback.map(w => w.hint || 'پەیڤێ بدۆزەوە');
      }

      const { data: newMatch, error: createError } = await supabase
        .from('online_matches')
        .insert({
          player1_id: user.id,
          status: 'waiting',
          words: selectedWords,
          riddles: selectedRiddles,
          current_word_index: 0,
          p1_score: 0, p2_score: 0
        })
        .select().single();

      if (createError) throw createError;
      if (newMatch) {
        console.log('[Multiplayer] HOST: Success! Created Match ID:', newMatch.id, 'Words:', newMatch.words?.[0]);
        setMatchId(newMatch.id);
        setActiveMatchGuarded(newMatch);
        setMultiplayerStateGuarded('waiting');
      }

    } catch (error) {
      console.error('[Multiplayer] Matchmaking Failed:', error);
      safeClearMatchmakingTimeout();
      try { stopSearchingSound(false); } catch(_e) { /* Ignore audio stop failures */ }
      setMultiplayerStateGuarded('idle');
    }
  }, [user?.id, startSearchingSound, stopSearchingSound, safeClearMatchmakingTimeout, fetchOpponentProfile, setActiveMatchGuarded, setMultiplayerStateGuarded]);



  const value = useMemo(() => ({
    multiplayerState,
    MatchmakingTime,
    activeMatch,
    opponent,
    setMultiplayerState,
    startMatchmaking,
    cancelMatch,
    submitGuess,
    submitFailure,
    broadcastGuess,
    opponentGuesses,
    scores,
    currentRound: currentWordIndex,
    isRoundWinner,
    MatchResultTrigger,
    LastMatchResult,
    MatchReward,
    ResetMatchResultTrigger,
    winnerNickname,
    roundMessage,
    fetchOpponentProfile,
    forfeitStatus,
    forfeitCountdown,
    triggerForfeitVictory,
    broadcastLiveAction,
    opponentLiveStatuses,
    opponentLiveCursor,
    isForfeitWin
  }), [
    multiplayerState, MatchmakingTime, activeMatch, opponent, setMultiplayerState,
    startMatchmaking, cancelMatch, submitGuess, submitFailure, broadcastGuess,
    opponentGuesses, scores, currentWordIndex, isRoundWinner, MatchResultTrigger,
    LastMatchResult, MatchReward, ResetMatchResultTrigger, winnerNickname,
    roundMessage, fetchOpponentProfile, forfeitStatus, forfeitCountdown,
    triggerForfeitVictory, broadcastLiveAction, opponentLiveStatuses,
    opponentLiveCursor, isForfeitWin
  ]);

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) throw new Error('useMultiplayer must be used within MultiplayerProvider');
  return context;
};
