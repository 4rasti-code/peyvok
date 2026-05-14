import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

function SettingsModal({
   isOpen,
   onClose,
   appSfxVolume,
   onAppSfxVolumeChange,
   bgMusicVolume,
   onBgMusicVolumeChange,
   hapticEnabled,
   onHapticToggle,
   micEnabled,
   micVolume,
   speakerEnabled,
   voiceVolume,
   updateProfile,
   onLogout,
   onPlaySound
}) {
   if (!isOpen) return null;

   return (
      <AnimatePresence>
         {isOpen && (
            <Motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-100 flex items-center justify-center px-4 bg-mono-white/80 dark:bg-black/80 backdrop-blur-md p-4 transition-colors duration-500"
               onClick={onClose}
            >
               <Motion.div
                  initial={{ scale: 0.98, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.98, opacity: 0, y: 10 }}
                  className="w-full max-w-[340px] rounded-lg overflow-hidden relative font-rabar bg-mono-white dark:bg-black border border-mono-200 dark:border-white/10 transition-colors duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
                  onClick={e => e.stopPropagation()}
                  dir="rtl"
               >
                  {/* Compact Header */}
                  <div className="p-6 pb-2 flex items-center justify-between">
                     <h2 className="text-xl font-black text-mono-900 dark:text-white">ڕێکخستن</h2>
                     <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-md bg-mono-50 dark:bg-white/5 flex items-center justify-center text-mono-500 dark:text-mono-400 hover:text-mono-900 dark:hover:text-white transition-all active:scale-90 border border-mono-100 dark:border-white/10"
                     >
                        <span className="material-symbols-outlined text-lg">close</span>
                     </button>
                  </div>

                   <div className="p-6 pt-2 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      {/* 1. SOUND EFFECTS SECTION */}
                      <div className="p-4 rounded-md bg-mono-50/50 dark:bg-white/5 border border-mono-100 dark:border-white/5 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                               <div className="w-8 h-8 rounded-md bg-mono-50 dark:bg-white/10 flex items-center justify-center border border-mono-100 dark:border-white/5">
                                  <span className="material-symbols-outlined text-base text-mono-600 dark:text-mono-400">
                                     {appSfxVolume > 0 ? 'volume_up' : 'volume_off'}
                                  </span>
                               </div>
                               <span className="text-[14px] font-black text-mono-800 dark:text-mono-200">کارتێکەرێن دەنگی</span>
                            </div>
                            <span className="text-[10px] font-black text-mono-400 tabular-nums bg-mono-50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-mono-100 dark:border-white/5">
                               {appSfxVolume}%
                            </span>
                         </div>
                         <div className="px-1">
                            <input
                               type="range"
                               min="0"
                               max="100"
                               value={appSfxVolume}
                               onChange={(e) => onAppSfxVolumeChange(parseInt(e.target.value))}
                               className="w-full h-1 bg-mono-100 dark:bg-white/10 rounded-none appearance-none cursor-pointer accent-mono-900 dark:accent-white transition-all"
                            />
                         </div>
                      </div>

                      {/* 2. APP TOGGLES GROUP */}
                      <div className="p-4 rounded-md bg-mono-50/50 dark:bg-white/5 border border-mono-100 dark:border-white/5 grid gap-2.5">
                         {/* Music Toggle */}
                         <div className="flex items-center justify-between p-3 rounded-md border border-mono-100 dark:border-white/5 bg-mono-50/30 dark:bg-white/5 hover:bg-mono-50 dark:hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-3">
                               <span className="material-symbols-outlined text-lg text-mono-400 dark:text-mono-500 group-hover:text-mono-900 dark:group-hover:text-white transition-colors">
                                  {bgMusicVolume > 0 ? 'music_note' : 'music_off'}
                               </span>
                               <span className="text-[13px] font-black text-mono-800 dark:text-mono-200">مۆزیکا پاشبنەمایی</span>
                            </div>
                            <button
                               onClick={() => { triggerHaptic(10); onBgMusicVolumeChange(bgMusicVolume > 0 ? 0 : 10); }}
                               className={`w-10 h-5 rounded-sm p-1 transition-all duration-300 relative ${bgMusicVolume > 0 ? 'bg-green-600/20' : 'bg-red-600/20'}`}
                            >
                               <Motion.div
                                  animate={{ x: bgMusicVolume > 0 ? -20 : 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className={`w-3 h-3 rounded-sm ${bgMusicVolume > 0 ? 'bg-green-600' : 'bg-red-600'} shadow-sm`}
                               />
                            </button>
                         </div>

                         {/* Haptic Toggle */}
                         <div className="flex items-center justify-between p-3 rounded-md border border-mono-100 dark:border-white/5 bg-mono-50/30 dark:bg-white/5 hover:bg-mono-50 dark:hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-3">
                               <span className="material-symbols-outlined text-lg text-mono-400 dark:text-mono-500 group-hover:text-mono-900 dark:group-hover:text-white transition-colors">vibration</span>
                               <span className="text-[13px] font-black text-mono-800 dark:text-mono-200">لەرزین</span>
                            </div>
                            <button
                               onClick={() => { triggerHaptic(10); onHapticToggle(); }}
                               className={`w-10 h-5 rounded-sm p-1 transition-all duration-300 relative ${hapticEnabled ? 'bg-green-600/20' : 'bg-red-600/20'}`}
                            >
                               <Motion.div
                                  animate={{ x: hapticEnabled ? -20 : 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className={`w-3 h-3 rounded-sm ${hapticEnabled ? 'bg-green-600' : 'bg-red-600'} shadow-sm`}
                               />
                            </button>
                         </div>
                      </div>

                      {/* 3. VOICE CHAT SECTION */}
                      <div className="p-4 rounded-md bg-mono-50/50 dark:bg-white/5 border border-mono-100 dark:border-white/5 space-y-4">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-mono-400">دەنگێ ڕاستەوخۆ (Live Voice)</h3>
                         
                         <div className="grid gap-2.5">
                            {/* Mic Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-md border border-mono-100 dark:border-white/5 bg-mono-50/30 dark:bg-white/5 hover:bg-mono-50 dark:hover:bg-white/10 transition-colors group">
                               <div className="flex items-center gap-3">
                                  <span className={`material-symbols-outlined text-lg transition-colors ${micEnabled ? 'text-mono-900 dark:text-white' : 'text-mono-400'}`}>
                                     {micEnabled ? 'mic' : 'mic_off'}
                                  </span>
                                  <span className="text-[13px] font-black text-mono-800 dark:text-mono-200">دەنگکێش</span>
                               </div>
                               <button
                                  onClick={() => { triggerHaptic(10); updateProfile({ mic_enabled: !micEnabled }); }}
                                  className={`w-10 h-5 rounded-sm p-1 transition-all duration-300 relative ${micEnabled ? 'bg-green-600/20' : 'bg-red-600/20'}`}
                               >
                                  <Motion.div
                                     animate={{ x: micEnabled ? -20 : 0 }}
                                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                     className={`w-3 h-3 rounded-sm ${micEnabled ? 'bg-green-600' : 'bg-red-600'} shadow-sm`}
                                  />
                               </button>
                            </div>

                            {/* Mic Volume Slider */}
                            {micEnabled && (
                               <div className="px-1 py-2 space-y-3">
                                  <div className="flex items-center justify-between">
                                     <span className="text-[11px] font-black text-mono-500">قەبارێ مایکرۆفۆنی</span>
                                     <span className="text-[10px] font-black text-mono-400">{micVolume}%</span>
                                  </div>
                                  <input
                                     type="range"
                                     min="0"
                                     max="100"
                                     value={micVolume}
                                     onChange={(e) => updateProfile({ mic_volume: parseInt(e.target.value) })}
                                     className="w-full h-1 bg-mono-100 dark:bg-white/10 rounded-none appearance-none cursor-pointer accent-mono-900 dark:accent-white transition-all"
                                  />
                               </div>
                            )}

                            {/* Speaker Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-md border border-mono-100 dark:border-white/5 bg-mono-50/30 dark:bg-white/5 hover:bg-mono-50 dark:hover:bg-white/10 transition-colors group">
                               <div className="flex items-center gap-3">
                                  <span className={`material-symbols-outlined text-lg transition-colors ${speakerEnabled ? 'text-mono-900 dark:text-white' : 'text-mono-400'}`}>
                                     {speakerEnabled ? 'volume_up' : 'volume_off'}
                                  </span>
                                  <span className="text-[13px] font-black text-mono-800 dark:text-mono-200">بلندگۆ</span>
                               </div>
                               <button
                                  onClick={() => { triggerHaptic(10); updateProfile({ speaker_enabled: !speakerEnabled }); }}
                                  className={`w-10 h-5 rounded-sm p-1 transition-all duration-300 relative ${speakerEnabled ? 'bg-green-600/20' : 'bg-red-600/20'}`}
                               >
                                  <Motion.div
                                     animate={{ x: speakerEnabled ? -20 : 0 }}
                                     transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                     className={`w-3 h-3 rounded-sm ${speakerEnabled ? 'bg-green-600' : 'bg-red-600'} shadow-sm`}
                                  />
                               </button>
                            </div>

                            {/* Voice Volume Slider */}
                            {speakerEnabled && (
                               <div className="px-1 py-2 space-y-3">
                                  <div className="flex items-center justify-between">
                                     <span className="text-[11px] font-black text-mono-500">قەبارێ دەنگی</span>
                                     <span className="text-[10px] font-black text-mono-400">{voiceVolume}%</span>
                                  </div>
                                  <input
                                     type="range"
                                     min="0"
                                     max="100"
                                     value={voiceVolume}
                                     onChange={(e) => updateProfile({ voice_volume: parseInt(e.target.value) })}
                                     className="w-full h-1 bg-mono-100 dark:bg-white/10 rounded-none appearance-none cursor-pointer accent-mono-900 dark:accent-white transition-all"
                                  />
                               </div>
                            )}
                         </div>
                      </div>

                     {/* Compact Logout Button */}
                     <button
                        onClick={() => { triggerHaptic(15); onPlaySound?.(); onLogout(); }}
                        className="w-full h-11 rounded-md font-black text-[12px] transition-all active:scale-95 flex items-center justify-center gap-2.5 bg-red-500/5 text-red-500 hover:bg-red-500/10 border border-red-500/10 mt-2"
                     >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        دەرکەفتن ژ ھەژمارێ
                     </button>

                     <div className="pt-2 flex flex-col items-center gap-1 opacity-20">
                        <p className="text-[8px] font-black tracking-[0.4em] uppercase text-mono-400">Peyvçîn v2.0</p>
                     </div>
                  </div>
               </Motion.div>
            </Motion.div>
         )}
      </AnimatePresence>
   );
}

export default SettingsModal;
