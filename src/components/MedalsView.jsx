import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { MEDALS } from '../constants/medals';
import { triggerHaptic } from '../utils/haptics';
import { useAudio } from '../context/AudioContext';
import { useGameStore } from '../store/gameStore';
import { getLevelFromXP } from '../utils/progression';
import { useUser } from '../context/AuthContext';
import CinematicAchievementOverlay from './CinematicAchievementOverlay';
import { supabase } from '../lib/supabase';

export default function MedalsView({ onViewChange }) {
 const { playSettingsCloseSound } = useAudio();
 const { profileData } = useUser();
 const claimedMedals = useGameStore(s => s.claimedMedals);
   const claimMedal = useGameStore(s => s.claimMedal);
   const currentXP = useGameStore(s => s.currentXP);
   const level = getLevelFromXP(currentXP);
   const playerStats = useGameStore(s => s.playerStats);

 const [activeOverlay, setActiveOverlay] = useState(null);
 const [sharedMedals, setSharedMedals] = useState({});

 useEffect(() => {
 if (profileData?.id) {
 try {
 const stored = localStorage.getItem(`shared_medals_${profileData.id}`);
 if (stored) {
 setTimeout(() => {
 setSharedMedals(JSON.parse(stored));
 }, 0);
 }
 } catch (_e) {
 console.error("Failed to load shared medals:", _e);
 }
 }
 }, [profileData?.id]);

 const shareMedalToGlobalChat = async (medalId) => {
 if (!profileData?.id) return;
 if (sharedMedals[medalId]) return; // Prevent multiple shares
 try {
 await supabase.from('messages').insert([{
 content: `[MEDAL_SHARE:${medalId}]`,
 user_id: profileData.id,
 user_nickname: profileData.nickname || 'یاریزان'
 }]);
 setSharedMedals(prev => {
 const next = { ...prev, [medalId]: true };
 try {
 localStorage.setItem(`shared_medals_${profileData.id}`, JSON.stringify(next));
 } catch (_err) {
 // Ignore local storage errors
 }
 return next;
 });
 } catch (err) {
 console.error("Failed to share medal:", err);
 }
 };

 const handleClaimMedal = (medal) => {
 setActiveOverlay(medal);
 };

 const container = {
 hidden: { opacity: 0 },
 show: {
 opacity: 1,
 transition: { staggerChildren: 0.1 }
 }
 };

 const item = {
 hidden: { opacity: 0, scale: 0.8 },
 show: { opacity: 1, scale: 1 }
 };

 return (
 <div className="min-h-screen bg-mono-50 dark:bg-[#0a0a0c] flex flex-col items-center safe-top safe-bottom overflow-x-hidden transition-colors duration-500 relative" dir="rtl">
 {/* Background Texture for PUBG Tactical Feel */}
 <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-mono-50 to-mono-100 dark:from-[#1a1a24] dark:via-[#0a0a0c] dark:to-mono-black opacity-80 dark:opacity-40" />
 <div className="absolute inset-0 noise-grain opacity-[0.03] dark:opacity-5 pointer-events-none" />

 {/* Header */}
 <div className="w-full flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+8px)] pb-2 sticky top-0 z-50 bg-white/90 dark:bg-[#0a0a0c]/90 border-b border-mono-200 dark:border-[#2a2a35] shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
 <button
 onClick={() => { triggerHaptic(10); if (playSettingsCloseSound) playSettingsCloseSound(); onViewChange('profile'); }}
 className="w-10 h-10 rounded-[8px] bg-mono-100 dark:bg-[#1a1a24] border border-mono-200 dark:border-[#2a2a35] flex items-center justify-center text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white hover:bg-mono-200 dark:hover:bg-[#2a2a35] transition-all active:scale-90 shadow-inner"
 >
 <span className="material-symbols-outlined">arrow_forward</span>
 </button>
 <div className="flex flex-col items-center">
 <h2 className="text-xl font-black font-rabar text-mono-900 dark:text-white uppercase drop-shadow-sm dark:drop-shadow-md">پلە</h2>
 </div>
 <div className="w-10" />
 </div>

 <div className="w-full overflow-y-auto no-scrollbar pb-40 px-4 sm:px-6 pt-6 relative z-10">
 <Motion.div
 variants={container}
 initial="hidden"
 animate="show"
 className="flex flex-col gap-3"
 >
 {MEDALS.map((m) => {
 const displayData = { 
 ...(profileData || {}), 
 ...(playerStats || {}), 
 level,
 daily_streak: profileData?.daily_streak || 0,
 total_words_found: profileData?.total_words_found || 0,
 games_won: profileData?.games_won || 0,
 flawless_wins: profileData?.flawless_wins || 0
 };
 const isUnlocked = claimedMedals.includes(m.id) || m.condition(displayData);
 const isClaimable = !claimedMedals.includes(m.id) && m.condition(displayData);

 return (
 <Motion.div
 key={m.id}
 variants={item}
 className={`relative flex flex-row items-center py-5 px-6 gap-6 transition-all duration-300 border-b-4 overflow-hidden group
 ${isUnlocked ? 'bg-linear-to-r from-mono-100 to-white dark:from-[#1a1a24] dark:to-[#22222e] border-blue-500 shadow-[0_8px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]' : 'bg-mono-200/50 dark:bg-[#111116] border-mono-300 dark:border-mono-800 opacity-70 grayscale'}
 ${isClaimable ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : ''}
 `}
 style={{
 clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)',
 }}
 >
 {/* Tactical Background Elements */}
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none" />
 <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-black/5 to-transparent dark:from-black/40 pointer-events-none" />

 {/* Glow Background for Unlocked */}
 {isUnlocked && (
 <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-blue-500/20 to-transparent blur-2xl pointer-events-none" />
 )}

 {/* Icon Container (Right Side) */}
 <div className="relative flex items-center justify-center min-w-21.25 min-h-21.25 shrink-0 z-10">
 {isClaimable ? (
 <div className="relative flex flex-col items-center justify-center w-full h-full">
 <m.IconComponent className="w-20 h-20 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" size={80} disabled={false} />

 <Motion.button
 onClick={(e) => { e.stopPropagation(); triggerHaptic(20); handleClaimMedal(m); }}
 animate={{
 boxShadow: ["0px 0px 10px rgba(245,158,11,0.5)", "0px 0px 25px rgba(245,158,11,1)", "0px 0px 10px rgba(245,158,11,0.5)"]
 }}
 transition={{ duration: 1.5, repeat: Infinity }}
 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-black text-white text-[14px] active:scale-95 transition-transform z-20 whitespace-nowrap shadow-xl"
 style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
 >
 وەرگرە
 </Motion.button>
 </div>
 ) : (
 <div className="relative">
 <m.IconComponent className="w-20 h-20 drop-shadow-xl transition-transform duration-500 group-hover:scale-105" size={80} disabled={!isUnlocked} />
 {!isUnlocked && (
 <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-mono-800 rounded-full flex items-center justify-center border-2 border-mono-300 dark:border-mono-900 shadow-md">
 <span className="material-symbols-outlined text-[16px] text-white">lock</span>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Text and Condition Container (Left Side) */}
 <div className="flex flex-col items-start justify-center flex-1 w-full z-10 min-w-0 pl-2">
 <span className={`text-[20px] sm:text-[22px] font-black font-rabar mb-2 drop-shadow-sm truncate w-full ${isUnlocked ? 'text-mono-900 dark:text-white' : 'text-mono-500 dark:text-mono-600'}`}>
 {m.name}
 </span>

 <div className={`w-full py-2 px-3 relative flex items-center justify-between overflow-hidden ${isUnlocked ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-mono-300/30 dark:bg-[#111116]'} border-l-4 ${isUnlocked ? 'border-blue-500' : 'border-mono-400 dark:border-mono-700'}`}>
 <div className="flex items-center gap-1.5 min-w-0">
 {isUnlocked && <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400 shrink-0">check_circle</span>}
 <span className={`block text-[12px] sm:text-[13px] font-bold leading-tight ${isUnlocked ? 'text-blue-700 dark:text-blue-200' : 'text-mono-500 dark:text-mono-500'} truncate`}>
 {isUnlocked ? 'ئەڤ پلەیە هاتیە وەرگرتن' : m.tooltip}
 </span>
 </div>
 
 {isUnlocked && !isClaimable && !sharedMedals[m.id] && (
 <button
 onClick={(e) => { e.stopPropagation(); triggerHaptic(10); shareMedalToGlobalChat(m.id); }}
 className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black transition-all bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm"
 >
 <span className="material-symbols-outlined text-[14px]">share</span>
 بەلاڤکرن د چاتێ دا
 </button>
 )}
 </div>
 </div>
 </Motion.div>
 );
 })}
 </Motion.div>
 </div>

 {/* Cinematic Overlay for Claiming */}
 <AnimatePresence>
 {activeOverlay && (
 <CinematicAchievementOverlay
 Icon={activeOverlay.IconComponent}
 title={activeOverlay.name}
 medalId={activeOverlay.id}
 onContinue={() => {
 claimMedal(activeOverlay.id, activeOverlay.rewardAmount);
 shareMedalToGlobalChat(activeOverlay.id); // Automatic sharing
 setActiveOverlay(null);
 }}
 />
 )}
 </AnimatePresence>

 </div>
 );
}
