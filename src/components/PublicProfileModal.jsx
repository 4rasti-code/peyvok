import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import FlagBadge from './FlagBadge';
import { triggerHaptic } from '../utils/haptics';
import { supabase } from '../lib/supabase';
import { FilsIcon, Level10Icon, PahlawanIcon, SharezaCompassIcon, KurdishShieldIcon, KingOfTheLettersIcon, MamostaBookIcon } from './CurrencyIcon';
import { toKuDigits } from '../utils/formatters';
import { getLevelData } from '../utils/progression';
import { getLevelTier } from '../utils/progression';
import { useAudio } from '../context/AudioContext';
import { usePresence } from '../context/PresenceContext';
const StatsView = lazy(() => import('./StatsView'));
import { NAME_FONTS } from '../constants/nameFonts';
import { NAME_STYLES } from '../constants/nameStyles';
import PremiumName from './PremiumName';
import { BUNDLES } from '../constants/bundles';
import { MEDALS } from '../constants/medals';
import CloseButton from './CloseButton';

export default function PublicProfileModal({
 profile,
 currentUser,
 onClose,
 onOpenChat,
 isFriend = false,
 isPending = false,
 isBlocked = false,
 onToggleBlock,
 onActionComplete,
 minimalMode = false
}) {
 const [fullData, setFullData] = useState(null);
 const [playerStats, setPlayerStats] = useState(null);
 const [loading, setLoading] = useState(true);
 const [showFullStats, setShowFullStats] = useState(false);
 const [topDailyRank, setTopDailyRank] = useState(null);

 const [showBlockConfirm, setShowBlockConfirm] = useState(false);
 const [showReportConfirm, setShowReportConfirm] = useState(false);
 const [showReportSuccess, setShowReportSuccess] = useState(false);
 const [reporting, setReporting] = useState(false);
 const [reportReasons, setReportReasons] = useState([]);
 const [customReason, setCustomReason] = useState("");
 const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
 const [claiming, setClaiming] = useState(false);
 const { onlineUsers } = usePresence();
 const [relStatus, setRelStatus] = useState(isFriend ? 'friend' : (isPending ? 'pending' : 'none')); // 'none', 'pending', 'friend'
 const [isMe, setIsMe] = useState(false);
 const [internalBlocked, setInternalBlocked] = useState(false);
 const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
 
 const { playBubblePopSound } = useAudio();

 useEffect(() => {
 if (!profile?.id || profile.id === 'undefined' || typeof profile.id !== 'string') return;
 const loadProfile = async () => {
 setLoading(true);
 setInternalBlocked(false);
 setShowBlockConfirm(false);
 const currentUserId = currentUser?.id;
 const isActuallyMe = currentUserId === profile.id;
 setIsMe(isActuallyMe);

 const queries = [
 supabase.from('profiles').select('*').eq('id', profile.id).single()
 ];

 if (currentUserId && !isActuallyMe) {
 queries.push(
 supabase.from('friendships').select('status, user_id, friend_id').or(`and(user_id.eq.${currentUserId},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUserId})`).maybeSingle(),
 supabase.from('blocks').select('id').eq('blocker_id', currentUserId).eq('blocked_id', profile.id).maybeSingle()
 );
 }

 const results = await Promise.all(queries);

 const { data } = results[0];
 if (data) {
 setFullData(data);
 setPlayerStats(data.guess_distribution);
 }

 // 3. Check Relationship if not same user
 if (currentUserId && !isActuallyMe) {
 const { data: friendship } = results[1];
 if (friendship) {
 if (friendship.status === 'accepted') {
 setRelStatus('friend');
 } else {
 // Check direction for pending status
 setRelStatus(friendship.user_id === currentUserId ? 'pending_sent' : 'pending_received');
 }
 } else {
 setRelStatus('none');
 }

 // 4. Check Block Status
 const blockResult = results[2];
 if (blockResult.error) {
 console.warn("Block table access restricted (RLS):", blockResult.error.message);
 setInternalBlocked(false);
 } else {
 setInternalBlocked(!!blockResult.data);
 }
 }
 setLoading(false);
 };
 
 loadProfile();

 // Fetch and sync Top 3 Daily Rank
 let fetchTimeout;
 const fetchTopDaily = async () => {
 if (!profile?.id) return;
 try {
 const todayISO = new Date().toISOString().split('T')[0];
 const { data, error } = await supabase
 .from('profiles')
 .select('id')
 .neq('nickname', 'Admin_4rasti')
 .neq('nickname', 'ADMIN_PEYVOK')
 .neq('nickname', 'پەیڤۆک')
 .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
 .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4')
 .eq('daily_xp_date', todayISO)
 .gt('daily_xp', 0)
 .order('daily_xp', { ascending: false })
 .limit(3);
 if (!error && data) {
 const index = data.findIndex(p => p.id === profile.id);
 if (index !== -1) {
 setTopDailyRank(index + 1);
 } else {
 setTopDailyRank(null);
 }
 }
 } catch (e) {
 console.warn("Failed to fetch top daily players", e);
 }
 };
 
 fetchTopDaily();

 let top3Sub = null;
 try {
 top3Sub = supabase.channel(`public:profiles:modal_top3_${profile?.id || 'unknown'}`)
 .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
 const updatedProfile = payload?.new;
 if (updatedProfile && typeof updatedProfile?.daily_xp !== 'undefined') {
 if (fetchTimeout) clearTimeout(fetchTimeout);
 fetchTimeout = setTimeout(() => {
 fetchTopDaily();
 }, 2000); 
 }
 }).subscribe((status, err) => {
 if (err) console.warn('modal_top3 subscription error:', err);
 });
 } catch (e) {
 console.warn('Failed to subscribe to modal_top3 channel:', e);
 }

 return () => {
 if (fetchTimeout) clearTimeout(fetchTimeout);
 if (top3Sub) {
 try {
 supabase.removeChannel(top3Sub);
 } catch (e) {
 console.warn('Failed to remove modal_top3 channel:', e);
 }
 }
 };
 }, [profile?.id, currentUser?.id]);

 if (!profile) return null;

 const baseData = fullData || profile;
 const isBot = baseData?.id === '9a813c24-b662-477d-a74a-6f822d17bbf1' || baseData?.id === '66bbf4d5-333a-4748-8529-ecd5bae9f3a4';
 
 // Exponential Progress Logic (Standardized)
 const levelData = isBot ? { level: 99, progressPercent: 100, nextLevelBase: 999999 } : getLevelData(baseData.xp || 0);
 const displayData = isBot ? { 
 ...baseData, 
 level: 99, 
 xp: 999999, 
 nickname: 'پەیڤۆک', 
 is_kurdistan: true, 
 country_code: 'IQ',
 games_won: 9999,
 daily_streak: 999,
 kurdish_words_completed: 9999,
 words_without_hints: 9999,
 mode_classic_played: 9999
 } : { ...baseData, level: levelData.level };
 const safeLevel = levelData.level;
 const progressRatio = levelData.progressPercent;
 const nextLevelXP = Math.round(levelData.nextLevelBase);
 const globalTier = getLevelTier(safeLevel);

 // Online Status Logic: Strictly rely on global PresenceContext
 const isOnline = isBot || isMe || onlineUsers?.has(displayData.id);

 // Mastery Logic
 const getMastery = (d) => {
 const modes = [
 { id: 'classic', count: d.mode_classic_played || 0, color: 'text-yellow-400', bg: 'bg-yellow-400/30', icon: 'sports_esports', name: 'پەیڤۆکا کلاسیك' },
 { id: 'lightning', count: d.mode_lightning_played || 0, color: 'text-purple-400', bg: 'bg-purple-400/30', icon: 'bolt', name: 'تایا پەیڤان' },
 { id: 'hard', count: d.mode_hard_played || 0, color: 'text-orange-500', bg: 'bg-orange-500/30', icon: 'military_tech', name: 'پەیڤێن دژوار' },
 { id: 'mystery', count: d.mode_mystery_played || 0, color: 'text-sky-500', bg: 'bg-sky-500/30', icon: 'search', name: 'پەیڤا نەھێنی' }
 ];

 const dominant = modes.reduce((prev, current) => (prev.count > current.count) ? prev : current);

 // Only show if played at least once
 if (dominant.count === 0) return null;

 let tierLevel = 1; // Bronze
 let tierBorder = 'border-amber-700';
 let tierGlow = '';

 if (dominant.count >= 200) {
 tierLevel = 3; // Gold
 tierBorder = 'border-yellow-400';
 tierGlow = '';
 } else if (dominant.count >= 50) {
 tierLevel = 2; // Silver
 tierBorder = 'border-slate-300';
 }

 return { ...dominant, tierLevel, tierBorder, tierGlow };
 };

 const handleClaimMastery = async () => {
 if (!mastery || claiming) return;
 const isMe = currentUser?.id === displayData.id;
 if (!isMe) return;

 const claimedTier = displayData.mastery_claims?.[mastery.id] || 0;
 if (mastery.tierLevel <= claimedTier) return;

 setClaiming(true);
 triggerHaptic(50); // Strong haptic for big claim

 const rewards = { 1: 500, 2: 2500, 3: 10000 };
 const amount = rewards[mastery.tierLevel];

 // Update DB
 const newClaims = {
 ...(displayData.mastery_claims || {}),
 [mastery.id]: mastery.tierLevel
 };

 const { error } = await supabase
 .from('profiles')
 .update({
 fils: (displayData.fils || 0) + amount,
 mastery_claims: newClaims
 })
 .eq('id', currentUser?.id);

 if (!error) {
 setFullData({ ...displayData, fils: (displayData.fils || 0) + amount, mastery_claims: newClaims });
 window.dispatchEvent(new CustomEvent('fire-coins', { 
 detail: { type: 'fils', amount: amount } 
 }));
 }
 setClaiming(false);
 };

 const handleReport = async () => {
 if (!currentUser || reporting) return;
 
 let finalReason = reportReasons.filter(r => r !== 'یێن دیتر').join('، ');
 if (reportReasons.includes('یێن دیتر')) {
 finalReason = finalReason ? finalReason + '، ' + customReason.trim() : customReason.trim();
 }
 if (!finalReason) return;

 setReporting(true);
 triggerHaptic(20);

 const { error } = await supabase
 .from('reports')
 .insert([{ reporter_id: currentUser.id, reported_id: profile.id, reason: finalReason }]);

 setReporting(false);
 setShowReportConfirm(false);
 setReportReasons([]);
 setCustomReason("");

 if (error) {
 console.error("Report Error:", error);
 alert("شاشیەک ڕوویدا: " + error.message);
 } else {
 setShowReportSuccess(true);
 setTimeout(() => {
 setShowReportSuccess(false);
 }, 4000);
 }
 };

 const handleSendFriendRequest = async () => {
 if (!currentUser || relStatus !== 'none') return;
 triggerHaptic(15);
 setRelStatus('pending_sent'); // Optimistic UI

 const { error } = await supabase
 .from('friendships')
 .insert([{ user_id: currentUser?.id, friend_id: profile.id, status: 'pending' }]);

 if (error) {
 if (error.code === '23505') {
 // Already sent, keep the optimistic status
 if (onActionComplete) onActionComplete();
 return;
 }
 setRelStatus('none');
 console.error("Friend request error:", error);
 } else {
 if (onActionComplete) onActionComplete();
 }
 };

 const handleAcceptFriendRequest = async () => {
 if (!currentUser || relStatus !== 'pending_received') return;
 triggerHaptic(20);
 setRelStatus('friend'); // Optimistic

 const { error } = await supabase
 .from('friendships')
 .update({ status: 'accepted' })
 .or(`and(user_id.eq.${currentUser?.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUser?.id})`);

 if (error) {
 setRelStatus('pending_received');
 console.error("Accept error:", error);
 } else {
 if (onActionComplete) onActionComplete();
 }
 };

 const handleDeclineFriendRequest = async () => {
 if (!currentUser) return;
 triggerHaptic(10);
 setRelStatus('none'); // Optimistic

 const { error } = await supabase
 .from('friendships')
 .delete()
 .or(`and(user_id.eq.${currentUser?.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUser?.id})`);

 if (error) {
 console.error("Decline error:", error);
 } else {
 if (onActionComplete) onActionComplete();
 }
 };

 const handleUnfriend = async () => {
 if (!currentUser || relStatus !== 'friend') return;

 const { error } = await supabase
 .from('friendships')
 .delete()
 .or(`and(user_id.eq.${currentUser?.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUser?.id})`);

 if (!error) {
 setRelStatus('none');
 setShowUnfriendConfirm(false);
 triggerHaptic(30);
 if (onActionComplete) onActionComplete();
 } else {
 console.error("Unfriend error:", error);
 }
 };

 const mastery = getMastery(displayData);

 // Medals Configuration
 const getLatestMedal = () => {
 if (!displayData?.claimed_medals || displayData.claimed_medals.length === 0) return MEDALS[0];
 const latestId = displayData.claimed_medals[displayData.claimed_medals.length - 1];
 return MEDALS.find(m => m.id === latestId) || MEDALS[0];
 };

 const bestMedal = getLatestMedal();
 const isBestUnlocked = displayData?.claimed_medals?.includes(bestMedal.id);

 const effectiveIsBlocked = internalBlocked || isBlocked;

 if (showFullStats) {
 return (
 <div className="fixed inset-0 z-100 bg-mono-white dark:bg-black overflow-y-auto">
 <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>}>
 <StatsView
 profileData={displayData}
 playerStats={playerStats}
 onViewChange={() => setShowFullStats(false)}
 />
 </Suspense>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 z-100 flex items-center justify-center p-6 sm:p-12 overflow- pointer-events-auto">
 {/* Heavy Backdrop */}
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => { playBubblePopSound(); onClose(); }}
 className="absolute inset-0 bg-mono-white/90 dark:bg-black/95 "
 />

 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 30 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 30 }}
 className="relative w-full max-w-sm bg-mono-white/95 dark:bg-black/95 border border-mono-200 dark:border-white/10 rounded-md overflow-hidden flex-col items-center p-4 sm:p-5 text-center max-h-[90vh] overflow-y-auto transition-colors duration-500 shadow-2xl"
 dir="rtl"
 >
 {/* Close Button */}
 <CloseButton onClick={() => { playBubblePopSound(); onClose(); }} className="absolute top-4 left-4 z-10" />

 {/* Level Badge - Reverted to Top Right Corner of Modal */}
 {!isBot && (() => {
 const tier = getLevelTier(safeLevel);
 return (
 <div className="absolute top-4 right-5 z-10 scale-125 origin-top-right">
 <div className="relative w-11 h-12 flex items-center justify-center">
 <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill={`url(#medalGradientPublic-${profile.id})`} stroke="white" strokeWidth="4" strokeOpacity="0.2" />
 <defs>
 <linearGradient id={`medalGradientPublic-${profile.id}`} x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
 <stop stopColor={tier.stop1} />
 <stop offset="1" stopColor={tier.stop2} />
 </linearGradient>
 </defs>
 </svg>
 <div className="relative z-10 flex flex-col items-center justify-center -mt-1.5">
 <span className="text-[7.5px] font-black text-slate-950/40 uppercase leading-none mb-0.5">ئاستێ</span>
 <span className="text-xl font-black text-slate-950 leading-none">{toKuDigits(safeLevel)}</span>
 </div>
 </div>
 </div>
 );
 })()}


 {/* Avatar Section (Centered) */}
 {(() => {
 const tier = getLevelTier(safeLevel);
 return (
 <div className="relative mb-3 mt-2 flex flex-col items-center">
 <div className="w-28 h-28 rounded-full flex items-center justify-center relative">
 {/* XP Progress Ring */}
 <div className="absolute -inset-1.5 z-0">
 <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
 <circle cx="50" cy="50" r="44" fill="none" className="stroke-mono-200/20 dark:stroke-white/5" strokeWidth="4" />
 <Motion.circle
 cx="50"
 cy="50"
 r="44"
 fill="none"
 stroke={tier.stop1}
 strokeWidth="6"
 strokeLinecap="butt"
 strokeDasharray="276.46"
 initial={{ strokeDashoffset: 276.46 }}
 animate={{
 strokeDashoffset: 276.46 - (276.46 * (progressRatio / 100)),
 filter: tier.isLegendary ? `drop-shadow(0 0 8px ${tier.stop1})` : "none"
 }}
 transition={{ duration: 1.5, ease: "circOut" }}
 />
 </svg>
 </div>

 <div 
 className={`w-full h-full rounded-full bg-mono-white dark:bg-slate-900 flex items-center justify-center border-4 border-mono-white dark:border-slate-900 relative z-10 overflow-hidden cursor-pointer active:scale-95 transition-transform ${isBot ? '' : (BUNDLES[displayData.equipped_bundle]?.id !== 'default' ? BUNDLES[displayData.equipped_bundle]?.avatarRing || '' : '')}`}
 onClick={() => setIsAvatarExpanded(true)}
 >
 {isBot ? (
 <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[#141414]">
 <img src="/Peyvok-logo-01.png" alt="Bot Avatar" className="w-[70%] h-[70%] object-contain block dark:hidden" />
 <img src="/Peyvok-logo-02.png" alt="Bot Avatar" className="w-[70%] h-[70%] object-contain hidden dark:block" />
 </div>
 ) : (
 <Avatar
 src={displayData.avatar_url}
 updatedAt={displayData.updated_at}
 size="2xl"
 border={false}
 className="w-full h-full object-cover"
 />
 )}
 </div>

 {/* Highest Medal Badge - On Avatar Circle */}
 {!isBot && (
 <div 
 className="absolute -top-1 -left-1 w-10 h-10 flex items-center justify-center z-50 transition-transform hover:scale-110"
 >
 <bestMedal.IconComponent className={`w-9 h-9 ${!isBestUnlocked ? 'brightness-90 contrast-125' : 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)]'}`} disabled={!isBestUnlocked} isBadge={true} />
 </div>
 )}

 {/* Online Indicator on Avatar Edge */}
 <div className={`absolute bottom-2 right-2 w-7 h-7 ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-600'} border-4 border-mono-white dark:border-black rounded-full z-20 transition-all duration-300`} />
 </div>
 </div>
 );
 })()}

 {/* Identity Section */}
 <div className="space-y-1 mb-3 w-full">
 {/* Name Row (Centered) */}
 <div className="flex flex-col items-center justify-center gap-1 w-full px-4">
 {(() => {
 const fontObj = NAME_FONTS[displayData.equipped_font] || NAME_FONTS['default-ku'];
 const styleObj = NAME_STYLES[displayData.equipped_name_style] || {};
 const bundleObj = BUNDLES[displayData.equipped_bundle] || BUNDLES['default'];
 return (
 <PremiumName
 text={displayData.nickname}
 styleId={bundleObj.id !== 'default' ? null : styleObj.id}
 className={`text-2xl font-black transition-colors duration-500 text-center ${isBot ? 'text-primary' : ''} ${bundleObj.id !== 'default' ? (bundleObj.fontKurdish + ' ' + bundleObj.textStyle) : ''}`}
 style={{ ...(!isBot && bundleObj.id === 'default' && !styleObj.class ? { color: getLevelTier(safeLevel).stop1 } : {}), ...(!isBot && bundleObj.id === 'default' ? fontObj.style : {}) }}
 />
 );
 })()}
 
 {/* Daily Top 3 Badge */}
 {topDailyRank && !isBot && (
 <Motion.span 
 initial={{ opacity: 0, y: -5 }}
 animate={{ opacity: 1, y: 0 }}
 className={`px-2 py-0.75 rounded-sm text-[9px] font-black uppercase leading-none shadow-sm flex items-center justify-center border font-rabar ${
 topDailyRank === 1 ? 'bg-linear-to-b from-[#FFEA00] to-[#F59E0B] text-[#422006] border-[#D97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_0_#92400E]' :
 topDailyRank === 2 ? 'bg-linear-to-b from-[#F8FAFC] to-[#94A3B8] text-[#0F172A] border-[#64748B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_0_#475569]' :
 'bg-linear-to-b from-[#FDBA74] to-[#C2410C] text-[#431407] border-[#92400E] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_0_#78350F]'
 }`}
 >
 <span className="pt-0.5">TOP {topDailyRank} ئەڤرۆ</span>
 </Motion.span>
 )}
 </div>

 {mastery && !isBot && (
 <div className="relative mt-2 pt-1 flex items-center justify-center gap-2 group">
 <div
 className="relative flex items-center justify-center cursor-pointer"
 onClick={() => triggerHaptic(10)}
 >
 <Motion.div
 className={`absolute inset-0 rounded-md ${mastery.bg} opacity-20`}
 />
 <div className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-mono-100 dark:bg-slate-900 border border-mono-200 dark:border-white/10 transition-colors`}>
 <span className={`material-symbols-outlined text-[15px] ${mastery.color}`}>{mastery.icon}</span>
 <span className={`text-[9px] uppercase font-black font-rabar ${mastery.color}`}>{mastery.name}</span>
 </div>
 </div>

 {isMe && mastery.tierLevel > (displayData.mastery_claims?.[mastery.id] || 0) && (
 <Motion.button
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleClaimMastery}
 disabled={claiming}
 className="relative z-20 flex items-center gap-1 bg-emerald-500 text-slate-950 font-black text-[10px] py-1.5 px-3 rounded-md border border-emerald-400/50 transition-all hover:bg-emerald-400 shadow-sm"
 >
 {claiming ? '...' : 'وەرگرتن'}
 <FilsIcon className="w-3.5 h-3.5" />
 </Motion.button>
 )}
 </div>
 )}

 {/* Flag, Social Actions, and Streak Row */}
 <div className="flex items-center justify-between w-full px-2 mt-5 pt-1" dir="ltr">
 {/* Left: Flag */}
 <div className="flex-1 flex justify-start items-center">
 <FlagBadge countryCode={displayData.country_code} isInKurdistan={displayData.is_kurdistan} size="sm" />
 </div>

 {/* Center: Social Action Icons */}
 <div className="flex flex-col items-center justify-center shrink-0">
 {!isMe && !isBot && displayData?.nickname !== 'Admin_4rasti' && displayData?.nickname !== 'ADMIN_PEYVOK' && displayData?.nickname !== 'پەیڤۆک' && (
 <div className="flex items-center justify-center gap-3" dir="rtl">
 {/* Friend Action */}
 {relStatus === 'friend' && !effectiveIsBlocked && (
 <button 
 onClick={() => { triggerHaptic(10); setShowUnfriendConfirm(true); }} 
 className={`relative overflow-hidden w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${globalTier.isLegendary ? 'text-slate-900 border-none hover:opacity-90' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'}`}
 style={globalTier.isLegendary ? { background: `linear-gradient(135deg, ${globalTier.stop1}, ${globalTier.stop2})`, filter: `drop-shadow(0 2px 8px ${globalTier.shadow})` } : {}}
 title="لابرنا ھەڤالینیێ">
 <span className="material-symbols-outlined text-[20px] relative z-10">how_to_reg</span>
 {globalTier.isLegendary && <div className="absolute inset-0 pointer-events-none animate-shimmer-sweep" />}
 </button>
 )}
 {relStatus === 'none' && !effectiveIsBlocked && (
 <button 
 onClick={handleSendFriendRequest} 
 className={`relative overflow-hidden w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-all shadow-md ${globalTier.isLegendary ? 'text-slate-900 border-none' : 'bg-mono-900 dark:bg-slate-100 text-mono-50 dark:text-slate-950'}`}
 style={globalTier.isLegendary ? { background: `linear-gradient(135deg, ${globalTier.stop1}, ${globalTier.stop2})`, filter: `drop-shadow(0 2px 8px ${globalTier.shadow})` } : {}}
 title="ببە ھەڤاڵ">
 <span className="material-symbols-outlined text-[20px] relative z-10">person_add</span>
 {globalTier.isLegendary && <div className="absolute inset-0 pointer-events-none animate-shimmer-sweep" />}
 </button>
 )}
 {relStatus === 'pending_sent' && !effectiveIsBlocked && (
 <button 
 onClick={handleDeclineFriendRequest} 
 className={`relative overflow-hidden w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${globalTier.isLegendary ? 'text-slate-900 border-none hover:opacity-90' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'}`}
 style={globalTier.isLegendary ? { background: `linear-gradient(135deg, ${globalTier.stop1}, ${globalTier.stop2})`, filter: `drop-shadow(0 2px 8px ${globalTier.shadow})` } : {}}
 title="پەشێمان بوون">
 <span className="material-symbols-outlined text-[20px] relative z-10">hourglass_top</span>
 {globalTier.isLegendary && <div className="absolute inset-0 pointer-events-none animate-shimmer-sweep" />}
 </button>
 )}

 {/* Report Action */}
 <button 
 onClick={() => { triggerHaptic(10); setShowReportConfirm(true); }} 
 className={`relative overflow-hidden w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${globalTier.isLegendary ? 'text-slate-900 border-none hover:opacity-90' : 'bg-mono-100 dark:bg-white/5 border-mono-200 dark:border-white/10 text-mono-500 dark:text-white/40 hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/20'}`}
 style={globalTier.isLegendary ? { background: `linear-gradient(135deg, ${globalTier.stop1}, ${globalTier.stop2})`, filter: `drop-shadow(0 2px 8px ${globalTier.shadow})` } : {}}
 title="ڕیپۆرتکرن / سکاڵا">
 <span className="material-symbols-outlined text-[20px] relative z-10">flag</span>
 {globalTier.isLegendary && <div className="absolute inset-0 pointer-events-none animate-shimmer-sweep" />}
 </button>

 {/* Block Action */}
 {onToggleBlock && (
 <button 
 onClick={() => { triggerHaptic(10); setShowBlockConfirm(true); }} 
 className={`relative overflow-hidden w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${globalTier.isLegendary ? 'text-slate-900 border-none hover:opacity-90' : (effectiveIsBlocked ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-mono-100 dark:bg-white/5 border-mono-200 dark:border-white/10 text-mono-500 dark:text-white/40 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20')}`}
 style={globalTier.isLegendary ? { background: `linear-gradient(135deg, ${globalTier.stop1}, ${globalTier.stop2})`, filter: `drop-shadow(0 2px 8px ${globalTier.shadow})` } : {}}
 title={effectiveIsBlocked ? 'لابرنا بلۆکی' : 'بلۆککرن'}>
 <span className="material-symbols-outlined text-[20px] relative z-10">{effectiveIsBlocked ? 'block' : 'person_off'}</span>
 {globalTier.isLegendary && <div className="absolute inset-0 pointer-events-none animate-shimmer-sweep" />}
 </button>
 )}
 </div>
 )}
 </div>

 {/* Right: Streak */}
 <div className="flex-1 flex justify-end items-center">
 {!isBot && fullData?.daily_streak > 0 && !(minimalMode && relStatus !== 'friend' && !isMe) && (
 <div className="flex items-center gap-1" dir="ltr">
 <span className="text-xl leading-none" style={{ filter: "drop-shadow(0 0 6px rgba(255, 159, 28, 0.4))" }}>
 {(fullData.last_streak_at && new Date().getTime() - new Date(fullData.last_streak_at).getTime() > 24 * 60 * 60 * 1000) ? '⏳' : '🔥'}
 </span>
 <div className="flex items-baseline gap-0.5">
 <span className="text-xl font-black text-mono-900 dark:text-white leading-none tabular-nums">{toKuDigits(fullData.daily_streak)}</span>
 <span className="text-[11px] font-bold text-mono-500 dark:text-mono-400 pb-0.5">ڕۆژ</span>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Stats Grid */}
 {!(minimalMode && relStatus !== 'friend' && !isMe) && !loading && !isBot && (() => {
 const tier = getLevelTier(safeLevel);
 return (
 <Motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full mb-3 pt-3 border-t border-mono-200 dark:border-white/5 space-y-2"
 >
 <div className="w-full relative overflow-hidden px-2">
 <div className="flex justify-between items-end mb-1.5 relative z-10">
 <div className="text-right">
 <span className="text-[8px] font-black uppercase text-mono-400 dark:text-white/40 block">ئەزموون (XP)</span>
 <span className="text-base font-black text-mono-900 dark:text-white ">{displayData.xp || 0}</span>
 </div>
 <span className="text-[9px] font-black text-mono-300 dark:text-white/20">/ {nextLevelXP}</span>
 </div>
 <div className="w-full h-2 bg-mono-100 dark:bg-slate-950 rounded-md overflow-hidden relative z-10 shadow-inner border border-mono-200 dark:border-white/5">
 <Motion.div
 initial={{ width: 0 }}
 animate={{ width: `${progressRatio}%` }}
 transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
 className="h-full rounded-md transition-all duration-500"
 style={{ background: `linear-gradient(to right, ${tier.stop1}, ${tier.stop2})` }}
 />
 </div>
 </div>

 <div className="px-2 pb-2">
 <button
 onClick={() => { triggerHaptic(10); setShowFullStats(true); }}
 className={`relative overflow-hidden w-full py-2.5 mt-2 rounded-md font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2 font-rabar shadow-sm ${
 globalTier.isLegendary 
 ? 'border-none text-slate-900 hover:opacity-90' 
 : 'bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/10 text-mono-900 dark:text-white hover:bg-mono-200 dark:hover:bg-white/10'
 }`}
 style={globalTier.isLegendary ? { background: `linear-gradient(135deg, ${globalTier.stop1}, ${globalTier.stop2})`, filter: `drop-shadow(0 2px 8px ${globalTier.shadow})` } : {}}
 >
 <div className="relative z-10 flex items-center justify-center gap-2">
 <span className="material-symbols-outlined text-[18px]">query_stats</span>
 <span>ئامار</span>
 </div>
 {globalTier.isLegendary && <div className="absolute inset-0 pointer-events-none animate-shimmer-sweep" />}
 </button>
 </div>


 </Motion.div>
 );
 })()}

 {/* Bottom Section (Conditional) */}
 {(() => {
 const hasConfirm = showReportSuccess;
 const showBottom = isBot || isMe || effectiveIsBlocked || relStatus === 'friend' || relStatus === 'pending_received' || hasConfirm;
 
 if (!showBottom) return null;

 return (
 <div className="w-full space-y-2 mt-auto flex flex-col pt-3 border-t border-mono-200 dark:border-white/5">
 {isMe ? (
 <div className="w-full py-3 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold text-sm text-center shadow-sm">ئەڤە پڕۆفایلا تەیا تایبەتە</div>
 ) : showReportSuccess ? (
 <Motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-3 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold text-sm text-center flex items-center justify-center gap-2 shadow-sm">
 <span className="material-symbols-outlined text-lg">check_circle</span>
 سکاڵا ب سەرکەڤتی هاتە هنارتن، سوپاس
 </Motion.div>
 ) : effectiveIsBlocked ? (
 <div className="w-full py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm text-center flex items-center justify-center gap-2">
 <span className="material-symbols-outlined text-lg">block</span>
 ئەڤ یاریزانە ھاتیە بلۆککرن
 </div>
 ) : relStatus === 'pending_received' ? (
 <div className="flex gap-2 w-full">
 <button onClick={handleAcceptFriendRequest} className="flex-2 py-2.5 rounded-md bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 font-rabar shadow-sm w-full">
 <span className="material-symbols-outlined text-base">check_circle</span>
 وەربگرە
 </button>
 <button onClick={handleDeclineFriendRequest} className="flex-1 py-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 font-black text-sm hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 w-1/3">
 <span className="material-symbols-outlined text-lg">close</span>
 </button>
 </div>
 ) : (relStatus === 'friend' || isBot) && onOpenChat ? (
 <button
 onClick={() => { triggerHaptic(20); if (onOpenChat) onOpenChat(displayData || profile); }}
 className="w-full py-2.5 rounded-md bg-primary text-slate-950 font-black text-sm hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 font-rabar shadow-sm"
 >
 <span>نامەیێ بھنێرە</span>
 <span className="material-symbols-outlined text-lg">chat</span>
 </button>
 ) : null}
 </div>
 );
 })()}
 </Motion.div>

 {/* Action Confirmation Modals Overlay */}
 <AnimatePresence>
 {(showReportConfirm || showBlockConfirm || showUnfriendConfirm) && (
 <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/90 ]"
 onClick={() => {
 setShowReportConfirm(false);
 setReportReasons([]);
 setCustomReason("");
 setShowBlockConfirm(false);
 setShowUnfriendConfirm(false);
 }}
 />
 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative w-full max-w-85 bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] border-4 border-[#121316] p-5 flex flex-col items-center overflow-hidden font-rabar"
 dir="rtl"
 >
 {/* Inner 3D Highlight Layer (Tapered Top) */}
 <div 
 className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>
 
 {/* Inner 3D Shadow Layer (Bottom & Sides) */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight */}
 <div className="absolute top-1.5 inset-x-1.5 h-7 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>

 <div className="relative z-10 w-full flex flex-col items-center pt-2">
 {showReportConfirm && (
 <>
 <h3 className="text-[17px] font-black text-white mb-4 leading-none text-center" style={{ textShadow: '-1.5px -1.5px 0 #1a1c23, 1.5px -1.5px 0 #1a1c23, -1.5px 1.5px 0 #1a1c23, 1.5px 1.5px 0 #1a1c23, 0 3px 0 #1a1c23, 0 4px 6px rgba(0,0,0,0.4)' }}>ئەگەرێ سکاڵایێ چیە؟</h3>
 
 <div className="flex flex-col relative rounded-[10px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden w-full mb-5 border-[1.5px] border-[#181a20]">
 <div className="absolute inset-0 rounded-[8px] border-2 border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-20"></div>
 <div className="relative z-10 w-full max-h-[35vh] overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
 {['ئاخفتنێن نەجوان', 'ناڤێ نەجوان', 'فێلکرن', 'بێزارکرن', 'یێن دیتر'].map(reason => (
 <label key={reason} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-[8px] bg-white border border-[#a0a7b4]/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#1e86ff]/50 transition-colors group">
 <input 
 type="checkbox" 
 name="reportReason" 
 value={reason} 
 checked={reportReasons.includes(reason)} 
 onChange={(e) => { 
 triggerHaptic(5); 
 if (e.target.checked) {
 setReportReasons(prev => [...prev, reason]);
 } else {
 setReportReasons(prev => prev.filter(r => r !== reason));
 }
 }} 
 className="w-4 h-4 rounded-sm border-2 border-[#a0a7b4] text-[#1e86ff] focus:ring-[#1e86ff]/30 cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] transition-all"
 />
 <span className="text-[#181a20] text-[12px] font-black flex-1">{reason}</span>
 </label>
 ))}
 
 {reportReasons.includes('یێن دیتر') && (
 <textarea
 value={customReason}
 onChange={(e) => setCustomReason(e.target.value)}
 placeholder="کێشەیێ ل ڤێرێ بنڤێسە..."
 className="w-full bg-white border border-[#a0a7b4]/50 rounded-[8px] p-2.5 text-[#181a20] text-[11px] font-bold focus:outline-none focus:border-[#1e86ff] focus:ring-2 focus:ring-[#1e86ff]/20 resize-none h-20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder:text-[#a0a7b4]"
 />
 )}
 </div>
 </div>
 
 <div className="flex gap-3 w-full">
 <button onClick={() => { triggerHaptic(10); setShowReportConfirm(false); setReportReasons([]); setCustomReason(""); }} className="flex-1 relative btn-clash-sm btn-clash-sm-slate text-white h-11 text-[13px] font-black">پەشێمانبوون</button>
 <button onClick={() => { triggerHaptic(10); handleReport(); }} disabled={reporting || reportReasons.length === 0 || (reportReasons.includes('یێن دیتر') && !customReason.trim())} className="flex-1 relative btn-clash-sm btn-clash-sm-blue text-white h-11 text-[13px] font-black disabled:opacity-50 disabled:grayscale">هنارتن</button>
 </div>
 </>
 )}
 {showBlockConfirm && (
 <>
 <h3 className="text-[17px] font-black text-white mb-4 -mt-2 leading-none text-center relative z-20" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>
 تو پشتڕاستی ژ بلۆککرنا ڤی کەسی؟
 </h3>
 <div className="flex-1 self-stretch flex flex-col relative w-full rounded-[8px] bg-[#e3eef2] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden mt-2">
 {/* Inner White Box Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 <div className="relative z-20 flex p-5 w-full gap-3">
 <button
 onClick={() => { triggerHaptic(10); setShowBlockConfirm(false); }}
 className="relative flex-1 h-10 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#8a92a0]"
 style={{ boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)' }}
 >
 <span className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>
 نەخێر
 </span>
 </button>
 <button
 onClick={() => { triggerHaptic(10); onToggleBlock(effectiveIsBlocked); setShowBlockConfirm(false); }}
 className="relative flex-1 h-10 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#ff3b3b]"
 style={{ boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)' }}
 >
 <span className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>
 بەڵێ، بلۆک
 </span>
 </button>
 </div>
 </div>
 </>
 )}
 {showUnfriendConfirm && (
 <>
 <h3 className="text-[17px] font-black text-white mb-4 -mt-2 leading-none text-center relative z-20" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>
 تو پشتڕاستی ژ ژێبرانا ڤی هەڤالی؟
 </h3>
 <div className="flex-1 self-stretch flex flex-col relative w-full rounded-[8px] bg-[#e3eef2] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden mt-2">
 {/* Inner White Box Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 <div className="relative z-20 flex p-5 w-full gap-3">
 <button
 onClick={() => { triggerHaptic(10); setShowUnfriendConfirm(false); }}
 className="relative flex-1 h-10 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#8a92a0]"
 style={{ boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)' }}
 >
 <span className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>
 نەخێر
 </span>
 </button>
 <button
 onClick={() => { handleUnfriend(); setShowUnfriendConfirm(false); }}
 className="relative flex-1 h-10 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#ff3b3b]"
 style={{ boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)' }}
 >
 <span className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>
 بەڵێ
 </span>
 </button>
 </div>
 </div>
 </>
 )}
 </div>
 </Motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Fullscreen Avatar Viewer */}
 <AnimatePresence>
 {isAvatarExpanded && (
 <Motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.15 }}
 className="fixed inset-0 z-99999 flex items-center justify-center bg-black/90 p-4" 
 onClick={() => setIsAvatarExpanded(false)}
 >
 <Motion.div
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.9, opacity: 0 }}
 transition={{ 
 type: 'spring', damping: 25, stiffness: 400,
 exit: { duration: 0.15, ease: "easeIn" }
 }}
 className="relative w-full max-w-[75vw] sm:max-w-xs aspect-square flex items-center justify-center"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Close Button */}
 <CloseButton onClick={() => setIsAvatarExpanded(false)} className="absolute -top-12 sm:-top-16 right-0 z-10" />
 
 <div 
 className={`w-full h-full rounded-full border-4 border-white/20 overflow-hidden shadow-2xl relative select-none ${isBot ? '' : (BUNDLES[displayData.equipped_bundle]?.id !== 'default' ? BUNDLES[displayData.equipped_bundle]?.avatarRing || '' : '')}`}
 onContextMenu={(e) => e.preventDefault()}
 >
 {/* Transparent overlay to intercept all right-clicks and long-presses on the image */}
 <div className="absolute inset-0 z-50 bg-transparent" />
 {isBot ? (
 <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[#141414] pointer-events-none">
 <img src="/Peyvok-logo-01.png" alt="Bot Avatar" className="w-[80%] h-[80%] object-contain block dark:hidden pointer-events-none" draggable={false} />
 <img src="/Peyvok-logo-02.png" alt="Bot Avatar" className="w-[80%] h-[80%] object-contain hidden dark:block pointer-events-none" draggable={false} />
 </div>
 ) : (
 <div className="w-full h-full pointer-events-none select-none">
 <Avatar
 src={displayData.avatar_url}
 updatedAt={displayData.updated_at}
 size="full"
 border={false}
 className="w-full h-full object-cover pointer-events-none"
 />
 </div>
 )}
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
