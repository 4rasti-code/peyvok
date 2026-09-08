import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const HELP_TOPICS = [
 {
 id: 'how-to-play',
 icon: 'sports_esports',
 title: 'چاوا دێ یاریێ کەی؟',
 desc: 'فێرکاری و مۆدێن یاریێ',
 faqs: [
 { q: 'بەشێ فێرکاری ل کیڤەیە؟', a: 'تو دشێی ل سەر شاشەیا سەرەکی (لۆبی) یان ژی د ناڤ یاریێ بخوە دا ل سەر ئایکۆنا پرسیارێ (؟) کلیک بکەی بۆ دیتنا فێرکاریێ بۆ هەر مۆدەکێ.' },
 { q: 'تایبەتمەندیێن مۆدێ کلاسیک چنە؟', a: 'د مۆدێ کلاسیک دا تە ٦ بزاڤ هەنە بۆ دیتنا پەیڤێن کو ژ ٢ تا ٥ پیتان پێکدهێن. ب دیتنا پەیڤێ تو دێ ٥٠ XP ب دەستڤە ئینی.' },
 { q: 'تایبەتمەندیێن مۆدێ هەڤڕکی (Multiplayer) چنە؟', a: 'هەڤڕکی ل سەر پەیڤێن ٥ پیتی یە ب ٣ بزاڤان دژی یاریزانەکێ دی یێ سەرهێل (Online). یاریزانێ کو ٢ خالان ژ هەڤڕکێ خوە پێشکەڤیت دێ یاریێ بەت و ١٠٠ XP وەرگریت. ئەگەر خال بوونە ٣-٣، یاری ب یاکسانبوون ب دوماهیک دهێت و تو ١٠ XP وەردگری.' },
 { q: 'تایبەتمەندیێن مۆدێ مامک چنە؟', a: 'د مامکان دا پەیڤ ژ ٢ پیتان تا بێسنوور پێکدهێن. تە ٦ بزاڤ هەنە کو پەیڤێ د ناڤ ڕێزکێن مامکێ دا ببینی.' },
 { q: 'تایبەتمەندیێن مۆدێ تایا پەیڤان (Word Fever) چنە؟', a: 'یارییەکا بلەزە ل سەر پەیڤێن ٥ پیتی ب ٣ بزاڤان، و پێدڤییە د ماوێ ٣٠ چرکەیان دا پەیڤێ ببینی.' },
 { q: 'تایبەتمەندیێن مۆدێ پەیڤێن دژوار چنە؟', a: 'د ڤی مۆدی دا، پەیڤێن درێژ یێن کو ژ ٦ پیتان تا بێسنوور پێکدهێن دێ هێنە بەرامبەر تە ب ٦ بزاڤان بۆ دیتنێ.' }
 ]
 },
 {
 id: 'settings',
 icon: 'settings',
 title: 'ڕێکخستن',
 desc: 'دەنگ، مۆزیک و لەرزین',
 faqs: [
 { q: 'دەنگێ یاریێ (SFX) چییە؟', a: 'ئەڤە دەنگێ کارتێکەرێن یاریێ یە (وەکی دەنگێ کلیککرنا پیتان یان دەنگێ سەرکەفتنێ).' },
 { q: 'مۆزیکا باکگراوەندی چییە؟', a: 'ئەڤە ئەو مۆزیکە یا کو د دەمێ یاریێ و لۆبیێ دا ب نەرمی ل پشتەڤە دهێتە لێدان بۆ ئارامکرنا مێشکی.' },
 { q: 'دەنگکێش و لەرزین چ کار دکەن؟', a: 'دەنگکێش (Voice) تایبەتە ب ئاخافتنێ دگەل هەڤڕکێ تە د مۆدێ هەڤڕکی (Multiplayer) دا. لەرزین (Haptics) ژی هەستێ دەستلێدانێ ل کاتی کلیککرنێ یان دیتنا پەیڤێ ددەتە تەلەفۆنێ.' }
 ]
 },
 {
 id: 'account',
 icon: 'manage_accounts',
 title: 'هژمارا کەسی',
 desc: 'ناسناڤ و وەڵات',
 faqs: [
 { q: 'چەوا ناسناڤێ خوە بگوهۆڕم و ئەرێ سنور هەیە؟', a: 'تو دشێی د بەشێ هژمارا کەسی ناسناڤێ خوە بگوهۆڕی، لێ ئاگاداربە پشتی گوهۆڕینێ، تو نەشێی بۆ ماوێ ١٤ ڕۆژان جارەکا دی ناسناڤێ خوە بگوهۆڕی.' },
 { q: 'ئەرێ دشێم وەڵاتێ خوە بگوهۆڕم؟', a: 'بەلێ، د بەشێ هژمارا کەسی دا دشێی ل سەر ئالایێ وەڵاتی کلیک بکەی و وەڵاتەکێ دی هەلبژێری.' }
 ]
 },
 {
 id: 'shop',
 icon: 'storefront',
 title: 'بازاڕ و هاریکاری (Powerups)',
 desc: 'فلس، درهەم، دینار و هاریکاریان',
 faqs: [
 { q: 'دراڤێن یاریێ چنە؟', a: 'یاری سێ دراڤێن خەیالی یێن مێژوویی بکاردهینیت: فلس (برۆنز)، درهەم (زیڤ)، و دینار (زێڕ).' },
 { q: 'هاریکاری (Hint) چ دکەت؟', a: 'ب ٢٥٠ فلسان، هاریکاری پیتەکا ڕاست ل جهێ وێ یێ دروست د ناڤ پەیڤێ دا بۆ تە ئاشکرا دکەت.' },
 { q: 'پیتژێبرک (Magnet) چ دکەت؟', a: 'ب ٥٠٠ فلسان، پیتژێبرک هندەک ژ وان پیتان ژ تەختەکلیکی ڕادکەت یێن کو د ناڤ پەیڤا ڤەشارتی دا نینن، دا کو یاری بۆ تە ب ساناتر بکەڤیت.' },
 { q: 'دەربازبوون (Full Skip) چ دکەت؟', a: 'ب ١٠٠٠ فلسان، ئەڤ هاریکارییە دێ یاریێ بۆ تە دەرباز کەت و پەیڤێ ب تەمامی ئاشکرا کەت بێی کو زیان ب زنجیرەیا سەرکەفتنێن تە بگەهیت.' }
 ]
 },
 {
 id: 'daily',
 icon: 'redeem',
 title: 'خەلاتێن ڕۆژانە',
 desc: 'خەلاتێن بەردەوام و خەلاتێ مەزن',
 faqs: [
 { q: 'خەلاتێن ڕۆژانە چەوا کار دکەن؟', a: 'بۆ ماوێ ٧ ڕۆژان ل سەر یەک، هەڕ ڕۆژ خەلاتەکێ نوی بۆ تە هەیە. پێدڤییە هەر ڕۆژ بچیە د ناڤ یاریێ دا و کلیکێ ل سەر خەلاتی بکەی.' },
 { q: 'ئەگەر ڕۆژەکێ ژبیر بکەم چ د قەومیت؟', a: 'ئەگەر تو بۆ ماوێ ڕۆژەکێ خەلاتێ خوە وەرنەگری، زنجیرەیا خەلاتێن تە دێ شکێت و دێ جارەکا دی ژ ڕۆژا ئێکێ دەست پێ کەتەڤە.' },
 { q: 'خەلاتێ مەزن یێ ڕۆژا ٧ چییە؟', a: 'ل ڕۆژا حەفتێ، تو دێ خەلاتەکێ مەزنتر وەرگری کو پێکدهێت ژ ٢٠٠٠ فلسان و ١ دینارێ زێڕین.' }
 ]
 },
 {
 id: 'xp-streak',
 icon: 'bolt',
 title: 'ئێکسپی (XP) و ڵێڤڵ',
 desc: 'کۆمکرنا ئێکسپی و گوهۆڕینا ڕەنگان',
 faqs: [
 { q: 'ڕەنگێن ڵێڤڵان چەوا دهێنە گوهۆڕین؟', a: 'هەرچەند تو ئێکسپی وەردگری و ڵێڤڵێ تە بلند دبیت، هەر ٥ ڵێڤڵان جارەکێ ڕەنگێ خانەیا ڵێڤڵێ تە (Tier) دێ هێتە گوهۆڕین. وەکی برۆنزی، زیڤی، زێڕی، زمروتی، و هتد.' },
 { q: 'ئاستێ ئەڵماسی چییە؟', a: 'گاڤا تو دگەهییە ڵێڤڵ ١٠٠ و بەرەڤ ژۆر، ڕەنگێ تە دێ بیتە ئەڵماسی یێ ئەفسانەیی (Legendary Diamond) و دێ جوداتر ل بەر چاڤان دیار بیت.' }
 ]
 },
 {
 id: 'achievements',
 icon: 'military_tech',
 title: 'نازناڤ و مەدالیا',
 desc: 'ئاستێن یاریکەران و دەستکەفت',
 faqs: [
 { q: 'سەرەتایی چییە؟', a: 'گەهشتن ب ڵێڤڵ ١٠.' },
 { q: 'شارەزا چییە؟', a: 'گەهشتن ب ڵێڤڵ ٥٠.' },
 { q: 'پەهلەوان چییە؟', a: 'سەرکەفتن د ١٠٠ یاریان دا.' },
 { q: 'مامۆستا چییە؟', a: 'گەهشتن ب زنجیرەیەکا ڕۆژانە یا ٢٠٠ یاریان ل سەر یەک.' },
 { q: 'شانازیا کوردستانێ چییە؟', a: 'دیتنا ١٠٠٠ پەیڤێن کوردی.' },
 { q: 'شاهێ پەیڤان چییە؟', a: 'دیتنا ١٠٠٠ پەیڤان بێی چ هاریکاری.' }
 ]
 },
 {
 id: 'chat',
 icon: 'chat',
 title: 'بەشێ چات و پەیوەندیان',
 desc: 'چاتا جیهانی، نامە و هەڤال',
 faqs: [
 { q: 'بەشێ جیهانی (Global Chat) چییە؟', a: 'ئەڤە ژوورەکا گشتی یە کو هەمی یاریزانێن یاریێ دشێن تێدا باخڤن، پەیامان بۆ ئێک و دوو بنێرن، و کەسێن نوی بنیاسن.' },
 { q: 'بەشێ نامە (Private Chat) چییە؟', a: 'ئەڤە تایبەتە بۆ نامە گۆڕینەوەیێ دگەل هەڤالێن تە یێن کو تە زێدەکرین د ناڤ یاریێ دا ب شێوەیەکێ تایبەت.' },
 { q: 'چەوا کەسەکێ کەمە هەڤالێ خوە؟', a: 'ل هەر جهەکێ د یاریێ دا (ل ڕێزبەندیێ یان د چاتا جیهانی دا) ل سەر وێنەیێ کەسەکێ کلیک بکە، پرۆفایلێ وی دێ ڤەبیت، پاشان کلیک ل سەر دوکمەیا "زێدەکرن وەک هەڤال" بکە بۆ ناردنا داخوازنامەیێ.' },
 { q: 'چەوا داخوازنامەیا هەڤالینیێ وەرگرم؟', a: 'گاڤا کەسەک داخوازنامەیەکێ بۆ تە دنێریت، دێ د بەشێ نۆتیفیکەیشن (ئاگاداری) دا یان د بەشێ هەڤالان دا بۆ تە دیار بیت، تو دشێی ل وێرێ وەرگری یان ڕەت بکەی.' },
 { q: 'چەوا کەسێ بێزارکەر بلۆک بکەم؟', a: 'هەر وەکی زێدەکرنا هەڤالان، ل سەر پرۆفایلێ وی کەسی کلیک بکە و دوکمەیا "بلۆککرن" هەلبژێرە.' }
 ]
 },
 {
 id: 'leaderboard',
 icon: 'leaderboard',
 title: 'ڕێزبەندی و گەڕیان',
 desc: 'هەڤال، لێگەڕیان و ڕێزبەندیا یاریزانان',
 faqs: [
 { q: 'ڕێزبەندی چەوا کار دکەت؟', a: 'ڕێزبەندی نیشانا باشترین یاریزانان ددەت ل سەر ئاستێ حەفتیانە و هەمی دەمان. ڕێزبەندی ل دووڤ وێ کۆژما ئێکسپی (XP) دهێتە هژمارتن کو تە د وێ ماوەیێ دا کۆمکرین.' },
 { q: 'بەشێ هەڤالان د ڕێزبەندیێ دا چییە؟', a: 'د ناڤ ڕێزبەندیێ دا تو دشێی ل سەر تابی "هەڤال" کلیک بکەی بۆ دیتنا ڕێزبەندیا تە د ناڤبەرا هەڤالێن تە بخوە دا.' },
 { q: 'چەوا ل هەڤالەکێ خوە بگەڕێم؟', a: 'تو دشێی د ناڤ لیستا هەڤالان یان ڕێزبەندیێ دا ب ڕێیا بەشێ لێگەڕیانێ (Search) ناڤێ هەر کەسەکێ بنڤیسی بۆ دیتنا پرۆفایلێ وی.' }
 ]
 }
];

const HelpCenterModal = ({ onClose, triggerHaptic }) => {
 const [activePage, setActivePage] = useState(null);

 const handleOpenPage = (id) => {
 if (triggerHaptic) triggerHaptic(10);
 setActivePage(id);
 };

 const handleBack = () => {
 if (triggerHaptic) triggerHaptic(10);
 setActivePage(null);
 };

 const activeTopic = HELP_TOPICS.find(t => t.id === activePage);

 return (
 <AnimatePresence>
 <Motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-1200 flex items-center justify-center bg-black/90 px-4"
 onClick={onClose}
 >
 <Motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="w-full max-w-85 h-187.5 max-h-[90vh] flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
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

 {/* Header Area */}
 <div className="w-full relative z-10 flex items-center justify-center pt-5 pb-5 shrink-0 px-12">
 {activePage && (
 <button
 onClick={handleBack}
 className="absolute left-3 top-3.5 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#115ab5] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-sm"></div>
 <span className="material-symbols-outlined text-lg relative z-10 -translate-y-px" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>arrow_back</span>
 </button>
 )}
 
 <h2 
 className="text-[17px] font-black text-white leading-snug relative z-10 text-center px-8" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 {activePage ? activeTopic?.title : 'سەنتەرێ هاریکاریێ'}
 </h2>

 <button
 onClick={() => { if (triggerHaptic) triggerHaptic(10); onClose(); }}
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

 {/* Main Content Area (White Box Wrapper) */}
 <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-3 rounded-sm bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-sm border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 
 {/* Scrollable Content */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 z-0 flex flex-col">
 <AnimatePresence mode="wait">
 {!activePage ? (
 <Motion.div
 key="main-menu"
 initial={{ x: -20, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: 20, opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="flex flex-col flex-1 space-y-4 pb-2"
 >
 {/* Content List */}
 <div className="rounded-md bg-[#e3eef2] border border-mono-100 dark:border-white/5 flex flex-col divide-y divide-mono-200">
 {HELP_TOPICS.map((topic) => (
 <button 
 key={topic.id}
 onClick={() => handleOpenPage(topic.id)}
 className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/50 transition-all group text-right"
 >
 <div className="flex items-center gap-3.5">
 <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
 <span className="material-symbols-outlined text-[18px] text-blue-600 group-hover:text-blue-700 transition-colors">
 {topic.icon}
 </span>
 </div>
 <div className="flex flex-col gap-0.5">
 <span className="text-[13px] font-black font-rabar text-[#181a20]">
 {topic.title}
 </span>
 <span className="text-[11px] font-bold font-rabar text-mono-500 truncate max-w-45">
 {topic.desc}
 </span>
 </div>
 </div>
 <span className="material-symbols-outlined text-[18px] text-mono-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all">
 chevron_left
 </span>
 </button>
 ))}
 </div>

 </Motion.div>
 ) : (
 /* --- DETAIL PAGE --- */
 <Motion.div
 key="detail-page"
 initial={{ x: 20, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: -20, opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="flex flex-col h-full w-full pb-2"
 >
 {/* FAQs List */}
 <div className="flex-1 space-y-3">
 {activeTopic?.faqs.map((faq, index) => (
 <div key={index} className="p-4 rounded-md bg-[#e3eef2] border border-mono-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
 <h4 className="text-[13px] font-black font-rabar text-[#181a20] flex items-start gap-2.5 leading-snug">
 {faq.q}
 </h4>
 <p className="text-[12px] font-bold font-rabar text-[#4b5563] leading-relaxed mt-1">
 {faq.a}
 </p>
 </div>
 ))}
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 </AnimatePresence>
 );
};

export default HelpCenterModal;
