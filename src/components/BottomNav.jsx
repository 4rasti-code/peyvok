import React, { useState, useEffect, startTransition } from 'react';
import { motion as Motion, LayoutGroup } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { NavProfileIcon, NavLeaderboardIcon, NavLobbyIcon, NavStoreIcon, NavChatIcon } from './NavIcons';
import { useGameStore } from '../store/gameStore';

export default function BottomNav({ currentView, setCurrentView, onSettingsToggle, onTabClickSound, chatBadgeCount = 0, hasSilentGlobal = false, pendingFriendsCount = 0, userAvatarUrl }) {
 const [localActive, setLocalActive] = useState(currentView);
  const hasUnclaimedRewards = useGameStore(s => s.hasUnclaimedMedals);

 useEffect(() => {
 setLocalActive(currentView);
 }, [currentView]);

 const tabs = [
 { id: 'profile', Icon: NavProfileIcon, label: 'بەرپەڕ' },
 { id: 'leaderboard', Icon: NavLeaderboardIcon, label: 'ڕێزبەندی' },
 { id: 'lobby', Icon: NavLobbyIcon, label: 'سەرەکی' },
 { id: 'store', Icon: NavStoreIcon, label: 'بازاڕ' },
 { id: 'social_hub', Icon: NavChatIcon, label: 'چات' }
 ];

 return (
 <nav className="fixed bottom-0 left-0 right-0 w-full z-40 pointer-events-none" dir="rtl">
 <div className="relative h-24 flex items-end justify-center w-full max-w-screen-sm md:max-w-240 mx-auto pointer-events-auto">
 <LayoutGroup>
 {tabs.map((tab) => {
 const isActive = localActive === tab.id;
 const isSettings = tab.id === 'settings';
 const Icon = tab.Icon;

 return (
 <React.Fragment key={tab.id}>
 <Motion.button
 layout
 transition={{ type: "spring", bounce: 0.1, duration: 0.2 }}
 id={`nav-${tab.id}`}
 onClick={() => {
 if (tab.id !== 'store') triggerHaptic(10, true);
 if (onTabClickSound) onTabClickSound();
 if (isSettings) onSettingsToggle();
 else {
 setLocalActive(tab.id);
 setTimeout(() => {
 startTransition(() => {
 setCurrentView(tab.id);
 });
 }, 50); // 50ms buffer to allow haptics/audio/animations to fire before freezing the main thread
 }
 }}
 className={`group relative flex-1 h-22 flex flex-col items-center justify-start select-none outline-none focus:outline-none focus-visible:outline-none rounded-t-[10px] border-none appearance-none ${isActive
 ? 'bg-linear-to-b from-[#40bcf7] to-[#1a9bf0] shadow-[0_-10px_25px_rgba(0,0,0,0.45),inset_1px_0_1px_rgba(0,0,0,0.5),inset_-1px_0_1px_rgba(0,0,0,0.5),inset_0_3px_0_rgba(255,255,255,0.4)] z-20'
 : 'bg-linear-to-b from-[#2573bd] to-[#155694] shadow-[0_-8px_20px_rgba(0,0,0,0.35),inset_1px_0_1px_rgba(0,0,0,0.5),inset_-1px_0_1px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.2)] hover:brightness-110 z-10'
 }`}
 >
 <div className={`relative flex justify-center items-center w-full transition-all duration-300 ${isActive ? 'mt-1' : 'h-full'}`}>
 <div className={`pointer-events-none transition-all duration-300 relative z-10 flex items-center justify-center ${isActive ? 'scale-[1.45] -translate-y-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]' : 'scale-[1.35] -translate-y-2 opacity-100'}`}>
 {/* Spotlight Glow behind active icon */}
 {isActive && (
 <Motion.div
 initial={{ opacity: 0, scale: 0.5 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.3 }}
 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#40bcf7] opacity-50 rounded-full blur-[10px] -z-10"
 />
 )}

 <Icon
 className="w-12 h-12 relative z-10"
 isActive={isActive}
 avatarUrl={userAvatarUrl}
 />
 </div>
 </div>

 {/* Text Label */}
 {isActive && (
 <Motion.span
 initial={{ opacity: 0, y: 10, scale: 0.8, x: '-50%' }}
 animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
 transition={{ duration: 0.2 }}
 className="absolute bottom-5 left-1/2 z-20 text-[14px] sm:text-[15px] font-black font-rabar tracking-normal whitespace-nowrap uppercase pointer-events-none text-white drop-shadow-md"
 >
 {tab.label}
 </Motion.span>
 )}

 </Motion.button>
 </React.Fragment>
 );
 })}
 </LayoutGroup>

 {/* BADGE OVERLAY: Rendered on top of all tabs so they are never clipped by the active tab's z-index */}
 <div className="absolute inset-0 h-24 flex items-end justify-center pointer-events-none z-50">
 {tabs.map((tab) => {
 const isActive = localActive === tab.id;
 return (
 <div key={`badge-overlay-${tab.id}`} className="relative flex-1 h-22 flex items-center justify-center">
 <div className={`relative flex justify-center items-center w-full transition-all duration-300 ${isActive ? 'mt-1' : 'h-full'}`}>
 <div className={`relative flex items-center justify-center w-12 h-12 transition-all duration-300 ${isActive ? 'scale-[1.45] -translate-y-4' : 'scale-[1.35] -translate-y-2'}`}>
 {tab.id === 'social_hub' && chatBadgeCount > 0 && (
 <Motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 className="absolute top-0 right-0 min-w-3.5 h-3.5 px-0.5 btn-clash-micro-red rounded-sm flex items-center justify-center pointer-events-none"
 >
 <span className="text-white text-[10px] font-black font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-wider mt-0.5">
 {chatBadgeCount > 99 ? '99+' : chatBadgeCount}
 </span>
 </Motion.div>
 )}

 {tab.id === 'profile' && pendingFriendsCount > 0 && (
 <Motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 className="absolute top-0 right-0 min-w-3.5 h-3.5 px-0.5 btn-clash-micro-red rounded-sm flex items-center justify-center pointer-events-none"
 >
 <span className="text-white text-[10px] font-black font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-wider mt-0.5">
 {pendingFriendsCount > 99 ? '99+' : pendingFriendsCount}
 </span>
 </Motion.div>
 )}

 {tab.id === 'profile' && pendingFriendsCount === 0 && hasUnclaimedRewards && (
 <Motion.div
 animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
 transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
 className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0a203e] shadow-[0_0_8px_rgba(239,68,68,0.4)]"
 />
 )}

 {tab.id === 'social_hub' && hasSilentGlobal && chatBadgeCount === 0 && (
 <Motion.div
 animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
 transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
 className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a203e] shadow-[0_0_8px_rgba(16,185,129,0.4)]"
 />
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </nav>
 );
}