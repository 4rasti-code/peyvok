import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';

import { useUser } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';
import { COUNTRIES } from '../data/countries';
import FlagBadge from './FlagBadge';
import { toKuDigits } from '../utils/formatters';
import UpgradeAccountModal from './UpgradeAccountModal';
import LinkEmailModal from './LinkEmailModal';
import AccountManagementModal from './AccountManagementModal';
import Avatar from './Avatar';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';
import CrSlider from './CrSlider';

export default function AccountSettings({ updateProfile, onDeleteAccount, isAccountManagementModalOpen, setIsAccountManagementModalOpen }) {
 const { user, userNickname, userAvatar, countryCode, isInKurdistan, lastNicknameUpdate } = useUser();

 const [draftNickname, setDraftNickname] = useState(userNickname);
 const [prevUserNickname, setPrevUserNickname] = useState(userNickname);
 if (userNickname !== prevUserNickname) {
 setPrevUserNickname(userNickname);
 setDraftNickname(userNickname);
 }

 const [draftCountryCode, setDraftCountryCode] = useState(countryCode);
 const [prevCountryCode, setPrevCountryCode] = useState(countryCode);
 if (countryCode !== prevCountryCode) {
 setPrevCountryCode(countryCode);
 setDraftCountryCode(countryCode);
 }

 const [draftIsInKurdistan, setDraftIsInKurdistan] = useState(isInKurdistan);
 const [prevIsInKurdistan, setPrevIsInKurdistan] = useState(isInKurdistan);
 if (isInKurdistan !== prevIsInKurdistan) {
 setPrevIsInKurdistan(isInKurdistan);
 setDraftIsInKurdistan(isInKurdistan);
 }


 const [saveError, setSaveError] = useState(null);
 const [isEditNicknameModalOpen, setIsEditNicknameModalOpen] = useState(false);
 const [isEditCountryModalOpen, setIsEditCountryModalOpen] = useState(false);
 const [showLockToast, setShowLockToast] = useState(false);
 const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
 const [isLinkEmailModalOpen, setIsLinkEmailModalOpen] = useState(false);

 const fileInputRef = useRef(null);
 const [imageToCrop, setImageToCrop] = useState(null);
 const [crop, setCrop] = useState({ x: 0, y: 0 });
 const [zoom, setZoom] = useState(1);
 const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
 const [isCropModalOpen, setIsCropModalOpen] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [cropSize, setCropSize] = useState({ width: 300, height: 300 });

 const cropperContainerRef = useCallback((node) => {
 if (node) {
 const { width } = node.getBoundingClientRect();
 setCropSize({ width, height: width });
 }
 }, []);

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
 e.target.value = null;
 };

 const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
 setCroppedAreaPixels(croppedAreaPixels);
 }, []);

 const handleConfirmCrop = async () => {
 if (!imageToCrop || !croppedAreaPixels) return;
 try {
 setIsUploading(true);
 const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);

 const fileExt = 'jpg';
 const fileName = `${user?.id || 'guest'}-${Date.now()}.${fileExt}`;

 const { error: uploadError } = await supabase.storage
 .from('avatars')
 .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

 if (uploadError) throw uploadError;

 const { data: { publicUrl } } = supabase.storage
 .from('avatars')
 .getPublicUrl(fileName);

 await updateProfile({ avatar_url: publicUrl });

 setIsCropModalOpen(false);
 triggerHaptic([20, 10, 20]);
 } catch (err) {
 setSaveError(err.message || 'شاشیەک ڕوویدا د سەیڤکرنا وێنەی دا');
 } finally {
 setIsUploading(false);
 }
 };

 let isHardLocked = false;
 let daysRemaining = 0;

 if (lastNicknameUpdate) {
 const lastUpdate = new Date(lastNicknameUpdate);
 const now = new Date();
 const diffTime = Math.abs(now - lastUpdate);
 const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

 if (diffDays < 14) {
 isHardLocked = true;
 daysRemaining = 14 - diffDays;
 }
 }





 const handleSave = async () => {
 try {
 setSaveError(null);
 triggerHaptic([20, 10, 20]);
 const updates = {
 country_code: draftCountryCode,
 is_kurdistan: draftIsInKurdistan
 };

 if (draftNickname !== userNickname) {
 updates.nickname = draftNickname;
 updates.last_nickname_update = new Date().toISOString();
 }

 await updateProfile(updates);

 setIsEditNicknameModalOpen(false);
 setIsEditCountryModalOpen(false);
 } catch (err) {
 setSaveError(err.message || 'شاشیەک ڕوویدا');
 }
 };



 return (
 <div className="space-y-4">
 {/* 4. ACCOUNT SETTINGS SECTION */}
 <div className="w-full flex flex-col items-center justify-center gap-4 mt-2">

 {/* AVATAR SECTION */}
 <div className="relative">
 <div className="relative p-1 bg-[#e3eef2] dark:bg-white/10 rounded-full border-[1.5px] border-[#181a20] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_4px_6px_rgba(0,0,0,0.2)]">
 <Avatar src={userAvatar} size="xl" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover" />
 <button
 onClick={() => { triggerHaptic(10); fileInputRef.current?.click(); }}
 disabled={isUploading}
 className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] border-[1.5px] border-[#181a20] flex items-center justify-center text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] active:scale-95 transition-transform disabled:opacity-50"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="material-symbols-outlined text-[15px] relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>{isUploading ? 'hourglass_empty' : 'edit'}</span>
 </button>
 </div>
 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
 </div>

 <div className="flex flex-row items-center justify-center gap-3 w-full relative">

 <button
 onClick={() => {
 triggerHaptic(10);
 if (user?.is_anonymous) {
 setIsUpgradeModalOpen(true);
 return;
 }
 if (isHardLocked) {
 setShowLockToast(true);
 setTimeout(() => setShowLockToast(false), 3000);
 return;
 }
 setIsEditNicknameModalOpen(true);
 }}
 className={`relative flex-1 h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 shrink-0 border-[1.5px] border-[#181a20] overflow-hidden ${isHardLocked
 ? 'bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] opacity-60 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white cursor-not-allowed'
 : 'bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer'
 }`}
 >
 {/* Glass Reflection Highlight */}
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10 -translate-y-px" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 2px 2px rgba(0,0,0,0.8)' }}>ناڤێ خوە بگوهۆڕە</span>
 </button>

 <button
 onClick={() => {
 triggerHaptic(10);
 setIsEditCountryModalOpen(true);
 }}
 className="relative flex-1 h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 shrink-0 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer"
 >
 {/* Glass Reflection Highlight */}
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10 -translate-y-px" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 2px 2px rgba(0,0,0,0.8)' }}>وەلاتێ خوە بگوهۆڕە</span>
 </button>
 </div>
 <AnimatePresence>
 {showLockToast && (
 <Motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 className="fixed inset-0 z-1000 flex items-center justify-center p-6 pointer-events-none"
 >
 <div className="bg-amber-500 text-slate-950 px-6 py-4 rounded-md font-black font-rabar text-[13px] shadow-2xl flex items-center gap-3 border-2 border-white/30 pointer-events-auto">
 <span className="material-symbols-outlined text-xl">lock</span>
 تو نەشێی ناسناڤێ خوە بگوهۆڕی هەتا {toKuDigits(daysRemaining)} ڕۆژێن دی
 </div>
 </Motion.div>
 )}
 </AnimatePresence>

 {isEditNicknameModalOpen && createPortal(
 <AnimatePresence>
 <Motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-1100 flex items-center justify-center bg-black/90 px-4"
 onClick={() => setIsEditNicknameModalOpen(false)}
 >
 <Motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="w-full max-w-85 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
 onClick={e => e.stopPropagation()}
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

 {/* Header */}
 <div className="w-full relative z-10 flex items-center justify-center pt-5 pb-5 shrink-0">
 <h2
 className="text-[22px] font-black text-white leading-none relative z-10 -translate-y-1 flex items-center gap-2"
 style={{
 textShadow: `
 -2px -2px 0 #1a1c23, 2px -2px 0 #1a1c23,
 -2px 2px 0 #1a1c23, 2px 2px 0 #1a1c23,
 -2px 0px 0 #1a1c23, 2px 0px 0 #1a1c23,
 0px 2px 0 #1a1c23, 0px -2px 0 #1a1c23,
 0px 5px 0px #1a1c23, 0px 5px 10px rgba(0,0,0,0.4)
 `
 }}
 >
 گوهۆڕینا ناسناڤی
 </h2>
 <button
 onClick={() => {
 setDraftNickname(userNickname);
 setSaveError(null);
 setIsEditNicknameModalOpen(false);
 }}
 className="absolute right-3 top-3.5 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-md"></div>
 <svg viewBox="0 0 24 24" className="w-4 h-4 -translate-y-px relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 </svg>
 </button>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 self-stretch flex flex-col mx-3 sm:mx-4 mb-4 relative z-0">
 <div className="flex flex-col relative rounded-[10px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden p-4 shrink-0 z-10 gap-3">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[10px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-10"></div>

 <div className="relative z-20 w-full flex flex-col gap-2">
 <label className="text-[13px] font-black text-[#181a20] block text-right px-1">ناسناڤی بنڤیسە</label>
 <div className="relative w-full">
 <input
 type="text"
 placeholder="ناسناڤ"
 value={draftNickname}
 onChange={(e) => {
 const noSpaceVal = e.target.value.replace(/\s/g, '');
 setDraftNickname(noSpaceVal);
 if (saveError) setSaveError(null);
 }}
 maxLength={20}
 className="w-full h-12 rounded-[8px] bg-white border-[1.5px] border-[#a0a7b4] text-[#181a20] font-black font-rabar text-right text-[15px] px-3 outline-none focus:border-[#1e86ff] focus:ring-2 focus:ring-[#1e86ff]/20 transition-all placeholder:text-[#a0a7b4] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
 autoFocus
 />
 </div>
 <AnimatePresence>
 {saveError && (
 <Motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#ff3b3b] text-[11px] font-black px-1 mt-1 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">{saveError}</Motion.p>
 )}
 {draftNickname.length > 0 && draftNickname.length < 8 && !saveError && (
 <Motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#ff3b3b] text-[11px] font-black px-1 mt-1 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">نابیت ناسناڤ ژ ٨ پیتان کێمتر بیت</Motion.p>
 )}
 {draftNickname.length > 15 && !saveError && (
 <Motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#ff3b3b] text-[11px] font-black px-1 mt-1 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">نابیت ناسناڤ ژ ١٥ پیتان زێدەتر بیت</Motion.p>
 )}
 </AnimatePresence>
 </div>

 <div className="flex items-center gap-3 mt-2 relative z-20">
 <button
 onClick={() => {
 setDraftNickname(userNickname);
 setSaveError(null);
 setIsEditNicknameModalOpen(false);
 }}
 className="flex-1 h-11 rounded-[10px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] bg-[#a0a7b4] hover:bg-[#8d94a1] overflow-hidden relative"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span
 className="text-white text-[13.5px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar"
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 هەلوەشاندن
 </span>
 </button>
 <button
 onClick={handleSave}
 disabled={draftNickname.length < 8 || draftNickname.length > 15 || draftNickname === userNickname}
 className="flex-1 h-11 rounded-[10px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden relative bg-[#24a85c] disabled:opacity-60 disabled:bg-[#727888]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span
 className="text-white text-[13.5px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar"
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 پاراستن
 </span>
 </button>
 </div>
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 </AnimatePresence>,
 document.body
 )}

 {/* Edit Modals are rendered here as portals */}

 {isEditCountryModalOpen && createPortal(
 <AnimatePresence>
 <Motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-1100 flex items-center justify-center bg-black/90 px-4"
 onClick={() => setIsEditCountryModalOpen(false)}
 >
 <Motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="w-full max-w-85 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
 onClick={e => e.stopPropagation()}
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
 <div className="absolute top-1.5 inset-x-1.5 h-7 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>

 {/* Header Area */}
 <div className="w-full relative flex items-center justify-center pt-4 pb-4 shrink-0">
 <h2
 className="text-[20px] font-black text-white leading-none relative z-10"
 style={{
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 گوهۆڕینا وەڵاتی
 </h2>

 <button
 onClick={() => {
 triggerHaptic(10);
 setDraftCountryCode(countryCode);
 setDraftIsInKurdistan(isInKurdistan);
 setSaveError(null);
 setIsEditCountryModalOpen(false);
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

 {/* Content Area */}
 <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-4 rounded-[8px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 {/* Inner White Box Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>

 <div className="relative z-20 flex flex-col p-4">
 <label className="text-[14px] font-black text-[#3a404a] block text-right px-1 mb-2">وەڵاتێ خوە هەلبژێرە</label>
 <div className="p-1.5 max-h-55 overflow-y-auto custom-scrollbar bg-white/50 border-[1.5px] border-[#c0c5cc] rounded-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
 <button
 onClick={() => { triggerHaptic(10); setDraftIsInKurdistan(true); }}
 className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm w-full transition-colors flex-row-reverse border-[1.5px] ${draftIsInKurdistan ? 'bg-[#3b82f6]/10 border-[#3b82f6] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]' : 'border-transparent hover:bg-black/5'}`}
 >
 <FlagBadge isInKurdistan={true} size="xs" />
 <span className="flex-1 text-right text-[14px] font-black font-rabar text-[#3a404a]">کوردستان</span>
 {draftIsInKurdistan && (
 <div className="w-5 h-5 rounded-full bg-[#3b82f6] border border-[#2563eb] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
 <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>
 </div>
 )}
 </button>
 {COUNTRIES.map((country) => (
 <button
 key={country.code}
 onClick={() => { triggerHaptic(10); setDraftIsInKurdistan(false); setDraftCountryCode(country.code); }}
 className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm w-full transition-colors flex-row-reverse border-[1.5px] ${(!draftIsInKurdistan && draftCountryCode === country.code) ? 'bg-[#3b82f6]/10 border-[#3b82f6] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]' : 'border-transparent hover:bg-black/5'}`}
 >
 <FlagBadge countryCode={country.code} size="xs" />
 <span className="flex-1 text-right text-[14px] font-black font-rabar text-[#3a404a]">{country.name}</span>
 {!draftIsInKurdistan && draftCountryCode === country.code && (
 <div className="w-5 h-5 rounded-full bg-[#3b82f6] border border-[#2563eb] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
 <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>
 </div>
 )}
 </button>
 ))}
 </div>

 {/* Buttons */}
 <div className="flex items-center gap-3 mt-4">
 <button
 onClick={() => {
 triggerHaptic(10);
 setDraftCountryCode(countryCode);
 setDraftIsInKurdistan(isInKurdistan);
 setSaveError(null);
 setIsEditCountryModalOpen(false);
 }}
 className="relative flex-1 h-9 rounded-md flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#8a92a0]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span
 className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar"
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 هەلوەشاندن
 </span>
 </button>

 <button
 onClick={handleSave}
 disabled={draftCountryCode === countryCode && draftIsInKurdistan === isInKurdistan}
 className="relative flex-1 h-9 rounded-md flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#22c55e] disabled:opacity-60 disabled:active:scale-100 disabled:grayscale-[0.5]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span
 className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar"
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 پاراستن
 </span>
 </button>
 </div>
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 </AnimatePresence>,
 document.body
 )}

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
 </div>
 {/* UPGRADE ACCOUNT MODAL FOR GUESTS */}
 <UpgradeAccountModal
 isOpen={isUpgradeModalOpen}
 onSuccess={() => {
 setIsUpgradeModalOpen(false);
 setIsEditNicknameModalOpen(false); // Close settings if they registered successfully
 }}
 onClose={() => setIsUpgradeModalOpen(false)}
 />

 {/* LINK EMAIL MODAL FOR GOOGLE USERS */}
 <LinkEmailModal
 isOpen={isLinkEmailModalOpen}
 onSuccess={() => {
 setIsLinkEmailModalOpen(false);
 }}
 onClose={() => setIsLinkEmailModalOpen(false)}
 />

 {/* ACCOUNT MANAGEMENT MODAL */}
 <AccountManagementModal
 isOpen={isAccountManagementModalOpen}
 onClose={() => setIsAccountManagementModalOpen(false)}
 user={user}
 setIsUpgradeModalOpen={setIsUpgradeModalOpen}
 setIsLinkEmailModalOpen={setIsLinkEmailModalOpen}
 onDeleteAccount={onDeleteAccount}
 />
 </div>
 );
}
