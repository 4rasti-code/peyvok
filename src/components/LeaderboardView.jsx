import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AVATARS, DEFAULT_AVATAR } from '../data/avatars';
import Avatar from './Avatar';
import FlagBadge from './FlagBadge';
import { motion as Motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import PublicProfileModal from './PublicProfileModal';
import { FilsIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits } from '../utils/formatters';
import { useUser } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { useGameStore } from '../store/gameStore';
import { useAudio } from '../context/AudioContext';
import { getLevelFromXP, getLevelTier, getLevelData } from '../utils/progression';
import { NAME_STYLES } from '../constants/nameStyles';
import PremiumName from './PremiumName';
import { NAME_FONTS } from '../constants/nameFonts';
import { BUNDLES } from '../constants/bundles';


export default function LeaderboardView({ onOpenChat, isVisible }) {
 const {
 user,
 userNickname,
 userAvatar,
 countryCode,
 isInKurdistan,
 lastProfileUpdate,
 handleToggleBlock: toggleBlockInContext,
 loadingAuth,
 equippedNameStyle,
 equippedFont,
 equippedBundle
 } = useUser();

 const { onlineCount, onlineUsers } = usePresence();

 const userXP = useGameStore(s => s.currentXP);
   const _userFils = useGameStore(s => s.fils);
   const _userLevel = getLevelFromXP(userXP);
   const _useGameLoading = false; // Zustand is synchronous

 const userId = user?.id;
 const { playTabSound } = useAudio();
 const [leaders, setLeaders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [loadingMore, setLoadingMore] = useState(false);
 const [error, setError] = useState(null);
 const [view, setView] = useState('daily');
 const [selectedPlayer, setSelectedPlayer] = useState(null);

 // Daily isolated states
 const [dailyLeaders, setDailyLeaders] = useState([]);
 const [loadingDaily, setLoadingDaily] = useState(true);
 const [loadingMoreDaily, setLoadingMoreDaily] = useState(false);
 const [hasMoreDaily, setHasMoreDaily] = useState(true);
 const dailyPageRef = useRef(0);
 const [showScrollTop, setShowScrollTop] = useState(false);

 // Caching for instant load
 const cacheRef = useRef({ global: null, friends: null });

 // Pagination states
 const pageRef = useRef(0);
 const [hasMore, setHasMore] = useState(true);
 const [totalPlayersCount, setTotalPlayersCount] = useState(0);
 const [trueRank, setTrueRank] = useState(null);
 const ITEMS_PER_PAGE = 20;

 const bgRef = useRef(null);
 const fetchTimeoutRef = useRef(null);
 const scrollContainerRef = useRef(null);

 const handleScroll = (e) => {
 setShowScrollTop(e.target.scrollTop > 400);
 };

 useEffect(() => {
 if (isVisible) {
 setView('daily');
 }
 }, [isVisible]);

 const scrollToTop = () => {
 triggerHaptic(10);
 if (scrollContainerRef.current) {
 scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
 }
 };

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

 const fetchDailyData = useCallback(async (isLoadMore = false) => {
 if (loadingAuth || !userId || userId === 'undefined' || userId.length < 5) {
 if (!isLoadMore) setLoadingDaily(false);
 return;
 }
 
 if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

 return new Promise((resolve) => {
 fetchTimeoutRef.current = setTimeout(async () => {
 const currentPage = isLoadMore ? dailyPageRef.current + 1 : 0;

 if (!isLoadMore) {
 setLoadingDaily(true);
 setError(null);
 } else {
 setLoadingMoreDaily(true);
 }

 try {
 // Kurdistan is UTC+3. Get the date string offset by 3 hours.
 const kurdistanTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
 const todayISO = kurdistanTime.toISOString().split('T')[0];
 const { data, error: leaderError } = await supabase
 .from('profiles')
 .select('*')
 .neq('nickname', 'Admin_4rasti')
 .neq('nickname', 'ADMIN_PEYVOK')
 .neq('nickname', 'پەیڤۆک')
 .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
 .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4')
 .eq('daily_xp_date', todayISO)
 .gt('daily_xp', 0)
 .order('daily_xp', { ascending: false })
 .order('updated_at', { ascending: true })
 .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

 if (leaderError) throw leaderError;
 const leaderData = data || [];

 if (isLoadMore) {
 setDailyLeaders(prev => {
 const existingIds = new Set(prev.map(p => p.id));
 const newItems = leaderData.filter(p => !existingIds.has(p.id));
 return [...prev, ...newItems];
 });
 } else {
 setDailyLeaders(leaderData);
 }

 dailyPageRef.current = currentPage;
 setHasMoreDaily(leaderData.length === ITEMS_PER_PAGE);
 } catch (err) {
 console.warn("Daily Leaderboard fetch error:", err);
 setError(true);
 } finally {
 if (!isLoadMore) setLoadingDaily(false);
 setLoadingMoreDaily(false);
 resolve();
 }
 }, 300);
 });
 }, [loadingAuth, userId]);

 const fetchData = useCallback(async (isLoadMore = false) => {
 // 1. HARDENED GUARD: Reject invalid, undefined, or loading states
 if (loadingAuth || !userId || userId === 'undefined' || userId.length < 5) {
 if (!isLoadMore) setLoading(false);
 return;
 }
 
 if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

 return new Promise((resolve) => {
 fetchTimeoutRef.current = setTimeout(async () => {
 const currentPage = isLoadMore ? pageRef.current + 1 : 0;

 if (!isLoadMore) {
 if (!cacheRef.current[view]) {
 setLoading(true);
 } else {
 setLeaders(cacheRef.current[view]);
 }
 setError(null);
 } else {
 setLoadingMore(true);
 }

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
 .order('xp', { ascending: false })
 .order('updated_at', { ascending: true });

 if (pError) throw pError;
 leaderData = data || [];
 // Apply local pagination for friends since we fetched them all
 const startIdx = currentPage * ITEMS_PER_PAGE;
 const paginatedFriends = leaderData.slice(startIdx, startIdx + ITEMS_PER_PAGE);
 leaderData = paginatedFriends;
 } else {
 // GLOBAL VIEW - Order strictly by XP (Ground Truth)
 const { data, error: leaderError } = await supabase
 .from('profiles')
 .select('*')
 .neq('nickname', 'Admin_4rasti')
 .neq('nickname', 'ADMIN_PEYVOK')
 .neq('nickname', 'پەیڤۆک')
 .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
 .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4')
 .order('xp', { ascending: false })
 .order('updated_at', { ascending: true })
 .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

 if (leaderError) throw leaderError;
 leaderData = data || [];
 }

 if (isLoadMore) {
 setLeaders(prev => {
 // Prevent duplicates by checking IDs
 const existingIds = new Set(prev.map(p => p.id));
 const newItems = leaderData.filter(p => !existingIds.has(p.id));
 const next = [...prev, ...newItems];
 cacheRef.current[view] = next;
 return next;
 });
 } else {
 setLeaders(leaderData);
 cacheRef.current[view] = leaderData;
 }

 pageRef.current = currentPage;
 setHasMore(leaderData.length === ITEMS_PER_PAGE);

 // Rank is now calculated asynchronously by GameContext and exposed globally
 } catch (err) {
 console.warn("Leaderboard fetch error:", err);
 setError(true);
 } finally {
 if (!isLoadMore) setLoading(false);
 setLoadingMore(false);
 resolve();
 }
 }, 300);
 });
 }, [loadingAuth, userId, view]);

 useEffect(() => {
 // When view changes, reset to page 0
 if (view === 'daily') {
 fetchDailyData(false);
 } else {
 fetchData(false);
 }

 const handleFocus = () => {
 if (view === 'daily') fetchDailyData(false);
 else fetchData(false);
 };
 window.addEventListener('focus', handleFocus);

 return () => {
 window.removeEventListener('focus', handleFocus);
 };
 }, [view, userId, fetchData, fetchDailyData]);

 // Real-time XP updates
 useEffect(() => {
 const profilesSub = supabase.channel('public:profiles:leaderboard')
 .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
 const updatedProfile = payload.new;
 if (!updatedProfile) return;
 
 if (typeof updatedProfile.xp !== 'undefined') {
 setLeaders(prev => {
 const idx = prev.findIndex(p => p.id === updatedProfile.id);
 if (idx === -1) return prev; // Not currently loaded in the list
 
 let next = [...prev];
 // Only update if xp or other relevant stats changed
 if (next[idx].xp === updatedProfile.xp) return prev;
 
 next[idx] = { ...next[idx], ...updatedProfile };
 next.sort((a, b) => b.xp - a.xp); // Re-sort descending by XP
 
 cacheRef.current[view] = next; // Sync cache
 return next;
 });
 }

 if (typeof updatedProfile.daily_xp !== 'undefined') {
 setDailyLeaders(prev => {
 const idx = prev.findIndex(p => p.id === updatedProfile.id);
 if (idx === -1) return prev; 
 
 let next = [...prev];
 if (next[idx].daily_xp === updatedProfile.daily_xp) return prev;
 
 next[idx] = { ...next[idx], ...updatedProfile };
 next.sort((a, b) => b.daily_xp - a.daily_xp); 
 return next;
 });
 }
 }).subscribe((status, err) => {
 if (err) console.warn('profiles realtime subscription error:', err);
 });
 
 return () => {
 supabase.removeChannel(profilesSub);
 };
 }, [view]);

 // Track Total Players
 useEffect(() => {
 let isMounted = true;
 const fetchStats = async () => {
 const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
 .neq('nickname', 'Admin_4rasti')
 .neq('nickname', 'ADMIN_PEYVOK')
 .neq('nickname', 'پەیڤۆک')
 .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
 .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4');
 if (isMounted && count !== null) setTotalPlayersCount(count);
 };
 fetchStats();

 return () => {
 isMounted = false;
 };
 }, []);

 // Compute absolute true rank for sticky bar
 useEffect(() => {
 // 1. Try to find in current page first for instant update
 if (view === 'global') {
 const index = leaders.findIndex(l => l.id === userId);
 if (index !== -1) {
 setTrueRank(index + 1);
 return; // We found it locally, no need for DB
 }
 }
 }, [leaders, userId, view]);

 useEffect(() => {
 let isMounted = true;
 const fetchTrueRank = async () => {
 // If we already found them in the loaded global list, don't spam the DB
 const localIndex = cacheRef.current['global']?.findIndex(l => l.id === userId);
 if (localIndex !== undefined && localIndex !== -1) {
 if (isMounted) setTrueRank(localIndex + 1);
 return;
 }

 // 2. Fetch from DB as fallback
 if (userXP !== undefined && view === 'global') {
 try {
 // Query 1: strictly greater XP
 const { count: countGreater } = await supabase
 .from('profiles')
 .select('id', { count: 'exact', head: true })
 .gt('xp', userXP)
 .neq('nickname', 'Admin_4rasti')
 .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
 .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4');
 
 // Query 2: same XP but older (better) updated_at
 let countSame = 0;
 if (lastProfileUpdate) {
 let formattedDate = lastProfileUpdate;
 try {
 formattedDate = new Date(lastProfileUpdate).toISOString();
 } catch(_e) {
 console.warn("Invalid date format", lastProfileUpdate);
 }
 const { count } = await supabase
 .from('profiles')
 .select('id', { count: 'exact', head: true })
 .eq('xp', userXP)
 .lt('updated_at', formattedDate)
 .neq('nickname', 'Admin_4rasti')
 .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
 .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4');
 countSame = count || 0;
 }

 if (isMounted && countGreater !== null) {
 setTrueRank(countGreater + countSame + 1);
 }
 } catch (e) {
 console.warn("Error fetching true rank", e);
 }
 }
 };
 
 if (userId) fetchTrueRank();
 
 return () => { isMounted = false; };
 }, [userId, userXP, lastProfileUpdate, view]);


 return (
 <div
 onClick={handleBackgroundClick}
 className="w-full max-w-full relative animate-in fade-in duration-700 bg-transparent overflow-hidden text-right transition-colors flex flex-col"
 style={{ height: '100dvh' }}
 >


 <div className="relative z-10 flex flex-col h-full w-full">
 {/* FIXED HEADER CONTAINER */}
 <div 
 className="shrink-0 bg-transparent md:pt-4 px-0 shadow-sm transition-colors relative z-50"
 style={{ paddingTop: 'calc(env(safe-area-inset-top, 8px) + 8px)' }}
 >
 {/* GAP FILLER: Extends background infinitely upwards to cover iOS notch or scroll bounce gaps */}
 <div className="absolute bottom-full -left-12.5 -right-12.5 h-125 bg-transparent pointer-events-none" />
 
 <div className="flex flex-col items-center max-w-md mx-auto text-center relative py-4 mb-6 mt-2">
 {/* Ambient Golden Glow Behind the Podium */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-[50px] z-10 pointer-events-none" />
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-300/10 rounded-full blur-[30px] z-10 pointer-events-none" />
 
 <div className="z-30 relative drop-shadow-[0_15px_25px_rgba(0,0,0,0.4)] animate-[float_6s_ease-in-out_infinite]">
 <img 
 src="/assets/leaderboard_icon-01.svg" 
 alt="Leaderboard Crown" 
 className="w-60 h-auto object-contain max-h-56 relative z-20"
 />
 </div>
 </div>

 {/* LEADERBOARD FOLDER UI */}
 <div>
 <div className="w-full relative">
 
 {/* Main Tabs (Global / Daily) */}
 <div className="flex items-end gap-1 relative z-20 px-4 md:px-6 max-w-2xl mx-auto w-full h-10.5 pt-0.5">
 {['daily', 'general'].map((tab) => {
 const isActive = (tab === 'general' && (view === 'global' || view === 'friends')) || (tab === 'daily' && view === 'daily');
 
 return (
 <button
 key={tab}
 onClick={() => {
 triggerHaptic(10);
 playTabSound();
 if (tab === 'daily') {
 setView('daily');
 } else {
 if (view !== 'friends') {
 setView('global');
 }
 }
 }}
 className={`w-1/2 font-black uppercase transition-all duration-200 outline-none tab-clash flex items-center justify-center
 ${isActive 
 ? 'tab-clash-active text-white h-full z-30 after:content-[\'\'] after:absolute after:-bottom-0.75 after:left-0 after:right-0 after:h-1.5 after:bg-[#3b82f6] after:z-10' 
 : 'tab-clash-inactive text-white/80 h-9 z-10 opacity-90 hover:opacity-100 cursor-pointer'
 }
 `}
 >
 <span className={`relative z-20 font-rabar tracking-normal ${isActive ? 'drop-shadow-md' : 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'}`}>
 {tab === 'general' ? 'گشتی' : 'ئەڤرۆ'}
 </span>
 </button>
 );
 })}
 </div>
 
 {/* Connecting Base wrapping the Sub Tabs */}
 <div className="w-full bg-[#3b82f6] relative z-10 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15),0_16px_32px_rgba(0,0,0,0.4)] pb-4 rounded-none border-2 border-b-4 border-black">
 <div className="h-3 w-full" />
 
 {/* Sub-tabs / Indicator Area (Fixed height prevents layout jumping) */}
 <div className="relative h-9.5 w-full">
 <AnimatePresence mode="wait">
 {(view === 'global' || view === 'friends') ? (
 <Motion.div 
 key="subtabs"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="absolute inset-0 flex justify-center items-start px-4 w-full"
 >
 <div className="flex items-center justify-center gap-3 w-full relative z-10 h-full px-4">
 {['global', 'friends'].map((subTab) => {
 const isSubActive = view === subTab;
 return (
 <button
 key={subTab}
 onClick={() => {
 triggerHaptic(10);
 playTabSound();
 setView(subTab);
 }}
 className={`h-8 px-6 sm:px-8 font-black uppercase tracking-normal font-rabar text-[11px] sm:text-[12px] transition-all duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 isSubActive
 ? 'btn-clash-sm-blue text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-20'
 : 'btn-clash-sm-slate text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${isSubActive ? 'drop-shadow-md' : ''}`}>
 {subTab === 'global' ? 'جیھانی' : 'ھەڤال'}
 </span>
 </button>
 );
 })}
 </div>
 </Motion.div>
 ) : view === 'daily' ? (
 <Motion.div 
 key="daily-indicator"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="absolute inset-0 flex justify-center items-start px-4 w-full"
 >
 <div className="flex items-center justify-center w-full pt-2">
 <span 
 className="text-[18px] sm:text-[20px] font-black text-white font-rabar tracking-normal relative drop-shadow-md"
 >
 ئەڤرۆ ببە کەسێ ئێکێ!
 </span>
 </div>
 </Motion.div>
 ) : null}
 </AnimatePresence>
 </div>
 </div>
 </div>
 </div>

 {/* Live Stats - 3D Badges */}
 <div className="flex items-center justify-center gap-3 px-4 mt-4 pb-2 relative z-30 w-full max-w-sm mx-auto" dir="rtl">
 
 {/* Online Badge */}
 <div className="btn-clash-sm btn-clash-sm-slate flex items-center justify-center h-7 px-3 gap-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.3)] scale-95 opacity-95">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
 </span>
 <span className="text-[11px] font-bold text-white/80 font-rabar pt-0.5 whitespace-nowrap drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">ئۆنڵاین:</span>
 <span className="text-[12px] font-black text-white tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{toKuDigits(onlineCount)}</span>
 </div>
 
 {/* Total Badge */}
 <div className="btn-clash-sm btn-clash-sm-slate flex items-center justify-center h-7 px-3 gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.3)] scale-95 opacity-95">
 <span className="material-symbols-outlined text-[14px] text-white/70">group</span>
 <span className="text-[11px] font-bold text-white/80 font-rabar pt-0.5 whitespace-nowrap drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">هەمی:</span>
 <span className="text-[12px] font-black text-white tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{totalPlayersCount > 0 ? toKuDigits(totalPlayersCount) : '-'}</span>
 </div>
 
 </div>
 </div> {/* END FIXED HEADER */}

 {/* SCROLLABLE LIST CONTAINER */}
 <div 
 ref={scrollContainerRef}
 onScroll={handleScroll}
 className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 pb-24 relative z-10"
 style={{
 maskImage: 'linear-gradient(to bottom, transparent 0%, black 24px, black 100%)',
 WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 24px, black 100%)'
 }}
 >
 <div className="pt-6">
 <AnimatePresence mode="wait">
 {(view === 'daily' ? loadingDaily : loading) ? (
 <div className="flex flex-col items-center justify-center py-48 gap-4">
 <div className="w-10 h-10 border-2 border-mono-200 dark:border-primary border-t-transparent rounded-full animate-spin"></div>
 <span className="font-black text-mono-400 dark:text-mono-700 uppercase text-[10px] tracking-widest">LOADING...</span>
 </div>
 ) : error ? (
 <div className="flex flex-col items-center justify-center py-48 gap-4">
 <span className="material-symbols-outlined text-4xl text-red-500/50">cloud_off</span>
 <span className="font-black text-mono-400 font-rabar">کێشەیەک د پەیوەندیێ دا هەیە</span>
 </div>
 ) : (
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
 className="space-y-1.5 px-1 md:px-0 max-w-2xl mx-auto"
 >
 {(view === 'daily' ? dailyLeaders : leaders).map((player, index) => {
 // Sequential Ranking based on the list index (matches exact spot)
 // Since pagination uses ITEMS_PER_PAGE, we calculate absolute rank
 let rank = (pageRef.current * ITEMS_PER_PAGE) + index + 1;
 rank = index + 1;
 
 const isTop3 = rank <= 3;
 const isMe = userId && (player.id === userId);
 const effectiveAvatar = isMe ? userAvatar : (player.avatar_url || 'default');
 const effectiveNickname = isMe ? userNickname : player.nickname;
 const effectiveNameStyle = isMe ? (equippedNameStyle || 'default') : (player.equipped_name_style || 'default');
 const styleObj = NAME_STYLES[effectiveNameStyle] || NAME_STYLES['default'];
 const effectiveFontId = isMe ? (equippedFont || 'default') : (player.equipped_font || 'default');
 const fontObj = NAME_FONTS[effectiveFontId] || NAME_FONTS['default-ku'];
 const effectiveBundleId = isMe ? (equippedBundle || 'default') : (player.equipped_bundle || 'default');
 const bundleObj = BUNDLES[effectiveBundleId] || BUNDLES['default'];
 const effectiveXP = view === 'daily' ? (player.daily_xp || 0) : (isMe ? userXP : player.xp);
 const progressDecimal = getLevelData(effectiveXP).progressPercent / 100;
 const effectiveCountryCode = isMe ? countryCode : player.country_code;
 const effectiveIsInKurdistan = isMe ? isInKurdistan : player.is_kurdistan;
 
 const nameLen = Math.max(effectiveNickname?.length || 1, 1);
 
 // Specific penalty for naturally wide/fat fonts so they don't overlap
 const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
 const isWideFont = wideFonts.includes(effectiveFontId);
 const baselineLen = isWideFont ? 5.5 : 8.5;
 
 // Continuous scaling formula: if length > baselineLen, scale down proportionally.
 const scaleFactor = Math.min(1, baselineLen / nameLen);
 
 const maxPx = bundleObj.id !== 'default' ? 24 : 22;
 const minPx = bundleObj.id !== 'default' ? 16 : 15;
 
 const calculatedMin = Math.max(8.5, minPx * scaleFactor);
 const calculatedMax = Math.max(10, maxPx * scaleFactor);
 
 // Calculate dynamic container-based limits to prevent overflowing boundaries
 const charWidthFactor = isWideFont ? 1.2 : 0.75;
 const maxCqi = 100 / (nameLen * charWidthFactor);
 
 // dynamicFontSize uses clamp to adapt to screen width, and min() with cqi to ensure it NEVER exceeds the container box
 const dynamicFontSize = `min(clamp(${calculatedMin}px, ${4 * scaleFactor}vw + ${4 * scaleFactor}px, ${calculatedMax}px), ${maxCqi}cqi)`;

 return (
 <Motion.div
 layout
 key={player.id}
 variants={{
 hidden: { opacity: 0, y: 15, scale: 0.98 },
 visible: { opacity: 1, y: 0, scale: 1 },
 exit: { opacity: 0, scale: 0.98 }
 }}
 transition={{ type: "spring", stiffness: 400, damping: 17 }}
 whileHover={
 isTop3
 ? { scale: 1.02 }
 : { scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }
 }
 whileTap={{ scale: 0.98 }}
 onClick={() => { triggerHaptic(10); setSelectedPlayer({ ...player, avatar_url: effectiveAvatar, nickname: effectiveNickname, xp: effectiveXP, equipped_name_style: effectiveNameStyle }); }}
 className={`flex flex-row items-center justify-between p-[clamp(0.5rem,2vw,0.625rem)] px-[clamp(0.75rem,3vw,1.25rem)] relative transition-all cursor-pointer duration-300 ${
 isMe 
 ? 'rounded-[10px] bg-[linear-gradient(to_bottom,#fad65b_50%,#e7a421_50%)] border-[1.5px] border-b-4 border-[#a26516] text-mono-900 z-20 shadow-[0_0_15px_rgba(231,164,33,0.4)]'
 : bundleObj.id === 'default' 
 ? 'rounded-[10px] bg-[linear-gradient(to_bottom,#b8c6dc_50%,#9caecc_50%)] border-[1.5px] border-b-4 border-[#2c3951] text-mono-900 z-10 shadow-sm' 
 : `rounded-md border ${bundleObj.cardBg} z-10`
 }`}
 style={{
 zIndex: isTop3 ? 30 : (isMe ? 20 : 1), // Ensure top 3 cards have higher z-index for floating crowns, but strictly below sticky header (z-50)
 }}
 >

 {/* Sleek Metallic Rank Number (MINIMALIST) */}
 <div className="flex items-center justify-center w-[clamp(1.75rem,10vw,2.5rem)] shrink-0 z-10 relative ml-3 sm:ml-4">
 {rank <= 3 ? (
 <div className="z-30 pointer-events-none">
 <div className="relative w-[clamp(1.25rem,8vw,2rem)] h-[clamp(1.25rem,8vw,2rem)] flex items-center justify-center">
 <img 
 src={`/assets/Top_${rank}.svg`} 
 alt={`Top ${rank}`} 
 className="w-full h-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
 />
 </div>
 </div>
 ) : (
 <span className={`font-black italic tracking-normal relative z-10 text-[clamp(1.1rem,6vw,1.5rem)] ${
 bundleObj.id !== 'default' ? 'text-white drop-shadow-md' : 'text-mono-900'
 }`}>
 {toKuDigits(rank)}
 </span>
 )}
 </div>

 {/* Avatar Section */}
 <div className="flex items-center gap-[clamp(0.25rem,2vw,0.75rem)] z-10 px-1 shrink-0">
 <div className="relative w-[clamp(2rem,12vw,3rem)] h-[clamp(2rem,12vw,3rem)] flex items-center justify-center shrink-0">
 {/* XP Progress Ring */}
 <div className="absolute -inset-1 z-0">
 <svg className={`w-full h-full -rotate-90 overflow-visible ${
 isTop3 ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]' : ''
 }`} viewBox="0 0 100 100">
 <circle
 cx="50"
 cy="50"
 r="44"
 fill="none"
 className={
 bundleObj.id !== 'default'
 ? 'stroke-white/25'
 : 'stroke-mono-200/20 dark:stroke-white/5'
 }
 strokeWidth={isTop3 ? "6" : "4"}
 />
 <Motion.circle
 cx="50"
 cy="50"
 r="44"
 fill="none"
 stroke={getLevelTier(getLevelFromXP(effectiveXP)).stop1}
 strokeWidth={isTop3 ? "10" : "8"}
 strokeLinecap="butt"
 strokeDasharray="276.46"
 initial={{ strokeDashoffset: 276.46 }}
 animate={{ 
 strokeDashoffset: 276.46 - (276.46 * progressDecimal),
 filter: getLevelTier(getLevelFromXP(effectiveXP)).isLegendary ? `drop-shadow(0 0 5px ${getLevelTier(getLevelFromXP(effectiveXP)).stop1})` : "none"
 }}
 transition={{ duration: 1.5, ease: "circOut" }}
 />
 </svg>
 </div>

 {/* Clean Avatar */}
 <div className={`w-[clamp(1.75rem,10vw,2.5rem)] h-[clamp(1.75rem,10vw,2.5rem)] rounded-full shadow-sm bg-mono-100 dark:bg-white/5 shrink-0 relative z-10 ${bundleObj.id !== 'default' ? bundleObj.avatarRing : 'border border-mono-200 dark:border-white/10'}`}>
 <Avatar
 src={effectiveAvatar}
 updatedAt={isMe ? lastProfileUpdate : player.updated_at}
 size="full"
 className="rounded-full object-cover w-full h-full"
 border={false}
 showStatus={true}
 isOnline={onlineUsers && onlineUsers.has(player.id)}
 />
 </div>

 {/* Minimal Overlapping Flag Badge */}
 {(effectiveCountryCode || effectiveIsInKurdistan) && (
 <div className={`absolute -bottom-1.5 -right-1.5 z-20 w-4.5 h-4.5 rounded-full overflow-hidden border-[1.5px] shadow-sm bg-white dark:bg-mono-900 flex items-center justify-center scale-90 ${
 rank === 1
 ? 'border-[#a855f7]'
 : rank === 2
 ? 'border-[#ffcc00]'
 : rank === 3
 ? 'border-[#0ea5e9]'
 : 'border-white dark:border-mono-800'
 }`}>
 <FlagBadge countryCode={effectiveCountryCode} isInKurdistan={effectiveIsInKurdistan} size="full" />
 </div>
 )}
 </div>
 </div>

 {/* Info and Name (CENTERED) */}
 <div className="flex-1 flex justify-center items-center min-w-0 mx-1 sm:mx-2" style={{ containerType: 'inline-size' }}>
 <PremiumName 
 text={effectiveNickname}
 styleId={bundleObj.id !== 'default' ? null : styleObj.id}
 style={{
 ...(bundleObj.id !== 'default' ? {} : fontObj.style),
 fontSize: dynamicFontSize
 }}
 dir="auto"
 className={`font-black tracking-normal whitespace-nowrap leading-normal transition-all duration-300 pt-1 ${
 bundleObj.id !== 'default' ? (bundleObj.fontKurdish + ' ' + bundleObj.textStyle) : ''
 } ${
 (!styleObj.class && bundleObj.id === 'default') ? 'text-black' : 'text-white'
 }`} />
 </div>

 {/* Shield or XP (RIGHT SIDE) */}
 <div className="flex items-center shrink-0 pr-1">
 {view === 'daily' ? (
 <div className="flex flex-col items-center justify-center min-w-[clamp(2.5rem,14vw,3.5rem)] px-[clamp(0.25rem,1.5vw,0.5rem)] py-1.5">
 <span className={`text-[clamp(6px,2vw,8px)] font-black uppercase leading-none mb-1 font-rabar tracking-normal ${
 bundleObj.id !== 'default' ? 'text-white/80' : 'text-mono-700'
 }`}>ئێکس پی</span>
 <span className={`text-[clamp(10px,3.5vw,13px)] font-black leading-none drop-shadow-sm tabular-nums ${
 bundleObj.id !== 'default' ? 'text-white' : 'text-[#a855f7]'
 }`}>{toKuDigits(effectiveXP)}</span>
 </div>
 ) : (
 <div className="relative w-[clamp(1.75rem,10vw,2.5rem)] h-[clamp(2.25rem,12vw,3rem)] flex items-center justify-center shrink-0">
 <svg className="absolute inset-0 w-full h-full drop-shadow-[0_2.5px_6px_rgba(0,0,0,0.3)]" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill={`url(#medalGradient-${player.id})`} stroke="white" strokeWidth="5" strokeOpacity={isTop3 ? 0.75 : 0.35} />
 <defs>
 <linearGradient id={`medalGradient-${player.id}`} x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
 <stop stopColor={getLevelTier(getLevelFromXP(effectiveXP)).stop1} />
 <stop offset="1" stopColor={getLevelTier(getLevelFromXP(effectiveXP)).stop2} />
 </linearGradient>
 </defs>
 </svg>
 <div className="relative z-10 flex flex-col items-center justify-center -mt-1 w-full scale-[0.85]">
 <span className="text-[clamp(6px,1.5vw,7.5px)] font-black text-amber-950/60 uppercase leading-none mb-0.5">ئاست</span>
 <span className="text-[clamp(1rem,4vw,1.25rem)] font-black text-amber-950 leading-none drop-shadow-sm">{toKuDigits(getLevelFromXP(effectiveXP))}</span>
 </div>
 </div>
 )}
 </div>
 </Motion.div>
 );
 })}
 
 {/* Load More Button */}
 {(view === 'daily' ? hasMoreDaily : hasMore) && (view === 'daily' ? dailyLeaders.length : leaders.length) >= ITEMS_PER_PAGE && (
 <div className="flex justify-center pt-6 pb-12">
 <button
 onClick={() => view === 'daily' ? fetchDailyData(true) : fetchData(true)}
 disabled={view === 'daily' ? loadingMoreDaily : loadingMore}
 className="group relative px-6 py-2.5 rounded-full bg-mono-100 dark:bg-mono-900 border border-mono-200 dark:border-mono-800 text-mono-600 dark:text-mono-400 font-bold text-sm transition-all hover:bg-mono-200 dark:hover:bg-mono-800 hover:text-mono-900 dark:hover:text-mono-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
 >
 {(view === 'daily' ? loadingMoreDaily : loadingMore) ? (
 <div className="w-5 h-5 border-2 border-mono-900 dark:border-mono-100 border-t-transparent rounded-full animate-spin mx-auto"></div>
 ) : (
 <span className="flex items-center gap-2 uppercase tracking-normal font-black text-[11px] font-rabar">
 زێدەتر نیشانبدە
 <span className="material-symbols-outlined text-[16px] group-hover:translate-y-0.5 transition-transform">expand_more</span>
 </span>
 )}
 </button>
 </div>
 )}
 </Motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Sticky Bottom "Me" Bar */}
 {userId && trueRank && !loading && !error && view === 'global' && (
 <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 md:px-6 pointer-events-none drop-shadow-xl" dir="rtl">
 <Motion.div 
 initial={{ y: 50, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
 className="max-w-md mx-auto w-full pointer-events-auto"
 >
 <div 
 className="rounded-md p-2 px-4 flex items-center justify-between shadow-[0_4px_10px_rgba(0,0,0,0.15)] relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-transform border-b-4 border-black/15"
 style={{
 background: `linear-gradient(135deg, ${getLevelTier(getLevelFromXP(userXP)).stop1}, ${getLevelTier(getLevelFromXP(userXP)).stop2})`
 }}
 >
 {/* Shine effect */}
 <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
 
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 border border-white/40 shadow-sm shrink-0 flex items-center justify-center">
 <Avatar src={userAvatar} size="full" border={false} className="object-cover w-full h-full" />
 </div>
 <div className="flex flex-col items-start leading-none justify-center">
 <span className="font-black text-white text-[14px] drop-shadow-sm">ئاستێ {toKuDigits(getLevelFromXP(userXP))}</span>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <span className="text-[26px] font-black text-white italic tabular-nums leading-none drop-shadow-sm">#{toKuDigits(trueRank)}</span>
 </div>
 </div>
 </Motion.div>
 </div>
 )}

 {/* Scroll To Top Button */}
 <AnimatePresence>
 {showScrollTop && (
 <Motion.button
 initial={{ opacity: 0, scale: 0.5, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.5, y: 20 }}
 onClick={scrollToTop}
 className="fixed bottom-[calc(148px+env(safe-area-inset-bottom))] right-4 md:right-8 z-50 w-10 h-10 bg-mono-900 dark:bg-white text-white dark:text-mono-900 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-white/10 dark:border-black/10"
 title="بۆ سەرەوە"
 >
 <span className="material-symbols-outlined text-[20px]">keyboard_arrow_up</span>
 </Motion.button>
 )}
 </AnimatePresence>
 </div>
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


