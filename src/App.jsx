// Deployment Trigger: Ensuring timer removal is live
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import OneSignal from 'react-onesignal';
import TopAppBar from './components/TopAppBar';
import RoundIntro from './components/RoundIntro';
import BattleResultOverlay from './components/BattleResultOverlay';
import Avatar from './components/Avatar';
import { triggerHaptic } from './utils/haptics';
import InfoBar from './components/InfoBar';
import Grid from './components/Grid';
import Keyboard from './components/Keyboard';
import CategoryModal from './components/CategoryModal';
import BottomNav from './components/BottomNav';
import LobbyView from './components/LobbyView';
import { wordList, gameWordLists } from './data/wordList';
import { STATUS } from './data/constants';
import { getLocalDateString as _getLocalDateString } from './utils/formatters';
import KurdishSunLoader from './components/KurdishSunLoader';

import useMultiplayer from './hooks/useMultiplayer';
import { calculateLevelRewards, calculateDefeatPenalty } from './utils/gameStatus';
import useGameLogic from './hooks/useGameLogic';
import { AVATARS } from './data/avatars';

import { forceResumeAudio } from './utils/audio';
import { normalizeKurdishInput } from './utils/textUtils';

import useThemeDetector from './hooks/useThemeDetector';

// Resilient Lazy Loading Guard: Automatically reloads the page if a chunk fails to load 
// (common after new deployments where asset hashes change).
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenReloaded = JSON.parse(
      window.sessionStorage.getItem('page-has-been-reloaded') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-reloaded', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenReloaded) {
        window.sessionStorage.setItem('page-has-been-reloaded', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

const MultiplayerGameView = lazyWithRetry(() => import('./components/MultiplayerGameView'));
const LeaderboardView = lazyWithRetry(() => import('./components/LeaderboardView'));
const SocialHubView = lazyWithRetry(() => import('./components/SocialHubView'));
const ShopView = lazyWithRetry(() => import('./components/ShopView'));
const ProfileView = lazyWithRetry(() => import('./components/ProfileView'));
const AuthView = lazyWithRetry(() => import('./components/AuthView'));
const DictionaryView = lazyWithRetry(() => import('./components/DictionaryView'));
const SettingsModal = lazyWithRetry(() => import('./components/SettingsModal'));
const HowToPlayModal = lazyWithRetry(() => import('./components/HowToPlayModal'));
const DailyRewardModal = lazyWithRetry(() => import('./components/DailyRewardModal'));
const MasteryModal = lazyWithRetry(() => import('./components/MasteryModal'));
const KeyboardLanguageModal = lazyWithRetry(() => import('./components/KeyboardLanguageModal'));
const StatsView = lazyWithRetry(() => import('./components/StatsView'));
const AchievementsView = lazyWithRetry(() => import('./components/AchievementsView'));

import { useGame } from './context/GameContext';
import { useUser } from './context/AuthContext';
import { useAudio } from './context/AudioContext';
import VictoryOverlay from './components/VictoryOverlay';
import CoinAnimation from './components/CoinAnimation';
import LevelUpOverlay from './components/LevelUpOverlay';
import WordFeverResultOverlay from './components/WordFeverResultOverlay';
import DefeatOverlay from './components/DefeatOverlay';
import { supabase } from './lib/supabase';
import PrivacyPolicy from './components/PrivacyPolicy';
import DataDeletion from './components/DataDeletion';
import TermsOfService from './components/TermsOfService';
import { colorsToEmojiGrid } from './utils/share';




const PEYVCIN_VERSION = '2.0.0';

// Audio logic handled via GameContext useGame()

// --- FAIL-SAFE: GAME ERROR BOUNDARY ---
class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-mono-white text-mono-900 dark:bg-mono-950 dark:text-mono-50 p-8 text-center" style={{ fontFamily: 'Rabar, sans-serif' }}>
          <div className="bg-red-500/10 border-2 border-red-500/30 p-10 rounded-3xl shadow-2xl max-w-lg backdrop-blur-xl animate-in zoom-in-95">
            <h2 className="text-4xl font-black mb-6 text-red-500">ئاریشەیەک چێ بوو!</h2>
            <p className="text-white/70 mb-10 text-lg leading-relaxed">ببورە، ھندەک ئاریشەیێن تەکنیکی د دەستپێکرنا یاریێ دا ھەبوون. تکایە دووبارە پەیجێ نوو بکە یان ڤەگەرە لابیێ.</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => window.location.reload()} className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all">نووکرنا پەیجێ</button>
              <button onClick={() => window.location.href = '/'} className="bg-white/5 border border-white/10 text-white/60 px-10 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all">ڤەگەر بۆ سەرەکی</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- UI SUB-COMPONENTS (HOISTED FOR PERFORMANCE) ---
const ScrollingMatchFinder = ({ opponent }) => {
  const [randomPool] = useState(() =>
    [...AVATARS, ...AVATARS].sort(() => 0.5 - Math.random())
  );

  return (
    <div className="relative w-24 h-24 rounded-[100%] overflow-hidden bg-mono-100 dark:bg-black/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] border-2 border-red-500">
      <AnimatePresence mode="wait">
        {!opponent ? (
          <Motion.div
            key="scrolling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
            className="absolute inset-0"
          >
            <Motion.div
              animate={{ y: [0, -1200] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="flex flex-col items-center"
            >
              {randomPool.map((av, i) => (
                <div key={i} className="w-24 h-24 flex items-center justify-center shrink-0">
                  <Avatar src={av.id} size="full" border={false} />
                </div>
              ))}
            </Motion.div>
            {/* Vertical Blur & Fade Overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-mono-white dark:from-mono-950 via-transparent to-mono-white dark:to-mono-950 opacity-60" />
          </Motion.div>
        ) : (
          <Motion.div
            key="found"
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/10"
          >
            <Avatar src={opponent.avatar_url} size="full" border={false} />
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // 0. CORE CONTEXT HOOKS: Must be at the top to avoid ReferenceErrors
  const {
    user, setUser, hapticEnabled, loadingAuth, authProgress,
    userNickname, userAvatar, city, isInKurdistan, countryCode,
    ownedAvatars, equippedAvatar, unlockedThemes: _unlockedThemes, currentTheme,
    updateProfile, profileData,
    micEnabled, speakerEnabled, voiceVolume
  } = useUser();

  const {
    appSoundsEnabled,
    appSfxVolume, updateSfxVolume,
    bgMusicVolume, updateMusicVolume,
    playPopSound, playNotifSound, playMessageSound,
    playStartGameSound, playRewardSound, playPurchaseSound, playBoosterSound, playBubblePopSound,
    playSettingsOpenSound, playSettingsCloseSound,
    playTabSound, startBGM, stopBGM
  } = useAudio();

  const {
    currentXP, level, maxXP, minXPForLevel, lastNotifiedLevel,
    fils, derhem, dinar,
    dailyStreak, lastRewardClaimedAt,
    magnetCount, hintCount, skipCount,
    winsTowardsSecret, incrementSecretWordProgress, resetSecretWordProgress,
    solvedWords, playerStats,
    syncProgressToDatabase,
    processPurchase,
    getFreshWord,
    userRank, refreshRank,
    setLastNotifiedLevel,
    claimDailyReward: _claimDailyReward,
    updateInventory,
    initializeStatsInDB,
    loading: isGameLoading,
    resetBoard: _resetContextBoard
  } = useGame();

  // --- ONESIGNAL NOTIFICATION ENGINE ---
  useEffect(() => {
    let isMounted = true;
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: 'b642fbbb-f82b-4d0d-93b0-192e702cbd75',
          allowLocalhostAsSecureOrigin: true,
        });
        if (isMounted) {
          OneSignal.Slidedown.promptPush();
          console.log("🔔 [OneSignal] Initialized successfully");
        }
      } catch (err) {
        // Suppress "already initialized" error which happens in StrictMode or re-mounts
        if (err.message?.includes('already initialized')) {
          console.warn("🔔 [OneSignal] Already initialized, skipping.");
        } else {
          console.error("🔔 [OneSignal] Initialization failed:", err);
        }
      }
    };
    initOneSignal();
    return () => { isMounted = false; };
  }, []);

  // 1. INITIALIZE VIEW FROM URL
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname.replace('/', '');
    return path || 'lobby';
  });

  const bgmStatusRef = useRef('stopped');

  // --- THEME SYNC ENGINE (OS PREFERENCE & USER SELECTION) ---
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      // Priority: 1. User Selected Dark Theme, 2. OS Preference
      const isDarkTheme = currentTheme === 'zakho_nights' || currentTheme === 'dark';
      const isOSDark = mediaQuery.matches;

      if (isDarkTheme || (currentTheme === 'default' && isOSDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Apply immediately on mount and when currentTheme changes
    applyTheme();

    const handleOSThemeChange = () => {
      if (currentTheme === 'default') applyTheme();
    };

    mediaQuery.addEventListener('change', handleOSThemeChange);

    // --- GLOBAL AUDIO UNLOCK: Clear browser policy block on first interaction ---
    const handleFirstInteraction = () => {
      console.log("🔊 [App] Interaction detected, unlocking AudioContext...");
      forceResumeAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      mediaQuery.removeEventListener('change', handleOSThemeChange);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [currentTheme]);

  // Sync URL -> State (Initial Load & Back Button)
  // Sync URL -> State (Handles Initial Load & Back/Forward Buttons)
  useEffect(() => {
    const path = location.pathname.replace('/', '') || 'lobby';
    requestAnimationFrame(() => {
      setCurrentView(prev => prev !== path ? path : prev);
    });
  }, [location.pathname]);

  // Sync State -> URL (Handles internal navigateTo calls)
  useEffect(() => {
    const path = location.pathname.replace('/', '') || 'lobby';
    if (path !== currentView) {
      navigate('/' + currentView, { replace: true });
    }
  }, [currentView, navigate, location.pathname]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [howToPlayMode, setHowToPlayMode] = useState('classic');
  const [isHowToPlayShowTabs, setIsHowToPlayShowTabs] = useState(true);
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [initialSocialTab, setInitialSocialTab] = useState(null);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [isVerifyingSignup, setIsVerifyingSignup] = useState(false);
  const isRecoveringRef = useRef(false);
  const isVerifyingRef = useRef(false);

  // Sync refs with state for instant guard access in effects
  const setVerifyingSignup = (val) => {
    isVerifyingRef.current = val;
    setIsVerifyingSignup(val);
  };
  const [_initialStatsTab, setInitialStatsTab] = useState('stats');
  const setRecoveringPassword = (val) => {
    isRecoveringRef.current = val;
    setIsRecoveringPassword(val);
  };


  const [targetWord, setTargetWord] = useState('');
  const [targetHint, setTargetHint] = useState('');
  const [category, setCategory] = useState('');
  const [currentWordCategory, setCurrentWordCategory] = useState('');

  const [, setStartTime] = useState(0);
  const [, setRewardAmount] = useState(0);
  const [rewardAmountXp, setRewardAmountXp] = useState(0);
  const [magnetDisabledKeys, setMagnetDisabledKeys] = useState([]);
  const [revealedIndices, setRevealedIndices] = useState([]);
  const [hintTaps, setHintTaps] = useState(0);
  const [magnetsUsedInRound, setMagnetsUsedInRound] = useState(0);
  const [skipsUsedInRound, setSkipsUsedInRound] = useState(0);

  const [gameMode, setGameMode] = useState('classic'); // 'classic', 'word_fever', 'secret_word', 'mamak', 'hard_words'
  const [timeLeft, setTimeLeft] = useState(30);
  const [, setIsDailyActive] = useState(false);
  const [isSuccessSplash, setIsSuccessSplash] = useState(false);

  // Results & UI State
  const [victoryBreakdown, setVictoryBreakdown] = useState({
    awardAmount: 0,
    xpAdded: 0,
    greenCount: 0,
    yellowCount: 0,
    grayCount: 0
  });
  const [victoryCustomText, setVictoryCustomText] = useState(null);
  const [lastSolvedWord, setLastSolvedWord] = useState('');
  const [_isForfeitConfirmOpen, setIsForfeitConfirmOpen] = useState(false);
  const [isWordFeverResultVisible, setIsWordFeverResultVisible] = useState(false);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [defeatBreakdown, setDefeatBreakdown] = useState({ base: 0, mistakes: 0, total: 0 });
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [wordFeverResultType, setWordFeverResultType] = useState('win');
  const [_hintLimitToast, setHintLimitToast] = useState({ visible: false, message: '' });
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [isMasteryOpen, setIsMasteryOpen] = useState(false);
  const [masteryData, _setMasteryData] = useState(null);
  const [isKeyboardWarningOpen, setIsKeyboardWarningOpen] = useState(false);

  // 1. Memoized flattened dictionary for ultra-fast lookups
  const dictionarySet = useMemo(() => {
    const set = new Set();
    Object.values(gameWordLists).forEach(list => {
      list.forEach(item => {
        if (item.word) set.add(normalizeKurdishInput(item.word));
      });
    });
    return set;
  }, []);

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);


  // Expose initialization helper to console for the user
  useEffect(() => {
    window.initializeStats = async () => {
      console.log("Initializing dummy stats in DB...");
      const res = await initializeStatsInDB();
      if (res?.success) {
        console.log("Stats initialized successfully! Refreshing UI...");
        window.location.reload();
      } else {
        console.error("Failed to initialize stats:", res?.error);
      }
    };
  }, [initializeStatsInDB]);

  const {
    activeMatch,
    multiplayerState,
    MatchmakingTime,
    opponent,
    cancelMatch,
    startMatchmaking,
    LastMatchResult,
    MatchReward,
    scores,
    MatchResultTrigger,
    ResetMatchResultTrigger,
    submitFailure
  } = useMultiplayer();



  // CLEANUP: Ensure multiplayer state is reset when navigating away from results
  useEffect(() => {
    const mainViews = ['store', 'social_hub', 'leaderboard', 'stats', 'dictionary', 'profile'];
    if (multiplayerState === 'game_over' && mainViews.includes(currentView)) {
      // If we are in a result state but moved to a menu, clean up the match record
      if (cancelMatch) cancelMatch();
    }
  }, [currentView, multiplayerState, cancelMatch]);

  const [notificationsList, setNotificationsList] = useState([]);
  const [socialNotifications, setSocialNotifications] = useState({ unreadMessages: 0, pendingRequests: 0 });



  // 5. Notification Sound Trigger (Distinguishing between messages and others)
  const prevNotifCount = useRef(0);
  useEffect(() => {
    const currentCount = notificationsList.length;
    if (currentCount > prevNotifCount.current) {
      const latest = notificationsList[0];
      if (latest && latest.type === 'message') {
        playMessageSound();
      } else {
        playNotifSound();
      }
    }
    prevNotifCount.current = currentCount;
  }, [notificationsList, playNotifSound, playMessageSound]);


  // --- CORE GAME ENGINE (Unified) ---
  const [feverStreak, setFeverStreak] = useState(0);

  const handleGameCompletion = useCallback(async (finalGuesses, isWin, forcedMode = null, forcedTarget = null, precalcBreakdown = null, precalcPenalty = null) => {
    const { targetWord: refTWord, gameMode: refGMode, winsTowardsSecret: _wts, fils: currFils } = gameRefs.current;

    // Prioritize passed arguments over refs to avoid race conditions
    const tWord = forcedTarget || refTWord;
    const gMode = forcedMode || refGMode;

    if (isWin) {
      const breakdown = precalcBreakdown || calculateLevelRewards(tWord, finalGuesses, gMode);

      // Ensure local state is current (redundant safety)
      setVictoryBreakdown(breakdown);
      setRewardAmount(breakdown.awardAmount);
      setRewardAmountXp(breakdown.xpAdded);

      // --- CALCULATE SCORE FOR STATS ---
      let score = 0;
      const maxRows = gMode === 'secret_word' ? 1 : (gMode === 'word_fever' ? 3 : 6);

      if (gMode === 'word_fever') {
        score = feverStreak + 1; // Current word count in the streak
      } else if (gMode === 'battle') {
        score = 100;
      } else {
        // Wordle-style score: higher is better for stats dashboard
        score = Math.max(10, (maxRows - finalGuesses.length + 1) * 10);
      }

      // Synced database call
      if (gMode === 'classic') {
        incrementSecretWordProgress();
      } else if (gMode === 'secret_word') {
        resetSecretWordProgress();
      }

      const syncData = await syncProgressToDatabase(
        tWord.length,
        gMode,
        {
          sessionId: `${gMode}_${Date.now()}`, // 1 Attempt Only logic guard
          score: score,
          solvedWords: [tWord],
          filsBonus: breakdown.awardAmount,
          magnetsUsed: magnetsUsedInRound,
          hintsUsed: hintTaps,
          skipsUsed: skipsUsedInRound,
          attempts: finalGuesses.length,
          isWin: true
        }
      );
      // Extra verification from server if needed
      if (syncData?.xpAdded !== undefined) {
        setRewardAmountXp(syncData.xpAdded);
      }
    } else {
      const penaltyBreakdown = precalcPenalty || calculateDefeatPenalty(tWord, finalGuesses, gMode);
      setDefeatBreakdown(penaltyBreakdown);
      const nextFils = Math.max(0, Math.ceil(currFils - penaltyBreakdown.total));
      updateInventory({ fils: nextFils }, false);

      // Sync loss to update 'score' (0) for stats
      if (gMode !== 'multiplayer') { // Battle handled by multiplayer logic
        syncProgressToDatabase(tWord.length, gMode, {
          score: 0,
          solvedWords: [],
          isWin: false,
          attempts: finalGuesses.length
        });
      }
    }
  }, [syncProgressToDatabase, updateInventory, incrementSecretWordProgress, resetSecretWordProgress, feverStreak, magnetsUsedInRound, hintTaps, skipsUsedInRound]); // Stable dependencies

  const onWinHandler = useCallback((finalGuesses, winWord, winMode) => {
    const { hapticEnabled: hEnabled } = gameRefs.current;

    // 1. Calculate Rewards IMMEDIATELY from snapshots
    const breakdown = calculateLevelRewards(winWord, finalGuesses, winMode);

    // 2. Population states BEFORE showing overlay
    setVictoryBreakdown(breakdown);
    setRewardAmount(breakdown.awardAmount);
    setRewardAmountXp(breakdown.xpAdded);
    setLastSolvedWord(winWord);

    if (winMode === 'word_fever') {
      setFeverStreak(prev => prev + 1);
      setIsWordFeverResultVisible(true);
      setWordFeverResultType('win');
      playRewardSound();
      setIsSuccessSplash(true);
      setTimeout(() => setIsSuccessSplash(false), 1000);
    } else {
      if (hEnabled) triggerHaptic(25);
    }

    // 3. Trigger completion (Async DB sync)
    setRevealedIndices([]); // Clear immediately to prevent ghost tiles in next row during delay
    handleGameCompletion(finalGuesses, true, winMode, winWord, breakdown);
  }, [handleGameCompletion, playRewardSound]);

  const onLossHandler = useCallback((finalGuesses, lossWord, lossMode) => {
    const { multiplayerState: mState } = gameRefs.current;

    setLastSolvedWord(lossWord);
    setRevealedIndices([]); // Clear immediately
    setFeverStreak(0); // Reset fever streak on loss

    // Calculate penalty snap
    const penalty = calculateDefeatPenalty(lossWord, finalGuesses, lossMode);
    setDefeatBreakdown(penalty);

    // If in multiplayer, trigger the failure scoring logic (Round based)
    if (mState === 'playing') {
      submitFailure();
      return;
    }

    if (lossMode === 'word_fever') {
      setWordFeverResultType('fail');
      setIsWordFeverResultVisible(true);
    } else {
      handleGameCompletion(finalGuesses, false, lossMode, lossWord, null, penalty);
      if (lossMode === 'secret_word' || lossMode === 'classic') resetSecretWordProgress();
    }
  }, [handleGameCompletion, resetSecretWordProgress, submitFailure]);

  // --- SAFETY: PHANTOM HANDLER GUARD ---
  // Some legacy components or keyboard listeners may attempt to call this function.
  // We define it here to prevent 'ReferenceError: handleGameplayUpdate is not defined' crashes.
  const handleGameplayUpdate = useCallback((data) => {
    if (import.meta.env.MODE === 'development') {
      console.warn('[App] Phantom handleGameplayUpdate called with:', data);
    }
  }, []);

  const {
    guesses,
    currentGuess,
    usedKeys,
    isVictory, setIsVictory,
    isDefeat, setIsDefeat,
    hintIndices,
    onKey, onDelete, onEnter,
    triggerHint,
    getLetterStatus,
    resetLocalBoard,
    isShaking
  } = useGameLogic({
    targetWord,
    maxRows: gameMode === 'secret_word' ? 1 : (gameMode === 'word_fever' ? 3 : 6),
    gameMode,
    revealedIndices,
    isLevelingUp,
    onWin: onWinHandler,
    onLoss: onLossHandler,
    isActive: currentView === 'game',
    handleGameplayUpdate,
    onWrongLanguage: () => {
      setIsKeyboardWarningOpen(true);
      triggerHaptic([50, 50]);
    },
    soundEnabled: appSoundsEnabled,
    hapticEnabled: hapticEnabled,
    dictionary: dictionarySet,
    onInvalidWord: (reason) => {
      if (reason === 'not_in_dictionary') {
        showToast('ئەڤ پەیڤە د فەرهەنگێ دا نینە');
      } else if (reason === 'short') {
        showToast('پەیڤ کێمە!');
      }
    }
  });

  // --- UNIFIED AUTOMATIC BACKGROUND MUSIC (BGM) CONTROLLER ---
  const lastBgmActionRef = useRef(null);
  useEffect(() => {
    if (!startBGM || !stopBGM || currentView === undefined) return;
    const menuViews = ['lobby', 'social_hub', 'store', 'leaderboard', 'stats', 'dictionary', 'profile'];
    const isGameplayActive = currentView === 'game' || multiplayerState === 'searching' || multiplayerState === 'waiting' || multiplayerState === 'playing' || isVictory || isDefeat || isWordFeverResultVisible;
    const isAuth = currentView === 'auth';
    const shouldPlay = menuViews.includes(currentView) && !isGameplayActive && !isAuth;
    const intendedAction = (shouldPlay && bgMusicVolume > 0) ? 'PLAY' : 'STOP';
    if (lastBgmActionRef.current === intendedAction) return;
    lastBgmActionRef.current = intendedAction;
    if (intendedAction === 'PLAY') {
      const timer = setTimeout(() => {
        if (lastBgmActionRef.current !== 'PLAY') return;
        bgmStatusRef.current = 'playing';
        startBGM();
      }, 800);
      return () => clearTimeout(timer);
    } else {
      if (isGameplayActive || isAuth || bgMusicVolume <= 0) {
        bgmStatusRef.current = 'stopped';
        stopBGM();
      }
    }
  }, [currentView, multiplayerState, isVictory, isDefeat, isWordFeverResultVisible, bgMusicVolume, startBGM, stopBGM]);

  // --- GLOBAL CLICK LISTENER ---
  useEffect(() => {
    const nuclearUnlock = () => { forceResumeAudio(); window.removeEventListener('click', nuclearUnlock); };
    window.addEventListener('click', nuclearUnlock);
    return () => window.removeEventListener('click', nuclearUnlock);
  }, []);

  const handleGoHome = useCallback(() => {
    setIsVictory(false); setIsDefeat(false);
    setVictoryBreakdown({ awardAmount: 0, xpAdded: 0, greenCount: 0, yellowCount: 0, grayCount: 0 });
    setRewardAmountXp(0); setVictoryCustomText(null); setIsWordFeverResultVisible(false); setIsDailyActive(false);
    setCategory(''); setTargetWord(''); setRevealedIndices([]);
    if (cancelMatch) cancelMatch();
    setCurrentView('lobby');
  }, [setIsVictory, setIsDefeat, setIsWordFeverResultVisible, setIsDailyActive, setCategory, setTargetWord, cancelMatch, setCurrentView]);

  const getMaxHintsForWord = useCallback((length) => {
    if (length <= 2) return 0; if (length <= 5) return 1; if (length <= 8) return 2; if (length <= 10) return 3; if (length <= 13) return 4; return 5;
  }, []);

  const showHintLimitToast = useCallback(() => {
    setHintLimitToast({ visible: true, message: 'هاریکاریێن تە ب دوماهیک هاتن' });
    triggerHaptic([50, 100, 50]); setTimeout(() => setHintLimitToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  const gameRefs = useRef({ targetWord, category, hintCount, magnetCount, skipCount, isVictory, isDefeat, currentView, revealedIndices, currentGuess, magnetDisabledKeys, gameMode, hapticEnabled, solvedWords, level, lastSolvedWord, winsTowardsSecret, fils, targetHint, hintTaps });
  useEffect(() => {
    Object.assign(gameRefs.current, { targetWord, category, hintCount, magnetCount, skipCount, isVictory, isDefeat, currentView, revealedIndices, currentGuess, magnetDisabledKeys, gameMode, hapticEnabled, solvedWords, level, lastSolvedWord, winsTowardsSecret, fils, targetHint, hintTaps });
  }, [targetWord, category, hintCount, magnetCount, skipCount, isVictory, isDefeat, currentView, revealedIndices, currentGuess, magnetDisabledKeys, gameMode, hapticEnabled, solvedWords, level, lastSolvedWord, winsTowardsSecret, fils, targetHint, hintTaps]);

  const handleOnEnter = useCallback(async () => {
    await onEnter();
  }, [onEnter]);

  const handleHint = useCallback(() => {
    const { hintCount: hCount, isVictory: isV, targetWord: tWord, hintTaps: hTaps } = gameRefs.current;
    const dynamicLimit = getMaxHintsForWord(tWord.length);
    if (hTaps >= dynamicLimit && !isV) { showHintLimitToast(); return; }
    if (hCount <= 0 || isV) return;

    const hintIndex = triggerHint();
    if (hintIndex === null) return;

    triggerHaptic(20);
    playBoosterSound();
    updateInventory({ hintCount: -1 }, true, true);
    setHintTaps(prev => prev + 1);
  }, [triggerHint, updateInventory, playBoosterSound, showHintLimitToast, getMaxHintsForWord]);

  const handleMagnet = useCallback(() => {
    const { magnetCount: mCount, isVictory: isV, targetWord: tWord, magnetDisabledKeys: mDisabled } = gameRefs.current;

    if (mCount <= 0 || isV) return;
    triggerHaptic(30);
    playBoosterSound();

    const alphabet = 'ئابپت جچحخد ڕزژسشعغفقکگ لڵمنوۆھەیێ'.replace(/\s/g, '').split('');
    const targetSet = new Set(tWord.split(''));
    const incorrect = alphabet.filter(char => !targetSet.has(char) && !mDisabled.includes(char));
    const toDisable = incorrect.sort(() => 0.5 - Math.random()).slice(0, 5);

    setMagnetDisabledKeys(prev => [...prev, ...toDisable]);
    setMagnetsUsedInRound(prev => prev + 1);
    updateInventory({
      magnetCount: -1
    }, true, true); // Sync to DB immediately
  }, [updateInventory, playBoosterSound]); // Added missing dependency

  const handleSkip = useCallback(() => {
    const { skipCount: sCount, isVictory: isV, targetWord: tWord } = gameRefs.current;

    if (sCount <= 0 || isV) return;
    triggerHaptic(25);
    playBoosterSound();
    onEnter(tWord, true); // Use targetWord as forced guess
    setSkipsUsedInRound(prev => prev + 1);
    updateInventory({
      skipCount: -1
    }, true, true); // Sync to DB immediately
  }, [onEnter, updateInventory, playBoosterSound]); // Added missing dependency






  // TRIGGER LEVEL UP UI (Standardized)
  useEffect(() => {
    // Only trigger if authenticated, not on auth screen, and we haven't notified for this level yet
    if (user && currentView !== 'auth' && level > lastNotifiedLevel) {
      requestAnimationFrame(() => setIsLevelingUp(true));
      triggerHaptic([40, 60, 40, 60, 80]);
    }
  }, [level, user, currentView, lastNotifiedLevel]);

  // MANDATORY AUTHENTICATION ENFORCEMENT & HEARTBEAT (Online Status)
  useEffect(() => {
    if (!isGameLoading && !loadingAuth) {
      if (!user) {
        requestAnimationFrame(() => setCurrentView('auth'));
      } else if (currentView === 'auth') {
        // Guard: Prevent redirecting to lobby if user is in the middle of password recovery or signup verification
        // Using Ref here for instant detection during the signup/recovery race conditions
        if (isRecoveringRef.current || isVerifyingRef.current) {
          console.log("[App] Redirect blocked: Verification/Recovery in progress");
          return;
        }
        requestAnimationFrame(() => setCurrentView('lobby'));
      }
    }
  }, [user, isGameLoading, loadingAuth, currentView, isRecoveringPassword, isVerifyingSignup]);

  // REAL-TIME NOTIFICATIONS (Messages & Friend Requests)
  useEffect(() => {
    if (!user?.id) return;

    const socialChannel = supabase
      .channel(`social-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          setSocialNotifications(prev => ({
            ...prev,
            unreadMessages: prev.unreadMessages + 1
          }));
          setNotificationsList(prev => [{
            id: Date.now(),
            type: 'message',
            title: 'نامەیەکا نوی',
            message: 'تە نامەیەکا تایبەت وەرگرت',
            created_at: new Date().toISOString()
          }, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friendships', filter: `friend_id=eq.${user.id}` },
        () => {
          setSocialNotifications(prev => ({
            ...prev,
            pendingRequests: prev.pendingRequests + 1
          }));
          setNotificationsList(prev => [{
            id: Date.now(),
            type: 'friend_request',
            title: 'داخوازییا ھەڤالینیێ',
            message: 'کەسەکی داخوازیا ھەڤالینیێ بۆ تە ھنارتییە',
            created_at: new Date().toISOString()
          }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(socialChannel);
    };
  }, [user?.id]);


  // Shared Logic (Haptic, Audio, Normalized, etc.) now handled in src/utils/gameStatus.js






  // Core logic is now handled by useGameLogic hook



  const handleProfileSave = async (profileData) => {
    if (!user || !user.id) {
      console.error("Save attempted without user session");
      alert('تکایە پێشێ وەرە ژوور (Login)');
      return;
    }

    try {
      const result = await updateProfile({
        nickname: profileData.nickname,
        avatar_url: profileData.avatar_url,
        country_code: profileData.countryCode,
        is_kurdistan: profileData.isInKurdistan
      });

      if (result?.success) {
        // Safe call for refreshRank (ensuring it exists)
        try {
          if (typeof refreshRank === 'function') refreshRank();
        } catch (e) { console.warn("Rank refresh failed but profile is saved", e); }
      } else {
        const errCode = result.error?.code;
        const errMsg = result.error?.message || 'Update failed';
        if (errCode === '23505') {
          alert('ئەڤ ناڤە یێ ھاتییە بکارئینان، تاقی بکە ناڤەکێ دی بنڤیسی');
        } else {
          alert(`شاشی: ${errMsg}`);
        }
      }
    } catch (err) {
      console.error("Critical handleProfileSave error:", err);
      alert("ئاریشەیەک د گەھشتنا داتابەیسێ دا ھەبوو");
    }
  };

  // 7. MULTIPLAYER RESULT REDIRECTION (CLEANUP)
  // Decoupled from shared isVictory/isDefeat state to prevent double overlays.
  // BattleResultOverlay now consumes LastMatchResult directly from MultiplayerContext.
  useEffect(() => {
    if (MatchResultTrigger > 0 && LastMatchResult) {
      console.log(`[Multiplayer] Result detected: ${LastMatchResult}. View redirected to Lobby.`);

      if (LastMatchResult === 'victory') {
        // Reward sound handled by result overlay if needed
      }

      const timer = setTimeout(() => {
        setCurrentView('lobby');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [MatchResultTrigger, LastMatchResult, playRewardSound, setCurrentView]);

  // Safe Audio Trigger for Game Start
  useEffect(() => {
    if (currentView === 'game') {
      try {
        playStartGameSound();
      } catch (e) {
        console.warn("Start sound trigger failed", e);
      }
    }
  }, [currentView, playStartGameSound]);

  // Delay Result Overlay by 7 seconds as requested
  useEffect(() => {
    if (isVictory || isDefeat || isWordFeverResultVisible) {
      const timer = setTimeout(() => {
        setShowResultOverlay(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      requestAnimationFrame(() => {
        setShowResultOverlay(false);
      });
    }
  }, [isVictory, isDefeat, isWordFeverResultVisible]);


  // Handlers now provided by useGameLogic

  // handleGameCompletion is now defined above 
  const ResetRoundBoosters = useCallback(() => {
    setHintTaps(0);
    setSkipsUsedInRound(0);
    setRevealedIndices([]);
    setMagnetsUsedInRound(0);
    setMagnetDisabledKeys([]);
    setVictoryBreakdown({ awardAmount: 0, xpAdded: 0, greenCount: 0, yellowCount: 0, grayCount: 0 });
    setVictoryCustomText(null);
    setRewardAmount(0);
    setRewardAmountXp(0);
    setDefeatBreakdown({ base: 0, mistakes: 0, total: 0 });
    setLastSolvedWord('');
  }, []); // Stable initializer

  const resetBoard = useCallback((wordObj) => {
    const { hapticEnabled: hEnabled, gameMode: gMode } = gameRefs.current;
    const cleanWord = normalizeKurdishInput(wordObj.word);

    setTargetWord(cleanWord);
    setTargetHint(wordObj.hint || '');
    setCurrentWordCategory(wordObj.category || '');
    setRevealedIndices([]);
    setStartTime(Date.now());
    setHintTaps(0);
    setMagnetsUsedInRound(0);
    setMagnetDisabledKeys([]);

    if (gMode === 'word_fever') setTimeLeft(30);
    resetLocalBoard(cleanWord);
    if (hEnabled) triggerHaptic(25);
  }, [resetLocalBoard]);

  const selectCategory = useCallback(async (cat, forcedMode = null) => {
    const { gameMode: gMode } = gameRefs.current;
    const modeToUse = forcedMode || gMode;

    const wordObj = await getFreshWord(modeToUse, cat);

    if (wordObj) {
      if (forcedMode) setGameMode(forcedMode);
      resetBoard(wordObj);
      setCategory(cat);
      setCurrentView('game');
    }
  }, [resetBoard, getFreshWord]);

  const handleEarlyExit = useCallback(() => {
    setIsVictory(false);
    setCurrentView('lobby');
    setCategory('');
    setTargetWord('');
    setIsDailyActive(false);
  }, [setIsVictory, setCurrentView, setCategory, setTargetWord, setIsDailyActive]);

  const handleNextGame = useCallback(async () => {
    const { gameMode: gMode, category: currCat } = gameRefs.current;
    const wordObj = await getFreshWord(gMode, currCat);

    if (wordObj) {
      resetBoard(wordObj);
    } else {
      setCurrentView('lobby');
    }
  }, [resetBoard, getFreshWord]);

  const _handleForfeit = useCallback(() => {
    playPopSound();
    setIsForfeitConfirmOpen(true);
  }, [playPopSound]);

  const executeForfeitConfirmed = useCallback(() => {
    setIsForfeitConfirmOpen(false);
    setCurrentView('lobby');
    setCategory('');
    setTargetWord('');
    setRevealedIndices([]);
  }, []);

  // --- WORD FEVER MODE TIMER ENGINE ---
  useEffect(() => {
    let timer;
    if (currentView === 'game' && gameMode === 'word_fever' && !isVictory && !isWordFeverResultVisible) {
      if (timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
      } else {
        // Time has expired
        requestAnimationFrame(() => {
          setIsDefeat(true); // Lock the board
          setWordFeverResultType('fail');
          setIsWordFeverResultVisible(true);
        });
      }
    }
    return () => clearInterval(timer);
  }, [currentView, gameMode, isVictory, isWordFeverResultVisible, timeLeft, setIsDefeat]);

  // Word Fever Reward & Penalty Effect
  useEffect(() => {
    if (gameMode === 'word_fever' && isWordFeverResultVisible) {
      const t = setTimeout(() => {
        if (wordFeverResultType === 'win') {
          // Note: handleVictorySync in onEnter already handles the database sync and local state XP increment
          // So we don't need addXP(50) here anymore to avoid double-dipping, 
          // but we might want the extra 50 Fils.
          updateInventory({ fils: 50 });
        } else if (wordFeverResultType === 'fail') {

          // Penalty for losing in Word Fever
          updateInventory({ fils: -50 });
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isWordFeverResultVisible, wordFeverResultType, gameMode, updateInventory]);
  // Audio logic handled via AudioContext hooks
  // Auth logic handled via AuthContext hooks


  const handleLogout = async () => {
    setIsLevelingUp(false); // Clear level-up state immediately
    setIsSettingsOpen(false);
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Clear all progression/inventory data from local storage to prevent data leakage to next user
      const keysToKeep = ['peyvchin_app_sfx_volume', 'peyvchin_bg_music_volume', 'peyvchin_haptic_enabled', 'peyvchin_current_theme'];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('peyvchin_') && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      // Force a clean state refresh - most reliable way to handle logouts
      window.location.href = '/';
    }
  };

  // --- SOCIAL NOTIFICATION ENGINE ---
  useEffect(() => {
    if (!user?.id) return;

    const fetchCounts = async () => {
      // 1. Fetch unread messages
      const { data: rawMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      // 2. Fetch pending requests
      const { data: rawReqs } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // 3. Collect unique profile IDs
      const uniqueIds = new Set([
        ...(rawMsgs || []).map(m => m.user_id),
        ...(rawReqs || []).map(r => r.user_id)
      ].filter(Boolean));

      // 4. Batch fetch profiles if IDs exist
      let profileMap = {};
      if (uniqueIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', Array.from(uniqueIds));

        if (profiles) {
          profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
      }

      // 5. Map notifications with profile data
      const msgList = (rawMsgs || []).map(m => {
        const sender = profileMap[m.user_id];
        return {
          id: `msg_${m.id}`,
          dbId: m.id,
          type: 'message',
          sender_id: m.user_id,
          user_nickname: sender?.nickname || m.user_nickname || 'یاریکەر',
          user_avatar: sender?.avatar_url || 'default',
          created_at: m.created_at
        };
      });

      const reqList = (rawReqs || []).map(r => {
        const sender = profileMap[r.user_id];
        return {
          id: `req_${r.id}`,
          dbId: r.id,
          type: 'friend',
          sender_id: r.user_id,
          user_nickname: sender?.nickname || 'یاریکەر',
          user_avatar: sender?.avatar_url || 'default',
          created_at: r.created_at
        };
      });

      const combined = [...msgList, ...reqList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotificationsList(combined);
      setSocialNotifications({ unreadMessages: msgList.length, pendingRequests: reqList.length });
    };

    fetchCounts();

    const socialChannel = supabase
      .channel(`social_notifs:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => fetchCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `friend_id=eq.${user.id}` }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(socialChannel); };
  }, [user?.id]);


  // WRAPPED NAVIGATION: Unified state transition
  const navigateTo = useCallback((view, state = {}) => {
    if (view === 'stats' && state.tab) {
      setInitialStatsTab(state.tab);
    }
    // Sync URL with State
    navigate('/' + view);
    setCurrentView(view);
  }, [navigate]);

  const handleNotificationAction = async (item) => {
    // Optimistically remove from list so it disappears instantly as requested
    setNotificationsList(prev => prev.filter(n => n.id !== item.id));

    // Persist to DB if it's a message
    if (item.type === 'message' && item.dbId) {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', item.dbId);

        // Refresh counts
        setSocialNotifications(prev => ({
          ...prev,
          unreadMessages: Math.max(0, prev.unreadMessages - 1)
        }));
      } catch (e) {
        console.warn("Failed to mark message as read:", e);
      }
    }

    if (item.type === 'message') {
      setActiveChatPartner({ id: item.sender_id, nickname: item.user_nickname, avatar_url: item.user_avatar });
      setInitialSocialTab('private');
      navigateTo('social_hub');
    } else if (item.type === 'friend') {
      setInitialSocialTab('friends');
      navigateTo('social_hub');
    } else {
      setInitialSocialTab('global');
      navigateTo('social_hub');
    }
  };

  const handleOpenChat = useCallback((partner) => {
    setActiveChatPartner(partner);
    setInitialSocialTab('private');
    navigateTo('social_hub');
  }, [navigateTo]);


  const handleViewMessages = useCallback(() => {
    setInitialSocialTab('private');
    navigateTo('social_hub');
  }, [navigateTo]);

  const handleViewFriends = useCallback(() => {
    setInitialSocialTab('friends');
    navigateTo('social_hub');
  }, [navigateTo]);


  const isSystemDark = useThemeDetector();

  const handleOpenHowToPlay = (mode = 'classic', showTabs = true) => {
    playBubblePopSound();
    setHowToPlayMode(mode);
    setIsHowToPlayShowTabs(showTabs);
    setIsHowToPlayOpen(true);
  };

  const handleCloseHowToPlay = () => {
    playBubblePopSound();
    setIsHowToPlayOpen(false);
  };

  // --- CRITICAL AUTH GUARD (Flicker Fix) ---
  // Shows loader if auth is initializing, game assets are loading,
  // or if we have no user but haven't yet redirected to the auth screen.
  if (loadingAuth || isGameLoading || (!user && !['auth', 'lobby', 'game'].includes(currentView))) return (
    <div className="h-dvh flex items-center justify-center bg-mono-white dark:bg-mono-950 transition-colors duration-500">
      <KurdishSunLoader progress={authProgress} />
    </div>
  );

  return (
    <div className="flex flex-col h-dvh max-h-dvh w-full items-center bg-mono-white text-mono-900 dark:bg-mono-950 dark:text-mono-50 transition-colors duration-500 font-noto-sans-arabic" dir="rtl">
      <Analytics />
      <div className={`flex-1 flex flex-col w-full max-w-screen-sm md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto relative overflow-hidden transition-colors duration-500`}>
        {/* Panic Overlay for Word Fever Mode Critical Time */}
        {gameMode === 'word_fever' && currentView === 'game' && timeLeft <= 10 && !isVictory && (
          <div className="panic-overlay" />
        )}

        {/* 1. STATE-BASED NAVIGATION HEADER */}
        {currentView !== 'auth' && currentView !== 'leaderboard' && currentView !== 'social_hub' && multiplayerState !== 'playing' && (
          <TopAppBar
            user={user} fils={fils} derhem={derhem} dinar={dinar}
            magnetCount={magnetCount} hintCount={hintCount} skipCount={skipCount}
            level={level} dailyStreak={dailyStreak}
            currentView={currentView} onEarlyExit={handleEarlyExit}
            onOpenSettings={() => { playSettingsOpenSound(); setIsSettingsOpen(true); }}
            notifications={notificationsList}
            onNotificationAction={handleNotificationAction}
            onOpenSocial={() => {
              playBubblePopSound();
              setCurrentView('social_hub');
            }}
            onForfeit={executeForfeitConfirmed}
            category={category}
            equippedAvatar={equippedAvatar}
            gameMode={gameMode}
            timeLeft={timeLeft}
            notificationCount={socialNotifications.unreadMessages + socialNotifications.pendingRequests}
            onPlaySound={playBubblePopSound}
            onDailyRewardClick={() => {
              playBubblePopSound();
              setIsDailyRewardOpen(true);
            }}
            isDailyAvailable={
              (() => {
                if (!lastRewardClaimedAt) return true;
                const now = new Date();
                const lastClaim = new Date(lastRewardClaimedAt);

                // Compare UTC dates (YYYY-MM-DD) to match server 00:00 UTC reset
                const lastClaimStr = lastClaim.toISOString().split('T')[0];
                const todayStr = now.toISOString().split('T')[0];

                return lastClaimStr !== todayStr;
              })()
            }
            isDark={isSystemDark}
            onOpenHowToPlay={(mode) => handleOpenHowToPlay(mode, false)}
          />
        )}

        {/* 2. MAIN CONTENT AREA (STATE DRIVEN) */}
        <main className={`flex-1 ${(currentView === 'game' || currentView === 'social_hub' || multiplayerState === 'playing') ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'} w-full relative ${(currentView === 'game' || currentView === 'auth' || currentView === 'social_hub' || multiplayerState === 'playing') ? 'p-0' : 'px-4 pt-4 pb-0'}`}>
          {currentView === 'auth' && (
            <AuthView
              onAuthSuccess={async (u, nicknameHint) => {
                setUser(u);
                if (nicknameHint) {
                  await updateProfile({ nickname: nicknameHint });
                }
                setIsRecoveringPassword(false);
                setIsVerifyingSignup(false);
                // Small delay to allow state sync before navigating to lobby
                setTimeout(() => setCurrentView('lobby'), 300);
              }}
              onRecoveringChange={setRecoveringPassword}
              onVerifyingSignupChange={setVerifyingSignup}
            />
          )}

          {(multiplayerState === 'playing' || multiplayerState === 'game_over' || multiplayerState === 'syncing') && (
            <Suspense fallback={<KurdishSunLoader />}>
              <MultiplayerGameView
                opponent={opponent}
                isDark={isSystemDark}
                onOpenHowToPlay={() => handleOpenHowToPlay('multiplayer', false)}
                handleGameplayUpdate={handleGameplayUpdate} // Safety prop passing
              />
            </Suspense>
          )}

          {/* 2. MAIN VIEWS (LOBBY / GAME / SOCIAL) */}
          {currentView === 'lobby' && multiplayerState === 'idle' && (
            <LobbyView
              onStartClassic={() => {
                forceResumeAudio();
                playTabSound();
                stopBGM();
                triggerHaptic(10);
                setIsDailyActive(false);
                selectCategory('generalWordPool', 'classic'); // Direct start with Unified Pool
              }}
              onStartHardWords={() => {
                playTabSound();
                stopBGM();
                triggerHaptic(10);
                setIsDailyActive(true);
                selectCategory('generalWordPool', 'hard_words'); // Filtered by length internally
              }}
              onStartWordFever={() => {
                playTabSound();
                stopBGM();
                triggerHaptic(10);
                setIsDailyActive(false);
                selectCategory('generalWordPool', 'word_fever');
              }}
              onStartSecretWord={() => {
                playTabSound();
                stopBGM();
                triggerHaptic(10);
                setIsDailyActive(false);
                selectCategory('generalWordPool', 'secret_word');
                resetSecretWordProgress();
              }}

              onDailyRewardClick={() => {
                playBubblePopSound();
                setIsDailyRewardOpen(true);
              }}
              onStartMamak={() => {
                playTabSound();
                stopBGM();
                triggerHaptic(10);
                setIsDailyActive(false);
                selectCategory('مامک', 'mamak');
              }}
              winsTowardsSecret={winsTowardsSecret}
              dailyStreak={dailyStreak}
              onViewChange={setCurrentView}
              notificationCount={socialNotifications.unreadMessages + socialNotifications.pendingRequests}
              onStartMultiplayer={() => {
                forceResumeAudio(); // iOS Unlock on User Gesture
                playTabSound();
                stopBGM();
                startMatchmaking();
              }}
              onOpenHowToPlay={handleOpenHowToPlay}
            />
          )}

          {currentView === 'game' && (
            <div className="flex-1 flex flex-col overflow-hidden relative h-full">
              {/* Tier 1 & 2: Info & Grid (Flex Grow) */}
              <div className="flex-1 flex flex-col items-center min-h-0 overflow-hidden no-scrollbar">
                {/* Question Section */}
                <div className={`w-full shrink-0 flex flex-col items-center my-1`}>
                  <InfoBar
                    targetHint={targetHint}
                    category={currentWordCategory || category}
                    gameMode={gameMode}
                    guessesCount={guesses.length}
                    maxGuesses={gameMode === 'word_fever' ? 3 : 6}
                    fils={fils}
                    currentXP={currentXP}
                    minXP={minXPForLevel}
                    maxXP={maxXP}
                    level={level}
                    targetDifficultyLevel={level}
                    timeLeft={timeLeft}
                    showSuccessSplash={isSuccessSplash}
                    isDark={isSystemDark}
                  />
                </div>

                {/* Grid Section (Centers content in remaining space) */}
                <div className="grid-protection-wrapper flex-1 flex flex-col justify-center overflow-hidden">
                  <div className="game-grid-core">
                    <Grid
                      key={targetWord}
                      guesses={guesses}
                      currentGuess={currentGuess}
                      wordLength={targetWord.length}
                      getLetterStatus={getLetterStatus}
                      revealedIndices={revealedIndices}
                      hintIndices={hintIndices}
                      lastHintIndex={-1}
                      targetWord={targetWord}
                      maxRows={gameMode === 'secret_word' ? 1 : (gameMode === 'word_fever' ? 3 : 6)}
                      isSecretMode={gameMode === 'secret_word'}
                      isShaking={isShaking}
                      isDark={isSystemDark}
                    />

                  </div>
                </div>
              </div>

              {/* Tier 3: Keyboard (Pinned to bottom) */}
              <div className={`shrink-0 w-full z-50 p-3 ${isSystemDark ? 'bg-mono-900 border-t border-white/5' : 'bg-mono-white border-t border-slate-200'} pb-[max(env(safe-area-inset-bottom),16px)] m-0 transition-colors duration-500`}>
                <Keyboard
                  onKey={onKey}
                  onDelete={onDelete}
                  onEnter={handleOnEnter}
                  usedKeys={usedKeys}
                  isDark={isSystemDark}
                  gameState={isVictory ? 'won' : isDefeat ? 'lost' : isLevelingUp ? 'leveling-up' : 'playing'}
                  magnetDisabledKeys={magnetDisabledKeys}
                  onHint={handleHint}
                  onMagnet={handleMagnet}
                  onSkip={handleSkip}
                  hintCount={hintCount}
                  magnetCount={magnetCount}
                  skipCount={skipCount}
                  hintTaps={hintTaps}
                  hintLimit={getMaxHintsForWord(targetWord.length)}
                  magnetUsedInRound={magnetsUsedInRound > 0}
                  skipsUsedInRound={skipsUsedInRound}
                  skipLimit={1}
                  keyboardSoundEnabled={appSoundsEnabled}
                  hapticEnabled={hapticEnabled}
                />
              </div>
            </div>
          )}

          <Suspense fallback={<KurdishSunLoader />}>
            {currentView === 'social_hub' && (
              <SocialHubView
                user={user}
                initialChatPartner={activeChatPartner}
                initialTab={initialSocialTab}
                onBack={() => {
                  setActiveChatPartner(null);
                  setInitialSocialTab(null);
                  setCurrentView('lobby');
                }}
                onViewMessages={handleViewMessages}
                onViewFriends={handleViewFriends}
                onKeyboardToggle={setIsKeyboardOpen}
              />
            )}
            {currentView === 'leaderboard' && (
              <LeaderboardView
                onOpenChat={handleOpenChat}
              />
            )}
            {currentView === 'store' && (
              <ShopView
                fils={fils}
                derhem={derhem}
                dinar={dinar}
                magnetCount={magnetCount}
                hintCount={hintCount}
                skipCount={skipCount}
                onPurchase={async (item) => {
                  // Security Hardening: Use the atomic RPC-based processPurchase
                  await processPurchase(item);
                }}
                onPurchaseAvatar={async (id, price, currency) => {
                  // Security Hardening: Treat avatar purchase as a standard item purchase
                  const result = await processPurchase({ id, price, currency, type: 'avatar' });
                  if (result.success) {
                    updateProfile({ ownedAvatars: [...ownedAvatars, id] });
                  }
                }}
                onEquipAvatar={(id) => updateProfile({ avatar_url: id })}
                playPurchaseSound={playPurchaseSound}
                ownedAvatars={ownedAvatars}
                equippedAvatar={equippedAvatar}
              />
            )}
            {currentView === 'stats' && (
              <StatsView
                profileData={profileData}
                playerStats={playerStats}
                rank={userRank}
                userNickname={userNickname}
                userAvatar={userAvatar}
                level={level}
                currentXP={currentXP}
                onViewChange={navigateTo}
              />
            )}
            {currentView === 'achievements' && (
              <AchievementsView
                profileData={profileData}
                onViewChange={navigateTo}
              />
            )}
            {currentView === 'dictionary' && (
              <DictionaryView
                solvedWords={solvedWords}
                wordList={wordList}
                onBack={() => navigateTo('lobby')}
              />
            )}
            {currentView === 'profile' && (
              <ProfileView
                user={user}
                userNickname={userNickname}
                onProfileSave={handleProfileSave}
                userAvatar={userAvatar}
                userCity={city}
                isInKurdistan={isInKurdistan}
                countryCode={countryCode}
                level={level}
                currentXP={currentXP}
                maxXP={maxXP}
                fils={fils}
                derhem={derhem}
                dinar={dinar}
                playerStats={playerStats}
                userRank={userRank}
                dailyStreak={dailyStreak}
                onViewChange={navigateTo}
              />
            )}
          </Suspense>

          {/* Premium Toast Notification System */}
          <AnimatePresence>
            {toastMessage && (
              <Motion.div
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="fixed top-32 left-1/2 z-100 bg-mono-900/90 dark:bg-mono-100/90 backdrop-blur-md text-mono-50 dark:text-mono-900 px-4 py-2 rounded-md shadow-2xl font-rabar font-light text-xs pointer-events-none border border-white/10 dark:border-black/10"
                style={{ whiteSpace: 'nowrap' }}
              >
                {toastMessage}
              </Motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 3. CONDITIONAL BOTTOM NAV (Hide during ANY gameplay or multiplayer) */}
        {currentView !== 'game' &&
          currentView !== 'auth' &&
          currentView !== 'stats' &&
          currentView !== 'achievements' &&
          currentView !== 'dictionary' &&
          (multiplayerState === 'idle' || multiplayerState === 'game_over') &&
          !isKeyboardOpen && (
            <BottomNav
              currentView={currentView}
              setCurrentView={navigateTo}
              onSettingsToggle={() => { setIsSettingsOpen(true); }}
              onTabClickSound={playBubblePopSound}
            />
          )}

        {/* 4. GLOBAL OVERLAYS (SINGLE PLAYER ONLY) */}
        {multiplayerState === 'idle' && (
          <>
            {/* Single Player Victory */}
            <VictoryOverlay
              isVisible={isVictory && showResultOverlay && currentView === 'game' && gameMode !== 'word_fever'}
              breakdown={victoryBreakdown}
              solvedWord={lastSolvedWord}
              guesses={guesses}
              xp={rewardAmountXp}
              customTitle={victoryCustomText?.title}
              customDescription={victoryCustomText?.description}
              isDark={isSystemDark}
              onNext={() => {
                setIsVictory(false);
                handleNextGame();
              }}
              onHome={handleGoHome}
              playStartSound={playStartGameSound}
              profileData={profileData}
              playerStats={playerStats}
              gameMode={gameMode}
            />

            {/* Single Player Defeat */}
            <DefeatOverlay
              isVisible={isDefeat && showResultOverlay && currentView === 'game' && gameMode !== 'word_fever'}
              solvedWord={lastSolvedWord}
              guesses={guesses}
              breakdown={defeatBreakdown}
              gameMode={gameMode}
              playStartSound={playStartGameSound}
              onRetry={async () => {
                setIsDefeat(false);
                const wordObj = await getFreshWord(gameMode, category);
                if (wordObj) resetBoard(wordObj);
              }}
              onHome={handleGoHome}
              isDark={isSystemDark}
              profileData={profileData}
              playerStats={playerStats}
            />
            {/* Word Fever Result */}
            <WordFeverResultOverlay
              isVisible={isWordFeverResultVisible && showResultOverlay && currentView === 'game'}
              type={wordFeverResultType}
              solvedWord={lastSolvedWord}
              guesses={guesses}
              breakdown={wordFeverResultType === 'win' ? victoryBreakdown : defeatBreakdown}
              xp={rewardAmountXp}
              onContinue={() => {
                setIsWordFeverResultVisible(false);
                handleNextGame();
              }}
              onRepeat={() => {
                setIsWordFeverResultVisible(false);
                handleNextGame();
              }}
              onHome={handleGoHome}
              playStartSound={playStartGameSound}
            />
          </>
        )}

        {/* UNIFIED MULTIPLAYER BATTLE RESULT */}
        <BattleResultOverlay
          isVisible={multiplayerState === 'game_over' && !!LastMatchResult}
          result={LastMatchResult}
          scores={scores}
          opponent={opponent}
          playerStats={playerStats}
          user={{ nickname: userNickname, avatar_url: userAvatar, level: level }}
          isPlayer1={activeMatch?.player1_id === user?.id}
          breakdown={MatchReward?.awards ? {
            awardAmount: MatchReward.awards.amount,
            awardType: MatchReward.awards.type,
            xpAdded: MatchReward.xpAdded
          } : {
            awardAmount: LastMatchResult === 'victory' ? 1 : (LastMatchResult === 'draw' ? 20 : 0),
            awardType: LastMatchResult === 'victory' ? 'derhem' : 'fils',
            xpAdded: LastMatchResult === 'victory' ? 30 : (LastMatchResult === 'draw' ? 5 : 0)
          }}
          xp={MatchReward?.xpAdded || (LastMatchResult === 'victory' ? 30 : (LastMatchResult === 'draw' ? 5 : 0))}
          onNext={() => {
            ResetMatchResultTrigger();
            handleGoHome();
          }}
          onExit={() => {
            ResetMatchResultTrigger();
            handleGoHome();
          }}
          playStartSound={playStartGameSound}
          isDark={isSystemDark}
          shareGrid={colorsToEmojiGrid(activeMatch?.player1_id === user?.id ? activeMatch?.p1_colors : activeMatch?.p2_colors)}
        />

        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => { playSettingsCloseSound(); setIsSettingsOpen(false); }}
            isDark={isSystemDark}
            appSfxVolume={appSfxVolume}
            onAppSfxVolumeChange={updateSfxVolume}
            bgMusicVolume={bgMusicVolume}
            onBgMusicVolumeChange={updateMusicVolume}
            hapticEnabled={hapticEnabled}
            onHapticToggle={() => {
              updateProfile({ haptic_enabled: !hapticEnabled });
            }}
            micEnabled={micEnabled}
            speakerEnabled={speakerEnabled}
            voiceVolume={voiceVolume}
            updateProfile={updateProfile}
            user={user}
            onLogout={handleLogout}
            onPlaySound={playBubblePopSound}
          />

          <DailyRewardModal
            isOpen={isDailyRewardOpen}
            onClose={() => setIsDailyRewardOpen(false)}
            isDark={isSystemDark}
          />

          <HowToPlayModal
            isOpen={isHowToPlayOpen}
            onClose={handleCloseHowToPlay}
            initialMode={howToPlayMode}
            isDark={isSystemDark}
            showTabs={isHowToPlayShowTabs}
          />

          <MasteryModal
            isOpen={isMasteryOpen}
            onClose={() => setIsMasteryOpen(false)}
            masteryData={masteryData}
            isDark={isSystemDark}
          />

          <KeyboardLanguageModal
            isOpen={isKeyboardWarningOpen}
            onClose={() => setIsKeyboardWarningOpen(false)}
          />
        </Suspense>



        {/* 5. MULTIPLAYER MATCHMAKING OVERLAY */}
        <AnimatePresence>
          {(multiplayerState === 'searching' || multiplayerState === 'waiting' || multiplayerState === 'found') && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-200 flex flex-col items-center justify-between bg-mono-50/90 dark:bg-mono-950/90 backdrop-blur-2xl px-6 py-12 text-center overflow-hidden"
            >
              {/* Background gradient elements removed as requested by user */}

              {/* TOP RIGHT CANCEL ICON */}
              <div className={`absolute top-6 right-6 z-50 transition-all duration-500 ${multiplayerState === 'found' ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}>
                <button
                  onClick={cancelMatch}
                  className="p-3 bg-mono-200/50 dark:bg-mono-800/50 hover:bg-mono-300 dark:hover:bg-mono-700 border border-mono-300/50 dark:border-mono-700/50 rounded-full text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white backdrop-blur-md shadow-sm hover:shadow-md transition-all active:scale-90"
                  aria-label="Cancel Matchmaking"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* TOP: OPPONENT SEARCHER / FOUND */}
              <div className="relative z-10 flex flex-col items-center mt-24 min-h-[220px] w-full">
                {/* Premium Avatar Rings */}
                <div className="relative flex flex-col items-center justify-center">
                  
                  {/* Minimalist Stage Base */}
                  <div className="absolute -bottom-4 flex flex-col items-center z-0 pointer-events-none">
                    <div className="w-32 h-6 bg-linear-to-b from-mono-200/50 to-mono-300/30 dark:from-mono-800/50 dark:to-mono-900/30 border border-white/40 dark:border-mono-700/40 rounded-[100%] backdrop-blur-sm" />
                    <div className="absolute top-2 w-24 h-2 bg-black/10 dark:bg-black/50 rounded-[100%] blur-md" />
                  </div>

                  {/* Avatar (Rings removed as requested) */}
                  <div className="relative z-10 mt-2">
                    <ScrollingMatchFinder opponent={opponent} />
                  </div>
                </div>
                
                {/* Fixed height placeholder for the name to prevent layout shift */}
                <div className="absolute top-[160px] left-0 right-0 flex flex-col items-center pointer-events-none">
                  <AnimatePresence>
                    {multiplayerState === 'found' && opponent && (
                      <Motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="text-mono-800 dark:text-mono-100 font-black text-xl drop-shadow-md">
                          {opponent.nickname || 'ھەڤڕک'}
                        </div>
                        <div className="text-sm font-semibold text-mono-500 dark:text-mono-400 bg-white/60 dark:bg-mono-900/60 backdrop-blur-md px-3 py-0.5 rounded-md border border-mono-200 dark:border-mono-800 shadow-sm flex items-center justify-center -mt-1">
                           <span>ئاستێ {opponent.level || 1}</span>
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* MIDDLE: VS & TIMER */}
              <div className="relative z-10 flex flex-col items-center gap-2 w-full max-w-sm my-auto -translate-y-6">
                {/* Timer Without Background */}
                <div className="flex items-center justify-center">
                  <span className="text-mono-800 dark:text-mono-100 font-black font-mono text-4xl tracking-widest tabular-nums drop-shadow-md">
                    {Math.floor(MatchmakingTime / 60).toString().padStart(2, '0')}:
                    {(MatchmakingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <h2 className="text-sm font-light tracking-widest text-mono-500 dark:text-mono-400 transition-colors duration-300">
                  {multiplayerState === 'found' ? 'ئامادەبە!' : 'لێگەڕیان...'}
                </h2>
              </div>

              {/* BOTTOM: USER PODIUM */}
              <div className="relative z-10 flex flex-col items-center mb-24">
                <div className="relative flex flex-col items-center justify-center">
                  
                  {/* Minimalist Stage Base */}
                  <div className="absolute -bottom-4 flex flex-col items-center z-0 pointer-events-none">
                    <div className="w-32 h-6 bg-linear-to-b from-mono-200/50 to-mono-300/30 dark:from-mono-800/50 dark:to-mono-900/30 border border-white/40 dark:border-mono-700/40 rounded-[100%] backdrop-blur-sm" />
                    <div className="absolute top-2 w-24 h-2 bg-black/10 dark:bg-black/50 rounded-[100%] blur-md" />
                  </div>

                  <div className="w-24 h-24 relative z-10 rounded-[100%] overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.3)] border-2 border-blue-500 bg-mono-100 dark:bg-black/40">
                    <Avatar src={userAvatar} size="full" border={false} />
                  </div>
                </div>
                
                <div className="mt-12 flex flex-col items-center gap-1 relative z-20">
                  <span className="text-mono-800 dark:text-mono-100 font-black text-lg uppercase tracking-widest drop-shadow-md">
                    {userNickname || 'تۆ (YOU)'}
                  </span>
                  <div className="text-sm font-semibold text-mono-500 dark:text-mono-400 bg-white/60 dark:bg-mono-900/60 backdrop-blur-md px-3 py-0.5 rounded-md border border-mono-200 dark:border-mono-800 shadow-sm flex items-center justify-center mt-1">
                     <span>ئاستێ {level}</span>
                  </div>
                </div>
              </div>


              <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4 opacity-20">
                {['پ', 'ە', 'ی', 'ڤ', 'چ', 'ن'].map((char, i) => (
                  <Motion.span
                    key={i}
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                    className="text-4xl font-black font-rabar text-mono-900 dark:text-white"
                  >
                    {char}
                  </Motion.span>
                ))}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* 6. LEVEL UP OVERLAY */}
        <LevelUpOverlay
          isVisible={isLevelingUp}
          newLevel={level}
          isDark={isSystemDark}
          onClose={() => {
            setIsLevelingUp(false);
            setLastNotifiedLevel(level); // Sync notified level locally
            localStorage.setItem('peyvchin_last_notified_level', level.toString());
            updateInventory({ fils: 500 }); // Bonus reward
          }}
        />

      </div>
    </div>
  );
}


