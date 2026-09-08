import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { playBackSfx, playTabSfx } from '../utils/audio';


const DataDeletion = ({ onViewChange, onClose }) => {
 const [isKurdish, setIsKurdish] = useState(() => {
 return localStorage.getItem('policy_lang') !== 'en';
 });

 const handleLanguageChange = (isKurd) => {
 setIsKurdish(isKurd);
 localStorage.setItem('policy_lang', isKurd ? 'ku' : 'en');
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
 title: "Data Deletion Guidelines",
 lastUpdated: "Last Updated: August 26, 2026",
 intro: "If you wish to leave the game and delete your account, we provide a very simple way to permanently erase all your information from our servers.",
 section1Title: "1. How to Request Account Deletion",
 section1Text: "If you want to completely delete all your information and profile:",
 steps: [
 "Via the game: Go to the (Settings) section -> (Account Settings) -> and click on (Delete Account).",
 "Alternatively, you can send an email to support@peyvokgame.com titled 'Data Deletion Request' including your User ID or email address."
 ],
 section2Title: "2. What Information Will Be Deleted?",
 section2Text: "After accepting the deletion, the following data will be permanently deleted and cannot be recovered:",
 deletedItems: [
 "Profile information (name, picture, email, device type, geographic location).",
 "Game statistics (such as: XP, level, in-game currency, and all other progress and achievements).",
 "Social connections and friendships within the game."
 ],
 section3Title: "3. Automatic Chat Deletion (Ephemeral Data)",
 section3Text: "To protect your information, Peyvok automatically deletes all chat messages, images, and voice notes from the servers after 24 hours. You can also manually delete your own messages directly within the chat at any time.",
 backButton: "Back",
 },
 ku: {
 title: "ڕێنمایێن ژێبرنا داتایان",
 lastUpdated: "دووماهیک نویژەنکرن: ٢٦ تەباخ، ٢٠٢٦",
 intro: "ئەگەر تە بڤێت یاریێ بجهـ بهێلی و هژمارا خوە ژێ ببەی، ئەم ڕێکەکا زۆر ب ساناھی دابین دکەین کو تێدا هەمی پێزانینێن تە ب ئێکجاری ژ سێرڤەرێن مە دهێنە ژێبرن.",
 section1Title: "١. چاوا داخوازییا ژێبرنا هژمارێ بکەی",
 section1Text: "ئەگەر تە بڤێت هەمی پێزانین و پرۆفایلێ خوە ب تەمامی ژێ ببەی:",
 steps: [
 "د ناڤ یاریێ دا: هەرە بەشێ (ڕێکخستن) -> (ڕێکخستنێن هژمارێ) -> و کلیکێ ل سەر (ژێبرنا هژمارێ) بکە.",
 "یان ژی، تو دشێی ئیمەیلەکی بۆ support@peyvokgame.com بهنێری ب ناڤونیشانێ 'Data Deletion Request' و ناسنامەیا خوە (User ID) یان ئیمەیلا خوە تێدا بنڤێسی."
 ],
 section2Title: "٢. چ پێزانین دێ هێنە ژێبرن؟",
 section2Text: "پشتی قەبوولکرنا ژێبرنێ، ئەڤ داتایێن تە دێ ب ئێکجاری هێنە ژێبرن و ناهێنە ڤەگەڕاندن:",
 deletedItems: [
 "پێزانینێن پرۆفایلی (ناڤ، وێنە، ئیمێل، جۆرێ مۆبایلێ، جهێ جوگرافی).",
 "ئامارێن یاریێ (وەکو: XP، ئاست، دراڤێ یاریێ، و دەستکەفتێن دی).",
 "گرێدانێن جڤاکی و هەڤالەتی ل ناڤ یاریێ."
 ],
 section3Title: "٣. ژێبرنا ئۆتۆماتیکی یا چاتێ (Ephemeral Data)",
 section3Text: "بۆ پاراستنا زانیاریێن تە، یارییا پەیڤۆک ب شێوەیەکێ ئۆتۆماتیکی هەمی نامە، وێنە، و نامەیێن دەنگی یێن ناڤ چاتێ پشتی ٢٤ دەمژمێران ژ سێرڤەران ژێ دبەت. هەروەسا تو دشێی هەر دەمێ تە بڤێت، ب خوە نامەیێن خوە ل ناڤ چاتێ ژێ ببەی.",
 backButton: "ڤەگەڕە",
 }
 };

 const t = isKurdish ? content.ku : content.en;

 return (
 <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir={isKurdish ? 'rtl' : 'ltr'}>
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
 {t.title}
 </h2>
 
 {/* Language Toggle - Clash Royale Tabs Style */}
 <div dir="ltr" className="flex items-center justify-center gap-3 w-64 max-w-full px-4 mb-1">
 <button
 onClick={() => handleLanguageChange(false)}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[12px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 !isKurdish
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${!isKurdish ? 'drop-shadow-md' : ''}`}>English</span>
 </button>
 <button
 onClick={() => handleLanguageChange(true)}
 className={`h-8 flex-1 font-black uppercase tracking-normal font-rabar text-[12px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 isKurdish
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${isKurdish ? 'drop-shadow-md' : ''}`}>کوردی</span>
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
 <p className={`text-[13px] text-[#4a5568] mb-6 leading-relaxed font-bold border-[#181a20] ${isKurdish ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
 {t.intro}
 </p>

 <div className="space-y-6">
 {/* Section 1 */}
 <section className="relative">
 <h3 className="text-[15px] font-black font-rabar text-[#181a20] mb-3 flex items-center gap-3">
 {t.section1Title}
 </h3>
 <p className="text-[13px] font-bold text-[#4a5568] leading-relaxed mb-3">{t.section1Text}</p>
 <ul className={`space-y-3 ${isKurdish ? 'pr-6' : 'pl-6'}`}>
 {t.steps.map((step, i) => (
 <li key={i} className="flex items-start gap-2 text-[12px] font-bold text-[#4a5568]">
 <div className="w-1.5 h-1.5 rounded-full bg-[#1e86ff] mt-1.5 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"></div>
 <span className="flex-1 leading-relaxed">{step}</span>
 </li>
 ))}
 </ul>
 </section>

 {/* Section 2 */}
 <section className="relative">
 <h3 className="text-[15px] font-black font-rabar text-[#181a20] mb-3 flex items-center gap-3">
 {t.section2Title}
 </h3>
 <p className="text-[13px] font-bold text-[#4a5568] leading-relaxed mb-3">{t.section2Text}</p>
 <ul className={`space-y-3 ${isKurdish ? 'pr-6' : 'pl-6'}`}>
 {t.deletedItems.map((item, i) => (
 <li key={i} className="flex items-start gap-2 text-[12px] font-bold text-[#4a5568]">
 <div className="w-1.5 h-1.5 rounded-full bg-[#e62b2b] mt-1.5 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"></div>
 <span className="flex-1 leading-relaxed">{item}</span>
 </li>
 ))}
 </ul>
 </section>

 {/* Section 3 */}
 <section className="relative">
 <h3 className="text-[15px] font-black font-rabar text-[#181a20] mb-3 flex items-center gap-3">
 {t.section3Title}
 </h3>
 <p className="text-[13px] font-bold text-[#4a5568] leading-relaxed mb-3">{t.section3Text}</p>
 </section>
 </div>

 {/* Footer Links */}
 <div className="mt-10 pt-6 border-t-[1.5px] border-[#a0a7b4]/30 text-center space-y-6">
 <div className="flex flex-wrap items-center justify-center gap-4 text-[#4a5568] font-bold text-[11px] uppercase">
 <button className="text-[#181a20] pointer-events-none">{isKurdish ? 'ژێبرنا داتایان' : 'Data Deletion'}</button>
 <span className="w-1 h-1 rounded-full bg-[#a0a7b4]"></span>
 <button onClick={() => handleNavigate('/privacy-policy', 'privacy')} className="hover:text-[#181a20] transition-colors">{isKurdish ? 'سیاسەتا تایبەتمەندیێ' : 'Privacy Policy'}</button>
 <span className="w-1 h-1 rounded-full bg-[#a0a7b4]"></span>
 <button onClick={() => handleNavigate('/terms-of-service', 'terms')} className="hover:text-[#181a20] transition-colors">{isKurdish ? 'مەرجێن خزمەتگوزاریێ' : 'Terms of Service'}</button>
 </div>
 <p className="text-[10px] text-[#727888] font-bold uppercase opacity-80">
 {isKurdish ? '© ٢٠٢٦ تیما پەیڤۆک • هاتیە دروستکرن بۆ کەلەپووری' : '© 2026 Peyvok Team • Built for Heritage'}
 </p>
 </div>
 </div>
 </div>
 </div>
 </Motion.div>
 </div>
 );
};

export default DataDeletion;
