import React, { useState, useRef, useEffect } from 'react';
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
import { useGame } from '../context/GameContext';
import { useAudio } from '../context/AudioContext';
import FloatingLetterBackground from './FloatingLetterBackground';
import { getLevelFromXP, getLevelTier } from '../utils/progression';
import { getCroppedImg } from '../utils/imageUtils';
import Cropper from 'react-easy-crop';


export default function ProfileView({ onProfileSave }) {
   const {
      user, userNickname, userAvatar,
      isInKurdistan, countryCode
   } = useUser();

   const {
      currentXP, level, dailyStreak,
      userRank, progressPercent, solvedWords
   } = useGame();

   const { playSaveSound } = useAudio();
   const [isFlagBoxOpen, setIsFlagBoxOpen] = useState(false);

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

   const selectedCountry = COUNTRIES.find(c => c.code === (draftCountryCode || countryCode));
   const selectedCountryName = draftIsInKurdistan ? 'کوردستان' : (selectedCountry ? selectedCountry.name : 'ھەلبژێرە');

   const tier = getLevelTier(safeLevel);


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

               const { error: uploadError } = await supabase.storage
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

               const { error: uploadError } = await supabase.storage
                  .from('avatars')
                  .upload(fileName, pendingFile);

               if (!uploadError) {
                  const { data: { publicUrl } } = supabase.storage
                     .from('avatars')
                     .getPublicUrl(fileName);
                  finalAvatar = publicUrl;
               }
            } catch (_err) { /* ignore upload errors for fallback */ }
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


   return (
      <div
         onClick={handleBackgroundClick}
         className="w-screen max-w-full mx-auto h-full flex flex-col pt-0 pb-0 overflow-x-hidden relative z-10 bg-mono-white dark:bg-mono-950 bg-trigger-zone transition-colors duration-500"
      >
         <div className="absolute inset-0 pointer-events-none z-0">
            <FloatingLetterBackground ref={bgRef} />
         </div>

         <div className="px-5 mb-4 text-center flex flex-col items-center relative z-10 bg-trigger-zone">
            <div className="relative w-full aspect-[1.4/1] max-w-[340px] rounded-md overflow-hidden border border-mono-200 dark:border-mono-800 bg-mono-white dark:bg-mono-950 group transition-colors duration-300 shadow-xl">

               {/* 1. Texture Layer */}
               <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>


               {/* 3. Top Header: Save & Badges */}
               <div className="absolute top-0 left-0 right-0 h-20 z-60 px-6 flex justify-between items-center" dir="ltr">
                  {/* Left: Save/Streak */}
                  <div className="relative pt-6 w-14">
                     <AnimatePresence mode="popLayout">
                        {(draftAvatar !== userAvatar || pendingFile || draftNickname !== userNickname || draftCountryCode !== countryCode) && !saveSuccess ? (
                           <Motion.button
                              key="save-btn"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              onClick={(e) => { e.stopPropagation(); handleSave(); }}
                              disabled={isUploading}
                              className="w-14 h-14 bg-green-600 text-white rounded-md flex flex-col items-center justify-center border-b-2 border-white/40 hover:scale-110 active:scale-95 transition-all shadow-lg absolute -top-2"
                           >
                              {isUploading ? (
                                 <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                              ) : (
                                 <>
                                    <span className="material-symbols-outlined text-[24px] font-black leading-none">save</span>
                                    <span className="text-[7px] font-black uppercase -mt-0.5">پاشەکەفت</span>
                                 </>
                              )}
                           </Motion.button>
                        ) : (
                           <Motion.div
                              key="streak-badge"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col items-center justify-center relative w-12 h-14"
                           >
                              <Motion.div
                                 className="relative text-xl leading-none cursor-pointer"
                                 animate={{
                                    filter: [
                                       "drop-shadow(0 0 8px rgba(255, 159, 28, 0.4))",
                                       "drop-shadow(0 0 20px rgba(255, 159, 28, 0.8))",
                                       "drop-shadow(0 0 8px rgba(255, 159, 28, 0.4))"
                                    ]
                                 }}
                                 transition={{
                                    repeat: Infinity,
                                    duration: 2.5,
                                    ease: "easeInOut"
                                 }}
                              >
                                 🔥
                                 <Motion.div
                                    className="absolute inset-x-0 bottom-0 top-1/4 bg-orange-500/30 rounded-full blur-lg z-[-1]"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                 />
                              </Motion.div>
                              <div className="flex flex-col items-center z-10 w-full mt-1">
                                 <span className="text-[8px] font-black text-orange-400 uppercase leading-none mb-0.5 opacity-80">ستریك</span>
                                 <span className="text-lg font-black text-mono-900 dark:text-mono-100 leading-none tabular-nums">{toKuDigits(dailyStreak || 0)}</span>
                              </div>
                           </Motion.div>
                        )}
                     </AnimatePresence>
                  </div>

                  {/* Right: Level Shield (Restored Original Style) */}
                  <div className="relative pt-6 w-14 flex flex-col items-center">
                     <div className="relative flex flex-col items-center justify-center">
                        <svg width="38" height="44" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                           <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill="url(#levelMedalGradient)" stroke="white" strokeWidth="4" strokeOpacity="0.3" />
                           <defs>
                              <linearGradient id="levelMedalGradient" x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
                                 <stop stopColor="#FFD700" />
                                 <stop offset="1" stopColor="#B8860B" />
                              </linearGradient>
                           </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1" dir="rtl">
                           <span className="text-[8px] font-black text-slate-900 uppercase leading-none mb-0.5">ئاست</span>
                           <span className="text-[13px] font-black text-slate-950 leading-none tabular-nums">{toKuDigits(safeLevel || level || 1)}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* 4. Central Avatar Section - Maximum Top Position with Progress Ring */}
               <div className="absolute inset-0 flex items-start justify-center z-30 pointer-events-none pt-4">
                  <Motion.div
                     className="relative pointer-events-auto cursor-pointer group/avatar p-2"
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => { triggerHaptic(10); fileInputRef.current?.click(); }}
                  >
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
                              animate={{ strokeDashoffset: 257.61 - (257.61 * (effectiveProgress || 0)) }}
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

                     <div className="relative p-0.5 bg-mono-white dark:bg-mono-950 rounded-full shadow-2xl border-[0.5px] border-mono-200 dark:border-mono-800 z-10">
                        <Avatar src={draftAvatar} size="xl" className="w-26 h-26 rounded-full border border-mono-100 dark:border-mono-800 object-cover" updatedAt={user?.updated_at} />
                        <div className="absolute bottom-0 right-0 w-9 h-9 bg-[#FF9F1C] text-slate-950 rounded-full border-2 border-white flex items-center justify-center shadow-xl z-50 transition-transform active:scale-90">
                           <span className="material-symbols-outlined text-[20px] font-black leading-none">edit</span>
                        </div>
                     </div>
                  </Motion.div>
               </div>

               {/* 5. Bottom Info Dock */}
               <div className="absolute bottom-0 left-0 right-0 z-40 bg-mono-50/95 dark:bg-mono-900/95 backdrop-blur-xl border-t border-mono-200 dark:border-mono-800 p-3 pt-1 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]" dir="rtl">
                  <div className="flex flex-col items-center mb-2">
                     <h3 className="text-xl font-black font-rabar text-mono-900 dark:text-mono-50 leading-tight truncate w-full text-center px-4">{draftNickname || 'یاریکەر'}</h3>

                  </div>

                  {/* Unified 3-Column Stats Grid */}
                  <div className="grid grid-cols-3 gap-1.5" dir="ltr">

                     <div className="flex flex-col items-center justify-center py-1.5 rounded-md bg-mono-white dark:bg-mono-950 border border-mono-200 dark:border-mono-800 shadow-sm">
                        <span className="text-[9px] font-black uppercase mb-0.5 text-mono-400">XP سەرجەمێ</span>
                        <span className="text-[12px] font-black text-mono-900 dark:text-mono-100 tabular-nums leading-none">
                           {isLoading ? <div className="w-6 h-2 bg-mono-100 dark:bg-mono-800 animate-pulse rounded"></div> : toKuDigits(currentXP || 0)}
                        </span>
                     </div>
                     <div className="flex flex-col items-center justify-center py-1.5 rounded-md bg-mono-white dark:bg-mono-950 border border-mono-200 dark:border-mono-800 shadow-sm">
                        <span className="text-[9px] font-black uppercase mb-0.5 text-mono-400">ڕێزبەندی</span>
                        <span className="text-[12px] font-black text-mono-900 dark:text-mono-100 tabular-nums leading-none">
                           {isLoading ? '...' : `#${toKuDigits(userRank || 0)}`}
                        </span>
                     </div>

                     <div
                        className={`flex flex-col items-center justify-center py-1.5 rounded-md border border-white/10 shadow-sm transition-all ${isLoading ? 'animate-pulse opacity-50' : ''}`}
                        style={{ backgroundColor: tier.stop1 }}
                     >
                        <span className="text-[9px] font-black uppercase mb-0.5 text-mono-950/90">پەیڤێن دیتی</span>
                        <span className="text-[12px] font-black text-mono-950 leading-none tabular-nums">
                           {isLoading ? '...' : toKuDigits(solvedWords?.length || 0)}
                        </span>
                     </div>


                  </div>
               </div>
            </div>
         </div>


         <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),80px)] scrollbar-hide relative z-10 bg-trigger-zone">
             <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-2 w-full">
                     <div className="space-y-2 flex flex-col items-end">
                        <label htmlFor="profile-nickname" className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1  text-right block w-full mt-1">ناسناڤێ تە</label>
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
                                 className={`w-full h-12 border rounded-md px-4 font-bold font-rabar transition-all pr-12 text-right noise-grain text-[15px] ${isNicknameLocked
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
                              <Motion.button
                                 initial={{ scale: 0.8, opacity: 0 }}
                                 animate={{ scale: 1, opacity: 1 }}
                                 onClick={handleSave}
                                 disabled={draftNickname.length < 8 || draftNickname.length > 15}
                                 className={`h-12 px-5 rounded-md font-black text-xs whitespace-nowrap transition-all ${draftNickname.length < 8 || draftNickname.length > 15 ? 'bg-mono-200 dark:bg-mono-800 text-mono-400 dark:text-mono-600 cursor-not-allowed' : 'bg-green-600 text-white shadow-lg shadow-green-900/20'}`}
                              >
                                 پاراستن
                              </Motion.button>
                           )}
                        </div>
                        {!isNicknameLocked && (
                           <div className="w-full text-right px-1 mt-1">
                              <AnimatePresence>
                                 {draftNickname.length > 0 && draftNickname.length < 8 && (
                                    <Motion.p initial={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} className="text-rose-600 dark:text-rose-400 text-[11px] font-black">نابیت ناسناڤێ تە ژ ٨ پیتان کێمتر بیت</Motion.p>
                                 )}
                                 {draftNickname.length > 15 && (
                                    <Motion.p initial={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }} className="text-rose-600 dark:text-rose-400 text-[11px] font-black">نابیت ناڤێ تە ژ ١٥ پیتان زێدەتر بیت</Motion.p>
                                 )}
                              </AnimatePresence>
                           </div>
                        )}
                     </div>

                     <div className="space-y-2 flex flex-col items-end">
                        <span className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1  text-right block w-full mt-1">ئیمەیڵێ تە (Gmail)</span>
                        <div className="w-full h-12 bg-mono-white dark:bg-mono-900 border border-mono-300 dark:border-mono-700 rounded-md px-4 flex items-center justify-end font-bold text-mono-500 dark:text-mono-400 text-[14px] noise-grain overflow-hidden mb-1 shadow-sm transition-colors duration-300">
                           <span className="truncate">{user?.email || 'جیمایڵ نەتایبەتە'}</span>
                           <span className="material-symbols-outlined text-[20px] mr-3 text-mono-400 dark:text-mono-500">mail</span>
                        </div>
                     </div>

                     <div className="space-y-2 flex flex-col items-end">
                        <span className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1  text-right block w-full">وەڵات</span>
                        <div className="flex items-center gap-2 w-full">
                           <div className="relative w-full">
                              <button
                                 id="country-selector"
                                 ref={flagButtonRef}
                                 onClick={() => { triggerHaptic(10); setIsFlagBoxOpen(!isFlagBoxOpen); }}
                                 className={`flex items-center px-4 h-12 rounded-md border transition-all w-full justify-between flex-row-reverse ${isFlagBoxOpen
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
                              <Motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={handleSave} className="h-12 px-5 bg-green-600 text-white rounded-md font-black text-xs whitespace-nowrap shadow-lg shadow-green-900/20">پاراستن</Motion.button>
                           )}
                        </div>

                        {isFlagBoxOpen && createPortal(
                           <AnimatePresence mode="wait">
                              <Motion.div ref={flagDropdownRef} initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} style={{ position: 'absolute', top: dropdownCoords.top + 6, left: dropdownCoords.left, width: dropdownCoords.width }} className="bg-mono-white dark:bg-mono-900 rounded-xl border border-mono-200 dark:border-mono-800 z-9999 shadow-2xl overflow-hidden noise-grain">
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
                              </Motion.div>
                           </AnimatePresence>,
                           document.body
                        )}
                     </div>

                     <div className="space-y-4">
                        <span className="text-sm font-medium text-mono-600 dark:text-mono-400 px-1 uppercase  text-right block w-full">ھەلبژارتنا ئاڤاتاری</span>
                        <div className="bg-mono-white dark:bg-mono-900 border border-mono-300 dark:border-mono-700 rounded-md p-4 shadow-sm noise-grain transition-colors duration-300">
                           <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-4 max-h-60 overflow-y-auto pr-1 scrollbar-hide py-2 justify-items-center">
                              {AVATARS.map((avatar) => (
                                 <button
                                    key={avatar.id}
                                    onClick={() => { triggerHaptic(10); setDraftAvatar(avatar.id); }}
                                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all relative ${draftAvatar === avatar.id
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

                     {/* Invite Friends Section */}
                     <div className="bg-mono-50 dark:bg-mono-900/50 p-6 rounded-md border border-mono-200 dark:border-mono-800 flex flex-col items-center text-center noise-grain transition-colors duration-300 mt-8 mb-4">
                        <div className="w-12 h-12 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 border border-green-200 dark:border-green-800/30">
                           <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-400 font-bold">person_add</span>
                        </div>
                        <h4 className="text-base font-bold font-rabar text-mono-900 dark:text-mono-50 mb-1">ھەڤالێن خوە داخواز بکە</h4>
                        <p className="text-mono-500 dark:text-mono-400 text-[10px] font-bold font-rabar mb-5 leading-relaxed max-w-[200px]">بۆ ھەڤالێ خوە بھنێرە و پێکڤە یاریێ بکەن بۆ بدەستڤەھینانا خەلاتان</p>
                        <button onClick={() => { triggerHaptic(10); handleInvite(); }} className="w-full bg-green-600 text-white py-2.5 rounded-md font-black font-rabar text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-green-900/20">
                           کۆپی کرنا لینکی
                        </button>
                     </div>
                  </Motion.div>
         </div>
         {isCropModalOpen && createPortal(
            <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/90 overflow-hidden" dir="rtl">
               <Motion.div
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
                        <h3 className="text-white font-black font-rabar text-[15px]">کڕۆپکرنا وێنەی</h3>
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
                           <span className="text-[10px] font-black text-white/40 uppercase ]">زۆمکرنا وێنەی (Zoom)</span>
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
                                 [&::-moz-range-thumb]:border-white"
                           />
                        </div>
                     </div>

                     <div className="flex flex-col gap-3 pt-2">
                        <button
                           onClick={handleConfirmCrop}
                           className="w-full h-14 rounded-2xl bg-green-600 text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-t-2 border-white/40"
                        >
                           <span className="material-symbols-outlined text-2xl">check_circle</span>
                           پاراستن
                        </button>
                        <button
                           onClick={() => {
                              setIsCropModalOpen(false);
                              setImageToCrop(null);
                           }}
                           className="w-full h-12 rounded-2xl bg-red-600/10 text-red-500 font-bold text-xs hover:bg-red-600/20 transition-all active:scale-95 border border-red-600/20"
                        >
                           پەشیمانبوون و گۆهۆڕین
                        </button>
                     </div>
                  </div>
               </Motion.div>
            </div>,
            document.body
         )}
      </div>
   );
}

