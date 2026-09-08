import React, { useEffect, useState, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/AuthContext';
import { MEDALS } from '../constants/medals';
import { triggerHaptic } from '../utils/haptics';
import { getLevelFromXP } from '../utils/progression';
import { 
 playNoberaSfx, 
 playPalawanSfx, 
 playExpertSfx, 
 playMamostaSfx, 
 playShanaziKurdistanSfx, 
 playShanaziJihaniSfx 
} from '../utils/audio';

export default function AchievementToastManager() {
 const { profileData } = useUser();
 const [queue, setQueue] = useState([]);
 const [currentToast, setCurrentToast] = useState(null);
 const hasInitialized = useRef(false);
 const previousLevelRef = useRef(null);

 // Check for newly unlocked achievements
 useEffect(() => {
 if (!profileData) return;

 const computedLevel = profileData ? getLevelFromXP(profileData.xp || 0) : 1;
 const displayData = { ...(profileData || {}), ...(profileData?.statistics || {}), level: computedLevel };
 
 // Get previously unlocked medals from local storage
 const stored = localStorage.getItem('peyvchin_unlocked_medals');
 const previouslyUnlocked = stored ? JSON.parse(stored) : [];

 if (!hasInitialized.current) {
 // First time we get profile data: just silently sync all currently unlocked medals to local storage
 const currentUnlocked = MEDALS.filter(m => m.condition(displayData)).map(m => m.id);
 
 // Add to previouslyUnlocked without showing toasts to prevent spam on first load
 const merged = Array.from(new Set([...previouslyUnlocked, ...currentUnlocked]));
 localStorage.setItem('peyvchin_unlocked_medals', JSON.stringify(merged));
 
 previousLevelRef.current = computedLevel;
 hasInitialized.current = true;
 return;
 }

 // Level up broadcast check removed
 previousLevelRef.current = computedLevel;

 const claimedMedals = profileData?.claimed_medals || [];
 
 const newUnlocked = [];
 MEDALS.forEach(medal => {
 // If they have already claimed the reward for this medal in the DB, 
 // or we already showed them the toast in this local session, don't show it again.
 if (
 medal.condition(displayData) && 
 !previouslyUnlocked.includes(medal.id) && 
 !claimedMedals.includes(medal.id)
 ) {
 newUnlocked.push(medal);
 previouslyUnlocked.push(medal.id);


 }
 });

 if (newUnlocked.length > 0) {
 localStorage.setItem('peyvchin_unlocked_medals', JSON.stringify(previouslyUnlocked));
 setTimeout(() => {
 setQueue(prev => [...prev, ...newUnlocked]);
 }, 0);
 }
 }, [profileData]);

 // Process the queue
 useEffect(() => {
 if (!currentToast && queue.length > 0) {
 setTimeout(() => {
 setCurrentToast(queue[0]);
 setQueue(prev => prev.slice(1));
 }, 0);
 }
 }, [queue, currentToast]);

 // Auto-dismiss the toast and play sound
 useEffect(() => {
 if (currentToast) {
 if (currentToast.id === 'nobera') {
 playNoberaSfx();
 triggerHaptic(50);
 } else if (currentToast.id === 'palawan') {
 playPalawanSfx();
 triggerHaptic(50);
 } else if (currentToast.id === 'expert') {
 playExpertSfx();
 triggerHaptic(30);
 } else if (currentToast.id === 'mamosta') {
 playMamostaSfx();
 triggerHaptic(30);
 } else if (currentToast.id === 'shanazi_kurdistan') {
 playShanaziKurdistanSfx();
 triggerHaptic(40);
 } else if (currentToast.id === 'shanazi_jihani') {
 playShanaziJihaniSfx();
 triggerHaptic(40);
 } else {
 triggerHaptic(20);
 }

 const timer = setTimeout(() => {
 setCurrentToast(null);
 }, 4500); // stay on screen for 4.5 seconds
 return () => clearTimeout(timer);
 }
 }, [currentToast]);

 const isHeavy = currentToast?.id === 'nobera' || currentToast?.id === 'palawan';

 return (
 <div className="fixed top-1/4 left-0 right-0 z-9999 pointer-events-none flex flex-col items-center justify-center px-4">
 <AnimatePresence mode="wait">
 {currentToast && (
 <Motion.div
 key={currentToast.id}
 initial={isHeavy ? { opacity: 0, y: -250, scale: 1.5, rotate: 10 } : { opacity: 0, y: -80, scale: 0.3, rotate: -15 }}
 animate={isHeavy ? { opacity: 1, y: 0, scale: 1, rotate: [10, -5, 5, -2, 0] } : { opacity: 1, y: 0, scale: 1, rotate: 0 }}
 exit={{ opacity: 0, scale: 1.5 }}
 transition={isHeavy ? { type: "spring", stiffness: 450, damping: 12, mass: 1.5 } : { type: "spring", stiffness: 300, damping: 20 }}
 className="flex flex-col items-center justify-center pointer-events-none"
 dir="rtl"
 >
 {/* The beautiful floating medal */}
 <div className="relative flex items-center justify-center">
 {/* Subtle background glow, no hard background */}
 <div className={`absolute inset-0 rounded-full opacity-30 ${currentToast.color.replace('text-', 'bg-')}`} />
 
 <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
 <currentToast.IconComponent size="100%" className="w-full h-full drop-shadow-2xl" isShining={true} />
 </div>
 </div>

 <Motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
 className="mt-6 flex flex-col items-center"
 >
 <p className={`text-sm sm:text-base font-black mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase ${currentToast.color}`}>
 دەستکەفتێ نوی!
 </p>
 <h3 className="text-3xl sm:text-5xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] text-center">
 {currentToast.name}
 </h3>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
