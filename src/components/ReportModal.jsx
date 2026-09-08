import React, { useState, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import CloseButton from './CloseButton';

const ReportModal = ({ isOpen, onClose, user }) => {
 const [type, setType] = useState('bug');
 const [description, setDescription] = useState('');
 const [images, setImages] = useState([]);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState(null);
 const [success, setSuccess] = useState(false);
 
 const fileInputRef = useRef(null);

 const handleImageChange = (e) => {
 const files = Array.from(e.target.files);
 if (!files.length) return;

 if (images.length + files.length > 5) {
 setError('تو دشێی زێدەترینی ٥ وێنەیان هەلبژێری.');
 if (fileInputRef.current) fileInputRef.current.value = '';
 return;
 }

 for (let file of files) {
 if (file.size > 5 * 1024 * 1024) {
 setError('قەبارەیێ وێنەی نابیت ژ 5 مێگابایت مەزنتر بیت.');
 if (fileInputRef.current) fileInputRef.current.value = '';
 return;
 }
 
 const reader = new FileReader();
 reader.onloadend = () => {
 setImages(prev => [...prev, { file, preview: reader.result }]);
 };
 reader.readAsDataURL(file);
 }
 
 if (fileInputRef.current) fileInputRef.current.value = '';
 };

 const removeImage = (indexToRemove) => {
 setImages(prev => prev.filter((_, i) => i !== indexToRemove));
 };

 const handleSubmit = async () => {
 if (!description.trim()) {
 setError('هیڤیە ئاریشە یان پێشنیارێ بنڤێسە.');
 return;
 }

 try {
 triggerHaptic(10);
 setIsSubmitting(true);
 setError(null);

 let imageUrl = null;

 // 1. Upload images if exist
 if (images.length > 0) {
 const uploadedUrls = [];
 for (let i = 0; i < images.length; i++) {
 const imageObj = images[i];
 const fileExt = imageObj.file.name.split('.').pop();
 const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
 
 const { error: uploadError } = await supabase.storage
 .from('report_images')
 .upload(fileName, imageObj.file, { upsert: false });

 if (uploadError) throw uploadError;

 const { data: publicUrlData } = supabase.storage
 .from('report_images')
 .getPublicUrl(fileName);

 uploadedUrls.push(publicUrlData.publicUrl);
 }
 imageUrl = uploadedUrls.join(',');
 }

 // 2. Insert into user_reports
 const { error: insertError } = await supabase
 .from('user_reports')
 .insert([{
 user_id: user.id,
 type,
 description: description.trim(),
 image_url: imageUrl
 }]);

 if (insertError) throw insertError;

 triggerHaptic(30);
 setSuccess(true);
 setTimeout(() => {
 handleClose();
 }, 2000);

 } catch (err) {
 console.error('Report submission error:', err);
 setError('ئاریشەیەک چێبوو د هنارتنێ دا: ' + err.message);
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleClose = () => {
 setType('bug');
 setDescription('');
 setImages([]);
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
 className="w-full max-w-105 h-auto max-h-[90vh] flex flex-col bg-[#f59e0b] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
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
 ئاریشە و پێشنیار
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
 <p className="font-black font-rabar text-[15px] text-[#181a20] text-center">ب سەرکەفتیانە هاتە هنارتن!</p>
 <p className="text-[12px] font-bold font-rabar text-[#4a5568] text-center">سوپاس بۆ هاریکاریا تە.</p>
 </div>
 ) : (
 <>
 {/* Type Selector */}
 <div className="flex items-center justify-center gap-3 w-full">
 <button
 onClick={() => { triggerHaptic(10); setType('bug'); }}
 className={`h-9 flex-1 font-black tracking-normal font-rabar text-[12px] sm:text-[13px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 type === 'bug'
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${type === 'bug' ? 'drop-shadow-md' : ''}`}>ئاریشەیەک هەیە</span>
 </button>
 <button
 onClick={() => { triggerHaptic(10); setType('suggestion'); }}
 className={`h-9 flex-1 font-black tracking-normal font-rabar text-[12px] sm:text-[13px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 type === 'suggestion'
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${type === 'suggestion' ? 'drop-shadow-md' : ''}`}>پێشنیار</span>
 </button>
 </div>

 {/* Image Upload */}
 <div className="flex flex-col gap-1.5 mt-1">
 <label className="text-[13px] font-black font-rabar text-[#181a20] mr-1">وێنەیان هەلبژێرە</label>
 
 {images.length > 0 && (
 <div className="flex gap-2 overflow-x-auto pb-2 snap-x custom-scrollbar">
 {images.map((img, index) => (
 <div key={index} className="relative w-20 h-20 shrink-0 rounded-[8px] overflow-hidden border-[1.5px] border-[#181a20] bg-black snap-start">
 <img src={img.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
 <button 
 onClick={() => removeImage(index)}
 className="absolute top-1 right-1 w-6 h-6 rounded-sm bg-black/90 text-white flex items-center justify-center transition-opacity hover:bg-[#ff6b6b]"
 >
 <span className="material-symbols-outlined text-[14px]">close</span>
 </button>
 </div>
 ))}
 {images.length < 5 && (
 <button
 onClick={() => fileInputRef.current?.click()}
 className="w-20 h-20 shrink-0 border-2 border-dashed border-[#a0a7b4] hover:border-[#1e86ff] bg-[#f0f4f8] rounded-[8px] flex flex-col items-center justify-center gap-1 text-[#4a5568] transition-colors"
 >
 <span className="material-symbols-outlined text-xl">add</span>
 </button>
 )}
 </div>
 )}

 {images.length === 0 && (
 <button
 onClick={() => fileInputRef.current?.click()}
 className="w-full py-4 border-2 border-dashed border-[#a0a7b4] hover:border-[#1e86ff] bg-[#f0f4f8] rounded-[8px] flex flex-col items-center justify-center gap-2 text-[#4a5568] transition-colors"
 >
 <span className="material-symbols-outlined text-2xl text-[#1e86ff]">add_photo_alternate</span>
 <span className="text-[12px] font-black font-rabar">وێنەی هەلبژێرە...</span>
 </button>
 )}
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleImageChange}
 accept="image/*"
 multiple
 className="hidden" 
 />
 <p className="text-[10px] font-bold font-rabar text-[#727888] mr-1">تێبینی: تو دشێی ٥ وێنەیان بار بکەی.</p>
 </div>

 {/* Description */}
 <div className="flex flex-col gap-1.5 mt-1">
 <label className="text-[13px] font-black font-rabar text-[#181a20] mr-1">ڕوونکرن *</label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder={type === 'bug' ? "ئاریشێ ڕوون بکە..." : "هزرەکا نوی بۆ یاریێ..."}
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
 disabled={isSubmitting}
 className="relative w-full h-11 mt-2 rounded-[8px] font-black font-rabar text-[15px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#65e065] to-[#3ab53a] hover:from-[#76e876] hover:to-[#40c740] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#238523,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer disabled:opacity-70"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/20"></div>
 <span className="relative z-10 flex items-center justify-center gap-2" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>
 {isSubmitting ? (
 <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></div>
 ) : (
 <>هنارتن</>
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

export default React.memo(ReportModal);
