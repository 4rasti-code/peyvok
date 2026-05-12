import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { playBackSfx } from '../utils/audio';

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

const PrivacyPolicy = ({ onViewChange, onClose }) => {
    const [lang, setLang] = useState('ku'); // 'en' or 'ku'
    const navigate = useNavigate();

    const handleNavigate = (path, policyKey) => {
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
            title: "Privacy Policy",
            subtitle: "Last Updated: April 2, 2026",
            intro: "At پەیڤۆک, we are committed to protecting your privacy and security. This Privacy Policy outlines how we handle your personal information when you use our application.",
            sections: [
                {
                    title: "1. Information We Collect",
                    text: "When you use پەیڤۆک, we may collect the following information:",
                    list: [
                        "Public profile information (Name, Profile Picture) from Facebook, Google, or Apple.",
                        "Email address provided during sign-in.",
                        "Game data (scores, level, and virtual rewards) to maintain your ranking on the leaderboard.",
                        "Device information (language, device type)."
                    ]
                },
                {
                    title: "2. How We Use Facebook, Google, and Apple Data",
                    text: "If you choose to sign in via Facebook, Google, or Apple, we only access information you explicitly permit. We use this data to:",
                    list: [
                        "Create your unique game profile.",
                        "Display your name and country on the global leaderboards.",
                        "Synchronize your game progress across multiple devices."
                    ]
                },
                {
                    title: "3. Data Security",
                    text: "Your data is stored securely using Supabase. We do not sell or share your personal information with third parties for marketing purposes."
                },
                {
                    title: "4. Your Rights and Data Deletion",
                    text: "You have the right to access, edit, or delete your information at any time. Specifically for Facebook, Google, or Apple users:",
                    list: [
                        "To delete game activity, go to your Facebook, Google, or Apple profile > Settings & Privacy > Settings > Apps and Websites.",
                        "Find 'پەیڤۆک App' and click 'Remove'.",
                        "Alternatively, you can email us at support@peyvchin.com to request full account and data deletion."
                    ]
                },
                {
                    title: "5. Contact Us",
                    text: "If you have any questions or concerns regarding this policy, please contact us at:",
                    email: "support@peyvchin.com"
                }
            ]
        },
        ku: {
            title: "ڕێبازا پاراستنا نھێنیێ",
            subtitle: "دووماھیک نویژەنکرن: ٢ نیسان، ۲۰۲٦",
            intro: "ئەم ل پەیڤۆک ھەمی پێکۆلەکێ دکەین بۆ پاراستنا تایبەتمەندیا تە. ئەڤ ڕێبازە دیار دکەت کا ئەم چەوا پێزانینێن تە یێن کەسی بکار دهینین دەما تو یارییا مە بکار دهینی.",
            sections: [
                {
                    title: "١. ئەو پێزانینێن ئەم کۆم دکەین",
                    text: "دەما تو پەیڤۆک بکار دهینی، دبیت ئەڤ پێزانینە بھێنە کۆمکرن:",
                    list: [
                        "پێزانینێن گشتی یێن پڕۆفایلی (ناڤ، وێنە) ژ فەیسبۆکی، گۆگلی یان ئەپڵی.",
                        "ئیمەیڵا ھاتیە پێشکێشکرن دەما چوونەژوورێ.",
                        "داتایێن یاریێ (نمرەیان، ئاست، و پاداشتێن خەیالی) بۆ پاراستنا ڕێزا تە د لیستا سەرکەفتیاندا.",
                        "پێزانینێن ئامیرەیی (زمان، جۆرێ مۆبایلێ)."
                    ]
                },
                {
                    title: "٢. چەوا ئەم داتایێن فەیسبۆک، گۆگل و ئەپڵی بکار دهینین",
                    text: "ئەگەر تە ھەلبژارت ب ڕێیا فەیسبۆکی، گۆگلی یان ئەپڵی بچی د ژوورڤە، ئەم ب تنێ دەستەکا مە ل سەر وان پێزانینان ھەیە کو تە ڕێپێدان پێ دایە. ئەم ڤان داتایان بکار دهینین بۆ:",
                    list: [
                        "دروستکرنا پڕۆفایلێ تە یێ تایبەت د ناڤ یاریێدا.",
                        "پێشاندانا ناڤ و وەلاتێ تە د لیستا جیھانی یا سەرکەفتیاندا.",
                        "ھەڤدەمکرنا (Sync) پێشکەفتنا تە د یاریێدا د ناڤبەرا چەندین ئامیران دا."
                    ]
                },
                {
                    title: "٣. پاراستنا داتایان",
                    text: "داتایێن تە گەلەک ب تەناهی دھێنە پاراستن ب ڕێیا Supabase. ئەم چ پێزانینێن تە یێن تایبەت نادەینە چ لایەنەکێ دی بۆ مەبەستێن ڕیکلامێ."
                },
                {
                    title: "٤. مافێن تە و ژێبرنا داتایان",
                    text: "مافێ تە ھەیە ل ھەر دەمەکی پێزانینێن خوە ببینی، دەستکاری بکەی، یان ژی ببەی. تایبەت بۆ بکارھێنەرێن فەیسبۆک، گۆگل یان ئەپڵی:",
                    list: [
                        "بۆ ژێبرنا چالاکیێن یاریێ، ھەرە د ناڤ پڕۆفایلێ خوە یێ فەیسبۆکی، گۆگلی یان ئەپڵی > Settings & Privacy > Settings > Apps and Websites.",
                        "پەیڤۆک (پەیڤۆک App) بببینە و کلیک بکە ل سەر Remove.",
                        "یان ژی تو دشێی ئیمەیڵەکێ بۆ مە بهنێری ل سەر support@peyvchin.com بۆ داخوازکرنا ژێبرنا ئێکجارە یا هژمارێ و ھەمی داتایێن یاریێ."
                    ]
                },
                {
                    title: "٥. پەیوەندی ب مە بکە",
                    text: "ئەگەر تە ھەر پسیارەک یان تێبینیەک ھەبیت ل سەر ڤێ ڕێبازێ، ھیڤییە پەیوەندیێ ب مە بکەی ب ڕێیا:",
                    email: "support@peyvchin.com"
                }
            ]
        }
    };

    const current = content[lang];
    const isRTL = lang === 'ku';

    return (
        <div className="h-full bg-mono-white dark:bg-mono-950 text-mono-900 dark:text-mono-100 selection:bg-mono-900 dark:bg-mono-50/30 selection:text-white font-body p-6 sm:p-12" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-4xl mx-auto relative">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-16 gap-8">
                    <div className="flex items-center gap-6 group cursor-pointer" onClick={handleClose}>
                        <div>
                            <h1 className="text-4xl font-bold   text-mono-900 dark:text-white mb-1">پەیڤۆک</h1>
                            <p className="text-text-dim/60 text-xs font-bold uppercase tracking-[0.2em]">Heritage Reborn</p>
                        </div>
                    </div>

                    <div className="flex bg-mono-50 dark:bg-mono-900/80 backdrop-blur-xl border border-mono-200 dark:border-white/5 rounded-2xl p-1.5 shadow-2xl">
                        <button 
                            onClick={() => setLang('ku')}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${lang === 'ku' ? 'bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900 shadow-lg shadow-black/20 dark:shadow-white/10' : 'text-mono-500 dark:text-white/40 hover:text-mono-700 dark:text-white/70'}`}
                        >
                            <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm">
                                <KurdistanFlag />
                            </div>
                            <span>بەهدینی</span>
                        </button>
                        <button 
                            onClick={() => setLang('en')}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${lang === 'en' ? 'bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900 shadow-lg shadow-black/20 dark:shadow-white/10' : 'text-mono-500 dark:text-white/40 hover:text-mono-700 dark:text-white/70'}`}
                        >
                            <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm">
                                <USFlag />
                            </div>
                            <span>English</span>
                        </button>
                    </div>
                </div>

                {/* Content Card */}
                <Motion.div 
                    key={lang}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-mono-50 dark:bg-mono-900/50 backdrop-blur-2xl border border-mono-200 dark:border-white/5 rounded-3xl p-10 sm:p-20 shadow-[0_20px_80px_rgba(0,0,0,0.4)] relative"
                >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-mono-500/50 to-transparent opacity-30"></div>

                    <header className="mb-16 text-center sm:text-start">
                        <h2 className="text-4xl sm:text-5xl font-bold  text-mono-900 dark:text-white mb-4 leading-tight">{current.title}</h2>
                        <span className="text-mono-600 dark:text-mono-400 font-bold text-sm tracking-wide bg-mono-900 dark:bg-mono-50/10 px-4 py-2 rounded-full border border-mono-200 dark:border-mono-700">{current.subtitle}</span>
                    </header>

                    <p className="text-xl text-mono-700 dark:text-white/70 mb-16 leading-relaxed font-medium italic border-r-4 border-mono-900 dark:border-mono-50 pr-6">
                        {current.intro}
                    </p>

                    <div className="space-y-16">
                        {current.sections.map((section, idx) => (
                            <section key={idx} className="relative">
                                <h3 className="text-2xl font-bold  text-mono-900 dark:text-white mb-6 flex items-center gap-4">
                                    {section.title}
                                </h3>
                                <p className="text-mono-600 dark:text-white/60 leading-relaxed text-lg mb-6">{section.text}</p>
                                {section.list && (
                                    <ul className="space-y-4 pr-12">
                                        {section.list.map((item, i) => (
                                            <li key={i} className="flex items-start gap-4 text-mono-600 dark:text-white/50 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-mono-900 dark:bg-mono-50 mt-2.5 transition-transform group-hover:scale-150"></div>
                                                <span className="flex-1">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {section.email && (
                                    <a href={`mailto:${section.email}`} className="inline-block mt-4 text-mono-900 dark:text-mono-50 font-bold  text-xl hover:text-white transition-colors border-b-2 border-mono-300 dark:border-mono-600 pb-1">
                                        {section.email}
                                    </a>
                                )}
                            </section>
                        ))}
                    </div>
                </Motion.div>

                {/* Footer */}
                <div className="mt-16 text-center space-y-8">
                    <div className="flex flex-wrap items-center justify-center gap-6 text-mono-500 dark:text-white/30 font-bold text-xs uppercase tracking-widest">
                        <button onClick={() => handleNavigate('/terms-of-service', 'terms')} className="hover:text-mono-900 dark:hover:text-mono-50 transition-colors">Terms of Service</button>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <button onClick={() => handleNavigate('/privacy-policy', 'privacy')} className="text-mono-900 dark:text-mono-50 hover:text-white transition-colors">Privacy Policy</button>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <button onClick={() => handleNavigate('/data-deletion', 'deletion')} className="hover:text-mono-900 dark:hover:text-mono-50 transition-colors">Data Deletion</button>
                    </div>
                    
                    <button 
                        onClick={() => {
                            playBackSfx();
                            handleClose();
                        }}
                        className="bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900 px-10 py-5 rounded-2xl font-black  text-sm uppercase tracking-[0.2em] shadow-xl shadow-black/20 dark:shadow-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto pt-4 mt-8"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        {lang === 'ku' ? 'ڤەگەڕە' : 'Back to Game'}
                    </button>
                    <p className="mt-8 text-[10px] text-mono-300 dark:text-white/10 uppercase font-bold   italic">&copy; 2026 پەیڤۆک App. All Rights Reserved.</p>
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

export default PrivacyPolicy;


