import React from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { useVoice } from '../context/VoiceContext';
import { useAudio } from '../context/AudioContext';

const CrButton = ({ isOn, onClick }) => {
 return (
 <button
 onClick={() => {
 triggerHaptic(10);
 onClick();
 }}
 className={`relative w-32.5 h-7 rounded-[8px] shrink-0 flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden ${
 isOn ? 'bg-[#40ea00]' : 'bg-[#ff3b3b]'
 }`}
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
 {isOn ? 'هەلکری' : 'ڤەمری'}
 </span>
 </button>
 );
};

import CrSlider from './CrSlider';;

export default function AudioSettingsModal({
 isOpen,
 onClose,
 appSfxVolume,
 onAppSfxVolumeChange,
 bgMusicVolume,
 onBgMusicVolumeChange,
 hapticEnabled,
 onHapticToggle
}) {
 const { isMuted, toggleMute, isDeafened, toggleDeafen } = useVoice();
 const { playPopSound } = useAudio();

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
 ڕێکخستنێن دەنگی
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

 {/* Main Content Area */}
 <div className="flex-1 self-stretch flex flex-col relative mx-2.5 sm:mx-3 mb-4 rounded-[12px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 {/* Inner White Box Highlight */}
 <div className="absolute inset-0 rounded-[12px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 
 <div className="flex flex-col p-5 sm:p-6 z-0 relative h-full overflow-y-auto custom-scrollbar">
 
 {/* Top Row: Music & SFX ON/OFF */}
 <div className="grid grid-cols-2 gap-4 pb-6">
 <div className="flex flex-col items-center gap-2">
 <span className="font-black font-rabar text-[15px] text-[#3a404a]">دەنگ</span>
 <CrButton isOn={appSfxVolume > 0} onClick={() => onAppSfxVolumeChange(appSfxVolume > 0 ? 0 : 100)} />
 </div>
 <div className="flex flex-col items-center gap-2">
 <span className="font-black font-rabar text-[15px] text-[#3a404a]">مۆزیک</span>
 <CrButton isOn={bgMusicVolume > 0} onClick={() => onBgMusicVolumeChange(bgMusicVolume > 0 ? 0 : 100)} />
 </div>
 </div>

 {/* Middle Section: Sliders */}
 <div className="flex flex-col gap-8 py-6 border-t-[2.5px] border-b-[2.5px] border-black/5 relative">
 {/* Inner subtle white highlights for borders */}
 <div className="absolute top-0 inset-x-0 h-px bg-white/80"></div>
 <div className="absolute bottom-0 inset-x-0 h-px bg-white/80"></div>

 <div className="flex flex-col gap-3 w-full text-center">
 <span className="font-black font-rabar text-[15px] text-[#3a404a]">ئاستێ مۆزیکێ</span>
 <CrSlider value={bgMusicVolume} onChange={onBgMusicVolumeChange} />
 </div>
 <div className="flex flex-col gap-3 w-full text-center">
 <span className="font-black font-rabar text-[15px] text-[#3a404a]">ئاستێ دەنگی</span>
 <CrSlider 
 value={appSfxVolume} 
 onChange={onAppSfxVolumeChange} 
 onRelease={() => playPopSound()}
 />
 </div>
 </div>

 {/* Bottom Row: Voice & Haptics */}
 <div className="grid grid-cols-2 gap-4 pt-6">
 <div className="flex flex-col items-center gap-2">
 <span className="font-black font-rabar text-[15px] text-[#3a404a]">بڵندگۆ (سپیکەر)</span>
 <CrButton isOn={!isDeafened} onClick={toggleDeafen} />
 </div>
 <div className="flex flex-col items-center gap-2">
 <span className="font-black font-rabar text-[15px] text-[#3a404a]">مایکڕۆفۆن</span>
 <CrButton isOn={!isMuted} onClick={toggleMute} />
 </div>
 </div>
 <div className="flex justify-center mt-6 mb-2">
 <div className="flex flex-col items-center gap-2">
 <span className="font-black font-rabar text-[15px] text-[#3a404a]">لەرزین</span>
 <CrButton isOn={hapticEnabled} onClick={onHapticToggle} />
 </div>
 </div>

 </div>
 </div>
 </Motion.div>
 </div>
 )}
 </AnimatePresence>,
 document.body
 );
}
