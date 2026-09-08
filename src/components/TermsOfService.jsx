import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { playBackSfx, playTabSfx } from '../utils/audio';
import { useNavigate } from 'react-router-dom';



const TermsOfService = ({ onViewChange, onClose }) => {
 const [lang, setLang] = useState(() => {
 return localStorage.getItem('policy_lang') || 'ku';
 });

 const handleLanguageChange = (newLang) => {
 setLang(newLang);
 localStorage.setItem('policy_lang', newLang);
 playTabSfx();
 };
 const navigate = useNavigate();

 const handleNavigate = (path, policyKey) => {
 if (onViewChange && policyKey) {
 onViewChange(policyKey);
 } else {
 navigate(path);
 }
 };

 const handleClose = () => {
 playBackSfx();
 if (onClose) {
 onClose();
 } else {
 navigate('/');
 }
 };

 const content = {
 en: {
 title: "Terms of Service",
 subtitle: "Last Updated: August 26, 2026",
 intro: "By using the Peyvok game, you agree to abide by these terms to maintain a safe environment for all players.",
 sections: [
 {
 title: "1. User Generated Content (UGC)",
 text: "Peyvok allows players to send images, text messages, and voice notes to each other in the chat, as well as speak via microphone in the game. You are fully responsible for any content you share. For your information, all chat messages, images, and voice notes are automatically deleted after 24 hours to protect your privacy."
 },
 {
 title: "2. Prohibited Actions and Bans",
 text: "To maintain a safe and fair environment for all players, the following actions are strictly prohibited and will result in a permanent ban of your account:",
 list: [
 "Using offensive language, disrespecting, attacking, or harassing other players in the chat or voice chat.",
 "Sending inappropriate, sexually explicit, or violent images.",
 "Using hacking programs or cheats to gain points."
 ]
 },
 {
 title: "3. Reporting and Blocking",
 text: "We grant all players the right to block or report any violating player. Our moderation team will take the necessary steps against those accounts."
 },
 {
 title: "4. In-Game Virtual Currency",
 text: "In-game currency (Fils, Derhem, Dinar) is solely virtual game currency with no real-world monetary value and cannot be exchanged outside the game."
 }
 ]
 },
 ku: {
 title: "مەرجێن بکارهینانێ",
 subtitle: "دووماهیک نویژەنکرن: ٢٦ تەباخ، ٢٠٢٦",
 intro: "ب بکارئینانا یارییا پەیڤۆک، تو ڕازی دبی کو پابەندی ڤان مەرجان بی بۆ پاراستنا ژینگەهەکا ساخلەم بۆ هەمی یاریزانان.",
 sections: [
 {
 title: "١. ناڤەرۆکا بکارھێنەری (User Generated Content - UGC)",
 text: "یارییا پەیڤۆک ڕێکێ ددەتە یاریزانان کو د ناڤ چاتێ دا وێنە، نامە، و نامەیێن دەنگی بۆ ئێک بهنێرن، هەروەسا ب ڕێکا مایکرۆفۆنێ د ناڤ یاریێ دا باخڤن. تو ب تەمامی بەرپرسیاری ژ هەر ناڤەرۆکەکا تو بەلاڤ دکەی. بۆ زانیاریێن زێدەتر، هەمی نامە و وێنە و دەنگێن چاتێ پشتی ٢٤ دەمژمێران بۆ پاراستنا نهێنیێ ب ئۆتۆماتیکی دهێنە ژێبرن."
 },
 {
 title: "٢. کارێن قەدەغەکری و ڕاگرتن",
 text: "بۆ پاراستنا ژینگەهەکا ساخلەم و دادپەروەرانە بۆ هەمی یاریزانان، ئەڤ کارێن خوارێ ب توندترین شێوە قەدەغەنە و دێ بنە ئەگەرێ ڕاگرتنا (Ban) هەمیشەیی یا هژمارا تە:",
 list: [
 "بکارئینانا پەیڤێن نەجوان، بێڕێزیکرن، هێرشکرن، یان بێزارکرنا یاریزانێن دی ل ناڤ چاتێ یان ب ڕێکا مایکرۆفۆنێ.",
 "هنارتنا وێنەیێن نەگونجای، سێکسی، یان توندوتیژی.",
 "بکارئینانا پرۆگرامێن هاککرنێ یان فێلبازیێ بۆ بدەستڤەئینانا خاڵان."
 ]
 },
 {
 title: "٣. ڕاپۆرتکرن و بلۆککرن",
 text: "ئەم مافێ ددەینە هەمی یاریزانان کو هەر یاریزانەکێ سەرپێچیکار بلۆک (Block) بکەن یان ڕاپۆرت (Report) بکەن. تیمێ مە یێ چاڤدێریێ دێ پێنگاڤێن پێدڤی هەمبەر وان هژماران هاڤێژیت."
 },
 {
 title: "٤. دراڤێ خەیاڵی یێ یاریێ",
 text: "دراڤێ د ناڤ یاریێ دا (فلس، دەرهەم، دینار) ب تنێ دراڤەکێ خەیاڵی یێ یاریێ یە و چ بهایەکێ ڕاستەقینە یێ ماددی نینە و ل دەرڤەی یاریێ ناهێتە ئالوگۆڕکرن."
 }
 ]
 }
 };

 const current = content[lang];
 const isRTL = lang === 'ku';

 return (
 <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Backdrop */}
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={handleClose}
 className="absolute inset-0 bg-black/90 ]"
 />

 {/* Modal Content */}
 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-2xl h-[90vh] flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
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
 <div className="w-full relative z-10 flex flex-col items-center justify-center pt-5 pb-3 shrink-0 gap-3">
 <h2 
 className="text-[26px] font-black text-white leading-none relative z-10 -translate-y-1 flex items-center gap-2" 
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
 {current.title}
 </h2>
 
 {/* Language Toggle - Clash Royale Tabs Style */}
 <div dir="ltr" className="flex items-center justify-center gap-3 w-64 max-w-full px-4 mb-1">
 <button
 onClick={() => handleLanguageChange('en')}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[12px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 lang === 'en'
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${lang === 'en' ? 'drop-shadow-md' : ''}`}>English</span>
 </button>
 <button
 onClick={() => handleLanguageChange('ku')}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[12px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 lang === 'ku'
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${lang === 'ku' ? 'drop-shadow-md' : ''}`}>کوردی</span>
 </button>
 </div>

 <button
 onClick={handleClose}
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
 
 <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar p-5 sm:p-6">
 <p className={`text-[13px] text-[#4a5568] mb-6 leading-relaxed font-bold border-[#181a20] ${isRTL ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
 {current.intro}
 </p>

 <div className="space-y-6">
 {current.sections.map((section, idx) => (
 <section key={idx} className="relative">
 <h3 className="text-[15px] font-black font-rabar text-[#181a20] mb-3 flex items-center gap-3">
 {section.title}
 </h3>
 <p className="text-[13px] font-bold text-[#4a5568] leading-relaxed mb-3">{section.text}</p>
 {section.list && (
 <ul className={`space-y-3 ${isRTL ? 'pr-6' : 'pl-6'}`}>
 {section.list.map((item, i) => (
 <li key={i} className="flex items-start gap-2 text-[12px] font-bold text-[#4a5568]">
 <div className="w-1.5 h-1.5 rounded-full bg-[#1e86ff] mt-1.5 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"></div>
 <span className="flex-1 leading-relaxed">{item}</span>
 </li>
 ))}
 </ul>
 )}
 {section.email && (
 <a href={`mailto:${section.email}`} className="inline-block mt-3 text-[#1e86ff] font-bold text-[13px] hover:text-[#115ab5] transition-colors border-b-[1.5px] border-[#1e86ff]/50 pb-0.5">
 {section.email}
 </a>
 )}
 </section>
 ))}
 </div>

 {/* Footer Links */}
 <div className="mt-10 pt-6 border-t-[1.5px] border-[#a0a7b4]/30 text-center space-y-6">
 <div className="flex flex-wrap items-center justify-center gap-4 text-[#4a5568] font-bold text-[11px] uppercase">
 <button onClick={() => handleNavigate('/data-deletion', 'deletion')} className="hover:text-[#181a20] transition-colors">{isRTL ? 'ژێبرنا داتایان' : 'Data Deletion'}</button>
 <span className="w-1 h-1 rounded-full bg-[#a0a7b4]"></span>
 <button onClick={() => handleNavigate('/privacy-policy', 'privacy')} className="hover:text-[#181a20] transition-colors">{isRTL ? 'سیاسەتا تایبەتمەندیێ' : 'Privacy Policy'}</button>
 </div>
 <p className="text-[10px] text-[#727888] font-bold uppercase opacity-80">
 {isRTL ? '© ٢٠٢٦ تیما پەیڤۆک • هاتیە دروستکرن بۆ کەلەپووری' : '© 2026 Peyvok Team • Built for Heritage'}
 </p>
 </div>
 </div>
 </div>
 </div>
 </Motion.div>
 </div>
 );
};

export default TermsOfService;


