import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AVATARS, DEFAULT_AVATAR } from '../data/avatars';
import Avatar from './Avatar';
import { motion as Motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import PublicProfileModal from './PublicProfileModal';
import { FilsIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits } from '../utils/formatters';
import { useUser } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useAudio } from '../context/AudioContext';
import { getLevelFromXP, getLevelTier } from '../utils/progression';
import FloatingLetterBackground from './FloatingLetterBackground';

export default function LeaderboardView({ onOpenChat }) {
  const {
    user,
    userNickname,
    userAvatar,
    _countryCode,
    _isInKurdistan,
    lastProfileUpdate,
    handleToggleBlock: toggleBlockInContext,
    loadingAuth
  } = useUser();

  const {
    currentXP: userXP,
    level: _userLevel,
    fils: _userFils,
    useGameLoading: _useGameLoading
  } = useGame();

  const userId = user?.id;
  const { playTabSound } = useAudio();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [_userRank, setUserRank] = useState('--');
  const [view, setView] = useState('global');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const bgRef = useRef(null);

  const handleBackgroundClick = (e) => {
    // Only trigger if clicking the direct container to avoid item capture
    if (e.target === e.currentTarget || e.target.classList.contains('bg-trigger-zone')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      bgRef.current?.pulse(x, y);
    }
  };

  const handleToggleBlock = async (currentStatus) => {
    if (!selectedPlayer || !userId || userId === 'undefined') return;
    const success = await toggleBlockInContext(selectedPlayer.id, currentStatus);
    if (success) {
      if (!currentStatus) alert("یاریزان ھاتە بلۆککرن!");
      else alert("بلۆک ھاتە لابرن!");
      setSelectedPlayer(null);
    }
  };

  const fetchData = useCallback(async () => {
    // 1. HARDENED GUARD: Reject invalid, undefined, or loading states
    if (loadingAuth || !userId || userId === 'undefined' || userId.length < 5) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let leaderData = [];

      if (view === 'friends') {
        // 1. Get all accepted friendships
        const { data: friendships, error: fError } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted');

        if (fError) throw fError;

        // 2. Map to a list of IDs including current user
        const friendIds = [userId];
        friendships.forEach(f => {
          friendIds.push(f.user_id);
          friendIds.push(f.friend_id);
        });
        const uniqueIds = [...new Set(friendIds)];

        // 3. Fetch profiles for those IDs
        const { data, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniqueIds)
          .order('xp', { ascending: false });

        if (pError) throw pError;
        leaderData = data || [];
      } else {
        // GLOBAL VIEW - Order strictly by XP (Ground Truth)
        const { data, error: leaderError } = await supabase
          .from('profiles')
          .select('*')
          .order('xp', { ascending: false })
          .limit(20);

        if (leaderError) throw leaderError;
        leaderData = data || [];
      }

      setLeaders(leaderData);

      // Rank calculation: Count users with more XP
      if (typeof userXP === 'number' && !isNaN(userXP)) {
        const { count, error: rankError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('xp', userXP);

        if (!rankError) setUserRank(count + 1);
      }
    } catch (err) {
      console.warn("Leaderboard fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loadingAuth, userId, view, userXP]);

  useEffect(() => {
    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [view, userId, fetchData]);


  return (
    <div
      onClick={handleBackgroundClick}
      className="w-full max-w-full px-4 md:px-6 pb-56 h-full relative animate-in fade-in duration-700 bg-mono-50 dark:bg-mono-900 overflow-x-hidden pt-[calc(env(safe-area-inset-top,24px)+32px)] md:pt-20 text-right bg-trigger-zone transition-colors"
    >
      <FloatingLetterBackground ref={bgRef} />

      <div className="relative z-10">
        <div className="flex flex-col items-center mb-10 max-w-md mx-auto text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-2.5 drop-shadow-lg">leaderboard</span>
          <h2 className="text-5xl font-black font-rabar  italic uppercase text-mono-900 dark:text-mono-300 transition-colors duration-500">رێزبەندی</h2>
        </div>

        {/* Top Tab Swapper - Synced Card Style */}
        <div className="flex p-1 rounded-md border mb-10 w-full max-w-xs mx-auto relative z-30 shadow-sm transition-all overflow-hidden bg-mono-100 dark:bg-mono-950 border-mono-200 dark:border-mono-800 duration-300">
          {['global', 'friends'].map((tab) => {
            const isActive = view === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  triggerHaptic(10);
                  playTabSound();
                  setView(tab);
                }}
                className={`flex-1 py-2.5 px-4 rounded-md font-black text-sm transition-all duration-300 relative z-10 ${isActive
                  ? 'text-mono-50 dark:text-mono-50'
                  : 'text-mono-500 hover:text-mono-900 dark:text-mono-400 dark:hover:text-mono-100'
                  }`}
              >
                {isActive && (
                  <Motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-mono-900 dark:bg-mono-800 rounded-sm shadow-sm"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
                <span className="relative z-20 uppercase tracking-normal font-rabar">
                  {tab === 'global' ? 'جیھانی' : 'ھەڤال'}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {!loading ? (
            <Motion.div
              key={view}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05, delayChildren: 0.05 }
                },
                exit: { opacity: 0, transition: { duration: 0.2 } }
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-3 px-1 md:px-0 max-w-2xl mx-auto pb-40"
            >
              {leaders.map((player, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const isMe = userId && (player.id === userId);
                const effectiveAvatar = isMe ? userAvatar : (player.avatar_url || 'default');
                const effectiveNickname = isMe ? userNickname : player.nickname;
                const effectiveXP = isMe ? userXP : player.xp;

                return (
                  <Motion.div
                    key={player.id}
                    variants={{
                      hidden: { opacity: 0, y: 15, scale: 0.98 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                      exit: { opacity: 0, scale: 0.98 }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { triggerHaptic(10); setSelectedPlayer({ ...player, avatar_url: effectiveAvatar, nickname: effectiveNickname, xp: effectiveXP }); }}
                    className={`flex flex-row items-center justify-between p-2.5 px-5 rounded-md border relative transition-all cursor-pointer shadow-sm bg-mono-white dark:bg-mono-800 border-mono-200 dark:border-mono-700 duration-300`}
                    style={{
                      zIndex: isTop3 ? 50 : 1 // Ensure top 3 cards have higher z-index for floating crowns
                    }}
                  >

                    {/* Sleek Metallic Rank Number (MINIMALIST) */}
                    <div className="flex items-center justify-center w-10 shrink-0 z-10 relative">
                      {rank <= 3 && (
                        <Motion.div
                          initial={{ y: 0, rotate: rank === 1 ? -5 : rank === 2 ? 5 : 0 }}
                          animate={{
                            y: [-2, 2, -2],
                            rotate: rank === 1 ? [-5, 5, -5] : rank === 2 ? [5, -5, 5] : [-3, 3, -3]
                          }}
                          transition={{ repeat: Infinity, duration: rank === 1 ? 4 : rank === 2 ? 4.5 : 5, ease: "easeInOut" }}
                          className={`absolute -top-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none`}
                        >
                          <div className="relative w-9 h-9 flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]">
                              <defs>
                                <linearGradient id={`refGold-${player.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#FFD54F" />
                                  <stop offset="50%" stopColor="#FFC107" />
                                  <stop offset="100%" stopColor="#FFA000" />
                                </linearGradient>
                                <linearGradient id={`refSilver-${player.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#F8FAFC" />
                                  <stop offset="50%" stopColor="#CBD5E1" />
                                  <stop offset="100%" stopColor="#94A3B8" />
                                </linearGradient>
                                <linearGradient id={`refBronze-${player.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#FFCC80" />
                                  <stop offset="50%" stopColor="#FB8C00" />
                                  <stop offset="100%" stopColor="#E65100" />
                                </linearGradient>
                              </defs>

                              {/* Dual-Band Base */}
                              <path
                                d="M15 85 Q50 90 85 85 L85 75 Q50 80 15 75 Z"
                                fill={rank === 1 ? "#FF8F00" : rank === 2 ? "#475569" : "#BF360C"}
                                stroke="#3E2723" strokeWidth="2"
                              />
                              <path
                                d="M15 75 Q50 80 85 75 L85 68 Q50 73 15 68 Z"
                                fill={rank === 1 ? `url(#refGold-${player.id})` : rank === 2 ? `url(#refSilver-${player.id})` : `url(#refBronze-${player.id})`}
                                stroke="#3E2723" strokeWidth="2"
                              />

                              {/* 5-Point Crown Body (matching reference shape) */}
                              <path
                                d="M15 68 Q50 73 85 68 L95 40 L75 55 L50 20 L25 55 L5 40 Z"
                                fill={rank === 1 ? `url(#refGold-${player.id})` : rank === 2 ? `url(#refSilver-${player.id})` : `url(#refBronze-${player.id})`}
                                stroke="#3E2723" strokeWidth="2"
                              />

                              {/* Central Diamond Gem (Purple) with Shine Animation */}
                              <Motion.path
                                d="M50 45 L58 55 L50 65 L42 55 Z"
                                fill={rank === 1 ? "#7E57C2" : rank === 2 ? "#3B82F6" : "#EF4444"}
                                stroke="#3E2723" strokeWidth="1.5"
                                animate={{
                                  filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                                }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              />

                              {/* Glowing Highlight for Diamond */}
                              <Motion.path
                                d="M50 48 L54 55 L50 62 L46 55 Z"
                                fill="white" fillOpacity="0.4"
                                animate={{ opacity: [0.2, 0.6, 0.2] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              />

                              {/* 5 Beads on Points (Teal) with Shine */}
                              {[
                                { cx: 5, cy: 40, r: 5 },
                                { cx: 25, cy: 55, r: 4 },
                                { cx: 50, cy: 20, r: 6 },
                                { cx: 75, cy: 55, r: 4 },
                                { cx: 95, cy: 40, r: 5 }
                              ].map((b, i) => (
                                <g key={i}>
                                  <Motion.circle
                                    cx={b.cx} cy={b.cy} r={b.r}
                                    fill="#4DD0E1" stroke="#3E2723" strokeWidth="1.5"
                                    animate={{ filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                                  />
                                  <Motion.circle
                                    cx={b.cx - b.r / 3} cy={b.cy - b.r / 3} r={b.r / 4}
                                    fill="white" fillOpacity="0.6"
                                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                                  />
                                </g>
                              ))}

                              {/* Small Decorative Beads on Body */}
                              <circle cx="30" cy="62" r="2.5" fill="#4DD0E1" stroke="#3E2723" strokeWidth="1" />
                              <circle cx="40" cy="64" r="2.5" fill="#4DD0E1" stroke="#3E2723" strokeWidth="1" />
                              <circle cx="60" cy="64" r="2.5" fill="#4DD0E1" stroke="#3E2723" strokeWidth="1" />
                              <circle cx="70" cy="62" r="2.5" fill="#4DD0E1" stroke="#3E2723" strokeWidth="1" />

                              {/* Highlight Reflections */}
                              <path d="M50 25 L50 40" stroke="white" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
                            </svg>
                          </div>
                        </Motion.div>
                      )}
                      <span className={`text-2xl font-black italic tracking-normal relative z-10 ${rank === 1 ? 'text-[#92400e]' :
                        rank === 2 ? 'text-mono-500 dark:text-mono-300' :
                          rank === 3 ? 'text-[#7c2d12]' :
                            'text-mono-900 dark:text-mono-50'
                        }`}>
                        {toKuDigits(rank)}
                      </span>
                    </div>

                    {/* Avatar Section */}
                    <div className="flex items-center gap-3 z-10 px-1">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        {/* XP Progress Ring */}
                        <div className="absolute inset-[-4px] z-0">
                          <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
                             <circle cx="50" cy="50" r="44" fill="none" className="stroke-mono-200/20 dark:stroke-white/5" strokeWidth="4" />
                             <Motion.circle
                                cx="50"
                                cy="50"
                                r="44"
                                fill="none"
                                stroke={getLevelTier(getLevelFromXP(effectiveXP)).stop1}
                                strokeWidth="8"
                                strokeLinecap="butt"
                                strokeDasharray="276.46"
                                initial={{ strokeDashoffset: 276.46 }}
                                animate={{ 
                                   strokeDashoffset: 276.46 - (276.46 * (player.xp_progress || 0.7)), // Fallback progress for visual
                                   filter: getLevelTier(getLevelFromXP(effectiveXP)).isLegendary ? `drop-shadow(0 0 5px ${getLevelTier(getLevelFromXP(effectiveXP)).stop1})` : "none"
                                }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                             />
                          </svg>
                        </div>

                        {/* Clean Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-mono-100 dark:bg-white/5 shrink-0 relative z-10 border border-mono-200 dark:border-white/10">
                          <Avatar
                            src={effectiveAvatar}
                            updatedAt={isMe ? lastProfileUpdate : player.updated_at}
                            size="full"
                            className="rounded-full object-cover w-full h-full"
                            border={false}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Info and Name (CENTERED) */}
                    <div className="flex-1 flex justify-center items-center gap-2 min-w-0 mx-2">
                      <span className="font-black text-mono-900 dark:text-mono-50 text-sm tracking-normal uppercase truncate leading-none">{effectiveNickname}</span>
                    </div>

                    {/* Shield (RIGHT SIDE) */}
                    <div className="flex items-center shrink-0 pr-1">
                      <div className="relative w-10 h-12 flex items-center justify-center shrink-0">
                        <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill={`url(#medalGradient-${player.id})`} stroke="white" strokeWidth="4" strokeOpacity="0.2" />
                          <defs>
                            <linearGradient id={`medalGradient-${player.id}`} x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#FFD700" />
                              <stop offset="1" stopColor="#B8860B" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="relative z-10 flex flex-col items-center justify-center -mt-1 w-full scale-[0.85]">
                          <span className="text-[7px] font-black text-mono-900/40 dark:text-mono-950/40 uppercase leading-none mb-0.5">ئاست</span>
                          <span className="text-xl font-black text-mono-900 dark:text-mono-50 leading-none drop-shadow-sm">{toKuDigits(getLevelFromXP(effectiveXP))}</span>
                        </div>
                      </div>
                    </div>
                  </Motion.div>
                );
              })}
            </Motion.div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-48 gap-4">
              <span className="material-symbols-outlined text-4xl text-red-500/50">cloud_off</span>
              <span className="font-black text-mono-400 font-rabar">کێشەیەک د پەیوەندیێ دا هەیە</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-48 gap-4">
              <div className="w-10 h-10 border-2 border-mono-200 dark:border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-black text-mono-400 dark:text-mono-700 uppercase text-[10px] tracking-widest">LOADING...</span>
            </div>
          )}
        </AnimatePresence>
      </div>

      <PublicProfileModal
        profile={selectedPlayer}
        currentUser={{ id: userId }}
        onClose={() => setSelectedPlayer(null)}
        onToggleBlock={handleToggleBlock}
        onOpenChat={onOpenChat}
      />
    </div>
  );
}


