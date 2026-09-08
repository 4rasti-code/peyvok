import React, { useRef, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import AccountSettings from './AccountSettings';
import HelpCenterModal from './HelpCenterModal';
import BlockedUsersModal from './BlockedUsersModal';
import { useUser } from '../context/AuthContext';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import DataDeletion from './DataDeletion';
import ReportModal from './ReportModal';
import WordSuggestionModal from './WordSuggestionModal';
import { playBackSfx } from '../utils/audio';
import { supabase } from '../lib/supabase';
import AudioSettingsModal from './AudioSettingsModal';
import CloseButton from './CloseButton';

function SettingsModal({
 isOpen,
 onClose,
 appSfxVolume,
 onAppSfxVolumeChange,
 bgMusicVolume,
 onBgMusicVolumeChange,
 hapticEnabled,
 onHapticToggle,
 updateProfile,
 onLogout,
 onPlaySound
}) {

 const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
 const [isHelpCenterOpen, setIsHelpCenterOpen] = React.useState(false);
 const [isBlockedModalOpen, setIsBlockedModalOpen] = React.useState(false);
 const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
 const [isWordSuggestionModalOpen, setIsWordSuggestionModalOpen] = React.useState(false);
 const [isAudioSettingsModalOpen, setIsAudioSettingsModalOpen] = React.useState(false);
 const [isAccountManagementModalOpen, setIsAccountManagementModalOpen] = React.useState(false);
 const [activePolicyModal, setActivePolicyModal] = React.useState(null);
 const { user, handleToggleBlock } = useUser();



 const handleDeleteAccount = async () => {
 setShowDeleteConfirm(false);
 triggerHaptic(50);
 try {
 // Call the Supabase RPC to completely delete the auth user
 const { error } = await supabase.rpc('delete_user');
 if (error) {
 console.error("RPC delete_user failed (maybe not created yet?), falling back to profile deletion:", error);
 await supabase.from('profiles').delete().eq('id', user.id);
 }
 } catch (err) {
 console.error("Account deletion error:", err);
 }

 if (onLogout) {
 onLogout();
 }
 };

 return (
 <>
 <AnimatePresence>
 {isOpen && (
 <Motion.div
 key="settings-modal-overlay"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 sm:p-6 transition-colors duration-500 overflow-hidden"
 onClick={onClose}
 >
 <Motion.div
 className="w-full max-w-105 h-auto max-h-[90vh] flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
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

 {/* Clash Royale Header (Inside Card) */}
 <div className="w-full relative z-10 flex items-center justify-center pt-5 pb-3 shrink-0">
 <h2 
 className="text-[28px] font-black text-white leading-none relative z-10 -translate-y-2" 
 style={{ 
 textShadow: `
 -2px -2px 0 #1a1c23,
 2px -2px 0 #1a1c23,
 -2px 2px 0 #1a1c23,
 2px 2px 0 #1a1c23,
 -2px 0px 0 #1a1c23,
 2px 0px 0 #1a1c23,
 0px 2px 0 #1a1c23,
 0px -2px 0 #1a1c23,
 0px 5px 0px #1a1c23, 
 0px 5px 10px rgba(0,0,0,0.4)
 `
 }}
 >
 ڕێکخستن
 </h2>
 <button
 onClick={onClose}
 className="absolute right-3 top-3.5 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
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

 {/* Main Content Area - Scrollable Wrapper */}
 <div className="flex-1 self-stretch overflow-y-auto custom-scrollbar flex flex-col mx-3 sm:mx-4 mb-3 relative z-0">
 
 {/* CONTAINER 1: Profile & Quick Edit */}
 <div className="flex flex-col relative rounded-[10px] bg-[#e6ebf0] shadow-[0_6px_12px_rgba(0,0,0,0.15)] overflow-hidden p-4 sm:p-5 shrink-0 z-20">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[10px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-10"></div>
 <div className="relative z-20 w-full">
 <AccountSettings 
 updateProfile={updateProfile} 
 onDeleteAccount={() => setShowDeleteConfirm(true)} 
 isAccountManagementModalOpen={isAccountManagementModalOpen}
 setIsAccountManagementModalOpen={setIsAccountManagementModalOpen}
 />
 </div>
 </div>

 {/* CONTAINER 2: Settings Grid */}
 <div className="flex flex-col relative rounded-b-[10px] bg-[#e3eef2] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden p-4 sm:p-5 pt-10 pb-8 sm:pb-10 shrink-0 z-10 -mt-4">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-b-[10px] border-[2.5px] border-t-transparent border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 <div className="relative z-20 flex flex-col h-full">
 {/* 1. ACCOUNT, AUDIO & BLOCKED USERS */}
 <div className="grid grid-cols-2 items-center justify-center gap-3 w-full relative mt-1">
 <button
 onClick={() => { 
 triggerHaptic(10); 
 setIsAccountManagementModalOpen(true);
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>ڕێکخستنێن هژمارێ</span>
 </button>

 <button
 onClick={() => { 
 triggerHaptic(10); 
 setIsAudioSettingsModalOpen(true);
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>ڕێکخستنێن دەنگی</span>
 </button>

 </div>

 {/* Divider Line */}
 <div className="w-full flex justify-center pt-6 pb-10">
 <div className="w-3/4 h-0.5 bg-[#a0a7b4] opacity-50 rounded-full"></div>
 </div>

 {/* HELP & LEGAL SECTION */}
 <div className="grid grid-cols-2 gap-3 w-full relative">
 <button
 onClick={() => { 
 triggerHaptic(10); 
 setIsHelpCenterOpen(true);
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>سەنتەرێ هاریکاریێ</span>
 </button>

 <button
 onClick={() => { 
 triggerHaptic(10); 
 setIsReportModalOpen(true);
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>ئاریشە و پێشنیار</span>
 </button>

 <button
 onClick={() => { 
 triggerHaptic(10); 
 setActivePolicyModal('terms');
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>مەرجێن خزمەتگوزاریێ</span>
 </button>

 <button
 onClick={() => { 
 triggerHaptic(10); 
 setActivePolicyModal('privacy');
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#115ab5] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>سیاسەتا تایبەتمەندیێ</span>
 </button>

 <button
 onClick={() => { 
 triggerHaptic(10); 
 setActivePolicyModal('deletion');
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#a0a7b4] to-[#727888] hover:from-[#b0b7c4] hover:to-[#828898] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#4a5568] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>ژێبرنا داتایان</span>
 </button>

 <button
 onClick={() => { 
 triggerHaptic(10); 
 setIsBlockedModalOpen(true);
 }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#a0a7b4] to-[#727888] hover:from-[#b0b7c4] hover:to-[#828898] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#4a5568] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>لیستا بلۆککریان</span>
 </button>
 </div>

 {/* Compact Logout Button */}
 <div className="mt-auto pt-8 w-full">
 <button
 onClick={() => { triggerHaptic(15); onPlaySound?.(); onLogout(); }}
 className="relative w-full h-7 rounded-[8px] font-black font-rabar text-[13px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#960f0f] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>دەرکەفتن ژ ھەژمارێ</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 {/* Footer Area (On Dark Gray Background) */}
 <div className="w-full shrink-0 flex flex-col items-center justify-center pb-4 -mt-1">
 <p className="text-[10px] font-black tracking-widest text-white" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 rgba(0,0,0,0.8)' }}>
 Peyvok v3.0.0
 </p>
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {isHelpCenterOpen && (
 <HelpCenterModal
 key="help-center-modal"
 onClose={() => setIsHelpCenterOpen(false)}
 triggerHaptic={triggerHaptic}
 />
 )}
 </AnimatePresence>

 <BlockedUsersModal
 isOpen={isBlockedModalOpen}
 onClose={() => setIsBlockedModalOpen(false)}
 user={user}
 handleToggleBlock={handleToggleBlock}
 />
 <PolicyModal
 isOpen={!!activePolicyModal}
 onClose={() => setActivePolicyModal(null)}
 type={activePolicyModal}
 onViewChange={setActivePolicyModal}
 />
 {/* DELETE CONFIRMATION OVERLAY */}
 <AnimatePresence>
 {showDeleteConfirm && (
 <Motion.div
 key="delete-confirm-overlay"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-110 bg-black/90 flex items-center justify-center p-4 sm:p-8"
 >
 <Motion.div
 key="delete-confirm-overlay-styled"
 initial={{ scale: 0.95, opacity: 0, y: 10 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.95, opacity: 0, y: 10 }}
 className="w-full max-w-85 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
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

 <div className="w-full relative flex items-center justify-center pt-4 pb-4 shrink-0">
 <h2 
 className="text-[20px] font-black text-white leading-none relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 ژێبرنا هژمارێ
 </h2>
 
 <button
 onClick={() => {
 triggerHaptic(10);
 setShowDeleteConfirm(false);
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
 
 <div className="relative z-20 flex flex-col items-center p-5 pt-6">
 <p className="text-[13px] font-bold text-center text-[#3a404a] mb-6 leading-relaxed">
 تو پشتڕاستی ژ ژێبرنا ڤێ هژمارێ؟ هەمی داتا و پێشکەفتنێن تە دێ ب یەکجاری هێنە ژێبرن و ڤەگەڕاندن تێدا نینە.
 </p>
 
 <div className="flex flex-col gap-3 w-full mt-2">
 <button
 onClick={() => { triggerHaptic(10); handleDeleteAccount(); }}
 className="relative w-full h-8 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#ff3b3b]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span 
 className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" 
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 بەلێ، ژێببە
 </span>
 </button>

 <button
 onClick={() => { triggerHaptic(10); setShowDeleteConfirm(false); }}
 className="relative w-full h-8 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#8a92a0]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span 
 className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" 
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 نەخێر
 </span>
 </button>
 </div>
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>

 {/* Report Bug/Suggestion Modal */}
 <AnimatePresence>
 {isReportModalOpen && (
 <ReportModal
 isOpen={isReportModalOpen}
 onClose={() => setIsReportModalOpen(false)}
 user={user}
 />
 )}
 </AnimatePresence>

 <AnimatePresence>
 {isWordSuggestionModalOpen && (
 <WordSuggestionModal
 isOpen={isWordSuggestionModalOpen}
 onClose={() => setIsWordSuggestionModalOpen(false)}
 user={user}
 />
 )}
 </AnimatePresence>
 
 <AudioSettingsModal 
 isOpen={isAudioSettingsModalOpen}
 onClose={() => setIsAudioSettingsModalOpen(false)}
 appSfxVolume={appSfxVolume}
 onAppSfxVolumeChange={onAppSfxVolumeChange}
 bgMusicVolume={bgMusicVolume}
 onBgMusicVolumeChange={onBgMusicVolumeChange}
 hapticEnabled={hapticEnabled}
 onHapticToggle={onHapticToggle}
 />
 </>
 );
}

const PolicyModal = ({ isOpen, onClose, type, onViewChange }) => {
 const scrollRef = useRef(null);

 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = 0;
 }
 }, [type]);

 const renderContent = () => {
 const props = { onViewChange, onClose };
 switch (type) {
 case 'terms': return <TermsOfService {...props} />;
 case 'privacy': return <PrivacyPolicy {...props} />;
 case 'deletion': return <DataDeletion {...props} />;
 default: return null;
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <Motion.div
 ref={scrollRef}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-1000 flex flex-col bg-mono-white dark:bg-black overflow-y-auto"
 >
 {/* Custom Header for Policy Modals */}
 <div className="sticky top-0 z-50 flex items-center justify-end px-6 py-4 pt-safe bg-mono-white/80 dark:bg-black/95 border-b border-mono-200 dark:border-white/5">
 <CloseButton onClick={() => { playBackSfx(); onClose(); }} />
 </div>

 <div className="flex-1">
 {renderContent()}
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 );
}

export default SettingsModal;
