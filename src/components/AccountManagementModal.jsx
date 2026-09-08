import React from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';

export default function AccountManagementModal({
 isOpen,
 onClose,
 user,
 setIsLinkEmailModalOpen,
 onDeleteAccount
}) {
 if (!isOpen) return null;

 return createPortal(
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/90 p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir="rtl">
 <Motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="w-full max-w-100 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
 onClick={e => e.stopPropagation()}
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

 <div className="w-full relative flex items-center justify-center pt-3 pb-4 shrink-0">
 <h2 
 className="text-[20px] font-black text-white leading-none relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 ڕێکخستنێن هژمارێ
 </h2>
 <button
 onClick={() => {
 triggerHaptic(10);
 onClose();
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
 <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-3 rounded-[8px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 {/* Content */}
 <div className="flex flex-col gap-3 p-5 z-0 relative">
 {/* Social Buttons Row */}
 <div className="grid grid-cols-2 gap-3">
 {/* GOOGLE BUTTON */}
 <button
 onClick={async () => {
 if (!user?.app_metadata?.providers?.includes('google')) {
 triggerHaptic(10);
 try {
 const { error } = await supabase.auth.linkIdentity({
 provider: 'google',
 options: {
 redirectTo: `${window.location.origin}/`,
 }
 });
 if (error) throw error;
 } catch (err) {
 console.error('Error linking Google account:', err);
 }
 }
 }}
 disabled={user?.app_metadata?.providers?.includes('google')}
 className={`relative w-full h-8 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-2px_0_#9ca3af] border-[1.5px] border-[#181a20] overflow-hidden group ${user?.app_metadata?.providers?.includes('google') ? 'bg-mono-200 cursor-default opacity-60 text-mono-500' : 'bg-linear-to-b from-white to-mono-100 hover:from-white hover:to-mono-50 active:scale-95 cursor-pointer text-mono-900'}`}
 title="Google"
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/40 pointer-events-none rounded-sm"></div>
 <span className="text-[11px] relative z-10">گۆگڵ</span>
 <div className="absolute right-2 flex items-center justify-center z-10">
 <svg className={`w-3.5 h-3.5 ${user?.app_metadata?.providers?.includes('google') ? 'grayscale opacity-50' : 'group-hover:scale-110 transition-transform'}`} viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
 <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
 </svg>
 </div>
 </button>

 {/* DISCORD BUTTON */}
 <button
 onClick={async () => {
 if (!user?.app_metadata?.providers?.includes('discord')) {
 triggerHaptic(10);
 try {
 const { error } = await supabase.auth.linkIdentity({
 provider: 'discord',
 options: {
 redirectTo: `${window.location.origin}/`,
 }
 });
 if (error) throw error;
 } catch (err) {
 console.error('Error linking Discord account:', err);
 alert("Error: " + err.message);
 }
 }
 }}
 disabled={user?.app_metadata?.providers?.includes('discord')}
 className={`relative w-full h-8 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#343b8a] border-[1.5px] border-[#181a20] overflow-hidden group ${user?.app_metadata?.providers?.includes('discord') ? 'bg-[#313669] text-[#7289da] cursor-default opacity-60' : 'bg-linear-to-b from-[#7289da] to-[#4752c4] hover:from-[#8ea1e1] hover:to-[#5865F2] cursor-pointer active:scale-95 text-white'}`}
 title="Discord"
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/10 pointer-events-none rounded-sm"></div>
 <span className="text-[11px] relative z-10" style={{ textShadow: user?.app_metadata?.providers?.includes('discord') ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}>دیسکۆرد</span>
 <div className="absolute right-2 flex items-center justify-center z-10">
 <svg className={`w-3.5 h-3.5 ${user?.app_metadata?.providers?.includes('discord') ? 'grayscale opacity-50' : 'text-white group-hover:scale-110 transition-transform'}`} viewBox="0 0 24 24" fill="currentColor">
 <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
 </svg>
 </div>
 </button>
 </div>

 {/* EMAIL BUTTON */}
 <button
 onClick={() => {
 triggerHaptic(10);
 if (!user?.app_metadata?.providers?.includes('email')) {
 onClose();
 setIsLinkEmailModalOpen(true);
 }
 }}
 disabled={!user?.is_anonymous && user?.app_metadata?.providers?.includes('email')}
 className={`relative w-full h-8 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#064e3b] border-[1.5px] border-[#181a20] overflow-hidden ${user?.app_metadata?.providers?.includes('email') ? 'bg-emerald-900/50 cursor-default opacity-60 text-emerald-300' : 'bg-linear-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:scale-95 cursor-pointer text-white'}`}
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/15 pointer-events-none rounded-sm"></div>
 <span className="text-[12px] relative z-10" style={{ textShadow: user?.app_metadata?.providers?.includes('email') ? 'none' : '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 2px 0 #181a20' }}>ئیمەیل</span>
 <div className="absolute right-3 flex items-center justify-center z-10">
 <span className="material-symbols-outlined text-[15px]">mail</span>
 </div>
 </button>

 {/* Separator Line */}
 <div className="w-full flex items-center justify-center opacity-70">
 <div className="w-[90%] h-[1.5px] bg-linear-to-r from-transparent via-[#b8c2cc] to-transparent"></div>
 </div>

 {/* Compact Delete Account Button */}
 <button
 onClick={() => { 
 triggerHaptic(10); 
 onClose();
 onDeleteAccount?.(); 
 }}
 className="relative w-full h-7 rounded-[8px] shrink-0 flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#ff3b3b]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span 
 className="text-white text-[13px] font-rabar leading-none relative z-10 -translate-y-px tracking-normal"
 style={{ 
 textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316'
 }}
 >
 ژێبرنا هژمارێ
 </span>
 <div className="absolute right-3 flex items-center justify-center z-10 text-white">
 <span className="material-symbols-outlined text-[15px]" style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}>person_remove</span>
 </div>
 </button>
 </div>
 </div>
 </Motion.div>
 </div>
 )}
 </AnimatePresence>,
 document.body
 );
}
