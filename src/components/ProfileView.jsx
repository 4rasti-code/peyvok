import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AVATARS, DEFAULT_AVATAR } from '../data/avatars';
import { COUNTRIES } from '../data/countries';
import { supabase } from '../lib/supabase';
import FlagBadge from './FlagBadge';
import StatsView from './StatsView';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import { triggerHaptic } from '../utils/haptics';
import { toKuDigits } from '../utils/formatters';
import ExperienceBar from './ExperienceBar';
import Avatar from './Avatar';
import { useUser } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useAudio } from '../context/AudioContext';
import FloatingLetterBackground from './FloatingLetterBackground';
import { getLevelData, getLevelFromXP } from '../utils/progression';
import { compressImage, getCroppedImg } from '../utils/imageUtils';
import Cropper from 'react-easy-crop';

export default function ProfileView({ onProfileSave, onViewChange }) {
   const { 
     user, userNickname, userAvatar, city: userCity, 
     isInKurdistan, countryCode, updateProfile 
   } = useUser();

   const { 
     currentXP, level, dailyStreak, fils, derhem, dinar,
     playerStats, userRank, progressPercent
   } = useGame();

   const { playTabSound, playSaveSound } = useAudio();
   const [activeTab, setActiveTab] = useState('profile');
   const [isFlagBoxOpen, setIsFlagBoxOpen] = useState(false);
   const [isAvatarBoxOpen, setIsAvatarBoxOpen] = useState(false);
   const [isUploading, setIsUploading] = useState(false);
   const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
   const fileInputRef = useRef(null);
   const flagDropdownRef = useRef(null);
   const flagButtonRef = useRef(null);
   const [draftNickname, setDraftNickname] = useState(userNickname);
   const [draftAvatar, setDraftAvatar] = useState(userAvatar);
   const [draftCountryCode, setDraftCountryCode] = useState(countryCode);
   const [draftIsInKurdistan, setDraftIsInKurdistan] = useState(isInKurdistan);
   const [saveSuccess, setSaveSuccess] = useState(false);
   const [dbLoading, setDbLoading] = useState(false);
   const [isNicknameLocked, setIsNicknameLocked] = useState(true);
   const [pendingFile, setPendingFile] = useState(null);
   const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
   const nicknameInputRef = useRef(null);
   const bgRef = useRef(null);
   const [isCropModalOpen, setIsCropModalOpen] = useState(false);
   const [imageToCrop, setImageToCrop] = useState(null);
   const [crop, setCrop] = useState({ x: 0, y: 0 });
   const [zoom, setZoom] = useState(1);
   const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
   const [croppedBlob, setCroppedBlob] = useState(null);

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
      setDraftNickname(userNickname);
      setDraftAvatar(userAvatar);
      setDraftCountryCode(countryCode);
      setDraftIsInKurdistan(isInKurdistan);
   }, [userNickname, userAvatar, countryCode, isInKurdistan]);

   useEffect(() => {
      if (isFlagBoxOpen && flagButtonRef.current) {
         const rect = flagButtonRef.current.getBoundingClientRect();
         setDropdownCoords({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
         });
      }
   }, [isFlagBoxOpen]);

   useEffect(() => {
      function handleClickOutside(event) {
         if (flagDropdownRef.current && !flagDropdownRef.current.contains(event.target) &&
            flagButtonRef.current && !flagButtonRef.current.contains(event.target)) {
            setIsFlagBoxOpen(false);
         }
      }
      if (isFlagBoxOpen) {
         document.addEventListener('mousedown', handleClickOutside);
         window.addEventListener('scroll', () => setIsFlagBoxOpen(false), { once: true });
         window.addEventListener('resize', () => setIsFlagBoxOpen(false), { once: true });
      }
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, [isFlagBoxOpen]);

   if (!user || user === null) {
      return <div className="flex flex-col items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
   }

   const safeLevel = getLevelFromXP(currentXP || 0);
   const effectiveProgress = (progressPercent || 0) / 100;

   const getLevelTier = (lvl) => {
      if (lvl < 10) return { stop1: '#cd7f32', stop2: '#f97316', shadow: 'rgba(249, 115, 22, 0.4)' };
      if (lvl < 25) return { stop1: '#cbd5e1', stop2: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.4)' };
      if (lvl < 45) return { stop1: '#fbbf24', stop2: '#d97706', shadow: 'rgba(245, 158, 11, 0.4)' };
      if (lvl < 70) return { stop1: '#22d3ee', stop2: '#0891b2', shadow: 'rgba(6, 182, 212, 0.4)' };
      if (lvl < 90) return { stop1: '#a855f7', stop2: '#7c3aed', shadow: 'rgba(139, 92, 246, 0.4)' };
      return { stop1: '#ef4444', stop2: '#b91c1c', shadow: 'rgba(239, 68, 68, 0.4)' };
   };

   const tier = getLevelTier(safeLevel);

   // Dynamic Win Ratio aggregator
   const getWinRatio = () => {
      if (!playerStats) return 0;
      let wins = 0, total = 0;
      Object.values(playerStats).forEach(m => {
         if (typeof m === 'object' && m !== null) {
            const w = Number(m.totalWins || m.totalCorrect || m.solvedWords?.length || 0);
            const t = Number(m.totalGames || m.gamesPlayed || (w + (m.losses || 0)) || 0);
            wins += w; total += Math.max(w, t);
         }
      });
      return total > 0 ? Math.min(100, Math.round((wins / total) * 100)) : 0;
   };
   const winRatio = getWinRatio();
   const isLoading = !user || userNickname === 'یاریزان';

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
         const { data, error: uploadError } = await supabase.storage
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
            nickname: draftNickname, 
            avatar_url: publicUrl, 
            countryCode: draftCountryCode, 
            isInKurdistan: draftIsInKurdistan 
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
         alert(`شاشی د سەیڤکرنێ دا: ${err.message}`);
      } finally {
         setIsUploading(false);
      }
   };

   const handleInvite = () => {
      const shareLink = `${window.location.origin}/play?invite=${user?.id || 'guest'}`;
      navigator.clipboard.writeText(shareLink);
      alert('لینک ھاتە کۆپیکرن! بۆ ھەڤالێن خۆ بفرێژە.');
   };

   const handleSave = async () => {
      try {
         setIsUploading(true);
         playSaveSound();
         triggerHaptic([20, 10, 20]);
         let finalAvatar = draftAvatar;

         // Use cropped blob if available
         const uploadSource = croppedBlob;

         if (uploadSource) {
            try {
               const fileName = `${user?.id || 'guest'}-${Date.now()}.jpg`;

               const { data, error: uploadError } = await supabase.storage
                  .from('avatars')
                  .upload(fileName, uploadSource, { contentType: 'image/jpeg' });

               if (!uploadError) {
                  const { data: { publicUrl } } = supabase.storage
                     .from('avatars')
                     .getPublicUrl(fileName);
                  finalAvatar = publicUrl;
               } else {
                  console.error("Upload error details:", uploadError);
               }
            } catch (upErr) {
               console.error("Upload process crashed:", upErr);
            }
         } else if (pendingFile) {
             // Fallback for direct avatar selection if any
             try {
                const fileExt = pendingFile.name.split('.').pop();
                const fileName = `${user?.id || 'guest'}-${Date.now()}.${fileExt}`;
 
                const { data, error: uploadError } = await supabase.storage
                   .from('avatars')
                   .upload(fileName, pendingFile);
 
                if (!uploadError) {
                   const { data: { publicUrl } } = supabase.storage
                      .from('avatars')
                      .getPublicUrl(fileName);
                   finalAvatar = publicUrl;
                }
             } catch (err) {}
         }

         await onProfileSave({ nickname: draftNickname, avatar_url: finalAvatar, countryCode: draftCountryCode, isInKurdistan: draftIsInKurdistan });
         setSaveSuccess(true);
         setIsNicknameLocked(true);
         setPendingFile(null);
         setCroppedBlob(null);
         if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
         setLocalPreviewUrl(null);
         setTimeout(() => setSaveSuccess(false), 2000);
      } catch (err) { alert(`شاشی: ${err.message}`); } finally { setIsUploading(false); }
   };

   const selectedCountryName = draftIsInKurdistan ? 'کوردستان' : (COUNTRIES.find(c => c.code === draftCountryCode)?.name || 'جیھان');

   return (
      <div 
         onClick={handleBackgroundClick}
         className="w-screen max-w-full mx-auto h-full flex flex-col pt-0 pb-0 overflow-x-hidden relative z-10 bg-mono-white dark:bg-mono-950 bg-trigger-zone transition-colors duration-500"
      >
         <div className="absolute inset-0 pointer-events-none z-0">
            <FloatingLetterBackground ref={bgRef} />
         </div>

          <div className="px-5 mb-4 text-center flex flex-col items-center relative z-10 bg-trigger-zone">
             <div className="relative w-full aspect-square max-w-[320px] rounded-md overflow-hidden border border-mono-200 dark:border-mono-800 bg-mono-white dark:bg-mono-950 group transition-colors duration-300 shadow-xl">
                
                {/* 1. Texture Layer */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>


                {/* 3. Top Header: Save & Badges */}
                <div className="absolute top-0 left-0 right-0 h-20 z-[60] px-6 flex justify-between items-center" dir="ltr">
                   {/* Left: Save/Streak */}
                   <div className="relative pt-6 w-14">
                      <AnimatePresence mode="popLayout">
                         {(draftAvatar !== userAvatar || pendingFile || draftNickname !== userNickname || draftCountryCode !== countryCode) && !saveSuccess ? (
                            <motion.button
                               key="save-btn"
                               initial={{ scale: 0, rotate: -90 }}
                               animate={{ scale: 1, rotate: 0 }}
                               exit={{ scale: 0, rotate: 90 }}
                               onClick={(e) => { e.stopPropagation(); handleSave(); }}
                               disabled={isUploading}
                               className="w-14 h-14 bg-primary text-slate-950 rounded-md flex flex-col items-center justify-center border-b-2 border-white/40 hover:scale-110 active:scale-95 transition-all shadow-lg absolute -top-2"
                            >
                               {isUploading ? (
                                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                               ) : (
                                  <>
                                     <span className="material-symbols-outlined text-[24px] font-black leading-none">save</span>
                                     <span className="text-[7px] font-black uppercase -mt-0.5">پاشەکەفت</span>
                                  </>
                               )}
                            </motion.button>
                         ) : (
                            <motion.div
                               key="streak-badge"
                               initial={{ opacity: 0, scale: 0.8 }}
                               animate={{ opacity: 1, scale: 1 }}
                               className="flex flex-col items-center justify-center relative w-14 h-15"
                            >
                               <div className="relative text-2xl leading-none hover:scale-110 transition-transform cursor-pointer">
                                  🔥
                                  <div className="absolute inset-x-0 bottom-0 top-1/4 bg-orange-500/20 rounded-full blur-md z-[-1]"></div>
                               </div>
                               <div className="flex flex-col items-center z-10 w-full mt-1">
                                  <span className="text-[8px] font-black text-orange-400 uppercase leading-none mb-0.5 opacity-80 tracking-normal">ستریك</span>
                                  <span className="text-xl font-black text-mono-900 dark:text-mono-100 leading-none tabular-nums">{toKuDigits(dailyStreak || 0)}</span>
                               </div>
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>

                   {/* Right: Level Shield (Restored Original Style) */}
                   <div className="relative pt-6 w-14 flex flex-col items-center">
                      <div className="relative flex flex-col items-center justify-center">
                          <svg width="44" height="50" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                             <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill="url(#levelMedalGradient)" stroke="white" strokeWidth="4" strokeOpacity="0.3" />
                             <defs>
                                <linearGradient id="levelMedalGradient" x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
                                   <stop stopColor="#FFD700" />
                                   <stop offset="1" stopColor="#B8860B" />
                                </linearGradient>
                             </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5" dir="rtl">
                             <span className="text-[7px] font-black text-slate-800/80 uppercase leading-none mb-0.5 tracking-tighter">ئاست</span>
                             <span className="text-[14px] font-black text-slate-950 leading-none tabular-nums">{toKuDigits(safeLevel || level || 1)}</span>
                          </div>
                      </div>
                   </div>
                </div>

                {/* 4. Central Avatar Section - Maximum Top Position with Progress Ring */}
                <div className="absolute inset-0 flex items-start justify-center z-30 pointer-events-none pt-10">
                   <motion.div 
                      className="relative pointer-events-auto cursor-pointer group/avatar p-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { triggerHaptic(10); fileInputRef.current?.click(); }}
                   >
                      {/* Perimeter Progress Ring - Enhanced Visibility */}
                      <div className="absolute inset-0 z-0">
                         <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_12px_rgba(255,159,28,0.4)]" viewBox="0 0 100 100">
                            {/* Inner Track (Subtle) */}
                            <circle cx="50" cy="50" r="44" fill="none" className="stroke-mono-200/20 dark:stroke-mono-800/40" strokeWidth="2" />
                            {/* Outer Track (Main) */}
                            <circle cx="50" cy="50" r="47" fill="none" className="stroke-mono-200/10 dark:stroke-mono-800/20" strokeWidth="6" />
                            
                            {/* Progress Path (Thick & Vibrant) */}
                            <motion.circle
                               cx="50"
                               cy="50"
                               r="47"
                               fill="none"
                               stroke="url(#avatarProgressGradient)"
                               strokeWidth="7"
                               strokeLinecap="round"
                               strokeDasharray="295.3" // 2 * PI * 47
                               initial={{ strokeDashoffset: 295.3 }}
                               animate={{ strokeDashoffset: 295.3 - (295.3 * (effectiveProgress || 0)) }}
                               transition={{ duration: 1.5, ease: "circOut" }}
                            />
                            <defs>
                               <linearGradient id="avatarProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor={tier.stop1} />
                                  <stop offset="100%" stopColor={tier.stop2} />
                                </linearGradient>
                            </defs>
                         </svg>
                      </div>

                      <div className="relative p-1.5 bg-mono-white dark:bg-mono-950 rounded-full shadow-2xl border border-mono-200 dark:border-mono-800 z-10">
                         <Avatar src={draftAvatar} size="xl" className="w-32 h-32 rounded-full border-2 border-mono-100 dark:border-mono-800 object-cover" updatedAt={user?.updated_at} />
                         <div className="absolute bottom-0 right-0 w-9 h-9 bg-[#FF9F1C] text-slate-950 rounded-full border-2 border-white flex items-center justify-center shadow-xl z-50 transition-transform active:scale-90">
                            <span className="material-symbols-outlined text-[20px] font-black leading-none">edit</span>
                         </div>
                      </div>
                   </motion.div>
                </div>

                {/* 5. Bottom Info Dock */}
                <div className="absolute bottom-0 left-0 right-0 z-40 bg-mono-50/95 dark:bg-mono-900/95 backdrop-blur-xl border-t border-mono-200 dark:border-mono-800 p-4 pt-2 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]" dir="rtl">
                   <div className="flex flex-col items-center mb-2">
                      <h3 className="text-2xl font-black font-rabar text-mono-900 dark:text-mono-50 leading-tight truncate w-full text-center px-4">{draftNickname || 'یاریکەر'}</h3>
                      
                   </div>

                  {/* Unified 3-Column Stats Grid */}
                  <div className="grid grid-cols-3 gap-1.5" dir="ltr">

                        <div className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-mono-white dark:bg-mono-950 border border-mono-200 dark:border-mono-800 shadow-sm">
                           <span className="text-[6px] font-black uppercase mb-0.5 text-mono-500 tracking-tighter">کۆیێ XP</span>
                           <span className="text-[12px] font-black text-mono-900 dark:text-mono-100 tabular-nums leading-none">
                              {isLoading ? <div className="w-6 h-2 bg-mono-100 dark:bg-mono-800 animate-pulse rounded"></div> : toKuDigits(currentXP || 0)}
                           </span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-mono-white dark:bg-mono-950 border border-mono-200 dark:border-mono-800 shadow-sm">
                           <span className="text-[6px] font-black uppercase mb-0.5 text-mono-500 tracking-tighter">پلەبەندی</span>
                           <span className="text-[12px] font-black text-mono-900 dark:text-mono-100 tabular-nums leading-none">
                              {isLoading ? '...' : `#${toKuDigits(userRank || 0)}`}
                           </span>
                        </div>

                     <div
                        className={`flex flex-col items-center justify-center py-1.5 rounded-xl border border-white/10 shadow-sm transition-all ${isLoading ? 'animate-pulse opacity-50' : ''}`}
                        style={{ backgroundColor: tier.stop1 }}
                     >
                        <span className="text-[6px] font-black uppercase mb-0.5 text-mono-950/60 tracking-wider">سەرکەفتن</span>
                        <span className="text-[12px] font-black text-mono-950 leading-none tabular-nums">
                           {isLoading ? '...' : `${toKuDigits(winRatio)}%`}
                        </span>
                     </div>


                  </div>
                </div>
             </div>
          </div>

         <div className="mx-6 mb-4">
            <div className="flex p-1 rounded-md border relative overflow-hidden transition-all bg-mono-100 dark:bg-mono-950 border-mono-200 dark:border-mono-800 transition-colors duration-300">
               {[
                  { id: 'profile', label: 'بەرپەڕ', icon: 'person' },
                  { id: 'stats', label: 'ئامار', icon: 'leaderboard' },
                  { id: 'friends', label: 'ھەڤال', icon: 'group' }
               ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                     <button
                        key={tab.id}
                        onClick={() => { 
                           triggerHaptic(10); 
                           playTabSound();
                           setActiveTab(tab.id); 
                        }}
                        className={`flex-1 relative py-2.5 rounded-md flex items-center justify-center gap-2 transition-all duration-300 z-10 ${isActive
                           ? 'text-mono-50 dark:text-mono-50'
                           : 'text-mono-500 hover:text-mono-900 dark:text-mono-400 dark:hover:text-mono-100'
                           }`}
                     >
                        {isActive && (
                           <motion.div
                              layoutId="activeTabBadge"
                              className="absolute inset-0 bg-mono-900 dark:bg-mono-800 shadow-sm rounded-sm"
                              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                           />
                        )}
                        <span className={`material-symbols-outlined text-[20px] relative z-10 ${isActive ? 'font-bold' : ''}`}>{tab.icon}</span>
                        <span className="text-xs font-black relative z-10 tracking-normal">{tab.label}</span>
                     </button>
                  );
               })}
            </div>
         </div>

         <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),80px)] scrollbar-hide relative z-10 bg-trigger-zone">
            <AnimatePresence mode="wait">
               {activeTab === 'friends' && (
                  <motion.div key="friends" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 w-full">
                     <div className="bg-mono-50 dark:bg-mono-900 p-6 rounded-md border border-mono-200 dark:border-mono-800 flex flex-col items-center text-center noise-grain transition-colors duration-300">
                        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                           <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-400 font-bold">person_add</span>
                        </div>
                        <h4 className="text-lg font-bold font-body text-mono-950 dark:text-mono-50 mb-1">ھەڤالێن خوە داخواز بکە</h4>
                        <p className="text-mono-500 dark:text-mono-400 text-[11px] font-bold font-body mb-5 leading-relaxed max-w-[200px]">بۆ ھەڤالێ خوە بھنێرە و پێکڤە یاریێ بکەن بۆ بدەستڤەھینانا خەلاتان</p>
                        <button onClick={() => { triggerHaptic(10); handleInvite(); }} className="w-full bg-primary text-black py-2.5 rounded-md font-black font-body text-sm hover:brightness-110 active:scale-95 transition-all">
                           کۆپی کرنا لینکی
                        </button>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'stats' && (
                  <motion.div key="stats" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
                     <StatsView playerStats={playerStats} rank={userRank} userNickname={userNickname} userAvatar={userAvatar} level={level} currentXP={currentXP} onViewChange={onViewChange} />
                  </motion.div>
               )}

               {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pt-2 w-full">
                     <div className="space-y-2 flex flex-col items-end">
                        <label htmlFor="profile-nickname" className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1 tracking-normal text-right block w-full mt-1">ناسناڤێ تە</label>
                        <div className="flex items-center gap-2 w-full">
                           <div className="relative w-full">
                              <input
                                 ref={nicknameInputRef}
                                 type="text"
                                 id="profile-nickname"
                                 name="profile-nickname"
                                 aria-label="Your nickname"
                                 value={draftNickname}
                                 onChange={(e) => setDraftNickname(e.target.value)}
                                 readOnly={isNicknameLocked}
                                 maxLength={20}
                                 className={`w-full h-12 border rounded-md px-4 font-bold font-rabar transition-all pr-12 text-right noise-grain text-[15px] ${
                                    isNicknameLocked 
                                       ? 'bg-mono-100 dark:bg-mono-900/50 text-mono-500 dark:text-mono-400 border-mono-200 dark:border-mono-800 cursor-not-allowed' 
                                       : 'bg-mono-white dark:bg-mono-900 text-mono-900 dark:text-mono-50 border-mono-300 dark:border-mono-700 shadow-sm ring-2 ring-primary/20'
                                 }`}
                              />
                              <button 
                                 onClick={() => { triggerHaptic(10); setIsNicknameLocked(false); setTimeout(() => nicknameInputRef.current?.focus(), 50); }} 
                                 className={`absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] transition-colors ${isNicknameLocked ? 'text-mono-400 dark:text-mono-500 hover:text-primary' : 'text-primary'}`}
                              >
                                 {isNicknameLocked ? 'edit' : 'edit_square'}
                              </button>
                           </div>
                           {(draftNickname !== userNickname) && draftNickname.trim() && !saveSuccess && (
                              <motion.button
                                 initial={{ scale: 0.8, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 onClick={handleSave}
                                 disabled={draftNickname.length < 8 || draftNickname.length > 15}
                                 className={`h-12 px-5 rounded-md font-black text-xs whitespace-nowrap transition-all ${draftNickname.length < 8 || draftNickname.length > 15 ? 'bg-mono-200 dark:bg-mono-800 text-mono-400 dark:text-mono-600 cursor-not-allowed' : 'bg-primary text-black shadow-lg shadow-primary/20'}`}
                              >
                                 پاراستن
                              </motion.button>
                           )}
                        </div>
                        {!isNicknameLocked && (
                           <div className="w-full text-right px-1 mt-1">
                              <AnimatePresence>
                                 {draftNickname.length > 0 && draftNickname.length < 8 && (
                                    <motion.p initial={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} className="text-rose-600 dark:text-rose-400 text-[11px] font-black">نابیت ناسناڤێ تە ژ ٨ پیتان کێمتر بیت</motion.p>
                                 )}
                                 {draftNickname.length > 15 && (
                                    <motion.p initial={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} className="text-rose-600 dark:text-rose-400 text-[11px] font-black">نابیت ناڤێ تە ژ ١٥ پیتان زێدەتر بیت</motion.p>
                                 )}
                              </AnimatePresence>
                           </div>
                        )}
                     </div>

                     <div className="space-y-2 flex flex-col items-end">
                        <span className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1 tracking-normal text-right block w-full mt-1">ئیمەیڵێ تە (Gmail)</span>
                        <div className="w-full h-12 bg-mono-white dark:bg-mono-900 border border-mono-300 dark:border-mono-700 rounded-md px-4 flex items-center justify-end font-bold text-mono-500 dark:text-mono-400 text-[14px] noise-grain overflow-hidden mb-1 shadow-sm transition-colors duration-300">
                           <span className="truncate">{user?.email || 'جیمایڵ نەتایبەتە'}</span>
                           <span className="material-symbols-outlined text-[20px] mr-3 text-mono-400 dark:text-mono-500">mail</span>
                        </div>
                     </div>

                     <div className="space-y-2 flex flex-col items-end">
                        <span className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1 tracking-normal text-right block w-full">وەڵات</span>
                        <div className="flex items-center gap-2 w-full">
                           <div className="relative w-full">
                              <button 
                                 id="country-selector"
                                 ref={flagButtonRef} 
                                 onClick={() => { triggerHaptic(10); setIsFlagBoxOpen(!isFlagBoxOpen); }} 
                                 className={`flex items-center px-4 h-12 rounded-md border transition-all w-full justify-between flex-row-reverse ${
                                    isFlagBoxOpen 
                                       ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                                       : 'bg-mono-white dark:bg-mono-900 border-mono-300 dark:border-mono-700 shadow-sm hover:bg-mono-50 dark:hover:bg-mono-800'
                                 }`}
                              >
                                 <span className={`material-symbols-outlined text-[20px] transition-transform ${isFlagBoxOpen ? 'rotate-180 text-black' : 'text-mono-400 dark:text-mono-500'}`}>expand_more</span>
                                 <div className="flex items-center gap-3">
                                    <FlagBadge countryCode={draftCountryCode} isInKurdistan={draftIsInKurdistan} size="xs" />
                                    <span className={`text-[13px] font-black font-rabar tracking-normal transition-colors ${isFlagBoxOpen ? 'text-black' : 'text-mono-900 dark:text-mono-50'}`}>{selectedCountryName}</span>
                                 </div>
                              </button>
                           </div>
                           {(draftCountryCode !== countryCode || draftIsInKurdistan !== isInKurdistan) && !saveSuccess && (
                              <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={handleSave} className="h-12 px-5 bg-primary text-black rounded-md font-black text-xs whitespace-nowrap shadow-lg shadow-primary/20">پاراستن</motion.button>
                           )}
                        </div>

                        {isFlagBoxOpen && createPortal(
                           <AnimatePresence mode="wait">
                              <motion.div ref={flagDropdownRef} initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} style={{ position: 'absolute', top: dropdownCoords.top + 6, left: dropdownCoords.left, width: dropdownCoords.width }} className="bg-mono-white dark:bg-mono-900 rounded-xl border border-mono-200 dark:border-mono-800 z-[9999] shadow-2xl overflow-hidden noise-grain">
                                 <div className="p-2 max-h-60 overflow-y-auto no-scrollbar">
                                    <button onClick={() => { triggerHaptic(10); setDraftIsInKurdistan(true); setIsFlagBoxOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 w-full transition-colors">
                                       <FlagBadge isInKurdistan={true} size="xs" />
                                       <span className="flex-1 text-left text-[13px] font-bold font-rabar text-mono-900 dark:text-mono-100">کوردستان</span>
                                       {draftIsInKurdistan && <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>}
                                    </button>
                                    {COUNTRIES.map((country) => (
                                       <button key={country.code} onClick={() => { triggerHaptic(10); setDraftIsInKurdistan(false); setDraftCountryCode(country.code); setIsFlagBoxOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 w-full transition-colors">
                                          <FlagBadge countryCode={country.code} size="xs" />
                                          <span className="flex-1 text-left text-[13px] font-bold font-rabar text-mono-900 dark:text-mono-100">{country.name}</span>
                                          {!draftIsInKurdistan && draftCountryCode === country.code && <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>}
                                       </button>
                                    ))}
                                 </div>
                              </motion.div>
                           </AnimatePresence>,
                           document.body
                        )}
                     </div>

                     <div className="space-y-4">
                        <span className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1 uppercase tracking-normal text-right block w-full">ھەلبژارتنا ئاڤاتاری</span>
                        <div className="bg-mono-white dark:bg-mono-900 border border-mono-300 dark:border-mono-700 rounded-md p-4 shadow-sm noise-grain transition-colors duration-300">
                           <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-4 max-h-60 overflow-y-auto pr-1 scrollbar-hide py-2 justify-items-center">
                              {AVATARS.map((avatar) => (
                                 <button 
                                    key={avatar.id} 
                                    onClick={() => { triggerHaptic(10); setDraftAvatar(avatar.id); }} 
                                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all relative ${
                                       draftAvatar === avatar.id 
                                          ? 'bg-primary ring-4 ring-primary/20 scale-110 z-10' 
                                          : 'bg-mono-50 dark:bg-mono-800 border border-mono-200 dark:border-mono-700'
                                    }`}
                                 >
                                    <Avatar src={avatar.id} size="sm" border={false} />
                                    {draftAvatar === avatar.id && (
                                       <div className="absolute -bottom-1 -right-1 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-mono-900 z-20">
                                          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                                       </div>
                                    )}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
         {isCropModalOpen && createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 overflow-hidden" dir="rtl">
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  className="bg-mono-white dark:bg-mono-950 rounded-md w-full max-w-2xl overflow-hidden relative border border-mono-200 dark:border-mono-800 transition-colors duration-300 shadow-2xl"
               >
                  {/* Header */}
                  <div className="p-5 border-b border-mono-200 dark:border-mono-800 flex items-center justify-between bg-mono-50 dark:bg-mono-900/50">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                           <span className="material-symbols-outlined text-primary text-xl font-bold">crop</span>
                        </div>
                        <h3 className="text-white font-black font-rabar text-[15px] tracking-wide">کڕۆپکرنا وێنەی</h3>
                     </div>
                     <button 
                        onClick={() => setIsCropModalOpen(false)} 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-mono-400 hover:text-mono-900 dark:text-mono-500 dark:hover:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-800 transition-all"
                     >
                        <span className="material-symbols-outlined text-xl">close</span>
                     </button>
                  </div>

                  {/* Cropper Container */}
                  <div className="relative aspect-square w-full bg-black overflow-hidden cursor-move touch-none">
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
                        style={{
                           containerStyle: { background: '#000', padding: 0 },
                           cropAreaStyle: { 
                              width: '600px', 
                              height: '600px',
                              border: '1px solid rgba(255,255,255,0.5)'
                           }
                        }}
                     />
                  </div>

                  {/* Controls */}
                  <div className="p-8 space-y-6 relative z-10 bg-mono-50 dark:bg-mono-900">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">زۆمکرنا وێنەی (Zoom)</span>
                           <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[12px] font-black tabular-nums border border-primary/30">
                              {zoom.toFixed(1)}x
                           </span>
                        </div>
                        
                        <div className="relative flex items-center h-8 group">
                           <input 
                              type="range" 
                              id="avatar-zoom"
                              name="avatar-zoom"
                              aria-label="Zoom avatar image"
                              min={1} 
                              max={3} 
                              step={0.01} 
                              value={zoom} 
                              onChange={(e) => setZoom(parseFloat(e.target.value))} 
                              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer outline-none
                                 [&::-webkit-slider-thumb]:appearance-none 
                                 [&::-webkit-slider-thumb]:w-6 
                                 [&::-webkit-slider-thumb]:h-6 
                                 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-primary 
                                 [&::-webkit-slider-thumb]:border-2 
                                 [&::-webkit-slider-thumb]:border-white 
                                 [&::-webkit-slider-thumb]:transition-all
                                 [&::-webkit-slider-thumb]:hover:scale-110
                                 [&::-moz-range-thumb]:w-6 
                                 [&::-moz-range-thumb]:h-6 
                                 [&::-moz-range-thumb]:rounded-full 
                                 [&::-moz-range-thumb]:bg-primary 
                                 [&::-moz-range-thumb]:border-2 
                                 [&::-moz-range-thumb]:border-white 
                                 [&::-moz-range-thumb]:border-white" 
                           />
                        </div>
                     </div>

                     <div className="flex flex-col gap-3 pt-2">
                        <button 
                           onClick={handleConfirmCrop} 
                           className="w-full h-14 rounded-2xl bg-primary text-slate-950 font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-t-2 border-white/40"
                        >
                           <span className="material-symbols-outlined text-2xl">check_circle</span>
                           پاراستن
                        </button>
                        <button 
                           onClick={() => {
                              setIsCropModalOpen(false);
                              setImageToCrop(null);
                           }} 
                           className="w-full h-12 rounded-2xl text-white/40 font-bold text-xs hover:text-white hover:bg-white/5 transition-all active:scale-95"
                        >
                           پەشیمانبوون و گۆهۆڕین
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>,
            document.body
         )}
      </div>
   );
}
