import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Grid from './Grid';
import Keyboard from './Keyboard';
import { useMultiplayer } from '../context/MultiplayerContext';
import { useUser } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { useGame } from '../context/GameContext';
import useGameLogic from '../hooks/useGameLogic';
import Avatar from './Avatar';
import KurdishSunLoader from './KurdishSunLoader';
import RoundIntro from './RoundIntro';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits } from '../utils/formatters';

export default function MultiplayerGameView({ opponent: propOpponent, isDark = true, onOpenHowToPlay }) {
  const {
    activeMatch,
    opponent: contextOpponent,
    submitGuess,
    broadcastGuess,
    opponentGuesses,
    scores,
    currentRound,
    isRoundWinner,
    winnerNickname: _winnerNickname,
    roundMessage,
    multiplayerState,
    setMultiplayerState: _setMultiplayerState,
    fetchOpponentProfile,
    resetMatchResultTrigger: _resetMatchResultTrigger,
    forfeitStatus,
    forfeitCountdown,
    triggerForfeitVictory: _triggerForfeitVictory,
    submitFailure,
    cancelMatch,
    broadcastLiveAction,
    opponentLiveStatuses,
    opponentLiveCursor
  } = useMultiplayer();

  // Prioritize Prop over Context to force re-renders from App.jsx
  const opponent = propOpponent || contextOpponent;

  const [isConfirmingExit, setIsConfirmingExit] = useState(false);

  const { user, userNickname, userAvatar } = useUser();
  const { playPopSound, playVictorySound: _playVictorySound, playStartGameSound: playStartSound } = useAudio();
  const { level: userLevel } = useGame();

  // 1. TOP-LEVEL DERIVED DATA (DECLARE BEFORE ANY RETURNS)
  const isPlayer1 = useMemo(() => activeMatch?.player1_id === user?.id, [activeMatch, user]);
  const targetWord = useMemo(() => {
    if (!activeMatch?.words?.length) return '';
    // Safe modulo access in case of extreme round counts
    const idx = currentRound % activeMatch.words.length;
    return activeMatch.words[idx] || '';
  }, [activeMatch, currentRound]);

  // CORE ENGINE
  const onGuessSubmitted = useCallback(async (colors, isWin) => {
    if (isWin) {
      await submitGuess(colors, true);
      // Only play sound at the very end of the match (handled by Context/Overlay)
      // playVictorySound(); // REMOVED - requested by user
    } else {
      broadcastGuess(colors, false);
      playPopSound(true);
    }
  }, [submitGuess, broadcastGuess, playPopSound]);

  const {
    guesses,
    currentGuess,
    usedKeys,
    onKey,
    onDelete,
    onEnter,
    getLetterStatus,
    resetLocalBoard
  } = useGameLogic({
    targetWord,
    maxRows: 3,
    gameMode: 'multiplayer',
    onGuessSubmitted,
    onLoss: async () => {
      if (multiplayerState !== 'playing') return;
      console.log('[Multiplayer] Round Loss detected locally. Submitting failure.');
      await submitFailure();
    },
    isActive: multiplayerState === 'playing'
  });

  // 1.5 MASKED LIVE SYNC BROADCASTER
  useEffect(() => {
    if (multiplayerState !== 'playing' || !broadcastLiveAction || !targetWord) return;

    // Calculate masked statuses for current guess
    // 0: empty, 1: correct, 2: wrong_place, 3: absent
    const statuses = currentGuess.map((char, i) => {
      if (!char) return 0;
      const status = getLetterStatus(currentGuess, i, targetWord);
      if (status === 'CORRECT') return 1;
      if (status === 'WRONG_POS') return 2;
      if (status === 'INCORRECT') return 3;
      return 0;
    });

    // Find cursor index (first empty cell)
    const cursorIndex = currentGuess.findIndex(c => c === '');
    const finalCursor = cursorIndex === -1 ? targetWord.length - 1 : cursorIndex;

    broadcastLiveAction(statuses, finalCursor);
  }, [currentGuess, multiplayerState, broadcastLiveAction, targetWord, getLetterStatus]);

  // 3. IDENTITY HEALING: Ensure opponent is fetched if missing
  useEffect(() => {
    if (activeMatch && !opponent) {
      const oppId = isPlayer1 ? activeMatch.player2_id : activeMatch.player1_id;
      if (oppId) {
        fetchOpponentProfile(oppId);
      }
    }
  }, [activeMatch, opponent, isPlayer1, fetchOpponentProfile]);

  // Handle board reset when round changes or word loads
  useEffect(() => {
    if (targetWord) {
      resetLocalBoard(targetWord);
    }
  }, [currentRound, targetWord, resetLocalBoard, playStartSound]);


  // --- GUARDS & EARLY RETURNS (Declare AFTER all hooks) ---
  if (!activeMatch) {
    return (
      <div className="h-full bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <KurdishSunLoader />
        <p className="mt-8 text-white/40 font-noto-sans-arabic animate-pulse">بەرھەڤکرنا پەیڤان...</p>
      </div>
    );
  }

  if (multiplayerState !== 'playing' || !opponent) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#020617] text-white">
        <KurdishSunLoader />
        <p className="mt-8 text-primary/40 font-rabar animate-pulse">بەرھەڤکرنا یاریێ...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 h-full w-full ${isDark ? 'bg-[#020617]' : 'bg-[#f5f5f4]'} overflow-hidden transition-colors duration-500`}>
      <style>
        {`
          .battlefield-container {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            overflow: hidden;
            width: 100%;
          }
          @media (max-height: 700px) {
            .battle-item-padding {
              padding-top: 0.1rem !important;
              padding-bottom: 0.1rem !important;
            }
            .riddle-text {
              font-size: clamp(0.55rem, 3.2vw, 1.1rem) !important;
              line-height: 1 !important;
              white-space: nowrap !important;
              font-weight: 300 !important;
            }
          }
          .riddle-text {
            white-space: nowrap !important;
            font-size: clamp(0.6rem, 3.5vw, 1.25rem) !important;
          }
        `}
      </style>

      {/* 0. ACTION TOP BAR */}
      <div className="fixed top-0 left-0 right-0 z-400 pt-[env(safe-area-inset-top)] px-2 flex items-center justify-between pointer-events-none">
        <div className="relative pointer-events-auto">
          <button
            onClick={() => { triggerHaptic(15); setIsConfirmingExit(!isConfirmingExit); }}
            className={`w-12 h-12 flex items-center justify-center transition-all ${isConfirmingExit ? 'text-white bg-red-500 rounded-full' : 'text-red-500'} active:scale-90 shadow-sm`}
            title="Exit Match"
          >
            <span className="material-symbols-outlined text-[32px] font-black">close</span>
          </button>

          <AnimatePresence>
            {isConfirmingExit && (
              <Motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className={`absolute right-0 mt-2 w-[72px] ${isDark ? 'bg-mono-900 border-mono-800' : 'bg-white border-mono-200'} border rounded-md p-1.5 shadow-xl flex flex-col gap-0.5 z-50 overflow-hidden transition-colors duration-300`}
              >
                <button
                  onClick={() => { triggerHaptic(15); setIsConfirmingExit(false); cancelMatch(); }}
                  className="flex items-center justify-center px-2 py-1.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-sm transition-all"
                >
                  <span className="text-sm font-medium">بەڵێ</span>
                </button>
                <button
                  onClick={() => { triggerHaptic(5); setIsConfirmingExit(false); }}
                  className={`flex items-center justify-center px-3 py-2 ${isDark ? 'hover:bg-mono-800 text-mono-300' : 'hover:bg-mono-100 text-mono-700'} rounded-sm transition-all`}
                >
                  <span className="text-sm font-medium">نەخێر</span>
                </button>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => {
            triggerHaptic(10);
            onOpenHowToPlay?.();
          }}
          className={`w-12 h-12 flex items-center justify-center ${isDark ? 'text-white/40' : 'text-slate-400'} hover:text-emerald-400 transition-all active:scale-90 pointer-events-auto`}
          title="How to Play"
        >
          <span className="material-symbols-outlined text-[28px] font-black">help</span>
        </button>
      </div>

      {/* 1. SYMMETRIC BATTLEFIELD */}
      <div className="battlefield-container no-scrollbar pt-[calc(env(safe-area-inset-top)+52px)]" dir="rtl">

        {/* RIDDLE DISPLAY */}
        <div className={`w-full flex flex-col items-center justify-center py-3 px-4 animate-in fade-in duration-700 shrink-0 ${isDark ? 'bg-white/5 border-b border-white/5' : 'bg-white border-b border-slate-200'}`}>
          <p className={`text-lg sm:text-2xl font-light ${isDark ? 'text-white' : 'text-slate-800'} leading-none font-noto-sans-arabic ${isDark ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : ''} riddle-text`}>
            {activeMatch?.riddles?.[currentRound % (activeMatch?.riddles?.length || 1)] || '...'}
          </p>
        </div>

        {/* TOP HALF: YOUR GRID */}
        <div className="flex-[1.2] min-h-0 flex flex-col items-center justify-center p-1 bg-white/2">
          <div className="flex items-center gap-2 opacity-60 scale-75 mb-1">
            <Avatar src={userAvatar} size="xs" />
            <span className="text-[10px] font-black text-blue-400 uppercase">{userNickname}</span>
          </div>
          <div className="w-full flex justify-center items-center overflow-hidden" dir="rtl">
            <Grid
              gridId="player"
              guesses={guesses}
              currentGuess={currentGuess}
              targetWord={targetWord}
              wordLength={targetWord.length}
              getLetterStatus={getLetterStatus}
              isDark={isDark}
              compact={true}
              maxRows={3}
            />
          </div>
        </div>

        {/* CENTER VS BAR: THE SCORES & ROUND */}
        <div className="shrink-0 flex items-center justify-center gap-4 py-1 z-20 relative">
          <div className={`absolute inset-0 bg-linear-to-r from-transparent via-${isDark ? 'white/5' : 'slate-200'} to-transparent h-px top-1/2 -translate-y-1/2 w-full`} />

          <div className={`flex items-center gap-3 ${isDark ? 'bg-[#020617] border-white/10' : 'bg-white border-slate-200 shadow-md'} px-3 py-1 rounded-full border relative z-10`}>
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-black ${isDark ? 'text-blue-400' : 'text-blue-600'} leading-none`}>{toKuDigits(isPlayer1 ? scores.p1 : scores.p2)}</span>
            </div>
            <div className={`w-px h-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'} mx-1`} />
            <div className={`text-[9px] font-black ${isDark ? 'text-white/40' : 'text-slate-500'} uppercase tracking-tighter`}>گەڕ {toKuDigits(currentRound + 1)}</div>
            <div className={`w-px h-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'} mx-1`} />
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-black ${isDark ? 'text-red-400' : 'text-red-600'} leading-none`}>{toKuDigits(isPlayer1 ? scores.p2 : scores.p1)}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM HALF: OPPONENT GRID */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-1 bg-black/10">
          <div className="w-full flex justify-center items-center overflow-hidden" dir="rtl">
            <Grid
              gridId="opponent"
              opponentStatuses={opponentGuesses}
              wordLength={targetWord.length}
              maxRows={3}
              hideLetters={true}
              targetWord={targetWord}
              getLetterStatus={(guess, i) => {
                // For opponent's completed rows, we use the pre-calculated colors
                if (Array.isArray(guess)) return guess[i] || '';
                return '';
              }}
              compact={true}
              activeRowIndex={opponentGuesses.length}
              opponentLiveStatuses={opponentLiveStatuses}
              opponentLiveCursor={opponentLiveCursor}
              isDark={isDark}
            />
          </div>
          <div className="flex items-center gap-2 opacity-60 scale-75 mt-1">
            <span className="text-[10px] font-black text-red-400 uppercase">{opponent?.nickname || 'چاڤەڕێ'}</span>
            <Avatar src={activeMatch?.opp_avatar_url || opponent?.avatar_url} size="xs" />
          </div>
        </div>
      </div>

      {/* 3. KEYBOARD (Pinned to bottom via Flex) */}
      <div className={`shrink-0 w-full z-50 p-2 ${isDark ? 'bg-[#020617]/40' : 'bg-[#f5f5f4]'} pb-[max(env(safe-area-inset-bottom),16px)] m-0 border-t ${isDark ? 'border-white/5' : 'border-slate-200 shadow-lg'}`}>
        <Keyboard
          onKey={onKey}
          onDelete={onDelete}
          onEnter={onEnter}
          usedKeys={usedKeys}
          gameState={(multiplayerState === 'game_over' || isRoundWinner) ? 'won' : (guesses.length >= 3 ? 'lost' : 'playing')}
          hidePowerups={true}
          isDark={isDark}
        />
      </div>

      {/* TEKKEN-STYLE CINEMATIC ROUND INTRO */}
      <RoundIntro
        opponent={opponent}
        userAvatar={userAvatar}
        userNickname={userNickname}
        userLevel={userLevel}
        currentRound={currentRound}
        roundMessage={roundMessage}
      />


      {/* 6. FORFEIT PENDING (GRACE PERIOD) OVERLAY */}
      <AnimatePresence>
        {forfeitStatus === 'pending' && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-700 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 text-center"
          >
            <Motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-amber-500/10 border-2 border-amber-500/30 p-10 rounded-[40px] shadow-2xl max-w-sm w-full"
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-amber-400 animate-pulse">wifi_off</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 leading-tight font-noto-sans-arabic">
                هێل یا هاتییە بڕین...
              </h2>
              <p className="text-amber-100/60 text-lg font-bold mb-6 font-noto-sans-arabic">
                چاڤەڕێبە {forfeitCountdown} چرکەیان
              </p>

              <div className="flex items-center justify-center gap-3">
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                {/* English Text Removed */}
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


