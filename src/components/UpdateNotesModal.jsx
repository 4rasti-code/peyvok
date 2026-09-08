import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../context/AudioContext';

const UPDATE_VERSION = 'v3.0.0'; // Change this string to force the modal to show again for all users

const UPDATE_RELEASE_DATE = new Date('2026-08-19T00:00:00Z');

const UpdateNotesModal = ({ user, onComplete }) => {
 const [isVisible, setIsVisible] = useState(false);
 const { playPopSound } = useAudio();
 const hasCheckedRef = React.useRef(false);

 useEffect(() => {
 if (hasCheckedRef.current) return;
 hasCheckedRef.current = true;
 const hasSeenUpdate = localStorage.getItem(`update_seen_${UPDATE_VERSION}`);

 if (!hasSeenUpdate) {
 // Check if the user is a new user (registered after the update release)
 if (user?.created_at && new Date(user.created_at) > UPDATE_RELEASE_DATE) {
 // New user: mark as seen silently so they never see it
 localStorage.setItem(`update_seen_${UPDATE_VERSION}`, 'true');
 if (onComplete) onComplete();
 return;
 }

 // Old user: show the modal with a small delay
 const timer = setTimeout(() => {
 setIsVisible(true);
 try { playPopSound(); } catch (_e) { /* ignore */ }
 }, 1500);
 return () => clearTimeout(timer);
 } else {
 if (onComplete) onComplete();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [playPopSound, user]);

 const handleClose = () => {
 try { playPopSound(); } catch (_e) { /* ignore */ }
 setIsVisible(false);
 localStorage.setItem(`update_seen_${UPDATE_VERSION}`, 'true');
 if (onComplete) onComplete();
 };

 return (
 <AnimatePresence>
 {isVisible && (
 <Motion.div
 key="update-modal-overlay"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90 p-4 font-rabar"
 dir="rtl"
 >
 <Motion.div
 initial={{ scale: 0.9, y: 20, opacity: 0 }}
 animate={{ scale: 1, y: 0, opacity: 1 }}
 exit={{ scale: 0.9, y: 20, opacity: 0 }}
 transition={{ type: "spring", stiffness: 350, damping: 25 }}
 className="w-[90%] max-w-sm relative flex flex-col items-center mt-12"
 >
 {/* Decorative Header */}
 <div className="absolute -top-12 z-20 bg-linear-to-br from-[#40bcf7] to-[#1a9bf0] w-24 h-24 rounded-2xl flex items-center justify-center border-4 border-mono-white dark:border-mono-900 shadow-xl shadow-[#1a9bf0]/20 transition-colors duration-500">
 <span className="material-symbols-outlined text-[48px] text-white">auto_awesome</span>
 </div>

 {/* Main Card */}
 <div className="bg-linear-to-b from-mono-white to-blue-50/30 dark:from-mono-900 dark:to-[#050a0f] rounded-lg border-2 border-[#1a9bf0] w-full pt-16 pb-5 px-4 sm:px-6 overflow-hidden flex flex-col relative z-10 transition-colors duration-500 shadow-2xl shadow-[#1a9bf0]/10">

 {/* Title */}
 <h2 className="text-xl font-black text-center text-mono-900 dark:text-white mb-1 transition-colors">
 وەشانا نوی گەهشت!
 </h2>
 <p className="text-xs text-center text-[#1a9bf0] font-bold mb-5 transition-colors">
 ڤێرژنا {UPDATE_VERSION}
 </p>

 {/* Scrollable Content */}
 <div className="relative flex-1 min-h-0 flex flex-col">
 <div
 className="flex-1 overflow-y-auto custom-scrollbar pr-2 pl-1 max-h-[55vh] flex flex-col space-y-3 pb-4"
 >
 {/* Item 1 */}
 <div className="bg-linear-to-br from-mono-100/80 to-white/50 dark:from-[#252525]/80 dark:to-[#181818]/40 rounded-md p-3 border border-mono-200/50 dark:border-white/5 flex gap-3 items-start transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
 <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl border border-blue-500/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
 ✨
 </div>
 <div className="flex flex-col pt-0.5">
 <h3 className="text-[13px] font-black text-[#1a9bf0] mb-0.5">دیزاینەکا نوی بۆ یاریێ</h3>
 <p className="text-[11px] font-bold text-mono-600 dark:text-mono-300 leading-relaxed">
 تەڤاهیا دیزاینا بەرنامەیی ب شێوەیەکێ گەلەک جوان و پێشکەفتی هاتیە گوهۆڕین!
 </p>
 </div>
 </div>

 {/* Item 2 */}
 <div className="bg-linear-to-br from-mono-100/80 to-white/50 dark:from-[#252525]/80 dark:to-[#181818]/40 rounded-md p-3 border border-mono-200/50 dark:border-white/5 flex gap-3 items-start transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
 <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xl border border-emerald-500/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
 🟢
 </div>
 <div className="flex flex-col pt-0.5">
 <h3 className="text-[13px] font-black text-emerald-500 mb-0.5">سیستەمێ ئۆنلاین یێ پێشکەفتی</h3>
 <p className="text-[11px] font-bold text-mono-600 dark:text-mono-300 leading-relaxed">
 سیستەمێ ئۆنلاین هاتیە پێشئێخستن .
 </p>
 </div>
 </div>

 {/* Item 3 */}
 <div className="bg-linear-to-br from-mono-100/80 to-white/50 dark:from-[#252525]/80 dark:to-[#181818]/40 rounded-md p-3 border border-mono-200/50 dark:border-white/5 flex gap-3 items-start transition-all duration-300 hover:scale-[1.02] hover:shadow-md group">
 <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-xl border border-amber-500/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
 💡
 </div>
 <div className="flex flex-col pt-0.5">
 <h3 className="text-[13px] font-black text-amber-500 mb-0.5">بەشێ پێشنیارکرنا پەیڤان</h3>
 <p className="text-[11px] font-bold text-mono-600 dark:text-mono-300 leading-relaxed">
 بەشەکێ نوی هاتیە زێدەکرن کو تو دشێی پەیڤێن نوی بۆ یاریێ پێشنیار بکەی.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Action Button */}
 <div className="mt-6 pt-4 border-t border-mono-200 dark:border-white/10 flex justify-center transition-colors duration-500">
 <button
 onClick={handleClose}
 className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 border border-amber-400/50 font-black text-[15px] py-3 px-12 rounded-md active:scale-95 transition-all w-full flex items-center justify-center gap-2"
 >
 <span>گەلەک باشە</span>
 <span className="material-symbols-outlined text-[18px]">check_circle</span>
 </button>
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>
 );
};

export default UpdateNotesModal;


