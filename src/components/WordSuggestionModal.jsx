import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import { useUser } from '../context/AuthContext';

const WordSuggestionModal = ({ isOpen, onClose, user }) => {
 const { userNickname } = useUser();
 const [word, setWord] = useState('');
 const [definition, setDefinition] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState(null);
 const [success, setSuccess] = useState(false);

 const handleSubmit = async () => {
 if (!word.trim()) {
 setError('هیڤیە پەیڤەکێ بنڤێسە.');
 return;
 }

 if (!definition.trim()) {
 setError('هیڤیە پێناسەیا پەیڤێ بنڤێسە.');
 return;
 }

 try {
 triggerHaptic(10);
 setIsSubmitting(true);
 setError(null);

 // Insert into word_suggestions
 const { error: insertError } = await supabase
 .from('word_suggestions')
 .insert([{
 word: word.trim(),
 definition: definition.trim() || null,
 suggested_by: user?.id || null,
 suggested_by_name: userNickname || 'نەناسراو',
 status: 'pending'
 }]);

 if (insertError) throw insertError;

 triggerHaptic(30);
 setSuccess(true);
 setTimeout(() => {
 handleClose();
 }, 2000);

 } catch (err) {
 console.error('Word suggestion submission error:', err);
 setError('ئاریشەیەک چێبوو د هنارتنێ دا: ' + err.message);
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleClose = () => {
 setWord('');
 setDefinition('');
 setError(null);
 setSuccess(false);
 onClose();
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir="rtl">
 {/* Backdrop */}
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={isSubmitting ? undefined : handleClose}
 className="absolute inset-0 bg-black/90 ]"
 />

 {/* Modal Content */}
 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-105 h-auto max-h-[90vh] flex flex-col bg-[#15803d] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
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
 <div className="absolute top-1.5 inset-x-1.5 h-7 bg-white/20 pointer-events-none z-0 rounded-t-[8px]"></div>

 {/* Header */}
 <div className="w-full relative z-10 flex items-center justify-center pt-5 pb-5 shrink-0">
 <h2 
 className="text-[26px] font-black text-white leading-none relative z-10 -translate-y-2 flex items-center gap-2" 
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
 پێشنیارکرنا پەیڤێ
 </h2>
 <button
 onClick={handleClose}
 disabled={isSubmitting}
 className="absolute right-3 top-3.5 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden disabled:opacity-50"
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
 <div className="flex-1 self-stretch overflow-y-auto custom-scrollbar flex flex-col mx-3 sm:mx-4 mb-4 relative z-0">
 <div className="flex flex-col relative rounded-[10px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden p-4 sm:p-5 shrink-0 z-10">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[10px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-10"></div>
 
 <div className="relative z-20 w-full flex flex-col gap-4">
 {success ? (
 <div className="flex flex-col items-center justify-center py-8 gap-4">
 <div className="w-16 h-16 rounded-md bg-green-500/20 text-green-500 flex items-center justify-center border border-green-500/30">
 <span className="material-symbols-outlined text-4xl">check_circle</span>
 </div>
 <p className="font-black font-rabar text-[15px] text-[#181a20] text-center">پێشنیارا تە ب سەرکەفتیانە هاتە هنارتن!</p>
 <p className="text-[12px] font-bold font-rabar text-[#4a5568] text-center">سوپاس بۆ هاریکاریا تە بۆ زەنگینکرنا یاریێ.</p>
 </div>
 ) : (
 <>
 <p className="text-[12px] font-bold font-rabar text-[#727888] text-center px-2 mt-2">
 پەیڤا خوە پێشنیار بکە، دا کو ل یاریێ بهێتە زێدەکرن
 </p>

 {/* Word Input */}
 <div className="flex flex-col gap-1.5 mt-2">
 <label className="text-[13px] font-black font-rabar text-[#181a20] mr-1">پەیڤا نوی *</label>
 <input
 type="text"
 value={word}
 onChange={(e) => setWord(e.target.value)}
 placeholder="پەیڤێ بنڤێسە..."
 className="w-full bg-[#f0f4f8] border-[1.5px] border-[#a0a7b4] rounded-[8px] p-3 text-[13px] font-rabar font-bold text-[#181a20] focus:outline-none focus:border-[#1e86ff] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
 autoFocus
 />
 </div>

 {/* Definition Textarea */}
 <div className="flex flex-col gap-1.5 mt-1">
 <label className="text-[13px] font-black font-rabar text-[#181a20] mr-1">پێناسەیا پەیڤێ *</label>
 <textarea
 value={definition}
 onChange={(e) => setDefinition(e.target.value)}
 placeholder="پێناسە یان ڕامانا پەیڤێ بنڤێسە..."
 className="w-full bg-[#f0f4f8] border-[1.5px] border-[#a0a7b4] rounded-[8px] p-3 text-[13px] font-rabar font-bold min-h-24 text-[#181a20] focus:outline-none focus:border-[#1e86ff] resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] custom-scrollbar"
 />
 </div>

 {error && (
 <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-[#d62020] text-[12px] font-black font-rabar p-2.5 rounded-[8px]">
 {error}
 </div>
 )}

 <button
 onClick={handleSubmit}
 disabled={isSubmitting || !word.trim() || !definition.trim()}
 className="relative w-full h-11 mt-2 rounded-[8px] font-black font-rabar text-[15px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#65e065] to-[#3ab53a] hover:from-[#76e876] hover:to-[#40c740] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#238523,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer disabled:opacity-70 disabled:active:scale-100"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/20"></div>
 <span className="relative z-10 flex items-center justify-center gap-2" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>
 {isSubmitting ? (
 <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></div>
 ) : (
 <>هنارتنا پەیڤێ</>
 )}
 </span>
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 </Motion.div>
 </div>
 );
};

export default React.memo(WordSuggestionModal);
