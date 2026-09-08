import { create } from 'zustand';
import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEscalatingUnifiedWords, saveWordsToHistory } from '../data/wordList';
import { triggerHaptic } from '../utils/haptics';
import { useGameStore } from './gameStore';
import { useUser } from '../context/AuthContext';

// --- MODULE LEVEL REFS (Singleton) ---
let forfeitTimerRef = null;
let countdownIntervalRef = null;
let reactionTimeoutRef = null;
let myReactionTimeoutRef = null;
export let channelRef = null;
let matchmakingTimeoutRef = null;
export let isPollingRef = false;
export let ignoreDeleteRef = false;
let lastSavedMatchIdRef = null;
export let stateRef = { current: 'idle' };
export let wordIndexRef = { current: 0 };
export let scoresRef = { current: { p1: 0, p2: 0 } };
export let opponentRef = { current: null };
export let matchIdRef = { current: null };
export let isFetchingOpponentRef = false;

export const useMultiplayerStore = create((set, get) => ({
  multiplayerState: 'idle',
  MatchmakingTime: 0,
  activeMatch: null,
  opponent: null,
  errorAlert: null,
  LastMatchResult: null,
  MatchResultTrigger: 0,

  opponentGuesses: [],
  scores: { p1: 0, p2: 0 },
  currentRound: 0,
  isRoundWinner: false,
  winnerNickname: '',
  roundMessage: '',
  forfeitStatus: null,
  forfeitCountdown: 10,
  isForfeitWin: false,
  MatchReward: null,

  isGameBoardMounted: false,
  isOpponentBackgroundReady: false,
  opponentLiveStatuses: [],
  opponentLiveCursor: 0,
  opponentReaction: null,
  myReaction: null,

  user_id: null,
  userNickname: '',
  level: 1,

  // --- SETTERS ---
  setAuthContext: (id, nickname, level) => set({ user_id: id, userNickname: nickname, level }),

  setMultiplayerState: (next) => set(state => {
    const nextVal = typeof next === 'function' ? next(state.multiplayerState) : next;
    if (state.multiplayerState !== nextVal) {
      stateRef.current = nextVal;
      return { multiplayerState: nextVal };
    }
    return {};
  }),

  setActiveMatch: (next) => set(state => {
    const nextVal = typeof next === 'function' ? next(state.activeMatch) : next;
    if (!state.activeMatch && !nextVal) return {};
    if (state.activeMatch && nextVal &&
      state.activeMatch.id === nextVal.id &&
      state.activeMatch.status === nextVal.status &&
      state.activeMatch.current_word_index === nextVal.current_word_index &&
      state.activeMatch.p1_score === nextVal.p1_score &&
      state.activeMatch.p2_score === nextVal.p2_score &&
      state.activeMatch.p1_failed === nextVal.p1_failed &&
      state.activeMatch.p2_failed === nextVal.p2_failed) return {};
    return { activeMatch: nextVal };
  }),

  setOpponent: (next) => set(state => {
    const nextVal = typeof next === 'function' ? next(state.opponent) : next;
    if (!state.opponent && !nextVal) return {};
    if (state.opponent?.id === nextVal?.id) return {};
    opponentRef.current = nextVal;
    return { opponent: nextVal };
  }),

  setErrorAlert: (val) => set({ errorAlert: val }),
  setMatchmakingTime: (val) => set(s => ({ MatchmakingTime: typeof val === 'function' ? val(s.MatchmakingTime) : val })),
  setOpponentGuesses: (val) => set(s => ({ opponentGuesses: typeof val === 'function' ? val(s.opponentGuesses) : val })),

  setScores: (val) => set(s => {
    const nextVal = typeof val === 'function' ? val(s.scores) : val;
    scoresRef.current = nextVal;
    return { scores: nextVal };
  }),

  setCurrentRound: (val) => set(s => {
    const nextVal = typeof val === 'function' ? val(s.currentRound) : val;
    wordIndexRef.current = nextVal;
    return { currentRound: nextVal };
  }),

  setIsRoundWinner: (val) => set({ isRoundWinner: val }),
  setWinnerNickname: (val) => set({ winnerNickname: val }),
  setRoundMessage: (val) => set({ roundMessage: val }),
  setForfeitStatus: (val) => set({ forfeitStatus: val }),
  setForfeitCountdown: (val) => set(s => ({ forfeitCountdown: typeof val === 'function' ? val(s.forfeitCountdown) : val })),
  setIsForfeitWin: (val) => set({ isForfeitWin: val }),
  setMatchReward: (val) => set({ MatchReward: val }),
  setLastMatchResult: (val) => set({ LastMatchResult: val }),
  setMatchResultTrigger: (val) => set(s => ({ MatchResultTrigger: typeof val === 'function' ? val(s.MatchResultTrigger) : val })),
  setIsGameBoardMounted: (val) => set({ isGameBoardMounted: val }),
  setIsOpponentBackgroundReady: (val) => set({ isOpponentBackgroundReady: val }),
  setOpponentLiveStatuses: (val) => set({ opponentLiveStatuses: val }),
  setOpponentLiveCursor: (val) => set({ opponentLiveCursor: val }),
  setOpponentReaction: (val) => set({ opponentReaction: val }),
  setMyReaction: (val) => set({ myReaction: val }),

  setMatchId: (val) => {
    matchIdRef.current = val;
    set({ activeMatch: get().activeMatch }); // Just trigger re-render if needed, but usually activeMatch carries ID
  },

  // --- ACTIONS ---
  safeClearMatchmakingTimeout: () => {
    if (matchmakingTimeoutRef) {
      clearTimeout(matchmakingTimeoutRef);
      matchmakingTimeoutRef = null;
    }
  },

  broadcastGuess: (colors, isWin = false) => {
    const { user_id } = get();
    if (!channelRef || !user_id) return;
    if (channelRef.state !== 'joined' && channelRef.state !== 'SUBSCRIBED') return;
    channelRef.send({ type: 'broadcast', event: 'GUESS_SUBMITTED', payload: { senderId: user_id, colors, isWin } });
  },

  broadcastLiveAction: (statuses, cursorIndex) => {
    const { user_id } = get();
    if (!channelRef || !user_id) return;
    if (channelRef.state !== 'joined' && channelRef.state !== 'SUBSCRIBED') return;
    channelRef.send({ type: 'broadcast', event: 'LIVE_SYNC', payload: { senderId: user_id, statuses, cursorIndex } });
  },

  broadcastReaction: (emoji) => {
    const { user_id, setMyReaction } = get();
    if (!channelRef || !user_id) return;

    setMyReaction(emoji);
    if (myReactionTimeoutRef) clearTimeout(myReactionTimeoutRef);
    myReactionTimeoutRef = setTimeout(() => setMyReaction(null), 2500);

    if (channelRef.state !== 'joined' && channelRef.state !== 'SUBSCRIBED') return;
    channelRef.send({ type: 'broadcast', event: 'GAME_REACTION', payload: { senderId: user_id, emoji } });
  },

  submitGuess: async (colors, isWin) => {
    const state = get();
    const { activeMatch, user_id, userNickname, setWinnerNickname, setActiveMatch, broadcastGuess, broadcastLiveAction } = state;
    const matchId = matchIdRef.current;

    if (!matchId || matchId === 'null' || matchId === 'undefined' || !activeMatch) return;

    if (opponentRef.current?.isBot) {
      if (isWin) {
        setWinnerNickname(userNickname);
        triggerHaptic([50, 50, 100]);
        setActiveMatch(prev => {
          if (!prev) return prev;
          const newP1Score = (prev.p1_score || 0) + 1;
          const newP2Score = prev.p2_score || 0;
          const newIndex = (prev.current_word_index || 0) + 1;
          const totalWords = prev.words?.length || 5;
          const scoreDiff = Math.abs(newP1Score - newP2Score);
          const isMatchEnd = scoreDiff >= 2 || newIndex >= totalWords;
          return {
            ...prev,
            p1_score: newP1Score,
            current_word_index: newIndex,
            status: isMatchEnd ? 'finished' : prev.status,
            p1_failed: false,
            p2_failed: false
          };
        });
      }
      return;
    }

    broadcastGuess(colors, isWin);
    broadcastLiveAction([], 0);

    const action = isWin ? 'WIN' : 'GUESS';
    const currentIdx = activeMatch?.current_word_index || 0;

    const payload = { p_match_id: String(matchId), p_user_id: String(user_id), p_expected_round: Number(currentIdx), p_action: String(action), p_colors: colors };
    const { error } = await supabase.rpc('submit_match_guess', payload);
    if (error) console.error('[Multiplayer] submitGuess Error:', error);

    if (isWin) {
      setWinnerNickname(userNickname);
      triggerHaptic([50, 50, 100]);
    }
  },

  submitFailure: async () => {
    const state = get();
    const { activeMatch, user_id, setActiveMatch, broadcastLiveAction } = state;
    const matchId = matchIdRef.current;

    if (!matchId || matchId === 'null' || matchId === 'undefined' || !activeMatch) return;

    if (opponentRef.current?.isBot) {
      setActiveMatch(prev => {
        if (!prev) return prev;
        if (prev.p2_failed) {
          const newIndex = (prev.current_word_index || 0) + 1;
          const totalWords = prev.words?.length || 5;
          const scoreDiff = Math.abs((prev.p1_score || 0) - (prev.p2_score || 0));
          const isMatchEnd = scoreDiff >= 2 || newIndex >= totalWords;
          return { ...prev, p1_failed: false, p2_failed: false, current_word_index: newIndex, status: isMatchEnd ? 'finished' : prev.status };
        }
        return { ...prev, p1_failed: true };
      });
      triggerHaptic([100, 50, 100]);
      return;
    }

    broadcastLiveAction([], 0);

    const currentIdx = activeMatch?.current_word_index || 0;
    const failureColors = ["#334155", "#334155", "#334155", "#334155", "#334155"];

    const payload = { p_match_id: String(matchId), p_user_id: String(user_id), p_expected_round: Number(currentIdx), p_action: 'FAIL', p_colors: failureColors };
    const { error } = await supabase.rpc('submit_match_guess', payload);
    if (error) console.error('[Multiplayer] submitFailure Error:', error);

    triggerHaptic([100, 50, 100]);
  },

  submitTimeout: async () => {
    const state = get();
    const { activeMatch, user_id, submitFailure } = state;
    const matchId = matchIdRef.current;

    if (!matchId || matchId === 'null' || matchId === 'undefined' || !activeMatch) return;

    if (opponentRef.current?.isBot) {
      submitFailure();
      return;
    }

    const currentIdx = activeMatch?.current_word_index || 0;
    const payload = { p_match_id: String(matchId), p_user_id: String(user_id), p_expected_round: Number(currentIdx), p_action: 'TIMEOUT' };
    const { error } = await supabase.rpc('submit_match_guess', payload);
    if (error) console.error('[Multiplayer] submitTimeout Error:', error);
  },

  ResetMatchResultTrigger: () => get().setMatchResultTrigger(0),

  fetchOpponentProfile: async (opponentId, signal = null) => {
    if (!opponentId || opponentId === 'undefined' || isFetchingOpponentRef) return null;
    try {
      isFetchingOpponentRef = true;
      let query = supabase.from('profiles').select('id, nickname, avatar_url, updated_at, xp, equipped_font, equipped_name_style').eq('id', opponentId);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (data) {
        get().setOpponent(data);
        return data;
      }
      return null;
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('Abort')) return null;
      return null;
    } finally {
      isFetchingOpponentRef = false;
    }
  },

  clearForfeitLogic: () => {
    if (forfeitTimerRef) { clearTimeout(forfeitTimerRef); forfeitTimerRef = null; }
    if (countdownIntervalRef) { clearInterval(countdownIntervalRef); countdownIntervalRef = null; }
  },

  triggerForfeitVictory: async () => {
    const mId = matchIdRef.current;
    if (!mId || mId === 'null' || mId === 'undefined') return;
    try {
      const state = get();
      state.setForfeitStatus('confirmed');
      state.setIsForfeitWin(true);
      const isP1 = state.activeMatch?.player1_id === state.user_id;

      const updates = { status: 'finished' };
      if (isP1) { updates.p1_score = 3; updates.p2_score = 0; }
      else { updates.p2_score = 3; updates.p1_score = 0; }

      await supabase.from('online_matches').update(updates).eq('id', mId);

      const rewardData = await useGameStore.getState().syncProgressToDatabase(5, 'battle', { isWin: true, attempts: 1 });
      if (rewardData) state.setMatchReward(rewardData);

      window.dispatchEvent(new CustomEvent('AUDIO_EVENT', { detail: { action: 'playReward' } }));

      state.setLastMatchResult('victory');
      state.setMatchResultTrigger(prev => prev + 1);

      state.clearForfeitLogic();
      state.setIsGameBoardMounted(false);
      state.setIsOpponentBackgroundReady(false);
      state.setMultiplayerState('idle');
    } catch (err) {
      console.error('[Multiplayer] Forfeit handling failed:', err);
    }
  },

  startGracePeriod: () => {
    const state = get();
    state.setForfeitStatus('pending');
    state.setForfeitCountdown(10);
    state.clearForfeitLogic();

    countdownIntervalRef = setInterval(() => {
      state.setForfeitCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownIntervalRef); return 0; }
        return prev - 1;
      });
    }, 1000);

    forfeitTimerRef = setTimeout(() => {
      console.log('[Multiplayer] Grace period expired, triggering forfeit.');
      state.triggerForfeitVictory();
    }, 10000);
  },

  cancelMatch: async () => {
    const state = get();
    const idToCancel = matchIdRef.current;
    const isValidId = idToCancel && idToCancel !== 'null' && idToCancel !== 'undefined';
    const wasPlaying = state.multiplayerState === 'playing';
    const isP1 = state.activeMatch?.player1_id === state.user_id;

    state.clearForfeitLogic();
    state.setForfeitStatus(null);

    if (channelRef) {
      if (!wasPlaying && (channelRef.state === 'joined' || channelRef.state === 'SUBSCRIBED')) {
        channelRef.send({ type: 'broadcast', event: 'MATCH_CANCELLED' }).catch(() => { });
      }
      await supabase.removeChannel(channelRef);
      channelRef = null;
    }

    window.dispatchEvent(new CustomEvent('AUDIO_EVENT', { detail: { action: 'stopSearching' } }));

    if (isValidId) {
      if (wasPlaying) {
        const updates = { status: 'finished' };
        if (isP1) { updates.p2_score = 3; updates.p1_score = 0; }
        else { updates.p1_score = 3; updates.p2_score = 0; }

        if (!idToCancel?.startsWith?.('local_bot_')) {
          await supabase.from('online_matches').update(updates).eq('id', idToCancel);
        }
        useGameStore.getState().applyPenalty(10, 25);

        state.setLastMatchResult('defeat');
        state.setMatchReward({ status: 'defeat', msg: 'تە یاری بجهێلا' });
        state.setMatchResultTrigger(prev => prev + 1);
        state.setIsGameBoardMounted(false);
        state.setIsOpponentBackgroundReady(false);
        state.setMultiplayerState('idle');
      } else {
        if (!idToCancel?.startsWith?.('local_bot_')) {
          await supabase.from('online_matches').delete().eq('id', idToCancel);
        }
      }
    }

    // IMMEDIATELY CLEAR LOCAL STATE
    matchIdRef.current = null;
    state.setActiveMatch(null);
    state.setOpponent(null);
    state.setMultiplayerState('idle');
    state.setMatchmakingTime(0);
    state.setOpponentGuesses([]);
    state.setScores({ p1: 0, p2: 0 });
    state.setCurrentRound(0);
    state.setIsRoundWinner(false);
    state.setMatchResultTrigger(0);
    state.setLastMatchResult(null);
    state.setMatchReward(null);
    state.setIsGameBoardMounted(false);
    state.setIsOpponentBackgroundReady(false);
  }
  ,
  startMatchmaking: async () => {
    const state = useMultiplayerStore.getState();
    const { user_id, level, setMultiplayerState, setMatchmakingTime, setOpponent, setActiveMatch, setMatchId, setOpponentGuesses, setMatchReward, safeClearMatchmakingTimeout } = state;

    if (!user_id) return;
    console.log('[Multiplayer] ONE-CLICK: Searching for rooms...');

    window.dispatchEvent(new CustomEvent('AUDIO_EVENT', { detail: { action: 'startSearching' } }));

    if (supabase.realtime) {
      supabase.realtime.disconnect();
      supabase.realtime.connect();
    }

    setMultiplayerState('searching');
    setMatchmakingTime(0);
    setOpponent(null);
    setActiveMatch(null);
    setMatchId(null);
    setOpponentGuesses([]);
    setMatchReward(null);
    ignoreDeleteRef = false;

    safeClearMatchmakingTimeout();
    matchmakingTimeoutRef = setTimeout(async () => {
      if (stateRef.current === 'searching' || stateRef.current === 'waiting') {
        const currentMatchId = matchIdRef.current;
        if (currentMatchId) {
          ignoreDeleteRef = true;
          supabase.from('online_matches').delete().eq('id', currentMatchId).then(() => {
            console.log('[Multiplayer] Fallback cleanup completed.');
          }).catch(e => console.error(e));
        }

        const botNamesList = ["بێوار", "شەڤگەر", "هشیار", "دلۆڤان", "دژوار", "ڕێبەر", "نێچیرڤان", "رۆناهی", "ڤیان", "پەلشین", "ئاراز", "هەڤاڵ", "Bewar", "Shevger", "Jiyan", "Dilovan", "Zana", "Azad", "Rojen", "Zozan", "Pelin", "Hejar", "Rasti_94", "Dlovan123", "Pro_Zaxoy", "KurdGamer", "Alan_Kurd", "KurdishBoy", "Zaxoyi_99", "Ahmed_Gaming", "Pelin2000"];
        const botAvatarIds = Array.from({ length: 9 }, (_, i) => `/Monster_Avatars/Monster_Avatars-0${i + 1}.svg`);

        const botOpponent = {
          id: 'bot_' + Date.now(),
          nickname: botNamesList[Math.floor(Math.random() * botNamesList.length)],
          avatar_url: botAvatarIds[Math.floor(Math.random() * botAvatarIds.length)],
          level: level || 1,
          xp: 0,
          isBot: true
        };

        const newBotMatchId = 'local_bot_match_' + Date.now();
        setMatchId(newBotMatchId);
        setOpponent(botOpponent);

        setActiveMatch(prev => {
          let fallbackWords = prev?.words;
          let fallbackRiddles = prev?.riddles;
          if (!fallbackWords || fallbackWords.length === 0) {
            try {
              const localEscalating = getEscalatingUnifiedWords();
              fallbackWords = localEscalating.map(w => w.word);
              fallbackRiddles = localEscalating.map(w => w.hint || 'پەیڤێ بدۆزەوە');
            } catch (_err) {
              fallbackWords = ["پەیڤ", "ڕاست", "پەیڤۆک", "کورد", "کوردستان"];
              fallbackRiddles = ["", "", "", "", ""];
            }
          }
          return {
            ...prev, id: newBotMatchId, player1_id: user_id, player2_id: botOpponent.id, player2_info: botOpponent,
            status: 'playing', isBot: true, words: fallbackWords, riddles: fallbackRiddles, current_word_index: 0,
            p1_score: 0, p2_score: 0, p1_failed: false, p2_failed: false, p1_colors: [], p2_colors: []
          };
        });

        setMultiplayerState('playing');
      }
    }, 12000);

    try {
      await supabase.from('online_matches').delete().eq('player1_id', user_id).eq('status', 'global_waiting');

      const { data: openMatches, error: _searchError } = await supabase.from('online_matches')
        .select('id, player1_id').eq('status', 'global_waiting').is('player2_id', null).neq('player1_id', user_id).order('created_at', { ascending: true }).limit(10);

      if (openMatches && openMatches.length > 0) {
        let targetMatch = null;
        const useLocationMatchmaking = localStorage.getItem('use_location_matchmaking') === 'true';

        if (useLocationMatchmaking) {
          const { data: userProfile } = await supabase.from('profiles').select('latitude, longitude').eq('id', user_id).single();
          if (userProfile?.latitude && userProfile?.longitude) {
            const { data: nearbyPlayers } = await supabase.rpc('find_nearby_players', { user_lat: userProfile.latitude, user_lon: userProfile.longitude, search_radius_km: 50, current_user_id: user_id });
            if (nearbyPlayers && nearbyPlayers.length > 0) {
              const nearbyIds = nearbyPlayers.map(p => p.id);
              const nearbyOpenMatches = openMatches.filter(m => nearbyIds.includes(m.player1_id));
              if (nearbyOpenMatches.length > 0) {
                const matchesWithDistance = nearbyOpenMatches.map(m => {
                  const playerInfo = nearbyPlayers.find(p => p.id === m.player1_id);
                  return { ...m, distance: playerInfo.distance_km };
                });
                matchesWithDistance.sort((a, b) => a.distance - b.distance);
                targetMatch = matchesWithDistance[0];
              }
            }
          }
        }

        if (!targetMatch) {
          const hostIds = openMatches.map(m => m.player1_id);
          const { data: hostProfiles } = await supabase.from('profiles').select('id, level').in('id', hostIds);
          targetMatch = openMatches[0];
          let smallestDiff = Infinity;
          const myLevel = level || 1;

          if (hostProfiles && hostProfiles.length > 0) {
            for (const match of openMatches) {
              const profile = hostProfiles.find(p => p.id === match.player1_id);
              const hostLevel = profile?.level || 1;
              const diff = Math.abs(hostLevel - myLevel);
              if (diff < smallestDiff) { smallestDiff = diff; targetMatch = match; }
            }
          }
        }

        const { data: joinedMatch, error: claimError } = await supabase.from('online_matches').update({ player2_id: user_id, status: 'playing' })
          .eq('id', targetMatch.id).is('player2_id', null).select().single();

        if (stateRef.current === 'found' || stateRef.current === 'playing' || stateRef.current === 'game_over') {
          if (joinedMatch) supabase.from('online_matches').update({ player2_id: null, status: 'global_waiting' }).eq('id', joinedMatch.id).then();
          return;
        }

        if (!claimError && joinedMatch) {
          safeClearMatchmakingTimeout();
          setMatchId(joinedMatch.id);
          setActiveMatch(joinedMatch);
          state.setCurrentRound(joinedMatch.current_word_index || 0);

          const hostProfile = await state.fetchOpponentProfile(joinedMatch.player1_id);
          if (hostProfile) triggerHaptic([50, 50, 100]);
          else setMultiplayerState('syncing');
          return;
        }
      }

      let selectedWords = [];
      let selectedRiddles = [];
      try {
        const localWords = getEscalatingUnifiedWords();
        selectedWords = localWords.map(w => w.word);
        selectedRiddles = localWords.map(w => w.hint || 'پەیڤێ بدۆزەوە');
      } catch (_err) { /* ignore */ }

      const { data: newMatch, error: createError } = await supabase.from('online_matches').insert({
        player1_id: user_id, status: 'global_waiting', words: selectedWords, riddles: selectedRiddles, current_word_index: 0, p1_score: 0, p2_score: 0
      }).select().single();

      if (createError) throw createError;

      if (stateRef.current === 'found' || stateRef.current === 'playing' || stateRef.current === 'game_over') {
        if (newMatch) supabase.from('online_matches').delete().eq('id', newMatch.id).then();
        return;
      }

      if (newMatch) {
        setMatchId(newMatch.id);
        setActiveMatch(newMatch);
        setMultiplayerState('waiting');
      }

    } catch (error) {
      console.error('[Multiplayer] Matchmaking Failed:', error);
      state.setErrorAlert("هەڵەیەک ڕوویدا: " + (error.message || "نەتوانرا یاری دروست بکرێت"));
      safeClearMatchmakingTimeout();
      window.dispatchEvent(new CustomEvent('AUDIO_EVENT', { detail: { action: 'stopSearching' } }));
      setMultiplayerState('idle');
    }
  },

  createPrivateMatch: async () => {
    const state = useMultiplayerStore.getState();
    const { user_id, setMultiplayerState, setOpponent, setOpponentGuesses, setMatchReward, setMatchId, setActiveMatch } = state;

    if (!user_id) return null;
    await supabase.from('online_matches').delete().eq('player1_id', user_id).eq('status', 'private_waiting');

    setMultiplayerState('private_lobby');
    setOpponent(null);
    setOpponentGuesses([]);
    setMatchReward(null);

    let selectedWords = [];
    let selectedRiddles = [];
    try {
      const localWords = getEscalatingUnifiedWords();
      selectedWords = localWords.map(w => w.word);
      selectedRiddles = localWords.map(w => w.hint || 'پەیڤێ بدۆزەوە');
    } catch (_err) { /* ignore */ }

    const { data: newMatch, error: createError } = await supabase.from('online_matches').insert({
      player1_id: user_id, status: 'private_waiting', words: selectedWords, riddles: selectedRiddles, current_word_index: 0, p1_score: 0, p2_score: 0
    }).select().single();

    if (createError) {
      setMultiplayerState('idle');
      return null;
    }

    if (newMatch) {
      setMatchId(newMatch.id);
      setActiveMatch(newMatch);
      if (supabase.realtime && !supabase.realtime.isConnected()) supabase.realtime.connect();
      setMultiplayerState('private_lobby');
      return newMatch.id;
    }
    return null;
  },

  hostAcceptJoiner: async (joinerId) => {
    const state = useMultiplayerStore.getState();
    const matchId = matchIdRef.current;
    if (!matchId || !joinerId) return;

    await supabase.from('online_matches').update({ player2_id: joinerId, status: 'playing' }).eq('id', matchId);

    const prof = await state.fetchOpponentProfile(joinerId);
    if (prof) {
      state.setActiveMatch(prev => prev ? { ...prev, player2_id: joinerId, status: 'playing' } : prev);
      triggerHaptic([50, 50, 100]);
    }
  },

  joinPrivateMatch: async (roomIdOrCode) => {
    const state = useMultiplayerStore.getState();
    const { user_id, setMultiplayerState, setOpponent, setOpponentGuesses, setMatchReward, setMatchId, setActiveMatch } = state;
    if (!user_id || !roomIdOrCode) return false;

    setMultiplayerState('joining');
    setOpponent(null);
    setOpponentGuesses([]);
    setMatchReward(null);
    setMatchId(roomIdOrCode);

    try {
      if (supabase.realtime && !supabase.realtime.isConnected()) supabase.realtime.connect();

      let foundMatch = null;
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.from('online_matches').select('*').eq('id', roomIdOrCode).maybeSingle();
        if (data && data.player2_id === user_id) { foundMatch = data; break; }
        await new Promise(res => setTimeout(res, 500));
      }

      if (!foundMatch) {
        state.setErrorAlert("ببورە، ئەڤ ژوورە نەهاتە دیتن یان یا ب دوماهی هاتی.");
        setMultiplayerState('idle');
        setMatchId(null);
        return false;
      }

      setActiveMatch(foundMatch);
      state.setCurrentRound(foundMatch.current_word_index || 0);

      const hostProfile = await state.fetchOpponentProfile(foundMatch.player1_id);
      if (hostProfile) triggerHaptic([50, 50, 100]);
      else setMultiplayerState('syncing');
      return true;

    } catch (_err) {
      setMultiplayerState('idle');
      setMatchId(null);
      return false;
    }
  }
}));

export const useMultiplayer = () => {
  return useMultiplayerStore();
};

export const MultiplayerEngineSync = () => {
  const state = useMultiplayerStore();
  const gameStore = useGameStore();
  const { user, profileData } = useUser();

  useEffect(() => {
    useMultiplayerStore.getState().setAuthContext(
      user?.id || null,
      profileData?.nickname || user?.user_metadata?.nickname || '',
      gameStore.level || 1
    );
  }, [user, profileData, gameStore.level]);

  const {
    multiplayerState, activeMatch, opponent, isGameBoardMounted, isOpponentBackgroundReady,
    setMatchmakingTime, setActiveMatch, setMultiplayerState, setOpponent,
    setOpponentGuesses, setIsRoundWinner, setWinnerNickname, setRoundMessage,
    setLastMatchResult, setMatchResultTrigger, setIsGameBoardMounted, setIsOpponentBackgroundReady,
    setScores, setCurrentRound, setMatchReward,
    fetchOpponentProfile, startGracePeriod, clearForfeitLogic, cancelMatch
  } = state;

  const user_id = state.user_id;

  // STOP SEARCHING SOUND WHEN LEAVING QUEUE
  useEffect(() => {
    if (multiplayerState !== 'searching' && multiplayerState !== 'waiting') {
      window.dispatchEvent(new CustomEvent('AUDIO_EVENT', { detail: { action: 'stopSearching' } }));
    }
  }, [multiplayerState]);

  // TIMER ENGINE
  useEffect(() => {
    let interval;
    if (multiplayerState === 'searching' || multiplayerState === 'waiting') {
      interval = setInterval(async () => {
        setMatchmakingTime(prev => {
          const next = prev + 1;
          if (next === 12 && stateRef.current !== 'playing') {
            const mId = matchIdRef.current;
            if (mId && typeof mId === 'string' && mId !== 'undefined' && mId !== 'null' && !mId?.startsWith?.('local_bot_')) {
              supabase.from('online_matches').select('*').eq('id', mId).maybeSingle().then(({ data }) => {
                if (data && (data.player2_id || data.status === 'playing')) {
                  console.log('[Multiplayer] Deep check found match state change! Force sync.');
                  setActiveMatch(prevMatch => {
                    if (prevMatch?.id?.startsWith?.('local_bot_')) return prevMatch;
                    return data;
                  });
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
  }, [multiplayerState, setActiveMatch, setMatchmakingTime]);

  // POLLING FALLBACK
  useEffect(() => {
    const isIdle = multiplayerState === 'idle';
    const mId = matchIdRef.current;
    if (isIdle || !mId || mId?.startsWith?.('local_bot_')) return;

    const controller = new AbortController();
    const pollInterval = setInterval(async () => {
      if (isPollingRef) return;
      try {
        isPollingRef = true;
        const { data: match } = await supabase.from('online_matches').select('*').eq('id', mId).abortSignal(controller.signal).maybeSingle();
        if (match) {
          const isSearching = stateRef.current === 'waiting' || stateRef.current === 'searching' || stateRef.current === 'private_lobby';
          if (isSearching && (match.player2_id || match.status === 'playing') && stateRef.current !== 'playing' && stateRef.current !== 'game_over') {
            console.log('[Multiplayer] Polling Fallback found opponent! Syncing.');
            setActiveMatch(match);
            clearInterval(pollInterval);
          } else if (stateRef.current === 'playing') {
            const currentMatch = useMultiplayerStore.getState().activeMatch;
            const hasDesynced = match.current_word_index !== wordIndexRef.current || match.status !== currentMatch?.status || (match.p1_failed && !currentMatch?.p1_failed) || (match.p2_failed && !currentMatch?.p2_failed);
            if (hasDesynced) {
              console.log('[Multiplayer] Polling Fallback detected desync! Resolving...');
              setActiveMatch(match);
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('[Multiplayer] Polling error:', err);
      } finally {
        isPollingRef = false;
      }
    }, 3000);
    return () => { clearInterval(pollInterval); controller.abort(); };
  }, [multiplayerState, setActiveMatch]);

  // REALTIME SUBSCRIPTION
  useEffect(() => {
    const mId = activeMatch?.id;
    if (!mId || mId === 'undefined' || mId === 'null' || mId?.startsWith?.('local_bot_')) return;

    console.log('[Multiplayer] Constructing subscription filter for:', mId);

    const channel = supabase.channel(`match_room_${mId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_matches', filter: `id=eq.${mId}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          if (ignoreDeleteRef) { console.log('[Multiplayer] Match deleted for Bot. Ignoring kick.'); return; }
          console.log('[Multiplayer] Match record deleted.');
          setMultiplayerState('idle'); setActiveMatch(null); setOpponent(null); return;
        }

        const updatedMatch = payload.new;
        if (!updatedMatch) return;

        supabase.from('online_matches').select('*').eq('id', updatedMatch.id).maybeSingle().then(({ data: fullMatch }) => {
          if (fullMatch) {
            let skipUpdate = false;
            setActiveMatch(prev => {
              if (prev?.id?.startsWith?.('local_bot_')) { skipUpdate = true; return prev; }
              return fullMatch;
            });
            if (skipUpdate) return;

            const isP1 = fullMatch.player1_id === user_id;
            if (isP1 && fullMatch.player2_id && stateRef.current !== 'playing' && stateRef.current !== 'game_over') {
              console.log('[Multiplayer] Realtime found Joiner! Resolving...');
              fetchOpponentProfile(fullMatch.player2_id).then(prof => { if (prof) triggerHaptic([50, 50, 100]); });
            }
          }
        });
      })
      .on('broadcast', { event: 'GUESS_SUBMITTED' }, (payload) => {
        const data = payload.payload || payload;
        if (user_id && data.senderId !== user_id) {
          setOpponentGuesses(prev => [...prev, data.colors]);
          if (data.isWin) {
            setWinnerNickname(opponentRef.current?.nickname || 'Opponent');
            triggerHaptic([100, 100, 100]);
            setTimeout(() => setWinnerNickname(''), 3000);
          }
        }
      })
      .on('broadcast', { event: 'LIVE_SYNC' }, (payload) => {
        const data = payload.payload || payload;
        if (user_id && data.senderId && data.senderId !== user_id) {
          useMultiplayerStore.getState().setOpponentLiveStatuses(data.statuses || []);
          useMultiplayerStore.getState().setOpponentLiveCursor(data.cursorIndex || 0);
        }
      })
      .on('broadcast', { event: 'GAME_REACTION' }, (payload) => {
        const data = payload.payload || payload;
        if (user_id && data.senderId && data.senderId !== user_id && data.emoji) {
          useMultiplayerStore.getState().setOpponentReaction(data.emoji);
          if (reactionTimeoutRef) clearTimeout(reactionTimeoutRef);
          reactionTimeoutRef = setTimeout(() => useMultiplayerStore.getState().setOpponentReaction(null), 2500);
        }
      })
      .on('broadcast', { event: 'I_AM_READY' }, () => {
        const currentState = stateRef.current;
        if (currentState === 'private_lobby' || currentState === 'match_starting' || currentState === 'playing') {
          if (channel.state === 'joined' || channel.state === 'SUBSCRIBED') channel.send({ type: 'broadcast', event: 'START_MATCH_TIMER' });
          if (currentState === 'private_lobby') setMultiplayerState('match_starting');
        }
      })
      .on('broadcast', { event: 'START_MATCH_TIMER' }, () => {
        if (stateRef.current === 'joining' || stateRef.current === 'syncing') setMultiplayerState('match_starting');
      })
      .on('broadcast', { event: 'CLIENT_BACKGROUND_READY' }, () => {
        setIsOpponentBackgroundReady(true);
      })
      .on('broadcast', { event: 'MATCH_CANCELLED' }, () => {
        setMultiplayerState('idle'); setActiveMatch(null); setOpponent(null);
      })
      .on('presence', { event: 'sync' }, () => {
        const presences = Object.values(channel.presenceState()).flat();
        const oppId = opponentRef.current?.id;
        const isOpponentPresent = presences.some(p => p.user_id === oppId);

        if (isOpponentPresent && forfeitTimerRef) {
          clearTimeout(forfeitTimerRef); forfeitTimerRef = null;
          if (countdownIntervalRef) { clearInterval(countdownIntervalRef); countdownIntervalRef = null; }
          useMultiplayerStore.getState().setForfeitStatus(null);
          useMultiplayerStore.getState().setForfeitCountdown(10);
        }
        if (stateRef.current === 'playing' && !isOpponentPresent && !forfeitTimerRef) startGracePeriod();
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const oppId = opponentRef.current?.id;
        if (leftPresences.some(p => p.user_id === oppId) && stateRef.current === 'playing' && !forfeitTimerRef) startGracePeriod();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const isJoiner = stateRef.current === 'joining' || stateRef.current === 'syncing';
          if (isJoiner && (channel.state === 'joined' || channel.state === 'SUBSCRIBED')) channel.send({ type: 'broadcast', event: 'I_AM_READY' });
          channelRef = channel;
          await channel.track({ user_id, online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); channelRef = null; clearForfeitLogic(); };
  }, [activeMatch?.id, user_id, fetchOpponentProfile, setActiveMatch, setMultiplayerState, setOpponent, startGracePeriod, clearForfeitLogic, setOpponentGuesses, setWinnerNickname, setIsOpponentBackgroundReady]);

  // VISIBILITY HANDLER
  useEffect(() => {
    const handleVis = () => { if (document.visibilityState === 'visible' && user_id && supabase.realtime && !supabase.realtime.isConnected()) supabase.realtime.connect(); };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [user_id]);

  // VERIFY AND START
  useEffect(() => {
    if (!activeMatch || !user_id) return;
    const verify = async () => {
      try {
        if (activeMatch?.player1_id && activeMatch?.player2_id) {
          const handleTrans = () => {
            const s = stateRef.current;
            if (s === 'private_lobby' || s === 'joining' || s === 'syncing') {
              if (s === 'joining') setMultiplayerState('syncing');
            } else if (s !== 'playing' && s !== 'game_over' && s !== 'match_starting') {
              setMultiplayerState('found');
              setTimeout(async () => {
                if (stateRef.current === 'found') {
                  if (!activeMatch?.id?.startsWith?.('local_bot_')) {
                    const { data } = await supabase.from('online_matches').select('id').eq('id', activeMatch?.id).maybeSingle();
                    if (!data) { setMultiplayerState('idle'); setActiveMatch(null); setOpponent(null); return; }
                  }
                  setMultiplayerState('playing');
                }
              }, 2000);
            }
          };

          if (opponent) handleTrans();
          else {
            const oppId = activeMatch.player1_id === user_id ? activeMatch.player2_id : activeMatch.player1_id;
            const { data: prof, error } = await supabase.from('profiles').select('*').eq('id', oppId).maybeSingle();
            if (error || !prof) { if (stateRef.current !== 'match_starting' && stateRef.current !== 'playing') setMultiplayerState('syncing'); }
            else { setOpponent(prof); handleTrans(); }
          }
        } else {
          if (stateRef.current !== 'waiting' && stateRef.current !== 'searching' && stateRef.current !== 'private_lobby') setMultiplayerState('waiting');
        }
      } catch (_err) { setMultiplayerState('syncing'); }
    };
    verify();
  }, [activeMatch, opponent, user_id, setMultiplayerState, setOpponent, setActiveMatch]);

  // BACKGROUND READY SYNC
  useEffect(() => {
    if (multiplayerState === 'match_starting' && isGameBoardMounted && !isOpponentBackgroundReady) {
      if (channelRef && (channelRef.state === 'joined' || channelRef.state === 'SUBSCRIBED')) channelRef.send({ type: 'broadcast', event: 'CLIENT_BACKGROUND_READY' });
    }
  }, [multiplayerState, isGameBoardMounted, isOpponentBackgroundReady]);

  // SAVE HISTORY
  useEffect(() => {
    if (multiplayerState === 'playing' && activeMatch?.id && activeMatch.id !== lastSavedMatchIdRef) {
      if (activeMatch.words?.length > 0) { saveWordsToHistory(activeMatch.words); lastSavedMatchIdRef = activeMatch.id; }
    }
  }, [multiplayerState, activeMatch]);

  // MATCH STARTING BUFFER
  useEffect(() => {
    let tId, cId;
    if (multiplayerState === 'match_starting') {
      if (isGameBoardMounted && isOpponentBackgroundReady) setMultiplayerState('playing');
      else {
        tId = setTimeout(() => { if (stateRef.current === 'match_starting') setMultiplayerState('playing'); }, 3000);
        cId = setTimeout(() => { if (!isOpponentBackgroundReady && cancelMatch) cancelMatch(); }, 10000);
      }
    }
    return () => { if (tId) clearTimeout(tId); if (cId) clearTimeout(cId); };
  }, [multiplayerState, isGameBoardMounted, isOpponentBackgroundReady, setMultiplayerState, cancelMatch]);

  // GAME SYNC (Round transition & Match results)
  useEffect(() => {
    if (!activeMatch || !user_id) return;
    const isP1 = activeMatch.player1_id === user_id;

    if (activeMatch.current_word_index !== undefined && activeMatch.current_word_index !== wordIndexRef.current) {
      const newIndex = activeMatch.current_word_index || 0;
      const wasTie = (activeMatch.p1_score === scoresRef.current.p1 && activeMatch.p2_score === scoresRef.current.p2);
      setCurrentRound(newIndex);
      setOpponentGuesses([]);
      setIsRoundWinner(false);
      setWinnerNickname('');
      setRoundMessage(wasTie && newIndex > 0 ? 'ROUND_DRAW' : `ROUND ${newIndex + 1}`);
      setTimeout(() => setRoundMessage(''), 4000);
    }

    if (activeMatch.status === 'finished' && multiplayerState !== 'idle') {
      const stateObj = useMultiplayerStore.getState();
      if (multiplayerState !== 'game_over' || stateObj.LastMatchResult === null) {
        const myScore = isP1 ? activeMatch.p1_score : activeMatch.p2_score;
        const oppScore = isP1 ? activeMatch.p2_score : activeMatch.p1_score;
        let result = myScore - oppScore >= 2 ? 'victory' : oppScore - myScore >= 2 ? 'defeat' : 'draw';

        setLastMatchResult(result);
        setMatchResultTrigger(prev => prev + 1);
        setIsGameBoardMounted(false);
        setIsOpponentBackgroundReady(false);
        setMultiplayerState('idle');

        if (result === 'victory') {
          const isFlawless = myScore === 3 && oppScore === 0;
          gameStore.syncProgressToDatabase(5, 'battle', { isPvPFlawless: isFlawless, isWin: true, attempts: isFlawless ? 1 : (oppScore === 1 ? 2 : 3), wordsFound: myScore }).then(d => { if (d) setMatchReward(d); });
        } else if (result === 'draw') {
          gameStore.syncProgressToDatabase(5, 'battle_draw', { isWin: false, wordsFound: myScore }).then(d => { if (d) setMatchReward(d); });
        } else {
          gameStore.syncProgressToDatabase(5, 'battle_loss', { isWin: false, wordsFound: myScore }).then(d => { if (d) setMatchReward(d); });
        }
      }
    }

    if (activeMatch.p1_score !== scoresRef.current.p1 || activeMatch.p2_score !== scoresRef.current.p2) {
      setScores({ p1: activeMatch.p1_score, p2: activeMatch.p2_score });
    }

    const oppColors = isP1 ? activeMatch.p2_colors : activeMatch.p1_colors;
    if (oppColors && Array.isArray(oppColors) && oppColors.length > state.opponentGuesses.length) {
      setOpponentGuesses(oppColors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatch, user_id, multiplayerState, setMultiplayerState, setCurrentRound, setOpponentGuesses, setIsRoundWinner, setWinnerNickname, setRoundMessage, setLastMatchResult, setMatchResultTrigger, setIsGameBoardMounted, setIsOpponentBackgroundReady, setMatchReward, setScores, state.opponentGuesses.length]); // gameStore intentionally omitted

  // HOST TIE BREAK
  useEffect(() => {
    if (!activeMatch || !user_id || activeMatch?.id?.startsWith?.('local_bot_')) return;
    if (activeMatch.player1_id === user_id && activeMatch.p1_failed && activeMatch.p2_failed) {
      const currentIdx = activeMatch.current_word_index || 0;
      const scoreDiff = Math.abs((activeMatch.p1_score || 0) - (activeMatch.p2_score || 0));
      const totalWords = activeMatch.words?.length || 5;
      const nextData = { current_word_index: currentIdx + 1, p1_failed: false, p2_failed: false, p1_colors: [], p2_colors: [] };
      if (scoreDiff >= 2 || currentIdx + 1 >= totalWords) nextData.status = 'finished';
      supabase.from('online_matches').update(nextData).eq('id', activeMatch.id);
    }
  }, [activeMatch, user_id]);

  // MOUNT-TIME RECOVERY
  useEffect(() => {
    if (!user_id || multiplayerState !== 'idle') return;
    const controller = new AbortController();
    const recover = async () => {
      try {
        const { data, error: _error } = await supabase.from('online_matches').select('*').or(`player1_id.eq.${user_id},player2_id.eq.${user_id}`).eq('status', 'playing').order('created_at', { ascending: false }).abortSignal(controller.signal).limit(1).maybeSingle();
        if (data) {
          if ((new Date() - new Date(data.created_at)) / 60000 > 15) { await supabase.from('online_matches').update({ status: 'finished' }).eq('id', data.id); return; }
          const oppId = data.player1_id === user_id ? data.player2_id : data.player1_id;
          useMultiplayerStore.getState().setMatchId(data.id);
          setActiveMatch(data);
          if (oppId) await fetchOpponentProfile(oppId);
          setMultiplayerState('playing');
          triggerHaptic([100, 50]);
        }
      } catch (_err) { /* ignore */ }
    };
    recover();
    return () => controller.abort();
  }, [user_id, multiplayerState, setActiveMatch, fetchOpponentProfile, setMultiplayerState]);

  return null;
};
