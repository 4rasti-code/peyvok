import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AVATARS, DEFAULT_AVATAR } from '../data/avatars';
import { COUNTRIES } from '../data/countries';
import { supabase } from '../lib/supabase';
import FlagBadge from './FlagBadge';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits } from '../utils/formatters';
import ExperienceBar from './ExperienceBar';
import Avatar from './Avatar';
import { useUser } from '../context/AuthContext';
import { useGameStore } from '../store/gameStore';
import { useAudio } from '../context/AudioContext';

import { getLevelFromXP, getLevelTier } from '../utils/progression';
import { getCroppedImg } from '../utils/imageUtils';
import Cropper from 'react-easy-crop';
import { MEDALS } from '../constants/medals';
import FriendsList from './FriendsList';
import { NAME_FONTS } from '../constants/nameFonts';
import { NAME_STYLES } from '../constants/nameStyles';
import PremiumName from './PremiumName';
import { BUNDLES } from '../constants/bundles';
import CrSlider from './CrSlider';
import CloseButton from './CloseButton';

export default function ProfileView({ onProfileSave, onOpenSettings, onViewChange, onOpenChat, pendingFriendsCount, initialFriendsModalOpen, onFriendsModalConsumed, isVisible }) {
 const {
 user, userNickname, userAvatar, profileData,
 equippedFont, equippedNameStyle, equippedBundle
 } = useUser();

 const currentXP = useGameStore(s => s.currentXP);
  const dailyStreak = useGameStore(s => s.dailyStreak);
  const lastStreakAt = useGameStore(s => s.lastStreakAt);
  const userRank = useGameStore(s => s.userRank);
  const progressPercent = useGameStore(s => s.progressPercent);
  const solvedWords = useGameStore(s => s.solvedWords);
  const hasUnclaimedMedals = useGameStore(s => s.hasUnclaimedMedals);
  const level = getLevelFromXP(currentXP);

 const audioContext = useAudio();
 const { playSaveSound, playTabSound /* , playVictorySound */ } = audioContext;
 const [draftAvatar, setDraftAvatar] = useState(userAvatar);

 const [saveSuccess, setSaveSuccess] = useState(false);
 const [cropSize, setCropSize] = useState({ width: 300, height: 300 });

 const cropperContainerRef = useCallback((node) => {
 if (node) {
 const { width } = node.getBoundingClientRect();
 setCropSize({ width, height: width });
 }
 }, []);

 const [isUploading, setIsUploading] = useState(false);
 const fileInputRef = useRef(null);

 const today = new Date();
 today.setHours(0, 0, 0, 0);
 let isStreakAtRisk = false;
 if (lastStreakAt) {
 const streakDate = new Date(lastStreakAt);
 streakDate.setHours(0, 0, 0, 0);
 const diffDays = Math.floor((today - streakDate) / (1000 * 60 * 60 * 24));
 if (diffDays >= 1) isStreakAtRisk = true;
 }

 const [pendingFile, setPendingFile] = useState(null);
 const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
 const bgRef = useRef(null);
 const [isCropModalOpen, setIsCropModalOpen] = useState(false);
 const [imageToCrop, setImageToCrop] = useState(null);
 const [crop, setCrop] = useState({ x: 0, y: 0 });
 const [zoom, setZoom] = useState(1);
 const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
 const [croppedBlob, setCroppedBlob] = useState(null);

 const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

 useEffect(() => {
 if (initialFriendsModalOpen) {
 setIsFriendsModalOpen(true);
 if (onFriendsModalConsumed) onFriendsModalConsumed();
 }
 }, [initialFriendsModalOpen, onFriendsModalConsumed]);

 useEffect(() => {
 if (!isVisible) {
 setIsFriendsModalOpen(false);
 }
 }, [isVisible]);

 const handleBackgroundClick = (e) => {
 // Pulse on background void clicks
 const isInteractiveElement = e.target.closest('button') || e.target.closest('input') || e.target.closest('.interactive-zone');
 if (!isInteractiveElement || e.target.classList.contains('bg-trigger-zone')) {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = (e.clientX - rect.left) / rect.width;
 const y = (e.clientY - rect.top) / rect.height;
 bgRef.current?.pulse(x, y);
 }
 };

 useEffect(() => {
 setDraftAvatar(userAvatar);
 }, [userAvatar]);

 if (!user || user === null) {
 return <div className="flex flex-col items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
 }

 const safeLevel = getLevelFromXP(currentXP || 0);
 const effectiveProgress = (progressPercent || 0) / 100;

 // Country and Nickname are handled in SettingsModal

 const tier = getLevelTier(safeLevel);


 const getLatestMedal = () => {
 if (!profileData?.claimed_medals || profileData.claimed_medals.length === 0) return null;
 const latestId = profileData.claimed_medals[profileData.claimed_medals.length - 1];
 return MEDALS.find(m => m.id === latestId) || null;
 };

 const bestMedal = getLatestMedal();
 const isBestUnlocked = bestMedal ? profileData?.claimed_medals?.includes(bestMedal.id) : false;

 const isLoading = !user || userNickname === 'یاریزان';

 const fontObj = NAME_FONTS[equippedFont] || NAME_FONTS['default-ku'];
 const styleObj = NAME_STYLES[equippedNameStyle] || {};
 const bundleObj = BUNDLES[equippedBundle] || BUNDLES['default'];

 const handleImageUpload = (e) => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = () => {
 setImageToCrop(reader.result);
 setIsCropModalOpen(true);
 setZoom(1);
 setCrop({ x: 0, y: 0 });
 };
 reader.readAsDataURL(file);
 };

 const onCropComplete = (croppedArea, croppedAreaPixels) => {
 setCroppedAreaPixels(croppedAreaPixels);
 };

 const handleConfirmCrop = async () => {
 if (!imageToCrop || !croppedAreaPixels) return;
 try {
 setIsUploading(true);
 const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);

 // Generate unique filename
 const fileName = `${user?.id || 'guest'}-${Date.now()}.jpg`;

 // Upload directly to Supabase Storage
 const { error: uploadError } = await supabase.storage
 .from('avatars')
 .upload(fileName, blob, {
 contentType: 'image/jpeg',
 upsert: true
 });

 if (uploadError) throw uploadError;

 // Get the public URL
 const { data: { publicUrl } } = supabase.storage
 .from('avatars')
 .getPublicUrl(fileName);

 // Close modal and show feedback immediately (Optimistic UI)
 setIsCropModalOpen(false);
 setDraftAvatar(publicUrl);
 setSaveSuccess(true);
 playSaveSound();
 triggerHaptic([20, 10, 20]);

 // Update the profile in the background (don't await)
 onProfileSave({
 avatar_url: publicUrl
 }).then(() => {
 console.log("[ProfileView] Profile synced in background");
 }).catch(err => {
 console.error("[ProfileView] Background sync failed:", err);
 });

 // Cleanup
 setCroppedBlob(null);
 if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
 setLocalPreviewUrl(null);
 setTimeout(() => setSaveSuccess(false), 2000);

 } catch (err) {
 console.error("Crop/Save failed:", err);
 alert(err.message || 'شاشیەک ڕوویدا د سەیڤکرنا وێنەی دا');
 } finally {
 setIsUploading(false);
 }
 };



 const handleSave = async () => {
 try {
 setIsUploading(true);
 playSaveSound();
 triggerHaptic([20, 10, 20]);
 let finalAvatar = draftAvatar;

 // Use cropped blob if available
 const uploadSource = croppedBlob;

 if (uploadSource || pendingFile) {
 try {
 const fileExt = pendingFile ? pendingFile.name.split('.').pop() : 'jpg';
 const fileName = `${user?.id || 'guest'}-${Date.now()}.${fileExt}`;
 const uploadData = uploadSource || pendingFile;

 const { error: uploadError } = await supabase.storage
 .from('avatars')
 .upload(fileName, uploadData, { contentType: uploadSource ? 'image/jpeg' : undefined });

 if (!uploadError) {
 const { data: { publicUrl } } = supabase.storage
 .from('avatars')
 .getPublicUrl(fileName);
 finalAvatar = publicUrl;
 } else {
 console.error("Upload error details:", uploadError);
 alert("نەتوانرا وێنە باربکرێت! ڕەنگە سەتڵا (avatars) ل Supabase نەیێ دروستکری یان ڕێگەپێدان نینە.");
 setIsUploading(false);
 return; // Stop saving!
 }
 } catch (upErr) {
 console.error("Upload process crashed:", upErr);
 alert("هەڵەیەک ڕوویدا لە بارکردنی وێنەکە");
 setIsUploading(false);
 return; // Stop saving!
 }
 }

 await onProfileSave({ avatar_url: finalAvatar });
 setSaveSuccess(true);
 setPendingFile(null);
 setCroppedBlob(null);
 setLocalPreviewUrl(null);
 setTimeout(() => setSaveSuccess(false), 2000);
 } catch (err) {
 alert(err.message || 'شاشیەک ڕوویدا');
 } finally {
 setIsUploading(false);
 }
 };


 return (
 <div
 onClick={handleBackgroundClick}
 className="w-full max-w-full mx-auto h-full flex flex-col pt-0 pb-0 overflow-x-hidden relative z-10 bg-transparent transition-colors duration-500"
 >
 <div className="absolute inset-0 pointer-events-none z-0">

 </div>

 <div className="mb-4 text-center flex flex-col items-center relative z-10 bg-trigger-zone w-full">
 <div 
 className={`relative w-full aspect-square sm:aspect-2/1 sm:max-h-95 overflow-hidden group transition-colors duration-300 ${bundleObj.id !== 'default' ? bundleObj.cardBg : 'bg-linear-to-b from-[#0b1329] via-[#112542] to-[#18395f]'}`}
 >

 {/* 1. Texture Layer */}
 <div 
 className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay" 
 style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/hexellence.png')" }}
 ></div>


 {/* 3. Top Header: Save & Badges */}
 <div className="absolute top-0 left-0 right-0 h-[68%] sm:h-[70%] z-60 px-6 sm:px-6 pt-[calc(env(safe-area-inset-top)+36px)] sm:pt-[calc(env(safe-area-inset-top)+36px)] flex justify-between items-start pointer-events-none w-full" dir="ltr">
 {/* Left: Settings Icon */}
 <div className="relative pointer-events-auto">
 <Motion.button
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 transition={{ type: "spring", stiffness: 400, damping: 17 }}
 onClick={(e) => { e.stopPropagation(); triggerHaptic(10); onOpenSettings?.(); }}
 className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-emerald-400 transition-all -ml-2"
 >
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '36px', height: '36px' }}>
 <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
 </svg>
 </Motion.button>
 </div>

 {/* Right: Level Shield (Restored Original Style) */}
 <div className="relative w-20 flex flex-col items-end pointer-events-auto">
 <div className="relative flex flex-col items-center justify-center">
 <svg width="48" height="55" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill="url(#levelMedalGradient)" stroke="white" strokeWidth="4" strokeOpacity="0.3" />
 <defs>
 <linearGradient id="levelMedalGradient" x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
 <stop stopColor={tier.stop1} />
 <stop offset="1" stopColor={tier.stop2} />
 </linearGradient>
 </defs>
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center pt-1" dir="rtl">
 <span className="text-[9px] font-black text-slate-900 uppercase leading-none mb-0.5">ئاست</span>
 <span className="text-[14px] font-black text-slate-950 leading-none tabular-nums">{toKuDigits(safeLevel || level || 1)}</span>
 </div>
 </div>
 </div>
 </div>

 {/* 4. Central Avatar Section - Maximum Top Position with Progress Ring */}
 <div className="absolute top-0 left-0 right-0 h-[68%] sm:h-[70%] flex items-center justify-center z-30 pointer-events-none">
 
 {/* Wrapper for effects and avatar so effects don't scale on hover */}
 <div className="relative flex items-center justify-center p-2 mt-8 sm:mt-8 w-full h-full">
 
 {/* Magical Ethereal Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 z-0 pointer-events-none opacity-40 mix-blend-screen" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(95, 180, 255, 1) 0%, rgba(59, 130, 246, 0.4) 40%, transparent 70%)' }}></div>
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 z-0 pointer-events-none opacity-60 mix-blend-overlay" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1) 0%, transparent 70%)' }}></div>

 <Motion.div
 className="relative pointer-events-auto cursor-pointer group/avatar z-10"
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => { triggerHaptic(10); fileInputRef.current?.click(); }}
 >

 {/* LOOT GLOW / MAGIC BURST (LEGENDARY ONLY) */}
 {tier.isLegendary && (
 <div className="absolute inset-0 flex items-center justify-center">
 <Motion.div
 animate={{
 rotate: [0, 360]
 }}
 transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
 className="absolute w-44 h-44 bg-radial from-cyan-400/10 via-purple-500/5 to-transparent blur-2xl opacity-40"
 />

 {/* DIAMOND SHARDS PARTICLES - Emitting from edges */}
 {[...Array(8)].map((_, i) => {
 const angle = (i * 45) * (Math.PI / 180);
 const radius = 46; // Emerges from the ring edge
 const startX = Math.cos(angle) * radius;
 const startY = Math.sin(angle) * radius;

 return (
 <Motion.div
 key={i}
 initial={{ opacity: 0, scale: 0, x: startX, y: startY }}
 animate={{
 opacity: [0, 0.8, 0],
 scale: [0.5, 1, 0.2],
 x: startX + (Math.cos(angle) * 30),
 y: startY + (Math.sin(angle) * 30),
 rotate: [0, 180]
 }}
 transition={{
 duration: 3 + Math.random() * 2,
 repeat: Infinity,
 delay: i * 0.5,
 ease: "easeOut"
 }}
 style={{
 clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
 }}
 className="absolute w-2 h-3 bg-cyan-100/60 shadow-[0_0_10px_rgba(180,251,255,0.8)] z-50"
 />
 );
 })}
 </div>
 )}

 {/* Perimeter Progress Ring - Enhanced Visibility */}
 <div className="absolute inset-0 z-0">
 <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
 {/* Inner Track (Subtle) */}
 <circle cx="50" cy="50" r="38" fill="none" className="stroke-mono-200/20 dark:stroke-mono-800/40" strokeWidth="1" />
 {/* Outer Track (Main) */}
 <circle cx="50" cy="50" r="41" fill="none" className="stroke-mono-200/10 dark:stroke-mono-800/20" strokeWidth="1" />

 {/* Progress Path (Thick & Vibrant) */}
 <Motion.circle
 cx="50"
 cy="50"
 r="41"
 fill="none"
 stroke="url(#avatarProgressGradient)"
 strokeWidth="16"
 strokeLinecap="butt"
 strokeDasharray="257.61"
 initial={{ strokeDashoffset: 257.61 }}
 animate={{
 strokeDashoffset: 257.61 - (257.61 * (effectiveProgress || 0)),
 filter: tier.isLegendary ? "drop-shadow(0 0 10px #b4fbff)" : "none"
 }}
 transition={{
 strokeDashoffset: { duration: 1.5, ease: "circOut" }
 }}
 />
 <defs>
 <linearGradient id="avatarProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor={tier.stop1} />
 <stop offset="100%" stopColor={tier.stop2} />
 </linearGradient>
 </defs>
 </svg>
 </div>

 <div className={`relative p-0.5 bg-mono-white dark:bg-black rounded-full border-[0.5px] border-mono-200 dark:border-mono-800 z-10 ${bundleObj.id !== 'default' ? bundleObj.avatarRing : ''}`}>
 <Avatar src={draftAvatar} size="xl" className="w-32 h-32 rounded-full border border-mono-100 dark:border-mono-800 object-cover" updatedAt={user?.updated_at} />
 <div
 className="absolute bottom-0 right-0 w-9 h-9 text-slate-950 rounded-full border-2 border-white flex items-center justify-center z-50 transition-transform active:scale-90"
 style={{ backgroundColor: tier.stop1 }}
 >
 <span className="material-symbols-outlined text-[20px] font-black leading-none">edit</span>
 </div>
 </div>
 </Motion.div>
 </div>
 </div>

 {/* 5. Bottom Info Dock */}
 <div className={`absolute top-[68%] sm:top-auto sm:bottom-0 left-0 right-0 z-40 ${bundleObj.id !== 'default' ? 'bg-black/10 dark:bg-black/20 text-white shadow-[0_-8px_20px_rgba(0,0,0,0.3)]' : 'bg-[#365a8c] shadow-[0_-8px_25px_rgba(0,0,0,0.4)]'} px-3 pb-4 sm:pb-3 pt-2 sm:pt-6 flex flex-col justify-end`} dir="rtl">
 <div className="flex flex-row items-center justify-between w-full sm:max-w-md sm:mx-auto mb-3.5 px-2 sm:px-6" dir="ltr">
 {/* Left: Medal Badge */}
 <div
 className="w-12 h-12 flex items-center justify-center shrink-0"
 >
 {bestMedal && (
 <bestMedal.IconComponent className={`w-10 h-10 ${!isBestUnlocked ? 'brightness-90 contrast-125' : 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)]'}`} disabled={!isBestUnlocked} isBadge={true} />
 )}
 </div>

 {/* Center: Name */}
 <div className="w-full text-center relative z-10 px-4">
 <PremiumName
 text={userNickname || 'بێناڤ'}
 styleId={bundleObj.id !== 'default' ? null : styleObj.id}
 className={`text-[22px] font-black leading-tight overflow-visible whitespace-nowrap w-full text-center transition-all duration-500 drop-shadow-sm ${bundleObj.id !== 'default' ? (bundleObj.fontKurdish + ' ' + bundleObj.textStyle) : ''}`}
 style={{ paddingBottom: '0.2em', ...(bundleObj.id !== 'default' ? {} : { ...(styleObj.class ? {} : { color: 'white' }), ...fontObj.style }) }}
 />
 </div>

 {/* Right: Streak / Save */}
 <div className="w-12 h-12 flex items-center justify-center shrink-0">
 <AnimatePresence mode="popLayout">
 {(draftAvatar !== userAvatar || pendingFile) && !saveSuccess ? (
 <Motion.button
 key="save-btn"
 initial={{ scale: 0, rotate: -90 }}
 animate={{ scale: 1, rotate: 0 }}
 exit={{ scale: 0, rotate: 90 }}
 onClick={(e) => { e.stopPropagation(); handleSave(); }}
 disabled={isUploading}
 className="w-12 h-12 bg-green-600 text-white rounded-md flex flex-col items-center justify-center border-b-2 border-white/40 hover:scale-110 active:scale-95 transition-all shadow-lg absolute"
 >
 {isUploading ? (
 <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
 ) : (
 <>
 <span className="material-symbols-outlined text-[20px] font-black leading-none">save</span>
 <span className="text-[7px] font-black uppercase -mt-0.5">پاشەکەفت</span>
 </>
 )}
 </Motion.button>
 ) : (
 <Motion.div
 key="streak-badge"
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 className="flex flex-col items-center justify-center relative w-12 h-12 transition-transform cursor-pointer"
 >
 <Motion.div
 className="relative text-xl leading-none"
 animate={{
 filter: [
 "drop-shadow(0 0 8px rgba(255, 159, 28, 0.4))",
 "drop-shadow(0 0 20px rgba(255, 159, 28, 0.8))",
 "drop-shadow(0 0 8px rgba(255, 159, 28, 0.4))"
 ]
 }}
 transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
 >
 {isStreakAtRisk ? '⏳' : '🔥'}
 <Motion.div
 className="absolute inset-x-0 bottom-0 top-1/4 bg-orange-500/30 rounded-full blur-lg z-[-1]"
 animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
 transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
 />
 </Motion.div>
 <div className="flex flex-col items-center z-10 w-full mt-0.5">
 <span className="text-[7px] font-black text-orange-400 uppercase leading-none mb-0.5 opacity-80">ستریك</span>
 <div className="flex items-baseline gap-0.5">
 <span className="text-sm font-black leading-none tabular-nums text-white">{toKuDigits(dailyStreak || 0)}</span>
 <span className="text-[8px] font-bold text-white/70">ڕۆژ</span>
 </div>
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* Unified 3-Column Stats Grid */}
 <div className="grid grid-cols-3 gap-4 px-4" dir="ltr">

 <div
 className="btn-clash-sm flex flex-col items-center justify-center py-2 transition-all duration-500"
 style={{
 backgroundColor: tier.stop1,
 boxShadow: `inset 0 2px 0px rgba(255, 255, 255, 0.45), inset 0 -2px 0px rgba(0, 0, 0, 0.15), 0 0 0 1px ${tier.stop2}, 0 1px 0 1px ${tier.stop2}, 0 2px 0 1px ${tier.stop2}, 0 0 0 1.5px #000, 0 1px 0 1.5px #000, 0 2px 0 1.5px #000`
 }}
 >
 <span className="text-[10px] font-black uppercase mb-0.5 text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">XP سەرجەمێ</span>
 <span className="text-[13px] font-black tabular-nums leading-none text-white drop-shadow-sm">
 {isLoading ? <div className="w-6 h-2 bg-white/20 animate-pulse rounded"></div> : toKuDigits(currentXP || 0)}
 </span>
 </div>

 <div
 className="btn-clash-sm flex flex-col items-center justify-center py-2 transition-all duration-500"
 style={{
 backgroundColor: tier.stop1,
 boxShadow: `inset 0 2px 0px rgba(255, 255, 255, 0.45), inset 0 -2px 0px rgba(0, 0, 0, 0.15), 0 0 0 1px ${tier.stop2}, 0 1px 0 1px ${tier.stop2}, 0 2px 0 1px ${tier.stop2}, 0 0 0 1.5px #000, 0 1px 0 1.5px #000, 0 2px 0 1.5px #000`
 }}
 >
 <span className="text-[10px] font-black uppercase mb-0.5 text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">ڕێزبەندی</span>
 <span className="text-[13px] font-black tabular-nums leading-none text-white drop-shadow-sm">
 {isLoading ? '...' : `#${toKuDigits(userRank || 0)}`}
 </span>
 </div>

 <div
 className={`btn-clash-sm flex flex-col items-center justify-center py-2 transition-all duration-500 ${isLoading ? 'animate-pulse opacity-50' : ''}`}
 style={{
 backgroundColor: tier.stop1,
 boxShadow: `inset 0 2px 0px rgba(255, 255, 255, 0.45), inset 0 -2px 0px rgba(0, 0, 0, 0.15), 0 0 0 1px ${tier.stop2}, 0 1px 0 1px ${tier.stop2}, 0 2px 0 1px ${tier.stop2}, 0 0 0 1.5px #000, 0 1px 0 1.5px #000, 0 2px 0 1.5px #000`
 }}
 >
 <span className="text-[10px] font-black uppercase mb-0.5 text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">پەیڤێن دیتی</span>
 <span className="text-[13px] font-black leading-none tabular-nums text-white drop-shadow-sm">
 {isLoading ? '...' : toKuDigits(solvedWords?.length || 0)}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="flex-1 px-4 pb-[max(env(safe-area-inset-bottom),80px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10 bg-trigger-zone flex flex-col justify-start pt-2">
 <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center">

 {/* Friends Button (Tab Design) */}
 <div className="flex w-full max-w-sm mx-auto mt-3 mb-6 px-4" dir="rtl">
 <button
 onPointerDown={(e) => { e.stopPropagation(); triggerHaptic(15); if (playTabSound) playTabSound(); setIsFriendsModalOpen(true); }}
 onClick={(e) => { e.stopPropagation(); triggerHaptic(15); if (playTabSound) playTabSound(); setIsFriendsModalOpen(true); }}
 className="w-full h-12 btn-clash btn-clash-blue text-white font-black text-[15px] sm:text-[16px] font-rabar tracking-normal flex items-center justify-center gap-2 outline-none active:translate-y-1"
 >
 <span className="material-symbols-outlined text-[22px] drop-shadow-sm mb-0.5">group</span>
 <span className="drop-shadow-md">لیستا هەڤالان</span>
 {pendingFriendsCount > 0 && (
 <div className="absolute -top-3 -right-2 bg-red-500 min-w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#141414] shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-20 px-1 animate-pulse">
 <span className="text-[12px] font-black text-white leading-none mt-0.5 drop-shadow-md">{pendingFriendsCount > 99 ? '99+' : pendingFriendsCount}</span>
 </div>
 )}
 </button>
 </div>

 {/* Quick Actions (Stats, Missions, Medals, Dictionary) */}
 <div className="flex flex-row items-center justify-between gap-3 w-full max-w-sm mx-auto mt-6 mb-4 relative z-10 px-4">

 {/* Stats */}
 <button
 onPointerDown={(e) => { e.stopPropagation(); triggerHaptic(10); }}
 onClick={() => { triggerHaptic(15); onViewChange('stats'); }}
 className="flex flex-col items-center justify-center flex-1 aspect-square max-w-18 btn-clash btn-clash-slate text-white outline-none active:translate-y-1"
 >
 <span className="material-symbols-outlined text-[28px] sm:text-[32px] drop-shadow-sm mb-1 text-mono-200">
 bar_chart
 </span>
 <span className="text-[10px] sm:text-[11px] font-black uppercase drop-shadow-md font-rabar text-mono-200">ئامار</span>
 </button>

 {/* Missions */}
 <button
 onPointerDown={(e) => { e.stopPropagation(); triggerHaptic(10); }}
 onClick={() => { triggerHaptic(15); onViewChange('achievements'); }}
 className="flex flex-col items-center justify-center flex-1 aspect-square max-w-18 btn-clash btn-clash-slate text-white outline-none active:translate-y-1"
 >
 <span className="material-symbols-outlined text-[28px] sm:text-[32px] drop-shadow-sm mb-1 text-mono-200">
 track_changes
 </span>
 <span className="text-[10px] sm:text-[11px] font-black uppercase drop-shadow-md font-rabar text-mono-200">ئەرک</span>
 </button>

 {/* Rank (New Button) */}
 <button
 onPointerDown={(e) => { e.stopPropagation(); triggerHaptic(10); }}
 onClick={() => { triggerHaptic(15); onViewChange('medals'); }}
 className="flex flex-col items-center justify-center flex-1 aspect-square max-w-18 btn-clash btn-clash-slate text-white outline-none active:translate-y-1 relative"
 >
 {hasUnclaimedMedals && (
 <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#141414] shadow-md z-20 animate-pulse" />
 )}
 <span className="material-symbols-outlined text-[28px] sm:text-[32px] drop-shadow-sm mb-1 text-mono-200">
 military_tech
 </span>
 <span className="text-[10px] sm:text-[11px] font-black uppercase drop-shadow-md font-rabar text-mono-200">پلە</span>
 </button>

 {/* Dictionary */}
 <button
 onPointerDown={(e) => { e.stopPropagation(); triggerHaptic(10); }}
 onClick={() => { triggerHaptic(15); onViewChange('dictionary'); }}
 className="flex flex-col items-center justify-center flex-1 aspect-square max-w-18 btn-clash btn-clash-slate text-white outline-none active:translate-y-1"
 >
 <span className="material-symbols-outlined text-[28px] sm:text-[32px] drop-shadow-sm mb-1 text-mono-200">
 menu_book
 </span>
 <span className="text-[10px] sm:text-[11px] font-black uppercase drop-shadow-md font-rabar text-mono-200">فەرهەنگ</span>
 </button>
 </div>

 <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
 </Motion.div>
 </div>

 {isCropModalOpen && createPortal(
 <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/90 p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir="rtl">
 <Motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="w-full max-w-100 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden max-h-[95vh]"
 onClick={e => e.stopPropagation()}
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
 <div className="w-full relative flex items-center justify-center pt-3 pb-4 shrink-0">
 <h2 
 className="text-[20px] font-black text-white leading-none relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 بڕینا وێنەی
 </h2>
 <button
 onClick={() => {
 setIsCropModalOpen(false);
 setImageToCrop(null);
 }}
 className="absolute right-3 top-3 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-sm"></div>
 <svg viewBox="0 0 24 24" className="w-4 h-4 -translate-y-px relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 </svg>
 </button>
 </div>

 {/* Main Content Area (White Box Wrapper) */}
 <div className="flex-1 self-stretch flex flex-col relative mx-2.5 sm:mx-3 mb-4 rounded-[12px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[12px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 
 <div className="flex flex-col z-0 relative">
 {/* Cropper takes full width of the white box */}
 <div ref={cropperContainerRef} className="relative w-full aspect-square bg-[#121316] overflow-hidden cursor-move touch-none border-b-[2.5px] border-black/10">
 <Cropper
 image={imageToCrop}
 crop={crop}
 zoom={zoom}
 aspect={1}
 onCropChange={setCrop}
 onCropComplete={onCropComplete}
 onZoomChange={setZoom}
 showGrid={false}
 cropShape="round"
 restrictPosition={true}
 objectFit="auto-cover"
 cropSize={cropSize}
 style={{
 containerStyle: { background: '#121316', padding: 0 },
 cropAreaStyle: { border: 'none' }
 }}
 />
 </div>

 {/* Controls underneath cropper */}
 <div className="p-4 sm:p-5 flex flex-col gap-5 bg-[#e6ebf0]">
 {/* Zoom Slider */}
 <div className="flex items-center gap-3">
 <span className="text-[14px] font-black font-rabar text-[#3a404a] min-w-max">نێزیکرن:</span>
 <div className="relative flex-1 flex items-center h-12">
 <CrSlider 
 value={((zoom - 1) / 2) * 100} 
 onChange={(percentage) => setZoom(1 + (percentage / 100) * 2)} 
 />
 </div>
 <span className="px-2 py-0.5 rounded-md bg-white text-[#40ea00] text-[13px] font-black tabular-nums border-[1.5px] border-[#c0c6cc] shadow-sm min-w-10 text-center" dir="ltr">
 {zoom.toFixed(1)}x
 </span>
 </div>

 {/* Save Button */}
 <div className="flex justify-center w-full pt-1">
 <button
 onClick={handleConfirmCrop}
 disabled={isUploading}
 className="relative w-32.5 h-7 bg-[#40ea00] rounded-[8px] border-[1.5px] border-[#121316] flex items-center justify-center font-black active:scale-95 transition-transform overflow-hidden disabled:opacity-50 shrink-0"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span className="text-white text-[13px] font-rabar leading-none relative z-10 -translate-y-px tracking-normal" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>
 {isUploading ? 'بارکرن...' : 'پاراستن'}
 </span>
 </button>
 </div>
 </div>
 </div>
 </div>
 </Motion.div>
 </div>,
 document.body
 )}


 {/* Friends Modal Inline (No Portal/AnimatePresence to fix iOS touch bugs) */}
 {isFriendsModalOpen && (
 <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-mono-white dark:bg-black" dir="rtl">
 <Motion.div
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 transition={{ type: "spring", stiffness: 300, damping: 30 }}
 className="bg-mono-white dark:bg-black w-full h-full max-w-md mx-auto shadow-2xl flex flex-col overflow-hidden relative z-10"
 >
 <div className="pt-[env(safe-area-inset-top)] bg-mono-50 dark:bg-mono-900/50 border-b border-mono-200 dark:border-mono-800 shrink-0">
 <div className="relative h-16 flex items-center justify-center px-4">
 <button
 onPointerDown={() => setIsFriendsModalOpen(false)}
 className="absolute right-4 w-10 h-10 flex items-center justify-center rounded-2xl text-mono-400 hover:text-mono-900 dark:text-mono-500 dark:hover:text-white hover:bg-mono-200 dark:hover:bg-mono-800 transition-all active:scale-95 border border-transparent hover:border-mono-300 dark:hover:border-mono-700"
 >
 <span className="material-symbols-outlined">close</span>
 </button>
 <h3 className="text-mono-900 dark:text-white font-black font-rabar text-lg">لیستا ھەڤالان</h3>
 </div>
 </div>

 <div className="flex-1 flex flex-col overflow-hidden p-4 relative">
 <FriendsList
 onOpenChat={(player) => {
 setIsFriendsModalOpen(false);
 if (onOpenChat) onOpenChat(player);
 }}
 />
 </div>
 </Motion.div>
 </div>
 )}


 </div>
 );
}
