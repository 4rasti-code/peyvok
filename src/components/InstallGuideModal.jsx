import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share, MoreHorizontal, ChevronDown, PlusSquare, X, Bookmark, Copy, MoreVertical, History, MonitorDown, Star, Globe, Home, Lock, Settings2, RotateCw, Monitor, ChevronLeft, RotateCcw } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/AuthContext';

// --- Custom iOS Icons ---
const IosShareIcon = ({ className, strokeWidth = 1.5 }) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
 <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
 <polyline points="16 6 12 2 8 6" />
 <line x1="12" y1="2" x2="12" y2="15" />
 </svg>
);

const IosSafariReadingIcon = ({ className, strokeWidth = 1.5 }) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
 <rect x="4" y="5" width="16" height="10" rx="2" />
 <line x1="4" y1="18" x2="20" y2="18" />
 <line x1="4" y1="22" x2="12" y2="22" />
 </svg>
);

// --- Step 1 Illustration: 3 Dots ---
const Step1Illustration = () => (
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[12px] shrink-0">١</div>
 <p className="text-[14px] font-bold text-gray-800 ">ل سەر سێ خالان (...) ل خوارێ شاشەیێ ل لایێ ڕاستێ کلیک بکە.</p>
 </div>
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center gap-5 text-gray-900 min-h-40" dir="ltr">
 <div className="flex items-center gap-1.5 w-full justify-center max-w-85">
 {/* Left Button */}
 <div className="w-11 h-11 rounded-full bg-white border-[1.5px] border-gray-200 flex items-center justify-center shrink-0">
 <ChevronLeft className="w-5.5 h-5.5 text-gray-800 " strokeWidth={1.5} />
 </div>

 {/* Center Pill */}
 <div className="flex-1 h-11 px-4 rounded-[22px] bg-white border-[1.5px] border-gray-200 flex items-center gap-3 text-gray-800 ">
 <RotateCcw className="w-4.5 h-4.5 shrink-0" strokeWidth={1.75} />
 <span className="text-[15px] font-sans font-medium flex-1 truncate text-center">peyvokgame.com</span>
 <IosSafariReadingIcon className="w-4.5 h-4.5 shrink-0" strokeWidth={1.75} />
 </div>

 {/* Right Button */}
 <div className="w-11 h-11 rounded-full bg-white border-[1.5px] border-gray-200 flex items-center justify-center shrink-0">
 <MoreHorizontal className="w-6 h-6 text-gray-800 " strokeWidth={1.5} />
 </div>
 </div>
 <div className="px-5 py-2.5 rounded-full bg-white/50 border border-gray-200 shadow-sm text-[13px] font-medium text-gray-700 mt-2" dir="rtl">
 ل سەر وان هەر سێ خالێن ل لایێ ڕاستێ(...) کلیک بکە
 </div>
 </div>
 </div>
);

// --- Step 2 Illustration: Share (upward arrow) ---
const Step2Illustration = () => (
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[12px] shrink-0">٢</div>
 <p className="text-[14px] font-bold text-gray-800 ">هەڵبژاردەیا (Share) هەڵبژێرە.</p>
 </div>
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center gap-6 text-gray-900 min-h-40" dir="ltr">
 <div className="flex items-center gap-4">
 <IosShareIcon className="w-10 h-10" strokeWidth={2} />
 <span className="text-[34px] font-sans font-semibold tracking-wide">Share</span>
 </div>
 <div className="px-6 py-2.5 rounded-full bg-white/50 border border-gray-300 shadow-sm text-[13px] font-medium text-gray-700 w-full max-w-70 text-center mt-2" dir="rtl">
 هەڵبژارتنا (شەیر) هەڵبژێرە
 </div>
 </div>
 </div>
);

// --- Step 3 Illustration: View More (down chevron) ---
const Step3Illustration = () => (
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[12px] shrink-0">٣</div>
 <p className="text-[14px] font-bold text-gray-800 ">لێ بگەڕە و ل سەر (View More) کلیک بکە.</p>
 </div>
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center gap-4 text-gray-900 min-h-40" dir="ltr">
 <div className="flex flex-col items-center gap-3">
 <div className="w-13 h-13 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center">
 <ChevronDown className="w-7 h-7 opacity-90" strokeWidth={1.5} />
 </div>
 <span className="text-[17px] font-sans font-light tracking-wide text-gray-800 ">View More</span>
 </div>
 <div className="px-6 py-2.5 rounded-full bg-white/50 border border-gray-300 shadow-sm text-[13px] font-medium text-gray-700 w-full max-w-70 text-center mt-2" dir="rtl">
 هەڵبژارتنا (ڤیۆ مۆر) هەڵبژێرە
 </div>
 </div>
 </div>
);

// --- Step 4 Illustration: Add to Home Screen (plus in square) ---
const Step4Illustration = () => (
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[12px] shrink-0">٤</div>
 <p className="text-[14px] font-bold text-gray-800 ">هەڵبژاردەیا (Add to Home Screen) هەڵبژێرە.</p>
 </div>
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center gap-5 text-gray-900 min-h-40" dir="ltr">
 <div className="flex items-center gap-3">
 <PlusSquare className="w-8 h-8" strokeWidth={1.5} />
 <span className="text-[22px] font-sans font-medium">Add to Home Screen</span>
 </div>
 <div className="px-5 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-[12px] font-medium text-gray-700 mt-1" dir="rtl">
 هەڵبژاردەیا (Add to Home Screen) هەڵبژێرە
 </div>
 </div>
 </div>
);

// --- Android Step 1 Illustration: Chrome Address Bar ---
const AndroidStep1Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-4">
 <div className="bg-[#4882c8] px-3 py-2.5 rounded-sm shadow-md w-full flex items-center justify-between gap-3 text-white border border-[#3b72b5] " dir="ltr">
 <Home className="w-5.5 h-5.5 shrink-0 opacity-90 stroke-[2.5]" />
 <div className="flex-1 flex items-center gap-2 bg-white/15 border border-white/5 rounded-full px-3 py-1.25 min-w-0 shadow-sm">
 <Lock className="w-3.5 h-3.5 shrink-0 opacity-90 stroke-[2.5]" />
 <span className="font-sans text-[14px] truncate pb-px">
 peyvokgame.com
 </span>
 </div>
 <div className="flex items-center gap-2.5 shrink-0">
 <div className="w-5 h-5 border-2 border-white/90 rounded-[5px] flex items-center justify-center ml-1">
 <span className="text-[12px] font-sans font-bold pb-px">1</span>
 </div>
 <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/25 border border-white/40 shadow-sm">
 <MoreVertical className="w-5 h-5 opacity-100 stroke-[2.5]" />
 </div>
 </div>
 </div>
 </div>
);

// --- Android Step 2 Illustration: Chrome Menu (Install App) ---
const AndroidStep2Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-6 flex justify-center items-center" dir="ltr">
 <div className="w-55 bg-white border border-gray-100 rounded-lg overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] ">
 <div className="p-2 flex flex-col gap-0.5">
 <div className="flex items-center gap-3.5 px-3.5 py-2.5 text-blue-600 bg-[#f0f4ff] rounded-lg border border-[#d6e4ff] shadow-sm relative">
 <MonitorDown className="w-4.5 h-4.5" strokeWidth={2} />
 <span className="text-[14px] font-sans font-medium">Install app</span>
 </div>
 </div>
 </div>
 </div>
);

// --- Android Step 3 Illustration: Chrome Menu (Add to Home Screen) ---
const AndroidStep3Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-6 flex justify-center items-center" dir="ltr">
 <div className="w-55 bg-white border border-gray-100 rounded-lg overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] ">
 <div className="p-2 flex flex-col gap-0.5">
 <div className="flex items-center gap-3.5 px-3.5 py-2.5 text-blue-600 bg-[#f0f4ff] rounded-lg border border-[#d6e4ff] shadow-sm relative">
 <PlusSquare className="w-4.5 h-4.5" strokeWidth={2} />
 <span className="text-[14px] font-sans font-medium">Add to Home screen</span>
 </div>
 </div>
 </div>
 </div>
);

// --- Android Step 4 Illustration: Chrome Install Dialog ---
const AndroidStep4Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-center min-h-37.5" dir="ltr">
 <div className="w-full max-w-70 bg-white rounded-default shadow-2xl p-5 flex flex-col gap-4 border border-gray-200 relative overflow-hidden">
 <div className="text-[16px] font-sans font-medium text-gray-900 ">Install app</div>
 <div className="flex items-center gap-3.5">
 <div className="w-11 h-11 rounded-[10px] bg-gray-900 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 shadow-sm">
 <img src="/Peyvok-logo-02.png" alt="پەیڤۆک" className="w-[70%] h-[70%] object-contain" />
 </div>
 <div className="flex flex-col justify-center">
 <span className="text-[14px] font-sans font-medium text-gray-900 truncate max-w-40 leading-tight mb-0.5">Peyvok Game</span>
 <span className="text-[11px] font-sans text-gray-500 truncate max-w-40">peyvokgame.com</span>
 </div>
 </div>
 <div className="flex justify-end gap-5 mt-1 pt-1">
 <span className="text-[13px] font-sans font-semibold text-blue-600 cursor-pointer opacity-80 pt-1">Cancel</span>
 <span className="text-[13px] font-sans font-bold text-blue-700 cursor-pointer bg-blue-100/50 px-4 py-1.5 -mr-2 rounded-full border border-blue-200 ">Install</span>
 </div>
 </div>
 </div>
);

// --- PC Step 1 Illustration: Desktop Address Bar ---
const PcStep1Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-5 flex justify-center items-center overflow-hidden" dir="ltr">
 <div className="w-full max-w-lg bg-[#f0ecf1] h-11 rounded-full flex items-center justify-between px-3 shadow-inner border border-white/40 ">
 <div className="flex items-center gap-3">
 <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
 <Settings2 className="w-4 h-4 text-gray-700 " strokeWidth={2.5} />
 </div>
 <span className="text-[14px] font-sans text-[#1a5bbb] font-medium truncate">peyvokgame.com</span>
 </div>
 <div className="flex items-center gap-2 pr-2 shrink-0">
 <div className="p-1.5 bg-black/5 rounded-full cursor-pointer transition-colors border border-black/5 shadow-sm relative">
 <MonitorDown className="w-4.5 h-4.5 text-gray-800 " strokeWidth={2.5} />
 </div>
 </div>
 </div>
 </div>
);

// --- PC Step 2 Illustration: Install Dialog ---
const PcStep2Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-5 flex justify-center items-center min-h-40" dir="ltr">
 <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 border border-gray-100 flex flex-col gap-6">
 <div className="flex flex-col gap-4">
 <span className="text-[16px] font-sans font-medium text-gray-900 ">Install app</span>
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 rounded-[10px] bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0 shadow-sm">
 <img src="/Peyvok-logo-02.png" alt="پەیڤۆک" className="w-[70%] h-[70%] object-contain" />
 </div>
 <div className="flex flex-col justify-center gap-0.5">
 <span className="text-[14px] font-sans text-gray-900 leading-none">Peyvok</span>
 <span className="text-[12.5px] font-sans text-gray-500 leading-none mt-1">www.peyvokgame.com</span>
 </div>
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-2 pr-1">
 <button className="px-5 py-1.5 rounded-full text-[14px] font-sans font-medium bg-[#fed6dc] text-[#8f192b] ">
 Install
 </button>
 <button className="px-5 py-1.5 rounded-full text-[14px] font-sans font-medium bg-[#7a3b45] text-white outline-2 outline-white ring-2 ring-[#7a3b45]">
 Cancel
 </button>
 </div>
 </div>
 </div>
);

// --- Mac Step 1 Illustration: Safari Address Bar ---
const MacStep1Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-5 flex justify-center items-center overflow-hidden" dir="ltr">
 <div className="w-full max-w-lg bg-white h-10 rounded-md flex items-center justify-between px-2 shadow-sm border border-gray-300 ">
 <div className="flex items-center gap-2 text-gray-400">
 <ChevronLeft className="w-4.5 h-4.5" strokeWidth={2} />
 <ChevronLeft className="w-4.5 h-4.5 rotate-180" strokeWidth={2} />
 </div>
 <div className="flex flex-1 items-center justify-center">
 <span className="text-[13px] font-sans text-gray-800 font-medium truncate">peyvokgame.com</span>
 </div>
 <div className="flex items-center gap-2 pr-1">
 <div className="p-1 rounded cursor-pointer hover:bg-gray-400 transition-colors relative">
 <IosShareIcon className="w-4.5 h-4.5 text-gray-700 " strokeWidth={1.5} />
 </div>
 <PlusSquare className="w-4.5 h-4.5 text-gray-400" strokeWidth={1.5} />
 </div>
 </div>
 </div>
);

// --- Mac Step 2 Illustration: Add to Dock Menu ---
const MacStep2Illustration = () => (
 <div className="w-full bg-gray-400 rounded-xl shadow-sm border border-gray-200 p-5 flex justify-center items-center min-h-40" dir="ltr">
 <div className="w-full max-w-55 bg-white/90 rounded-lg shadow-xl border border-gray-200 flex flex-col p-1.5">
 <div className="px-3 py-1.5 rounded-md bg-blue-500 text-white flex items-center justify-between text-[13px] cursor-pointer">
 <span className="font-sans font-medium">Add to Dock...</span>
 </div>
 <div className="h-px w-full bg-gray-200 my-1"></div>
 <div className="px-3 py-1.5 rounded-md flex items-center justify-between text-[13px] text-gray-800 ">
 <span className="font-sans font-medium">Share...</span>
 <IosShareIcon className="w-3.5 h-3.5" strokeWidth={2} />
 </div>
 </div>
 </div>
);

const InstallGuideModal = ({ isOpen, onClose }) => {
 const [activeTab, setActiveTab] = useState('ios');
 const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
 const [isLoading, setIsLoading] = useState(false);
 const [isStandalone, setIsStandalone] = useState(false);
 const { user, userNickname, refreshProfile } = useUser();
 const [showFriendsList, setShowFriendsList] = useState(false);
 const [friends, setFriends] = useState([]);
 const [isLoadingFriends, setIsLoadingFriends] = useState(false);
 const [isSending, setIsSending] = useState(false);

 useEffect(() => {
 if (showFriendsList && user?.id && friends.length === 0) {
 fetchFriends();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [showFriendsList, user]);

 const fetchFriends = async () => {
 setIsLoadingFriends(true);
 try {
 const fbQuery = supabase.from('friendships').select('*').or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`).eq('status', 'accepted');
 const fallbackRes = await fbQuery;
 if (fallbackRes.error) throw fallbackRes.error;

 const profileIds = new Set();
 fallbackRes.data.forEach(f => { profileIds.add(f.user_id); profileIds.add(f.friend_id); });
 profileIds.delete(user.id);
 
 if (profileIds.size > 0) {
 const { data: profiles, error: pError } = await supabase.from('profiles').select('id, nickname, avatar_url').in('id', Array.from(profileIds));
 if (pError) throw pError;
 setFriends(profiles || []);
 } else {
 setFriends([]);
 }
 } catch (err) {
 console.error('Error fetching friends:', err);
 } finally {
 setIsLoadingFriends(false);
 }
 };

 const handleSendDownload = async (receiverId = null) => {
 if (!user || isSending) return;
 setIsSending(true);
 try {
 const { error } = await supabase.from('messages').insert([{
 user_id: user.id,
 user_nickname: userNickname || 'یاریزان',
 content: `[DOWNLOAD_SHARE]`,
 receiver_id: receiverId,
 is_read: receiverId === null ? true : false
 }]);
 if (error) throw error;
 triggerHaptic(10);
 alert('لینکا داگرتنێ ب سەرکەفتیانە هاتە هنارتن!');
 setShowFriendsList(false);
 } catch (err) {
 console.error('Error sending download:', err);
 alert('خەلەتیەک د هنارتنێ دا دروست بوو.');
 } finally {
 setIsSending(false);
 }
 };
 useEffect(() => {
 const checkStandalone = () => {
 const isPwa = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
 setIsStandalone(!!isPwa);
 };
 checkStandalone();
 window.addEventListener('resize', checkStandalone);
 return () => window.removeEventListener('resize', checkStandalone);
 }, []);

 const handleCompleteGuide = async () => {
 if (!user) {
 onClose();
 return;
 }
 try {
 setIsLoading(true);
 triggerHaptic(20);
 const { error } = await supabase
 .from('profiles')
 .update({ has_completed_install_guide: true })
 .eq('id', user.id);

 if (error) throw error;

 // Update local profile state immediately via AuthContext
 if (refreshProfile) {
 refreshProfile(user.id);
 }

 onClose();
 } catch (error) {
 console.error("Error updating install guide completion:", error);
 } finally {
 setIsLoading(false);
 }
 };

 if (isOpen !== prevIsOpen) {
 setPrevIsOpen(isOpen);
 if (isOpen) {
 setActiveTab('ios');
 }
 }

 useEffect(() => {
 if (isOpen) {
 triggerHaptic(50);
 }
 }, [isOpen]);

 if (!isOpen) return null;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-999 flex items-center justify-center p-4 pt-12">
 {/* Backdrop */}
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/90 "
 />

 {/* Modal Content */}
 <Motion.div
 initial={{ scale: 0.95, opacity: 0, y: 10 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.95, opacity: 0, y: 10 }}
 className="w-full max-w-md flex flex-col bg-[#0ea5e9] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden z-50 max-h-[85vh]"
 dir="rtl"
 >
 {/* Inner 3D Highlight Layer (Tapered Top) */}
 <div 
 className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>
 
 {/* Inner 3D Shadow Layer (Bottom & Sides) */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight (stops at middle of text) */}
 <div className="absolute top-1.5 inset-x-1.5 h-10 bg-white/20 pointer-events-none z-0 rounded-t-[8px]"></div>

 {/* Header */}
 <div className="pt-5 pb-3 text-center relative shrink-0 z-10 w-full flex items-center justify-center">
 <h2 
 className="text-[20px] font-black text-white leading-none flex items-center justify-center gap-2 relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 داگرتنا یاریێ
 </h2>
 </div>

 {/* Tabs */}
 <div className="flex w-full px-3 z-10 relative mt-2 mb-2 shrink-0 gap-2">
 <button
 onClick={() => { triggerHaptic(10); setActiveTab('ios'); }}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[13px] transition-transform duration-100 flex items-center justify-center gap-1.5 outline-none btn-clash-sm ${
 activeTab === 'ios' 
 ? 'btn-clash-sm-orange text-white z-20' 
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 ئایفۆن
 </button>
 <button
 onClick={() => { triggerHaptic(10); setActiveTab('android'); }}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[13px] transition-transform duration-100 flex items-center justify-center gap-1.5 outline-none btn-clash-sm ${
 activeTab === 'android' 
 ? 'btn-clash-sm-orange text-white z-20' 
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 ئەندرۆید
 </button>
 <button
 onClick={() => { triggerHaptic(10); setActiveTab('windows'); }}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[13px] transition-transform duration-100 flex items-center justify-center gap-1.5 outline-none btn-clash-sm ${
 activeTab === 'windows' 
 ? 'btn-clash-sm-orange text-white z-20' 
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 ویندۆز
 </button>
 <button
 onClick={() => { triggerHaptic(10); setActiveTab('mac'); }}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[13px] transition-transform duration-100 flex items-center justify-center gap-1.5 outline-none btn-clash-sm ${
 activeTab === 'mac' 
 ? 'btn-clash-sm-orange text-white z-20' 
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 ماک
 </button>
 </div>

 {/* Content Area */}
 <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-4 rounded-[8px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0 z-10">
 {/* Inner White Box Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 
 {/* Scrollable Body */}
 <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 relative z-20">
 <AnimatePresence mode="wait">
 {activeTab === 'ios' && (
 <Motion.div
 key="ios"
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 10 }}
 transition={{ duration: 0.2 }}
 className="space-y-6"
 >
 <div className="bg-[#d0dbf0] border-2 border-[#a5bce6] text-[#2c4b8b] p-3 rounded-lg text-sm mb-4 text-right leading-relaxed font-bold shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]">
 تێبینی: بۆ زێدەکرنا یاریێ وەکو ئەپ ل سەر شاشەیا مۆبایلێ، پێدڤیە ئەپێ سەفاری (Safari) ڤەکەی. پاشان ل ناڤ گۆگڵی بنڤیسە (پەیڤۆک) و لێبگەڕە. یان ژی ب ڕێکا لینکێ یاریێ (peyvokgame.com) لێبگەڕە.
 </div>

 <Step1Illustration />
 <Step2Illustration />
 <Step3Illustration />
 <Step4Illustration />

 </Motion.div>
 )}

 {activeTab === 'android' && (
 <Motion.div
 key="android"
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 10 }}
 transition={{ duration: 0.2 }}
 className="space-y-6"
 >
 <div className="bg-[#d0dbf0] border-2 border-[#a5bce6] text-[#2c4b8b] p-3 rounded-lg text-sm mb-4 text-right leading-relaxed font-bold shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]">
 تێبینی: بۆ زێدەکرنا یاریێ وەکو ئەپ ل سەر شاشەیا مۆبایلێ، پێدڤیە ئەپێ گۆگڵ کرۆمی ڤەکەی. پاشان ل ناڤ گۆگڵی بنڤیسە (پەیڤۆک) و لێبگەڕە. یان ژی ب ڕێکا لینکێ یاریێ (peyvokgame.com) لێبگەڕە.
 </div>
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">١</div>
 <p className="text-[14px] font-bold text-[#3a404a]">ل سەر سێ خالان (⋮) ل سەرێ شاشەیێ ل لایێ ڕاستێ کلیک بکە.</p>
 </div>
 <AndroidStep1Illustration />
 </div>

 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">٢</div>
 <p className="text-[14px] font-bold text-[#3a404a]">هەڵبژاردەیا (Install app) هەڵبژێرە.</p>
 </div>
 <AndroidStep2Illustration />
 </div>

 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">٣</div>
 <p className="text-[14px] font-bold text-[#3a404a]">ئەگەر هەڵبژاردەیا (Install app) نەبیت، هەڵبژاردەیا (Add to Home screen) هەڵبژێرە.</p>
 </div>
 <AndroidStep3Illustration />
 </div>

 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">٤</div>
 <p className="text-[14px] font-bold text-[#3a404a]">د پەنجەرەیا نوی دا ل سەر (Install) یان (Add) کلیک بکە.</p>
 </div>
 <AndroidStep4Illustration />
 </div>
 </Motion.div>
 )}

 {activeTab === 'windows' && (
 <Motion.div
 key="windows"
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 10 }}
 transition={{ duration: 0.2 }}
 className="space-y-6"
 >
 <div className="bg-[#d0dbf0] border-2 border-[#a5bce6] text-[#2c4b8b] p-3 rounded-lg text-sm mb-4 text-right leading-relaxed font-bold shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]">
 تێبینی: بۆ زێدەکرنا یاریێ وەکو ئەپ ل سەر شاشەیا ویندۆزێ (Windows)، پێدڤیە گۆگڵ کرۆم یان ئیدج (Edge) ڤەکەی. پاشان ل ناڤ گۆگڵی بنڤیسە (پەیڤۆک) و لێبگەڕە. یان ژی ب ڕێکا لینکێ یاریێ (peyvokgame.com) لێبگەڕە.
 </div>
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">١</div>
 <p className="text-[14px] font-bold text-[#3a404a]">ل سەر ئایکۆنێ داگرتنێ ب ڕەخ ناڤونیشانێ سایتی ڤە کلیک بکە.</p>
 </div>
 <PcStep1Illustration />
 </div>
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">٢</div>
 <p className="text-[14px] font-bold text-[#3a404a]">د پەنجەرەیا نوی دا ل سەر (Install) کلیک بکە.</p>
 </div>
 <PcStep2Illustration />
 </div>
 </Motion.div>
 )}

 {activeTab === 'mac' && (
 <Motion.div
 key="mac"
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 10 }}
 transition={{ duration: 0.2 }}
 className="space-y-6"
 >
 <div className="bg-[#d0dbf0] border-2 border-[#a5bce6] text-[#2c4b8b] p-3 rounded-lg text-sm mb-4 text-right leading-relaxed font-bold shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)]">
 تێبینی: بۆ زێدەکرنا یاریێ وەکو ئەپ ل سەر شاشەیا ماک (Mac)، پێدڤیە سەفاری (Safari) ڤەکەی. پاشان ل ناڤ گۆگڵی بنڤیسە (پەیڤۆک) و لێبگەڕە. یان ژی ب ڕێکا لینکێ یاریێ (peyvokgame.com) لێبگەڕە.
 </div>
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">١</div>
 <p className="text-[14px] font-bold text-[#3a404a]">ل سەر ئایکۆنێ شەیر (Share) ب ڕەخ ناڤونیشانێ سایتی ڤە کلیک بکە، یان ژی ژ مێنیۆیا فایل (File) سەرێ شاشەیێ.</p>
 </div>
 <MacStep1Illustration />
 </div>
 <div className="flex flex-col gap-3 mb-6">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2c4b8b] flex items-center justify-center font-bold text-[12px] shrink-0">٢</div>
 <p className="text-[14px] font-bold text-[#3a404a]">پاشان هەڵبژاردەیا (Add to Dock) هەڵبژێرە.</p>
 </div>
 <MacStep2Illustration />
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 
 {/* Footer Footer */}
 <div className="p-4 shrink-0 flex flex-col gap-3 relative z-20">
 {/* Global Friend List Modal */}
 {typeof document !== 'undefined' && document.body ? createPortal(
 <AnimatePresence>
 {showFriendsList && (
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/90 transition-colors duration-500 overflow-hidden"
 onClick={() => setShowFriendsList(false)}
 dir="rtl"
 >
 <Motion.div
 initial={{ scale: 0.95, opacity: 0, y: 10 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.95, opacity: 0, y: 10 }}
 onClick={e => e.stopPropagation()}
 className="w-full max-w-100 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden max-h-[85vh]"
 >
 {/* Inner 3D Highlight Layer */}
 <div 
 className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>
 
 {/* Inner 3D Shadow Layer */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight */}
 <div className="absolute top-1.5 inset-x-1.5 h-7 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>

 {/* Header */}
 <div className="w-full relative z-10 flex items-center justify-center pt-5 pb-4 shrink-0">
 <h2 
 className="text-[20px] font-black text-white leading-none relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 هەڤالەکێ هەڵبژێرە
 </h2>
 <button
 onClick={() => setShowFriendsList(false)}
 className="absolute right-3 top-3 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
 >
 {/* Glass Reflection Highlight */}
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-sm"></div>
 <svg viewBox="0 0 24 24" className="w-4 h-4 -translate-y-px relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 </svg>
 </button>
 </div>

 {/* Content Area */}
 <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-4 rounded-[12px] bg-[#a3b3cc] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 <div className="relative z-20 flex flex-col p-3 overflow-y-auto custom-scrollbar gap-2 max-h-87.5">
 {isLoadingFriends ? (
 <div className="flex justify-center p-4">
 <div className="w-6 h-6 border-2 border-[#121316]/20 border-t-[#121316] rounded-full animate-spin"></div>
 </div>
 ) : friends.length > 0 ? (
 friends.map(friend => (
 <div key={friend.id} className="relative flex items-center justify-between p-2.5 rounded-[10px] transition-all bg-[linear-gradient(to_bottom,#b8c6dc_50%,#9caecc_50%)] border-[1.5px] border-b-4 border-[#2c3951] shadow-sm">
 <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2" dir="rtl">
 <div className="relative shrink-0 mr-1">
 {friend.avatar_url && friend.avatar_url !== 'default' ? (
 <img src={friend.avatar_url} alt={friend.nickname} className="w-10.5 h-10.5 rounded-full border-[1.5px] border-[#181a20] object-cover bg-white shadow-sm" />
 ) : (
 <div className="w-10.5 h-10.5 rounded-full bg-slate-200 flex items-center justify-center text-[16px] font-black text-[#181a20] uppercase border-[1.5px] border-[#181a20] shadow-sm">
 {(friend.nickname || '?')[0]}
 </div>
 )}
 </div>
 <span className="text-[17px] font-black text-[#1a1c23] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] pr-1 font-rabar truncate leading-none">
 {friend.nickname}
 </span>
 </div>
 <button onClick={() => { handleSendDownload(friend.id); setShowFriendsList(false); }} className="shrink-0 flex items-center justify-center px-4 py-2.5 rounded-[8px] bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60a5fa] hover:to-[#2563eb] transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#115ab5] border-[1.5px] border-[#181a20] overflow-hidden group">
 <span className="text-[14px] font-black text-white leading-none font-rabar drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] group-active:translate-y-0.5">هنارتن</span>
 </button>
 </div>
 ))
 ) : (
 <div className="flex flex-col items-center justify-center py-6 text-center px-4">
 <div className="w-12 h-12 rounded-[10px] bg-[#8997b0] border border-black/10 flex items-center justify-center mb-3 text-[#51596b] shadow-inner">
 <span className="material-symbols-outlined text-2xl">person_off</span>
 </div>
 <p className="text-[13px] font-bold text-[#51596b]">چ هەڤال نینن!</p>
 </div>
 )}
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>,
 document.body
 ) : null}

 <div className="flex flex-row gap-2">
 <button
 onClick={() => handleSendDownload(null)}
 disabled={isSending}
 className="relative shrink-0 flex-1 h-11 rounded-md font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-1.5 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3b82f6] shadow-[inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-3px_0_#1d4ed8,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer disabled:opacity-50"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/10"></div>
 <span className="material-symbols-outlined text-[16px] relative z-10">public</span>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20' }}>
 چاتا گشتی
 </span>
 </button>
 
 <button
 onClick={() => { triggerHaptic(10); setShowFriendsList(!showFriendsList); }}
 className="relative shrink-0 flex-1 h-11 rounded-md font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-1.5 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#8b5cf6] to-[#6d28d9] hover:from-[#a78bfa] hover:to-[#8b5cf6] shadow-[inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-3px_0_#5b21b6,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/10"></div>
 <span className="material-symbols-outlined text-[16px] relative z-10">group</span>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20' }}>
 بۆ هەڤالان
 </span>
 </button>
 </div>

 <button
 onClick={handleCompleteGuide}
 disabled={isLoading}
 className={`relative w-full h-11 mt-1 rounded-md font-black font-rabar text-[15px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#65e065] to-[#3ab53a] hover:from-[#76e876] hover:to-[#40c740] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#238523,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer`}
 >
 <span 
 className="text-white leading-none relative z-10 -translate-y-px tracking-wide text-center px-2 flex items-center justify-center" 
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 {isLoading ? 'چاڤەڕێ بە...' : (isStandalone ? 'دەستپێکرنا یاریێ' : 'تێگەهشتم')}
 </span>
 </button>
 </div>
 </div>
 </Motion.div>
 </div>
 </AnimatePresence>
 );
};

export default InstallGuideModal;
