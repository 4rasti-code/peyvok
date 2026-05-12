import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { playBackSfx } from '../utils/audio';
import { useNavigate } from 'react-router-dom';

const KurdistanFlag = () => (
  <svg viewBox="0 0 512 341" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
    <path fill="#ed2024" d="M0 0h512v113.8H0z"/>
    <path fill="#fff" d="M0 113.8h512v113.4H0z"/>
    <path fill="#278e3c" d="M0 227.2h512v113.8H0z"/>
    <g transform="translate(256 170.5)">
      <circle fill="#f8e71c" r="54"/>
      {Array.from({ length: 21 }).map((_, i) => (
        <path 
          key={i}
          fill="#f8e71c" 
          d="M0-65L6-45h-12z" 
          transform={`rotate(${(i * 360) / 21})`}
        />
      ))}
      <circle fill="#f8e71c" r="22"/>
    </g>
  </svg>
);

const USFlag = () => (
  <svg viewBox="0 0 741 390" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
    <path fill="#fff" d="M0 0h741v390H0z"/>
    <path d="M0 0h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0z" fill="#b22234"/>
    <path d="M0 0h296.4v210H0z" fill="#3c3b6e"/>
    <g fill="#fff">
      {Array.from({ length: 50 }).map((_, i) => (
        <path 
          key={i}
          d="M0-11l3 9h9l-7 5l3 9l-8-6l-8 6l3-9l-7-5h9z" 
          transform={`translate(${16.5 + (i % 6) * 49.4 + (Math.floor(i / 11) % 2 ? 0 : 0)}, ${14 + (Math.floor(i / 11)) * 21}) scale(0.6)`}
        />
      ))}
    </g>
  </svg>
);

const TermsOfService = ({ onViewChange, onClose }) => {
    const [lang, setLang] = useState('ku'); // 'en' or 'ku'
    const navigate = useNavigate();

    const handleNavigate = (path, policyKey) => {
        playBackSfx();
        if (onViewChange && policyKey) {
            onViewChange(policyKey);
        } else {
            navigate(path);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigate('/');
        }
    };

    const content = {
        en: {
            title: "Terms of Service",
            subtitle: "Last Updated: April 2, 2026",
            intro: "Welcome to پەیڤۆک. By accessing or using our application, you agree to be bound by these Terms of Service. Please read them carefully.",
            sections: [
                {
                    title: "1. Acceptance of Terms",
                    text: "By creating an account or using any part of the پەیڤۆک platform, you confirm that you have read, understood, and agreed to these terms. If you do not agree, you must not use our services."
                },
                {
                    title: "2. License to Use",
                    text: "We grant you a non-exclusive, non-transferable, revocable license to use پەیڤۆک for personal, non-commercial entertainment purposes only.",
                    list: [
                        "You may not reverse engineer or modify the game files.",
                        "Commercial use of our logos and assets is strictly prohibited."
                    ]
                },
                {
                    title: "3. User Accounts",
                    text: "You are responsible for maintaining the confidentiality of your login credentials (via Facebook or Google).",
                    list: [
                        "You are responsible for all activities occurring under your account.",
                        "Notify us immediately of any unauthorized access."
                    ]
                },
                {
                    title: "4. Intellectual Property",
                    text: "All content within پەیڤۆک, including logos, graphics, word lists, and software, is the exclusive property of پەیڤۆک and its creators, protected by international copyright laws."
                },
                {
                    title: "5. Prohibited Conduct",
                    text: "To maintain a fair gaming environment, users are prohibited from:",
                    list: [
                        "Using cheats, hacks, or automation software.",
                        "Harassing other players or using offensive language in profiles.",
                        "Attempting to disrupt our technical infrastructure."
                    ]
                },
                {
                    title: "6. Limitation of Liability",
                    text: "پەیڤۆک provides its services 'as is'. We are not responsible for technical glitches, data loss, or server downtime. Our total liability shall not exceed the amount you paid to use the service (if any)."
                },
                {
                    title: "7. Changes to Terms",
                    text: "We reserve the right to modify these terms at any time. We will notify you of major changes through the application.",
                    email: "support@peyvchin.com"
                },
                {
                    title: "8. Virtual Currency",
                    text: "Any in-game currency (e.g., Fils, Derhem, Dinar) or rewards provided in پەیڤۆک are purely virtual. They have no real-world monetary value, cannot be exchanged for real money, and are used exclusively for in-game entertainment."
                }
            ]
        },
        ku: {
            title: "مەرجێن بکارئینانێ",
            subtitle: "دووماھیک نویژەنکرن: ٢ نیسان، ٢٠٢٦",
            intro: "بخێر بێی بۆ پەیڤۆک. ب چوونە ژوور یان بکارئینانا ڤێ یاریێ، تو ڕازی دبی کو پابەندی ڤان مەرج و ڕێسایان بی. ھیڤییە ب ھووری بخوینە.",
            sections: [
                {
                    title: "١. پەژراندنا مەرجان",
                    text: "ب دروستکرنا هژمارێ یان بکارئینانا ھەر پشکەکا پەیڤۆک، تو پشتڕاست دکەی کو تە ئەڤ مەرجە خواندینە، تێگەھشتی، و پێ ڕازی بی. ئەگەر تو پێ ڕازی نەبی، نادروستە خزمەتگوزاریێن مە بکاربینی."
                },
                {
                    title: "٢. مۆڵەتا بکارھێنەران",
                    text: "ئەم مۆڵەتەکا نە-تایبەت و سنووردار ددەینە تە کو پەیڤۆک بکاربینی ب تنێ بۆ مەبەستێن کەسی و نەک بۆ کارێن بازرگانی.",
                    list: [
                        "تو نیشێی فایلێن یاریێ کۆپی بکەی یان دەستکاری بکەی.",
                        "بکارئینانا بازرگانی ژ لۆگۆ و ناڤ و نیشانێن یاریێ قەدەغەیە بێی ڕێپێدان."
                    ]
                },
                {
                    title: "٣. بەرپرسیاریا هژمارێ",
                    text: "تو بەرپرسیاری ژ پاراستنا نھێنیا پێزانینێن چوونە ژوور (فەیسبووک/گووگڵ).",
                    list: [
                        "ھەمی چالاکیێن د ناڤ هژمارا تە دا دھێنە کرن، تو بەرپرسیاری ژێ.",
                        "ئەگەر تە ھەست ب ھەر فێلبازیەکێ کر د هژمارا خوە دا، زوو مە ئاگەھدار بکە."
                    ]
                },
                {
                    title: "٤. مافێن خاوەنداریێ",
                    text: "ھەمی ناڤەرۆکا پەیڤۆک، ژ لۆگۆ، گرافیک، لیستێن پەیڤان، و پڕۆگرامان، مافێ تایبەت یێ پەیڤۆک و خودانانە و ژ لایێ یاسا نێڤدەولەتیڤە پاراستیە."
                },
                {
                    title: "٥. کارێن قەدەغەکری",
                    text: "بۆ پاراستنا ژینگەکا دادپەروەر د یاریێدا، بۆ بکارھێنەران قەدەغەیە:",
                    list: [
                        "بکارئینانا ھاک و پڕۆگرامێن فێلبازیێ بۆ سەرکەفتنێ.",
                        "تەنگاڤکرنا یاریزانێن دی یان بکارئینانا پەیڤێن نەجوان د ناڤ و پڕۆفایلاندا.",
                        "پێکۆلکرن بۆ تێکدان یان ھێرشێن تەکنیکی بۆ سەر یاریێ."
                    ]
                },
                {
                    title: "٦. سنووردارکرنا بەرپرسیاریێ",
                    text: "پەیڤۆک خزمەتگوزاریێن خوە پێشکێش دکەت ب ڤی ڕەنگی یێ ھەی. ئەم بەرپرس نینین ژ چ کێشێن تەکنیکی، ژ دەستچوونا داتایان، یان ڕاگرتنا سێرڤەران."
                },
                {
                    title: "٧. گوھۆڕینا مەرجان",
                    text: "مە ماف ھەیە ل ھەر دەمەکی ڤان مەرجان بگوھۆڕین. ئەم دێ تە ژ گوھۆڕینێن مەزن ئاگەھدار کەین.",
                    email: "support@peyvchin.com"
                },
                {
                    title: "٨. دراڤێ خەیاڵی یێ ناڤ یاریێ",
                    text: "ھەمی جۆرێن دراڤی یان خالان یێن کو د ناڤ یاریێ دا دھێنە دان (وەکی فلس، دەرهەم، دینار) ب تنێ بۆ مەبەستا دەربازکرنا دەمی نە د ناڤ یاریێ دا و چ بھایەکێ ڕاستەقینە یێ ماددی نینە و نابیت ب پارێ ڕاستەقینە بھێنە فرۆشتن یان ئاڵوگۆڕکرن."
                }
            ]
        }
    };

    const current = content[lang];
    const isRTL = lang === 'ku';

    return (
        <div className="h-full bg-[#050510] text-[#E0E0E0] selection:bg-primary/30 selection:text-white font-body p-6 sm:p-12" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-4xl mx-auto relative">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-16 gap-8">
                    <div className="flex items-center gap-6 group cursor-pointer" onClick={handleClose}>
                        <div className="w-16 h-16 rounded-lg bg-linear-to-br from-primary to-primary-container p-0.5 shadow-xl transition-all group-hover:scale-105 active:scale-95 shadow-primary/20">
                            <div className="w-full h-full bg-[#0F0F1A] rounded-[1.4rem] flex items-center justify-center overflow-">
                                <span className="text-3xl font-bold  text-primary">P</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold   text-white mb-1">پەیڤۆک</h1>
                            <p className="text-text-dim/60 text-xs font-bold uppercase tracking-[0.2em]">Heritage Reborn</p>
                        </div>
                    </div>

                    <div className="flex bg-[#12121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 shadow-2xl">
                        <button 
                            onClick={() => { playBackSfx(); setLang('ku'); }}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${lang === 'ku' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm">
                                <KurdistanFlag />
                            </div>
                            <span>بەهدینی</span>
                        </button>
                        <button 
                            onClick={() => { playBackSfx(); setLang('en'); }}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${lang === 'en' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm">
                                <USFlag />
                            </div>
                            <span>English</span>
                        </button>
                    </div>
                </div>

                <Motion.div 
                    key={lang}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#12121A]/50 backdrop-blur-2xl border border-white/5 rounded-3xl p-10 sm:p-20 shadow-[0_20px_80px_rgba(0,0,0,0.4)] relative"
                >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-30"></div>

                    <header className="mb-16 text-center sm:text-start">
                        <h2 className="text-4xl sm:text-5xl font-bold  text-white mb-4 leading-tight">{current.title}</h2>
                        <span className="text-primary/70 font-bold text-sm tracking-wide bg-primary/10 px-4 py-2 rounded-full border border-primary/20">{current.subtitle}</span>
                    </header>

                    <p className="text-xl text-white/70 mb-16 leading-relaxed font-medium italic border-r-4 border-primary pr-6">
                        {current.intro}
                    </p>

                    <div className="space-y-16">
                        {current.sections.map((section, idx) => (
                            <section key={idx} className="relative">
                                <h3 className="text-2xl font-bold  text-white mb-6 flex items-center gap-4">
                                    {section.title}
                                </h3>
                                <p className="text-white/60 leading-relaxed text-lg mb-6">{section.text}</p>
                                {section.list && (
                                    <ul className="space-y-4 pr-12">
                                        {section.list.map((item, i) => (
                                            <li key={i} className="flex items-start gap-4 text-white/50 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 transition-transform group-hover:scale-150"></div>
                                                <span className="flex-1">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {section.email && (
                                    <a href={`mailto:${section.email}`} className="inline-block mt-4 text-primary font-bold  text-xl hover:text-white transition-colors border-b-2 border-primary/20 pb-1">
                                        {section.email}
                                    </a>
                                )}
                            </section>
                        ))}
                    </div>
                </Motion.div>

                {/* Footer */}
                <div className="mt-16 text-center space-y-8">
                    <div className="flex flex-wrap items-center justify-center gap-6 text-white/30 font-bold text-xs uppercase tracking-widest">
                        <button onClick={() => handleNavigate('/terms-of-service', 'terms')} className="text-primary hover:text-white transition-colors">Terms of Service</button>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <button onClick={() => handleNavigate('/privacy-policy', 'privacy')} className="hover:text-primary transition-colors">Privacy Policy</button>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <button onClick={() => handleNavigate('/data-deletion', 'deletion')} className="hover:text-primary transition-colors">Data Deletion</button>
                    </div>
                    
                    <button 
                        onClick={() => {
                            playBackSfx();
                            handleClose();
                        }}
                        className="bg-primary text-white px-10 py-5 rounded-2xl font-black  text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto pt-4 mt-8"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        {lang === 'ku' ? 'ڤەگەڕە' : 'Back to Game'}
                    </button>
                    <p className="mt-8 text-[10px] text-white/10 uppercase font-bold   italic">&copy; 2026 پەیڤۆک App. All Rights Reserved.</p>
                </div>
            </div>

            <style>{`
                .animate-pulse-slow {
                    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.15; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
};

export default TermsOfService;


