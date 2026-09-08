import React, { useState, useEffect } from 'react';
import CloseButton from './CloseButton';
import { FilsIcon, DerhemIcon, DinarIcon, HintIcon, MagnetIcon, SkipIcon } from './CurrencyIcon';
import { motion as Motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import CurrencyDecrementEffect from './CurrencyDecrementEffect';
import NotificationsView from './NotificationsView';
import { toKuDigits, formatCompactNumber } from '../utils/formatters';
import ClipboardIcon from './ClipboardIcon';
import NotificationBellIcon from './NotificationBellIcon';
import { useGameStore } from '../store/gameStore';

const AnimatedCounter = ({ value }) => {
  const [internalValue, setInternalValue] = useState(value);
  const count = useMotionValue(internalValue);
  const [displayValue, setDisplayValue] = useState(formatCompactNumber(internalValue));
  const [prevPropValue, setPrevPropValue] = useState(value);

  // Derive state during render instead of in useEffect to avoid cascading renders
  if (value !== prevPropValue) {
    setPrevPropValue(value);
    if (!window.isAnimatingReward) {
      setInternalValue(value);
    }
  }

  useEffect(() => {
    const handleCoinHit = () => {
      setInternalValue(value);
    };

    window.addEventListener('reward-coin-hit', handleCoinHit);
    return () => window.removeEventListener('reward-coin-hit', handleCoinHit);
  }, [value]);

  useEffect(() => {
    const controls = animate(count, internalValue, {
      duration: 1.0,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(formatCompactNumber(Math.round(latest)));
      }
    });

    return () => controls.stop();
  }, [internalValue, count]);

  return <>{displayValue}</>;
};

const CurrencyStat = ({ value, Icon: _IconComponent, color, currency = 'fils', resetKey, _isDark = true }) => {
  return (
    <CurrencyDecrementEffect value={value} currency={currency} resetKey={resetKey}>
      <div
        id={`topbar-${currency}`}
        className={`flex flex-row items-center justify-end pr-5 xs:pr-7 sm:pr-8 md:pr-10 pl-3 xs:pl-4 h-5 md:h-6 flex-1 w-full min-w-20 xs:min-w-[96px] sm:min-w-28 max-w-48 bg-white/5 backdrop-blur-md rounded border border-white/10 shadow-sm transition-all duration-300 origin-center cursor-pointer hover:brightness-110 active:scale-95 relative`}
        onClick={() => { triggerHaptic(10, true); /* Handled by generic store routing */ }}
      >
        <div className={`absolute -left-1 md:-left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 md:w-9 md:h-9 shrink-0 flex items-center justify-center ${color} drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] z-10`}>
          <_IconComponent className="w-full h-full" />
        </div>

        <span className={`pl-5 md:pl-7 text-[12px] md:text-[15px] font-black font-heading tabular-nums leading-none pt-0.5 text-white whitespace-nowrap flex-1 text-center drop-shadow-sm`}><AnimatedCounter value={value || 0} /></span>
      </div>
    </CurrencyDecrementEffect>
  );
};

const InventoryStat = ({ value, icon, Icon, color, bg, isDark = true, type }) => {
  return (
    <div id={`topbar-${type}`} className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-2 rounded-[10px] md:rounded-[14px] ${bg || 'bg-white/5'} border border-white/5`}>
      {Icon ? (
        <Icon className="w-5 h-5 md:w-8 md:h-8 drop-shadow-md" disabled={(value || 0) <= 0} />
      ) : (
        <span className={`material-symbols-outlined text-[18px] md:text-[26px] ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      )}
      <span className={`text-[14px] md:text-[20px] font-black tabular-nums ${isDark ? 'text-white' : 'text-mono-900'}`}><AnimatedCounter value={value || 0} /></span>
    </div>
  );
};

export default function TopAppBar({
 onOpenSettings,
  currentView,
  onForfeit,
  _category = 'گشتی',
  notificationCount = 0,
  notifications = [],
  onNotificationAction,
  gameMode = 'classic',
  onPlaySound,
  _onDailyRewardClick,
  onOpenHowToPlay,
  _onHint,
  _onMagnet,
  _onSkip,
  _hintTaps = 0,
  _hintLimit = 3,
  _magnetUsedInRound = false,
  _skipsUsedInRound = 0,
  _skipLimit = 1,
  _isDailyAvailable = false,
  isDark = true
}) {
  const fils = useGameStore(s => s.fils);
  const derhem = useGameStore(s => s.derhem);
  const dinar = useGameStore(s => s.dinar);
  const magnetCount = useGameStore(s => s.magnetCount);
  const hintCount = useGameStore(s => s.hintCount);
  const skipCount = useGameStore(s => s.skipCount);

  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  const isPlaying = currentView === 'game';
  const _showStats = ['lobby', 'store', 'leaderboard', 'stats', 'dictionary'].includes(currentView);
  const _isClassic = gameMode === 'classic';

  return (
    <header
      className={`relative top-0 w-full z-100 bg-transparent pt-[env(safe-area-inset-top,0px)] transition-all duration-500 overflow-visible`}
      dir="ltr"
    >
      <div className="flex h-16 items-center justify-between px-4 xs:px-6 sm:px-12 w-full mx-auto relative gap-1 xs:gap-2 sm:gap-4">

        {/* Left Section: Close (X) or Settings / Daily Reward */}
        <div className="flex items-center justify-start shrink-0 relative">
          {isPlaying ? (
            <div className="flex items-center gap-1 relative">
              <Motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={() => { triggerHaptic(10); onOpenHowToPlay(gameMode); }}
                className="h-10 px-4 bg-[#f59e0b] shadow-[0_4px_0_#d97706] hover:brightness-110 rounded-md flex items-center justify-center gap-2 group transition-all border-none mb-1"
              >
                <span className="material-symbols-outlined text-white text-[20px] group-hover:scale-110 transition-transform">help</span>
                <span className="text-[13px] font-black font-rabar text-white uppercase mt-0.5 hidden xs:block">فێرکاری</span>
              </Motion.button>
            </div>
          ) : (
            <div className="flex items-center gap-1 relative h-full">


              {(currentView === 'leaderboard' || currentView === 'profile') && (
                <Motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => { triggerHaptic(10); onOpenSettings(); }}
                  className={`flex items-center justify-center text-mono-600 dark:text-mono-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all ${currentView === 'profile' ? 'w-15 h-15 mt-3' : 'w-12 h-12'}`}
                >
                  <span className={`material-symbols-outlined font-black ${currentView === 'profile' ? 'text-[60px]' : 'text-[28px]'}`}>settings</span>
                </Motion.button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-start flex-1 max-w-175 px-1 md:px-4 min-w-0">
          {(!isPlaying && (currentView === 'store' || currentView === 'leaderboard' || currentView === 'lobby')) && (
            <div className="flex w-full items-center justify-start gap-1.5 xs:gap-3 sm:gap-6 md:gap-8 mt-1 transition-all pl-1 md:pl-0 pr-1 xs:pr-2">
              <CurrencyStat key="store-dinar" value={dinar} Icon={DinarIcon} color="text-yellow-400" currency="dinar" resetKey={currentView} _isDark={isDark} />
              <CurrencyStat key="store-derhem" value={derhem} Icon={DerhemIcon} color="text-slate-300" currency="derhem" resetKey={currentView} _isDark={isDark} />
              <CurrencyStat key="store-fils" value={fils} Icon={FilsIcon} color="text-[#facc15]" currency="fils" resetKey={currentView} _isDark={isDark} />
            </div>
          )}
        </div>

        {/* Right Section: In-Game Info (Mode Specific) OR Global Stats + Notification */}
        <div className="flex items-center justify-end gap-1 sm:gap-3 shrink-0 relative min-w-14 md:min-w-20 pl-2">
          {isPlaying ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                  <Motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <CloseButton onClick={() => { triggerHaptic(10); onForfeit(); }} />
                  </Motion.div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Helpers Group (Lobby/Store/Leaderboard) */}
              {(currentView === 'store' || currentView === 'lobby' || currentView === 'leaderboard') && (
                <div className="hidden xs:flex items-center gap-1.5 px-2 py-1 bg-white/80 dark:bg-white/5 rounded-xl border border-mono-200/50 dark:border-white/5 backdrop-blur-md shadow-sm">
                  <InventoryStat value={hintCount} Icon={HintIcon} bg="bg-transparent" isDark={isDark} type="hint" />
                  <InventoryStat value={magnetCount} Icon={MagnetIcon} bg="bg-transparent" isDark={isDark} type="magnet" />
                  <InventoryStat value={skipCount} Icon={SkipIcon} bg="bg-transparent" isDark={isDark} type="skip" />
                </div>
              )}


              {/* Notification Button (Lobby Only) */}
              {currentView === 'lobby' && (
                <div className="relative ml-2">
                  <Motion.button
                    animate={notificationCount > 0 && !window.__hasViewedSystemNotifs ? {
                      scale: [1, 1.1, 1],
                      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                    } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      triggerHaptic(10);
                      if (onPlaySound) onPlaySound();
                      setIsNotifsOpen(!isNotifsOpen);
                      window.__hasViewedSystemNotifs = true;
                    }}
                    className={`w-14 h-14 md:w-20 md:h-20 flex items-center justify-center transition-all relative group cursor-pointer hover:scale-105 active:scale-95 ${isNotifsOpen || (notificationCount > 0 && !window.__hasViewedSystemNotifs) ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-amber-500/80 hover:text-amber-400 drop-shadow-md'}`}
                  >
                    <NotificationBellIcon className="w-8 h-8 md:w-10.5 md:h-10.5" isRinging={notificationCount > 0 && !window.__hasViewedSystemNotifs} />
                    {notificationCount > 0 && !window.__hasViewedSystemNotifs && (
                      <Motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-0 md:top-2 right-0 md:right-2 w-6 h-6 md:w-8 md:h-8 bg-red-500 rounded-full border-2 border-mono-white dark:border-mono-950 flex items-center justify-center pointer-events-none"
                      >
                        <span className="text-[11px] md:text-[14px] font-black text-white leading-none">{toKuDigits(notificationCount)}</span>
                      </Motion.div>
                    )}
                  </Motion.button>

                  <AnimatePresence>
                    {isNotifsOpen && (
                      <NotificationsView
                        notifications={notifications}
                        onClose={() => setIsNotifsOpen(false)}
                        onAction={(item) => {
                          setIsNotifsOpen(false);
                          onNotificationAction(item);
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </header>
  );
}

