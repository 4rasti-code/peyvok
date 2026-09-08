import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import Avatar from './Avatar';
import { useUser } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { useAudio } from '../context/AudioContext';
import { motion as Motion } from 'framer-motion';
import PublicProfileModal from './PublicProfileModal';

export default function FriendsList({ 
 onOpenChat, 
 onRequireActionComplete // Optional callback for parent
}) {
 const { user, loading: loadingAuth, handleToggleBlock } = useUser();
 const { onlineUsers } = usePresence();
 const [friends, setFriends] = useState([]);
 const [pendingRequests, setPendingRequests] = useState([]);
 const [pendingSentIds, setPendingSentIds] = useState(new Set());
 const [searchQuery, setSearchQuery] = useState('');
 const [searchResults, setSearchResults] = useState([]);
 const [searching, setSearching] = useState(false);
 const [selectedPlayer, setSelectedPlayer] = useState(null);
 const [activeTab, setActiveTab] = useState('friends');
 const { playTabSound } = useAudio();
 
 const searchTimeoutRef = useRef(null);
 const isSearchingRef = useRef(false);
 const friendsFetchTimeoutRef = useRef(null);

 const handleInvite = async () => {
 const shareLink = `https://www.peyvokgame.com/auth?invite=${user?.id || 'guest'}`;
 const shareText = `وەرە دگەل من یارییا پەیڤۆک بکە! ئەڤە لینکێ من یێ بانگهێشتکرنێ یە:\n${shareLink}`;

 if (navigator.share) {
 try {
 // Only sending URL ensures maximum compatibility with strict apps like Snapchat
 await navigator.share({ url: shareLink });
 } catch (err) {
 if (err.name !== 'AbortError') {
 navigator.clipboard.writeText(shareText);
 alert('لینک ھاتە کۆپیکرن! بۆ ھەڤالێن خوە بهنێرە.');
 }
 }
 } else {
 navigator.clipboard.writeText(shareText);
 alert('لینک ھاتە کۆپیکرن! بۆ ھەڤالێن خوە بهنێرە.');
 }
 };

 const fetchFriendsData = useCallback(async (signal = null) => {
 if (!user?.id) return;
 if (friendsFetchTimeoutRef.current) clearTimeout(friendsFetchTimeoutRef.current);

 return new Promise((resolve) => {
 friendsFetchTimeoutRef.current = setTimeout(async () => {
 try {
 let fQuery = supabase
 .from('friendships')
 .select(`
 *,
 user_data:profiles!user_id(id, nickname, avatar_url, updated_at),
 friend_data:profiles!friend_id(id, nickname, avatar_url, updated_at)
 `)
 .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`);

 if (signal) fQuery = fQuery.abortSignal(signal);

 const { data: friendships, error: fError } = await fQuery;

 let finalFriendships = friendships;

 if (fError) {
 if (fError.name === 'AbortError' || fError.message?.includes('aborted')) throw fError;
 console.warn("Using friends fallback", fError);
 let fbQuery = supabase.from('friendships').select('*').or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`);
 if (signal) fbQuery = fbQuery.abortSignal(signal);
 const fallbackRes = await fbQuery;
 if (fallbackRes.error) throw fallbackRes.error;

 const profileIds = new Set();
 fallbackRes.data.forEach(f => { profileIds.add(f.user_id); profileIds.add(f.friend_id); });
 const { data: profiles } = await supabase.from('profiles').select('id, nickname, avatar_url, updated_at').in('id', Array.from(profileIds));
 const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

 finalFriendships = fallbackRes.data.map(f => ({
 ...f,
 user_data: profileMap[f.user_id],
 friend_data: profileMap[f.friend_id]
 }));
 }

 const requests = [];
 const accepted = [];
 const sentPendingList = new Set();
 const uniqueRelationships = new Map();

 finalFriendships.forEach(f => {
 const isUserMe = f.user_id === user?.id;
 const otherId = isUserMe ? f.friend_id : f.user_id;
 const profileData = isUserMe ? f.friend_data : f.user_data;

 if (!profileData) return;

 const existing = uniqueRelationships.get(otherId);
 if (!existing || f.status === 'accepted' || (f.status === 'pending' && f.friend_id === user?.id && existing.status !== 'accepted')) {
 uniqueRelationships.set(otherId, { ...f, friendData: profileData });
 }
 });

 uniqueRelationships.forEach(rel => {
 if (rel.status === 'pending') {
 if (rel.friend_id === user?.id) requests.push({ ...rel, sender: rel.friendData });
 else sentPendingList.add(rel.friend_id);
 } else if (rel.status === 'accepted') {
 accepted.push({ ...rel, friend: rel.friendData });
 }
 });

 setPendingRequests(requests);
 setFriends(accepted);
 setPendingSentIds(sentPendingList);
 } catch (err) {
 if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
 console.warn("Friendships fetch error:", err);
 } finally {
 resolve();
 }
 }, 300);
 });
 }, [user?.id]);

 useEffect(() => {
 fetchFriendsData();

 if (!user?.id) return;
 const socialSub = supabase.channel('public:friendships_list')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
 fetchFriendsData();
 if (onRequireActionComplete) onRequireActionComplete();
 })
 .subscribe();

 return () => {
 supabase.removeChannel(socialSub);
 };
 }, [user?.id, fetchFriendsData, onRequireActionComplete]);

 const handleSearchPlayers = useCallback(async (query) => {
 setSearchQuery(query);
 if (query.trim().length === 0) { setSearchResults([]); return; }
 if (loadingAuth || !user?.id || user.id === 'undefined' || isSearchingRef.current) return;

 if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

 searchTimeoutRef.current = setTimeout(async () => {
 setSearching(true);
 isSearchingRef.current = true;
 try {
 const hasArabic = /[\u0600-\u06FF]/.test(query);
 let queryBuilder = supabase.from('profiles').select('id, nickname, avatar_url, updated_at');
 
 if (hasArabic) {
 // Fuzzy search to bypass Tatweel (ـ), hidden spaces, and aesthetic characters common in Kurdish names
 const fuzzyStr = query.replace(/\s+/g, '').split('').join('%');
 const q1 = `${fuzzyStr}%`;
 const q2 = `${fuzzyStr.replace(/ی/g, 'ي').replace(/ک/g, 'ك').replace(/ە/g, 'ه')}%`;
 const q3 = `${fuzzyStr.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ه/g, 'ە')}%`;
 
 queryBuilder = queryBuilder.or(`nickname.ilike.${q1},nickname.ilike.${q2},nickname.ilike.${q3}`);
 } else {
 queryBuilder = queryBuilder.ilike('nickname', `${query}%`);
 }
 
 queryBuilder = queryBuilder.neq('nickname', 'Admin_4rasti').neq('nickname', 'ADMIN_PEYVOK').neq('nickname', 'پەیڤۆک').neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1').neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4').neq('id', user.id).limit(40);
 
 const { data, error } = await queryBuilder;
 if (error) throw error;
 
 // Smart ranking system (Instagram style)
 const normalizeText = (text) => text.replace(/\s+/g, '').replace(/[\u0640]/g, '')
 .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ه/g, 'ە').toLowerCase();
 
 const cleanQuery = normalizeText(query);
 
 // Filter out broad fuzzy matches (only keep EXACT startsWith matches after normalization)
 const exactMatches = (data || []).filter(item => {
 return normalizeText(item.nickname || '').startsWith(cleanQuery);
 });
 
 const sortedData = exactMatches.sort((a, b) => {
 const cleanA = normalizeText(a.nickname || '');
 const cleanB = normalizeText(b.nickname || '');
 
 const getScore = (name) => {
 if (name === cleanQuery) return 100;
 if (name.startsWith(cleanQuery)) return 80;
 return 60; // All remaining are includes()
 };
 
 const scoreDiff = getScore(cleanB) - getScore(cleanA);
 if (scoreDiff !== 0) return scoreDiff;
 
 return cleanA.length - cleanB.length;
 }).slice(0, 15);
 
 setSearchResults(sortedData);
 } catch (err) {
 console.error("Search error:", err);
 } finally {
 setSearching(false);
 isSearchingRef.current = false;
 searchTimeoutRef.current = null;
 }
 }, 500);
 }, [user?.id, loadingAuth]);

 const handleAddFriend = async (friendId) => {
 try {
 if (!user?.id || pendingSentIds.has(friendId)) return;
 triggerHaptic(15);
 setPendingSentIds(prev => new Set([...prev, friendId]));
 
 // Check if it already exists to avoid 409 console error
 const { data: existing } = await supabase
 .from('friendships')
 .select('id')
 .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
 .maybeSingle();

 if (existing) return; // Already requested/friends
 
 const { error } = await supabase.from('friendships').insert([{ user_id: user.id, friend_id: friendId, status: 'pending' }]);
 if (error) { if (error.code === '23505') return; throw error; }
 } catch (err) {
 console.error("Friend request error:", err);
 setPendingSentIds(prev => { const next = new Set(prev); next.delete(friendId); return next; });
 }
 };

 const handleAcceptRequest = async (requestId) => {
 try {
 triggerHaptic(20);
 const { error } = await supabase
 .from('friendships')
 .update({ status: 'accepted' })
 .eq('id', requestId);
 if (error) throw error;
 fetchFriendsData();
 window.dispatchEvent(new CustomEvent('friendships_updated'));
 } catch (err) {
 console.error("Error accepting friend request:", err);
 }
 };

 const handleRejectRequest = async (requestId) => {
 try {
 triggerHaptic(20);
 const { error } = await supabase
 .from('friendships')
 .delete()
 .eq('id', requestId);
 if (error) throw error;
 fetchFriendsData();
 window.dispatchEvent(new CustomEvent('friendships_updated'));
 } catch (err) {
 console.error("Error rejecting friend request:", err);
 }
 };

 return (
 <div className="flex-1 w-full flex flex-col min-h-0" dir="rtl">
 {selectedPlayer && (
 <PublicProfileModal
 profile={selectedPlayer}
 currentUser={user}
 isFriend={friends.some(f => f.friend?.id === selectedPlayer.id)}
 isPending={pendingRequests.some(r => r.sender?.id === selectedPlayer.id || r.friend_id === selectedPlayer.id)}
 onClose={() => setSelectedPlayer(null)}
 onToggleBlock={handleToggleBlock}
 onOpenChat={(player) => {
 setSelectedPlayer(null);
 if (onOpenChat) onOpenChat(player);
 }}
 onActionComplete={() => {
 fetchFriendsData();
 if (onRequireActionComplete) onRequireActionComplete();
 }}
 />
 )}

 <div className="flex p-1 rounded-md border mb-4 w-full relative z-30 shadow-sm transition-all overflow-hidden bg-mono-100 dark:bg-mono-900 border-mono-200 dark:border-mono-800 duration-300 shrink-0">
 <button 
 onClick={() => { triggerHaptic(10); playTabSound(); setActiveTab('friends'); }}
 className={`flex-1 py-2.5 px-4 text-xs font-black rounded-md transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'friends' ? 'text-mono-50 dark:text-mono-50' : 'text-mono-500 hover:text-mono-900 dark:text-mono-400 dark:hover:text-mono-100'}`}
 >
 {activeTab === 'friends' && (
 <Motion.div
 layoutId="activeFriendsTabIndicator"
 className="absolute inset-0 bg-mono-900 dark:bg-mono-800 rounded-sm shadow-sm"
 transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
 />
 )}
 <span className="relative z-20 flex items-center justify-center gap-2 uppercase tracking-normal font-rabar">
 <span className="material-symbols-outlined text-[16px]">group</span>
 هەڤالێن تە
 </span>
 </button>
 <button 
 onClick={() => { triggerHaptic(10); playTabSound(); setActiveTab('search'); setTimeout(() => document.getElementById('player-search')?.focus(), 100); }}
 className={`flex-1 py-2.5 px-4 text-xs font-black rounded-md transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'search' ? 'text-mono-50 dark:text-mono-50' : 'text-mono-500 hover:text-mono-900 dark:text-mono-400 dark:hover:text-mono-100'}`}
 >
 {activeTab === 'search' && (
 <Motion.div
 layoutId="activeFriendsTabIndicator"
 className="absolute inset-0 bg-mono-900 dark:bg-mono-800 rounded-sm shadow-sm"
 transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
 />
 )}
 <span className="relative z-20 flex items-center justify-center gap-2 uppercase tracking-normal font-rabar">
 <span className="material-symbols-outlined text-[16px]">person_add</span>
 زێدەکرنا هەڤالان
 </span>
 </button>
 </div>

 {/* Invite Friends Banner */}
 <div className="w-full mb-4 p-3.5 rounded-md bg-mono-50/50 dark:bg-white/5 border border-mono-100 dark:border-white/5 flex items-center justify-between shadow-sm shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-md bg-green-100/50 dark:bg-green-900/30 flex items-center justify-center border border-green-200/50 dark:border-green-800/30">
 <span className="material-symbols-outlined text-[18px] text-green-600 dark:text-green-400 font-bold">person_add</span>
 </div>
 <h4 className="text-[12px] font-bold font-rabar text-mono-900 dark:text-mono-50">ھەڤالێن خوە داخواز بکە</h4>
 </div>
 <button onClick={() => { triggerHaptic(10); handleInvite(); }} className="px-3 py-2 bg-green-600 text-white rounded-md font-black font-rabar text-[10px] hover:brightness-110 active:scale-95 transition-all shadow-sm shrink-0 flex items-center gap-1.5">
 <span className="material-symbols-outlined text-[14px]">share</span>
 بەلاڤ بکە
 </button>
 </div>

 {activeTab === 'search' && (
 <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="relative group shrink-0">
 <span className="material-symbols-outlined absolute right-3 top-3.5 text-mono-500">search</span>
 <input
 type="text"
 id="player-search"
 name="player-search"
 aria-label="Search for players"
 placeholder="گەڕیان ل ھەڤالێن نوی..."
 value={searchQuery}
 onChange={(e) => handleSearchPlayers(e.target.value)}
 className="w-full bg-mono-100 dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-md py-3.5 pr-11 pl-4 text-sm font-bold font-rabar focus:ring-1 focus:ring-primary/20 outline-none transition-all duration-300 text-mono-900 dark:text-mono-50"
 />
 {searching && <div className="absolute left-4 top-4 w-4 h-4 border-2 border-mono-300 dark:border-mono-700 border-t-primary rounded-full animate-spin" />}
 </div>

 {searchResults.length > 0 && (
 <div className="flex-1 overflow-y-auto no-scrollbar mt-4 space-y-3 p-3 bg-mono-50 dark:bg-mono-900/50 rounded-md border border-mono-200 dark:border-mono-800 pb-28">
 <h3 className="text-[10px] font-black uppercase text-mono-500 px-1">ئەنجامێن ئەڤێ ھاتینە دیتن</h3>
 {searchResults.map(res => {
 const isFriend = friends.some(f => f.friend?.id === res.id);
 const isPending = pendingRequests.some(r => r.sender?.id === res.id || r.friend_id === res.id);

 return (
 <div key={res.id} className="flex items-center gap-3 p-2 hover:bg-mono-100 dark:hover:bg-white/5 rounded-md transition-all group cursor-pointer">
 <div className="flex items-center gap-3 flex-1" onClick={() => { triggerHaptic(10); setSelectedPlayer(res); }}>
 <Avatar src={res.avatar_url} lastActive={res.updated_at} isOnline={onlineUsers?.has(res.id)} showStatus={true} size="sm" />
 <div className="flex-1 text-right">
 <div className="font-black text-sm group-hover:text-primary transition-colors text-mono-900 dark:text-mono-100">{res.nickname}</div>
 </div>
 </div>

 {isFriend ? (
 <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md font-black text-[10px] flex items-center gap-1">
 <span className="material-symbols-outlined text-[14px]">check</span>
 ھوین ھەڤالن
 </div>
 ) : (isPending || pendingSentIds.has(res.id)) ? (
 <div className="px-3 py-1.5 bg-mono-100 dark:bg-mono-800 text-mono-400 dark:text-mono-500 border border-mono-200 dark:border-mono-700 rounded-md font-black text-[10px] flex items-center gap-1">
 <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
 چاڤەڕێبە
 </div>
 ) : (
 <button
 onClick={(e) => { e.stopPropagation(); handleAddFriend(res.id); }}
 className="px-3 py-1.5 bg-emerald-500 text-white rounded-md font-black text-[10px] flex items-center gap-1 hover:bg-emerald-600 active:scale-95 transition-all"
 >
 <span className="material-symbols-outlined text-[14px]">add</span>
 ببە ھەڤاڵ
 </button>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {activeTab === 'friends' && (
 <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300 pb-28">
 {pendingRequests.length > 0 && (
 <div className="mb-6 space-y-3">
 <h3 className="text-[10px] font-black uppercase text-mono-500 px-2">داخوازێن ھەڤالینیێ</h3>
 {pendingRequests.map(req => (
 <div key={req.id} className="flex items-center gap-3 p-3 bg-mono-white dark:bg-mono-900 rounded-md border border-mono-200 dark:border-mono-800 shadow-sm transition-colors duration-300">
 <Avatar src={req.sender?.avatar_url} lastActive={req.sender?.updated_at} isOnline={onlineUsers?.has(req.sender?.id)} showStatus={true} size="sm" />
 <div className="flex-1 text-right">
 <div className="font-black text-sm text-mono-900 dark:text-mono-100">{req.sender?.nickname}</div>
 </div>
 <div className="flex gap-2">
 <button onClick={() => handleAcceptRequest(req.id)} className="px-4 py-2 bg-emerald-500 text-white rounded-md font-black text-[10px] uppercase hover:bg-emerald-600 active:scale-95 transition-all">پەژراندن</button>
 <button onClick={() => handleRejectRequest(req.id)} className="px-4 py-2 bg-mono-200 dark:bg-mono-800 text-mono-700 dark:text-mono-300 rounded-md font-black text-[10px] uppercase hover:bg-mono-300 dark:hover:bg-mono-700 active:scale-95 transition-all">ڕەتکرن</button>
 </div>
 </div>
 ))}
 </div>
 )}

 <div className="space-y-3">
 {pendingRequests.length > 0 && <div className="w-full h-px bg-mono-200 dark:bg-mono-800 my-2" />}
 {friends.length === 0 ? (
 <div className="text-center py-6 text-mono-400 text-sm font-bold opacity-70">
 ھێشتا چ ھەڤال نینن
 </div>
 ) : (
 friends
 .sort((a, b) => {
 const activeA = new Date(a.friend?.updated_at || 0);
 const activeB = new Date(b.friend?.updated_at || 0);
 const isOnlineA = onlineUsers?.has(a.friend?.id);
 const isOnlineB = onlineUsers?.has(b.friend?.id);
 if (isOnlineA && !isOnlineB) return -1;
 if (!isOnlineA && isOnlineB) return 1;
 return activeB - activeA;
 })
 .map(f => (
 <div key={f.id} className="flex items-center gap-3 p-2 bg-mono-white dark:bg-mono-900 rounded-md border border-mono-200 dark:border-mono-800 group hover:border-primary/30 transition-all shadow-sm">
 <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => { triggerHaptic(10); setSelectedPlayer(f.friend); }}>
 <Avatar src={f.friend?.avatar_url} lastActive={f.friend?.updated_at} isOnline={onlineUsers?.has(f.friend?.id)} showStatus={true} size="sm" />
 <div className="flex-1 text-right">
 <div className="font-black text-sm text-mono-900 dark:text-mono-100 group-hover:text-primary transition-colors">{f.friend?.nickname}</div>
 </div>
 </div>
 <button 
 onClick={() => { 
 triggerHaptic(10); 
 if (onOpenChat) onOpenChat(f.friend); 
 }} 
 className="w-10 h-10 flex items-center justify-center rounded-md bg-mono-100 dark:bg-mono-800 text-mono-600 dark:text-mono-300 hover:bg-primary hover:text-white transition-all"
 >
 <span className="material-symbols-outlined text-[20px] font-bold">chat</span>
 </button>
 </div>
 ))
 )}
 </div>
 </div>
 )}
 </div>
 );
}
