import React, { useEffect, useCallback, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Grid from './Grid';
import Keyboard from './Keyboard';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { useUser } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { useGameStore } from '../store/gameStore';
import { getLevelFromXP } from '../utils/progression';
import { useVoice } from '../context/VoiceContext';
import useGameLogic from '../hooks/useGameLogic';
import useBotSimulator from '../hooks/useBotSimulator';
import Avatar from './Avatar';
import KurdishSunLoader from './KurdishSunLoader';
import RoundIntro from './RoundIntro';
import MultiplayerReactions from './MultiplayerReactions';
import { toKuDigits } from '../utils/formatters';
import { NAME_FONTS } from '../constants/nameFonts';
import { NAME_STYLES } from '../constants/nameStyles';
import PremiumName from './PremiumName';
import { BUNDLES } from '../constants/bundles';

export default function MultiplayerGameView({ opponent: propOpponent, isDark = true, onOpenHowToPlay: _onOpenHowToPlay }) {
  const activeMatch = useMultiplayerStore(s => s.activeMatch);
  const contextOpponent = useMultiplayerStore(s => s.opponent);
  const submitGuess = useMultiplayerStore(s => s.submitGuess);
  const broadcastGuess = useMultiplayerStore(s => s.broadcastGuess);
  const opponentGuesses = useMultiplayerStore(s => s.opponentGuesses);
  const scores = useMultiplayerStore(s => s.scores);
  const currentRound = useMultiplayerStore(s => s.currentRound);
  const isRoundWinner = useMultiplayerStore(s => s.isRoundWinner);
  const _winnerNickname = useMultiplayerStore(s => s.winnerNickname);
  const roundMessage = useMultiplayerStore(s => s.roundMessage);
  const multiplayerState = useMultiplayerStore(s => s.multiplayerState);
  const _setMultiplayerState = useMultiplayerStore(s => s.setMultiplayerState);
  const fetchOpponentProfile = useMultiplayerStore(s => s.fetchOpponentProfile);
  const _resetMatchResultTrigger = useMultiplayerStore(s => s.resetMatchResultTrigger);
  const forfeitStatus = useMultiplayerStore(s => s.forfeitStatus);
  const forfeitCountdown = useMultiplayerStore(s => s.forfeitCountdown);
  const _triggerForfeitVictory = useMultiplayerStore(s => s.triggerForfeitVictory);
  const submitFailure = useMultiplayerStore(s => s.submitFailure);
  const _cancelMatch = useMultiplayerStore(s => s.cancelMatch);
  const broadcastLiveAction = useMultiplayerStore(s => s.broadcastLiveAction);
  const opponentLiveStatuses = useMultiplayerStore(s => s.opponentLiveStatuses);
  const opponentLiveCursor = useMultiplayerStore(s => s.opponentLiveCursor);
  const setIsGameBoardMounted = useMultiplayerStore(s => s.setIsGameBoardMounted);
  const myReaction = useMultiplayerStore(s => s.myReaction);
  const opponentReaction = useMultiplayerStore(s => s.opponentReaction);
  const submitTimeout = useMultiplayerStore(s => s.submitTimeout);
  const setOpponentGuesses = useMultiplayerStore(s => s.setOpponentGuesses);
  const setOpponentLiveStatuses = useMultiplayerStore(s => s.setOpponentLiveStatuses);
  const setActiveMatchGuarded = useMultiplayerStore(s => s.setActiveMatchGuarded);
  const setWinnerNickname = useMultiplayerStore(s => s.setWinnerNickname);

  const {
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    isMuted,
    isDeafened,
    isInChannel,
    isVoiceReady
  } = useVoice();



  // Prioritize Prop over Context to force re-renders from App.jsx
  const opponent = propOpponent || contextOpponent;
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showCinematicOverlay, setShowCinematicOverlay] = React.useState(true);
  const [countdown, setCountdown] = React.useState(5);
  const [pressureTimer, setPressureTimer] = React.useState(null);
  const topGridWrapperRef = React.useRef(null);
  const [gridWidth, setGridWidth] = React.useState('264px');

  React.useEffect(() => {
    if (!topGridWrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const innerGrid = entry.target.querySelector('.mx-auto');
        if (innerGrid) {
          const width = innerGrid.getBoundingClientRect().width;
          if (width > 0) setGridWidth(`${width}px`);
        }
      }
    });
    observer.observe(topGridWrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const { user, userNickname, userAvatar, equippedFont, equippedNameStyle, equippedBundle } = useUser();
  const { playPopSound, playVictorySound: _playVictorySound, playStartGameSound: playStartSound } = useAudio();
  const currentXP = useGameStore(s => s.currentXP);
  const userLevel = getLevelFromXP(currentXP);

  const tickAudioRef = React.useRef(null);
  const leaveTimeoutRef = React.useRef(null);

  // Auto-join voice channel when match starts
  useEffect(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (isVoiceReady && activeMatch?.id && !isInChannel && !opponent?.isBot) {
      joinVoiceChannel(activeMatch.id, user?.id);
    }
  }, [isVoiceReady, activeMatch?.id, isInChannel, opponent?.isBot, joinVoiceChannel, user?.id]);

  // Leave voice channel on unmount
  useEffect(() => {
    return () => {
      leaveTimeoutRef.current = setTimeout(() => {
        leaveVoiceChannel();
      }, 500);
    };
  }, [leaveVoiceChannel]);

  // 1. TOP-LEVEL DERIVED DATA
  const isPlayer1 = useMemo(() => activeMatch?.player1_id === user?.id, [activeMatch, user]);
  const targetWord = useMemo(() => {
    if (!activeMatch?.words?.length) return '';
    const idx = currentRound % activeMatch.words.length;
    return activeMatch.words[idx] || '';
  }, [activeMatch, currentRound]);

  // Initialize Bot Simulator
  const isGameActive = multiplayerState === 'playing' && !showCinematicOverlay && !roundMessage;

  useBotSimulator({
    isBot: opponent?.isBot,
    multiplayerState,
    isGameActive,
    targetWord,
    userLevel,
    setOpponentGuesses,
    setOpponentLiveStatuses,
    opponentLiveCursor,
    setActiveMatchGuarded,
    activeMatch,
    setWinnerNickname,
    opponentGuessesLength: opponentGuesses.length
  });

  useEffect(() => {
    if (!showCinematicOverlay || multiplayerState !== 'playing') return;

    if (!tickAudioRef.current) {
      tickAudioRef.current = new Audio('/Cartoon-timer-ticking-tick-tock-countdown.mp3');
      tickAudioRef.current.volume = 0.25;
    }
    
    tickAudioRef.current.currentTime = 0;
    const playPromise = tickAudioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => console.warn("Failed to play tick audio:", e));
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowCinematicOverlay(false);
          if (tickAudioRef.current) {
            tickAudioRef.current.pause();
            tickAudioRef.current.currentTime = 0;
          }
          playStartSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (tickAudioRef.current) {
        tickAudioRef.current.pause();
      }
    };
  }, [showCinematicOverlay, multiplayerState, playStartSound]);




  // Expose Game Board Readiness
  useEffect(() => {


    if (opponent && targetWord && activeMatch) {
      setIsGameBoardMounted?.(true);
    } else {
      setIsGameBoardMounted?.(false);
    }
  }, [opponent, targetWord, activeMatch, setIsGameBoardMounted]);

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

  // --- PRESSURE TIMER LOGIC ---
  const iHaveFailed = guesses.length >= 3;
  const getAnimatedEmojiUrl = (reaction) => {
    const map = {
      '😂': '1f602',
      '😡': '1f621',
      '👏': '1f44f',
      '🤯': '1f92f',
      '💔': '1f494',
      '🧠': '1f9e0'
    };
    const code = map[reaction];
    return code ? `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp` : null;
  };

  const renderReactionContent = (rawReaction) => {
    if (!rawReaction) return null;
    const reaction = rawReaction.replace(/\u200E|\u200F|\uFE0F/g, '');
    
    if (reaction.length <= 3) {
      const webpUrl = getAnimatedEmojiUrl(reaction);
      if (webpUrl) {
        return (
          <img 
            src={webpUrl} 
            alt={reaction} 
            className="w-8 h-8 object-contain drop-shadow-sm"
          />
        );
      }

      let animationProps = {};
      switch (reaction) {
        case '😂':
          animationProps = { animate: { rotate: [0, -15, 15, -15, 15, 0], scale: [1, 1.2, 1.2, 1.2, 1.2, 1] }, transition: { duration: 1.5, repeat: Infinity } };
          break;
        case '😡':
          animationProps = { animate: { x: [0, -4, 4, -4, 4, 0], y: [0, 2, -2, 2, -2, 0] }, transition: { duration: 0.3, repeat: Infinity } };
          break;
        case '👏':
          animationProps = { animate: { scale: [1, 1.3, 1], y: [0, -5, 0] }, transition: { duration: 0.5, repeat: Infinity } };
          break;
        case '🤯':
          animationProps = { animate: { scale: [1, 1.4, 1], rotate: [0, 5, -5, 0] }, transition: { duration: 1.2, repeat: Infinity } };
          break;
        case '💔':
          animationProps = { animate: { scale: [1, 0.8, 1.1, 1], rotate: [0, -10, 10, 0] }, transition: { duration: 1.5, repeat: Infinity } };
          break;
        case '🧠':
          animationProps = { animate: { scale: [1, 1.15, 1] }, transition: { duration: 0.8, repeat: Infinity } };
          break;
        default:
          animationProps = { animate: { scale: [1, 1.1, 1] }, transition: { duration: 1, repeat: Infinity } };
          break;
      }

      return (
        <Motion.span 
          className="text-[26px] leading-none drop-shadow-sm inline-block"
          {...animationProps}
        >
          {reaction}
        </Motion.span>
      );
    }
    
    return <span className="text-[13px] sm:text-[14px] font-extrabold text-mono-900 dark:text-white leading-tight drop-shadow-sm">{reaction}</span>;
  };

  const opponentHasFailed = activeMatch?.[isPlayer1 ? 'p2_failed' : 'p1_failed'];
  
  useEffect(() => {
    let timeoutId;
    if (multiplayerState !== 'playing' || isRoundWinner) {
      timeoutId = setTimeout(() => setPressureTimer(null), 0);
      return () => clearTimeout(timeoutId);
    }
    if ((iHaveFailed && !opponentHasFailed) || (opponentHasFailed && !iHaveFailed)) {
      timeoutId = setTimeout(() => setPressureTimer(prev => prev === null ? 25 : prev), 0);
    } else {
      timeoutId = setTimeout(() => setPressureTimer(null), 0);
    }
    return () => clearTimeout(timeoutId);
  }, [iHaveFailed, opponentHasFailed, multiplayerState, isRoundWinner]);

  useEffect(() => {
    if (pressureTimer === null) return;
    if (pressureTimer <= 0) {
       if (pressureTimer === 0) {
         if (opponentHasFailed && !iHaveFailed) {
           submitFailure();
         } else if (iHaveFailed && !opponentHasFailed) {
           submitTimeout();
         }
         setTimeout(() => setPressureTimer(-1), 0);
       }
       return;
    }
    const interval = setInterval(() => setPressureTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [pressureTimer, opponentHasFailed, iHaveFailed, submitFailure, submitTimeout]);

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
  }, [currentRound, targetWord, resetLocalBoard]);


  // --- GUARDS & EARLY RETURNS (Declare AFTER all hooks) ---
  if (!activeMatch) {
    return (
      <div className="h-full bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <KurdishSunLoader />
        <p className="mt-8 text-white/40 font-noto-sans-arabic animate-pulse">بەرھەڤکرنا پەیڤان...</p>
      </div>
    );
  }

  if (!opponent) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#020617] text-white">
        <KurdishSunLoader />
        <p className="mt-8 text-primary/40 font-rabar animate-pulse">بەرھەڤکرنا یاریێ...</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col flex-1 h-full w-full ${isDark ? 'bg-black' : 'bg-mono-white'} overflow-hidden transition-colors duration-500`}
      style={{ display: multiplayerState === 'match_starting' ? 'none' : 'flex' }}
    >
      {showCinematicOverlay && (
        <div className="fixed inset-0 z-9999 bg-[#020617] flex flex-col overflow-hidden text-white">
          {/* Top Half: Opponent */}
          <div className="flex-1 bg-red-700 border-b-4 border-red-900 flex flex-col items-center justify-center relative shadow-[inset_0_-30px_60px_rgba(0,0,0,0.3)]">
            {(() => {
              const oppFont = NAME_FONTS[opponent?.equipped_font] || NAME_FONTS['default-ku'];
              const oppStyle = NAME_STYLES[opponent?.equipped_name_style] || {};
              const oppBundle = BUNDLES[opponent?.equipped_bundle] || BUNDLES['default'];
              const name = opponent?.nickname || 'Hévrk';
              const nameLen = Math.max(name.length, 1);
              const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
              const isWideFont = wideFonts.includes(opponent?.equipped_font);
              const baselineLen = isWideFont ? 4 : 7.5;
              const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
              const baseSize = oppFont.style?.fontSize ? parseFloat(oppFont.style.fontSize) : 1.4;
              const charWidthFactor = isWideFont ? 1.2 : 0.75;
              const maxVw = 80 / (nameLen * charWidthFactor);
              
              return (
                <div className="mb-5 px-6 py-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-lg z-10 flex justify-center">
                  <PremiumName 
                    text={name}
                    styleId={oppBundle.id !== 'default' ? null : oppStyle.id}
                    dir="auto"
                    className={`font-black block max-w-[80vw] whitespace-nowrap overflow-visible py-2 sm:py-3 text-center ${oppBundle.id !== 'default' ? (oppBundle.fontKurdish + ' ' + oppBundle.textStyle) : 'text-white'}`}
                    style={{
                      ...(oppBundle.id !== 'default' ? {} : oppFont.style),
                      fontSize: `min(${baseSize * scaleFactor}em, ${maxVw}vw)`
                    }}
                  />
                </div>
              );
            })()}
            <div className="ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] rounded-full z-10">
              <Avatar src={activeMatch?.opp_avatar_url || opponent?.avatar_url} size="xl" />
            </div>
          </div>

          {/* Middle: VS */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 z-50 flex items-center justify-center">
            <Motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 60%)' }}
            />
            <span className="relative font-black text-7xl sm:text-8xl italic bg-linear-to-b from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent select-none">
              و
            </span>
          </div>
          {/* Countdown Badge */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
            <div className="bg-black/80 px-8 py-2 rounded-full border border-white/20 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-center gap-3 text-white">
                <span className="material-symbols-outlined animate-pulse text-amber-500 text-3xl">timer</span>
                <span className="text-4xl font-black">{countdown}</span>
              </div>
            </div>
          </div>

          {/* Bottom Half: User */}
          <div className="flex-1 bg-blue-700 border-t-4 border-blue-900 flex flex-col items-center justify-center relative shadow-[inset_0_30px_60px_rgba(0,0,0,0.3)]">
            <div className="ring-4 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] rounded-full z-10">
              <Avatar src={userAvatar} size="xl" />
            </div>
            {(() => {
              const myFont = NAME_FONTS[equippedFont] || NAME_FONTS['default-ku'];
              const myStyle = NAME_STYLES[equippedNameStyle] || {};
              const myBundle = BUNDLES[equippedBundle] || BUNDLES['default'];
              const name = userNickname || 'یاریزان';
              const nameLen = Math.max(name.length, 1);
              const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
              const isWideFont = wideFonts.includes(equippedFont);
              const baselineLen = isWideFont ? 4 : 7.5;
              const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
              const baseSize = myFont.style?.fontSize ? parseFloat(myFont.style.fontSize) : 1.4;
              const charWidthFactor = isWideFont ? 1.2 : 0.75;
              const maxVw = 80 / (nameLen * charWidthFactor);
              
              return (
                <div className="mt-5 px-6 py-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-lg z-10 flex justify-center">
                  <PremiumName 
                    text={name}
                    styleId={myBundle.id !== 'default' ? null : myStyle.id}
                    dir="auto"
                    className={`font-black block max-w-[80vw] whitespace-nowrap overflow-visible py-2 sm:py-3 text-center ${myBundle.id !== 'default' ? (myBundle.fontKurdish + ' ' + myBundle.textStyle) : 'text-white'}`}
                    style={{
                      ...(myBundle.id !== 'default' ? {} : myFont.style),
                      fontSize: `min(${baseSize * scaleFactor}em, ${maxVw}vw)`
                    }}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}
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
              line-height: 1.2 !important;
              white-space: normal !important;
              font-weight: 300 !important;
              text-align: center;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
          }
          .riddle-text {
            white-space: normal !important;
            line-height: 1.2 !important;
            font-size: clamp(0.6rem, 3.5vw, 1.25rem) !important;
            text-align: center;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}
      </style>

      {/* 0. ACTION TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-400 pt-[calc(env(safe-area-inset-top)+0.5rem)] px-4 h-[calc(env(safe-area-inset-top)+3.5rem)] flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto relative">
          <button
            onClick={() => { playPopSound(); setIsMenuOpen(true); }}
            className={`flex items-center justify-center rounded-md transition-all ${isDark ? 'bg-black/60 text-white/80 hover:bg-black/80' : 'bg-white/80 text-slate-700 hover:bg-white'} backdrop-blur-md shadow-lg border ${isDark ? 'border-white/10' : 'border-slate-200'}`}
            style={{
              width: 'clamp(32px, 8vw, 44px)',
              height: 'clamp(32px, 8vw, 44px)'
            }}
          >
            <span 
              className="material-symbols-outlined"
              style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}
            >
              menu
            </span>
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <Motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />

                <Motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10, x: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10, x: 20 }}
                  className={`absolute top-12 right-0 w-48 rounded-md shadow-2xl border backdrop-blur-xl z-20 overflow-hidden ${isDark ? 'bg-black/90 border-white/10' : 'bg-white/95 border-slate-200'}`}
                  dir="rtl"
                >
                  <div className="flex flex-col py-1">
                    <button
                      onClick={() => {
                        playPopSound();
                        setIsMenuOpen(false);
                        _onOpenHowToPlay?.();
                      }}
                      className={`flex items-center gap-3 px-4 py-3 text-[13px] font-black font-rabar transition-colors ${isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">help</span>
                      ڕێنمایی
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      className={`flex items-center gap-3 px-4 py-3 text-[13px] font-black font-rabar transition-colors ${isMuted ? 'text-red-500 hover:bg-red-500/10' : (isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')} ${isInChannel ? '' : 'opacity-50 pointer-events-none'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isMuted ? 'mic_off' : 'mic'}
                      </span>
                      بێدەنگکرنا خوە
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeafen();
                      }}
                      className={`flex items-center gap-3 px-4 py-3 text-[13px] font-black font-rabar transition-colors ${isDeafened ? 'text-red-500 hover:bg-red-500/10' : (isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')} ${isInChannel ? '' : 'opacity-50 pointer-events-none'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isDeafened ? 'volume_off' : 'volume_up'}
                      </span>
                      بێدەنگکرنا هەڤڕکی
                    </button>

                    <div className={`h-px w-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

                    <button
                      onClick={() => {
                        playPopSound();
                        setIsMenuOpen(false);
                        _cancelMatch?.();
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-[13px] font-black font-rabar text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      دەرکەفتن
                    </button>
                  </div>
                </Motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1" />
      </div>

      {/* 1. SYMMETRIC BATTLEFIELD */}
      <div className="battlefield-container no-scrollbar pt-[calc(env(safe-area-inset-top)+clamp(44px,8vw+12px,56px))]" dir="rtl">

        {/* PRESSURE WARNING MOVED TO AVATARS */}

        {/* RIDDLE DISPLAY */}
        <div className={`w-full h-12 flex flex-col items-center justify-center px-4 animate-in fade-in duration-700 shrink-0 ${isDark ? 'bg-white/5 border-b border-white/5' : 'bg-slate-50 border-b border-slate-200'}`}>
          <p className={`text-lg sm:text-2xl font-light ${isDark ? 'text-white' : 'text-slate-800'} font-noto-sans-arabic ${isDark ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : ''} riddle-text w-full md:max-w-lg md:mx-auto md:text-center`}>
            {activeMatch?.riddles?.[currentRound % (activeMatch?.riddles?.length || 1)] || '...'}
          </p>
        </div>

        {/* TOP HALF: YOUR GRID */}
        <div className={`flex-1 min-h-0 flex flex-col items-center justify-center p-1 pb-6 sm:pb-1 ${isDark ? 'bg-white/5' : 'bg-white/60'}`}>
          <div 
            className={`flex items-center justify-between gap-3 mb-3 h-15 relative ${isDark ? 'bg-white/10 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-black/50' : 'bg-white/90 border-white shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5'} border rounded-md px-4 backdrop-blur-xl transition-all duration-300 ease-out`}
            style={{ width: gridWidth, minWidth: '230px' }}
          >
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              {opponentHasFailed && !iHaveFailed && pressureTimer !== null && pressureTimer > 0 && (
                <div className="absolute -inset-1.5 pointer-events-none z-50">
                  <svg width="100%" height="100%" viewBox="0 0 52 52" className="-rotate-90 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="3" />
                    <circle cx="26" cy="26" r="24" fill="none" stroke="#ef4444" strokeWidth="3"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (pressureTimer / 25) * 150.8}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                </div>
              )}
              <div className={`transition-all duration-300 ${myReaction ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <Avatar src={userAvatar} size="sm" />
              </div>
              <AnimatePresence mode="popLayout">
                {myReaction && (
                  <Motion.div
                    key={`my-${myReaction}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                    className="absolute inset-0 m-auto flex items-center justify-center z-100 pointer-events-none"
                  >
                    <div className={`${myReaction.replace(/\\u200E|\\u200F|\\uFE0F/g, '').length <= 3 ? 'w-10 h-10 rounded-full' : 'px-3 py-1.5 rounded-[12px] whitespace-nowrap'} ${isDark ? 'bg-mono-800 border-mono-700' : 'bg-white border-mono-200'} border shadow-xl flex items-center justify-center`}>
                      {renderReactionContent(myReaction)}
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex-1 flex flex-col min-w-0 items-end justify-center" style={{ containerType: 'inline-size' }}>
              {(() => {
                const myFont = NAME_FONTS[equippedFont] || NAME_FONTS['default-ku'];
                const myStyle = NAME_STYLES[equippedNameStyle] || {};
                const myBundle = BUNDLES[equippedBundle] || BUNDLES['default'];
                
                const name = userNickname || 'یاریزان';
                const nameLen = Math.max(name.length, 1);
                const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
                const isWideFont = wideFonts.includes(equippedFont);
                
                const baselineLen = isWideFont ? 4 : 7.5;
                const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
                const baseSize = myFont.style?.fontSize ? parseFloat(myFont.style.fontSize) : 1.4;
                
                const charWidthFactor = isWideFont ? 1.5 : 0.9;
                const maxCqi = 100 / (nameLen * charWidthFactor);

                return (
                  <div className="flex items-center gap-2">
                    <PremiumName 
                      text={name}
                      styleId={myBundle.id !== 'default' ? null : myStyle.id}
                      className={`text-sm sm:text-base font-black relative z-10 transition-colors duration-300 whitespace-nowrap block overflow-visible ${myBundle.id !== 'default' ? (myBundle.fontKurdish + ' ' + myBundle.textStyle) : (isDark ? 'text-blue-400' : 'text-blue-600')}`}
                      style={{
                        ...(myBundle.id !== 'default' ? {} : myFont.style),
                        fontSize: `min(${baseSize * scaleFactor}em, ${maxCqi}cqi)`
                      }}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="w-full md:max-w-lg md:mx-auto flex justify-center items-center overflow-hidden" dir="rtl" ref={topGridWrapperRef}>
            <Grid
              gridId="player"
              guesses={guesses}
              currentGuess={currentGuess}
              targetWord={targetWord || ''}
              wordLength={targetWord?.length || 5}
              getLetterStatus={getLetterStatus}
              isDark={isDark}
              compact={true}
              maxRows={3}
            />
          </div>
        </div>

        {/* CENTER VS BAR: THE SCORES & ROUND */}
        <div className="shrink-0 flex items-center justify-center h-0 w-full z-20 relative overflow-visible">
          <MultiplayerReactions />
          {/* Background Horizontal Line */}
          <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 bg-linear-to-r from-transparent via-${isDark ? 'white/10' : 'slate-300/60'} to-transparent h-px w-full`} />

          {/* Score & Round Elements */}
          <div 
            className={`flex items-center justify-between ${isDark ? 'bg-white/10 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-black/50' : 'bg-white/90 border-white shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5'} backdrop-blur-xl p-1.5 rounded-md border relative z-10 transition-all duration-300 ease-out`}
            style={{ 
              width: gridWidth,
              minWidth: '230px'
            }}
          >
            {/* Player Score Box (Right in RTL) */}
            <div className={`flex items-center justify-center px-1.5 sm:px-4 py-1 sm:py-1.5 ${isDark ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-500 text-white border-blue-600'} border rounded shadow-sm min-w-9 sm:min-w-11`}>
              <span className="text-base font-black leading-none tabular-nums">
                {toKuDigits(isPlayer1 ? scores?.p1 : scores?.p2)}
              </span>
            </div>

            {/* Round Text (Center, sitting on the unified background) */}
            <div className={`text-[13px] sm:text-base font-black ${isDark ? 'text-white/80' : 'text-slate-700'} uppercase px-1 sm:px-2 whitespace-nowrap`}>
              گەڕ {toKuDigits((currentRound || 0) + 1)}
            </div>

            {/* Opponent Score Box (Left in RTL) */}
            <div className={`flex items-center justify-center px-1.5 sm:px-4 py-1 sm:py-1.5 ${isDark ? 'bg-red-600 text-white border-red-500' : 'bg-red-500 text-white border-red-600'} border rounded shadow-sm min-w-9 sm:min-w-11`}>
              <span className="text-base font-black leading-none tabular-nums">
                {toKuDigits(isPlayer1 ? scores?.p2 : scores?.p1)}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM HALF: OPPONENT GRID */}
        <div className={`flex-1 min-h-0 flex flex-col items-center justify-center p-1 pt-6 sm:pt-1 ${isDark ? 'bg-black/40' : 'bg-black/5'}`}>
          <div className="w-full md:max-w-lg md:mx-auto flex justify-center items-center overflow-hidden" dir="rtl">
            <Grid
              gridId="opponent"
              opponentStatuses={opponentGuesses}
              wordLength={targetWord?.length || 5}
              maxRows={3}
              hideLetters={true}
              targetWord={targetWord || ''}
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
          <div 
            className={`flex items-center justify-between gap-3 mt-3 h-15 relative ${isDark ? 'bg-white/10 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-black/50' : 'bg-white/90 border-white shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5'} border rounded-md px-4 backdrop-blur-xl transition-all duration-300 ease-out`}
            style={{ width: gridWidth, minWidth: '230px' }}
          >
            <div className="flex-1 flex flex-col min-w-0 items-start justify-center" style={{ containerType: 'inline-size' }}>
              {(() => {
                const oppFont = NAME_FONTS[opponent?.equipped_font] || NAME_FONTS['default-ku'];
                const oppStyle = NAME_STYLES[opponent?.equipped_name_style] || {};
                const oppBundle = BUNDLES[opponent?.equipped_bundle] || BUNDLES['default'];
                
                const name = opponent?.nickname || 'چاڤەڕێ';
                const nameLen = Math.max(name.length, 1);
                const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
                const isWideFont = wideFonts.includes(opponent?.equipped_font);
                
                const baselineLen = isWideFont ? 4 : 7.5;
                const scaleFactor = Math.min(1.15, Math.max(0.25, baselineLen / nameLen));
                const baseSize = oppFont.style?.fontSize ? parseFloat(oppFont.style.fontSize) : 1.4;
                
                const charWidthFactor = isWideFont ? 1.5 : 0.9;
                const maxCqi = 100 / (nameLen * charWidthFactor);

                return (
                  <div className="flex items-center gap-2">
                    <PremiumName 
                      text={name}
                      styleId={oppBundle.id !== 'default' ? null : oppStyle.id}
                      className={`text-sm sm:text-base font-black relative z-10 transition-colors duration-300 whitespace-nowrap block overflow-visible ${oppBundle.id !== 'default' ? (oppBundle.fontKurdish + ' ' + oppBundle.textStyle) : (isDark ? 'text-red-400' : 'text-red-600')}`}
                      style={{
                        ...(oppBundle.id !== 'default' ? {} : oppFont.style),
                        fontSize: `min(${baseSize * scaleFactor}em, ${maxCqi}cqi)`
                      }}
                    />
                  </div>
                );
              })()}
            </div>
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              {iHaveFailed && !opponentHasFailed && pressureTimer !== null && pressureTimer > 0 && (
                <div className="absolute -inset-1.5 pointer-events-none z-50">
                  <svg width="100%" height="100%" viewBox="0 0 52 52" className="-rotate-90 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="3" />
                    <circle cx="26" cy="26" r="24" fill="none" stroke="#ef4444" strokeWidth="3"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (pressureTimer / 25) * 150.8}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                </div>
              )}
              {(() => {
                const oppBundle = BUNDLES[opponent?.equipped_bundle] || BUNDLES['default'];
                return (
                  <div className={`transition-all duration-300 rounded-full ${opponentReaction ? 'opacity-0 scale-75' : 'opacity-100 scale-100'} ${oppBundle.id !== 'default' ? oppBundle.avatarRing : ''}`}>
                    <Avatar src={activeMatch?.opp_avatar_url || opponent?.avatar_url} size="sm" border={oppBundle.id === 'default'} />
                  </div>
                );
              })()}
              <AnimatePresence mode="popLayout">
                {opponentReaction && (
                  <Motion.div
                    key={`opp-${opponentReaction}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
                    className="absolute inset-0 m-auto flex items-center justify-center z-100 pointer-events-none"
                  >
                    <div className={`${opponentReaction.replace(/\\u200E|\\u200F|\\uFE0F/g, '').length <= 3 ? 'w-10 h-10 rounded-full' : 'px-3 py-1.5 rounded-[12px] whitespace-nowrap'} ${isDark ? 'bg-mono-800 border-mono-700' : 'bg-white border-mono-200'} border shadow-xl flex items-center justify-center`}>
                      {renderReactionContent(opponentReaction)}
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KEYBOARD (Pinned to bottom via Flex) */}
      <div className={`shrink-0 w-full md:max-w-lg md:mx-auto z-50 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] ${isDark ? 'bg-black/40 md:bg-transparent' : 'bg-mono-50 md:bg-transparent'} m-0 border-t ${isDark ? 'border-white/5 md:border-none' : 'border-mono-200 shadow-lg md:border-none md:shadow-none'} relative`}>
        {/* WAITING FOR OPPONENT OVERLAY MOVED TO AVATAR */}

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
        userEquippedFont={equippedFont}
        userEquippedNameStyle={equippedNameStyle}
        userEquippedBundle={equippedBundle}
        userLevel={userLevel}
        currentRound={currentRound}
        roundMessage={roundMessage}
        previousWord={activeMatch?.current_word_index > 0 ? activeMatch?.words?.[activeMatch.current_word_index - 1] : null}
        previousRoundWinner={_winnerNickname}
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
              className="bg-amber-500/10 border-2 border-amber-500/30 p-10 rounded-2xl shadow-2xl max-w-sm w-full"
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







