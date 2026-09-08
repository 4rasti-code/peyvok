import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import Avatar from './Avatar';

export default function BlockedUsersModal({ isOpen, onClose, user, handleToggleBlock }) {
 const [blockedUsers, setBlockedUsers] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchBlockedUsers = async () => {
 setLoading(true);
 try {
 const { data: blocks, error } = await supabase
 .from('blocks')
 .select('blocked_id')
 .eq('blocker_id', user.id);

 if (error) throw error;

 if (blocks && blocks.length > 0) {
 const ids = blocks.map(b => b.blocked_id);
 const { data: profiles, error: profilesError } = await supabase
 .from('profiles')
 .select('id, nickname, avatar_url')
 .in('id', ids);

 if (profilesError) throw profilesError;
 setBlockedUsers(profiles || []);
 } else {
 setBlockedUsers([]);
 }
 } catch (err) {
 console.error("Error fetching blocked users:", err);
 } finally {
 setLoading(false);
 }
 };

 if (isOpen && user?.id) {
 fetchBlockedUsers();
 }
 }, [isOpen, user?.id]);

 const handleUnblock = async (targetId) => {
 triggerHaptic(10);
 // currentStatus = true means they are currently blocked, so this will unblock them
 const success = await handleToggleBlock(targetId, true);
 if (success) {
 setBlockedUsers(prev => prev.filter(u => u.id !== targetId));
 } else {
 alert("شاشیەک ڕوویدا د ڕاکردنا بلۆکیدا");
 }
 };

 if (!isOpen) return null;

 return createPortal(
 <AnimatePresence>
 <Motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-1100 flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir="rtl"
 >
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-black/90 ]"
 />

 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-85 h-auto max-h-[85vh] flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
 onClick={e => e.stopPropagation()}
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
 <div className="w-full relative z-10 flex flex-col items-center justify-center pt-5 pb-4 shrink-0 gap-3">
 <h2 
 className="text-[22px] font-black text-white leading-none relative z-10 -translate-y-1 flex items-center gap-2" 
 style={{ 
 textShadow: `
 -2px -2px 0 #1a1c23, 2px -2px 0 #1a1c23,
 -2px 2px 0 #1a1c23, 2px 2px 0 #1a1c23,
 -2px 0px 0 #1a1c23, 2px 0px 0 #1a1c23,
 0px 2px 0 #1a1c23, 0px -2px 0 #1a1c23,
 0px 4px 0px #1a1c23, 0px 4px 8px rgba(0,0,0,0.4)
 `
 }}
 >
 لیستا بلۆککریان
 </h2>
 
 <button
 onClick={onClose}
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
 <div className="flex-1 self-stretch overflow-hidden flex flex-col mx-3 sm:mx-4 mb-4 relative z-0">
 <div className="flex flex-col relative rounded-[10px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden h-full z-10">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[10px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-20"></div>
 
 <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar p-4 space-y-3">
 {loading ? (
 <div className="flex justify-center py-8">
 <div className="w-6 h-6 border-4 border-[#1e86ff] border-t-transparent rounded-full animate-spin shadow-md"></div>
 </div>
 ) : blockedUsers.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-10 gap-3">
 <div className="w-16 h-16 rounded-full bg-[#181a20]/5 flex items-center justify-center border-2 border-[#181a20]/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
 <span className="material-symbols-outlined text-[32px] text-[#4a5568]/50">person_off</span>
 </div>
 <span className="text-[#4a5568] font-black text-[13px] drop-shadow-sm">کەس نەهاتیە بلۆک کرن</span>
 </div>
 ) : (
 blockedUsers.map(u => (
 <div key={u.id} className="flex items-center justify-between p-2.5 rounded-[10px] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-[1.5px] border-[#a0a7b4]/30 relative overflow-hidden group">
 <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-t from-black/5 to-transparent pointer-events-none"></div>
 <div className="flex items-center gap-3 overflow-hidden relative z-10">
 <div className="rounded-full border-[1.5px] border-[#181a20] shadow-[0_2px_0_rgba(24,26,32,1)] p-0.5 bg-[#a0a7b4]">
 <Avatar src={u.avatar_url} size="sm" />
 </div>
 <span className="font-black text-[13px] text-[#181a20] truncate max-w-25">{u.nickname}</span>
 </div>
 <button
 onClick={() => handleUnblock(u.id)}
 className="relative z-10 px-3 py-2 bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] text-white rounded-[8px] text-[11px] font-black transition-all active:scale-95 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.5),0_2px_0_#960f0f,0_4px_4px_rgba(0,0,0,0.2)] border-[1.5px] border-[#181a20] overflow-hidden"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-[5px]"></div>
 <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">لادانا بلۆکێ</span>
 </button>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 </AnimatePresence>,
 document.body
 );
}
