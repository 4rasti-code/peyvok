import React, { useState } from 'react';
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

const DataDeletion = ({ onViewChange, onClose }) => {
    const [isKurdish, setIsKurdish] = useState(true);
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
        playBackSfx();
        if (onClose) {
            onClose();
        } else {
            navigate('/');
        }
    };

    const content = {
        en: {
            title: "Data Deletion Instructions",
            lastUpdated: "Last Updated: April 2, 2026",
            intro: "At پەیڤۆک, we respect your privacy and provide a simple way to request the deletion of your personal data associated with our Facebook login and game platform.",
            section1Title: "1. How to Request Data Deletion",
            section1Text: "To delete your data from پەیڤۆک, you can follow these steps:",
            steps: [
                "Open your Facebook profile and go to 'Settings & Privacy' > 'Settings'.",
                "Look for 'Apps and Websites' and find 'پەیڤۆک'.",
                "Click the 'Remove' button.",
                "Alternatively, you can send an email to support@peyvcin.com with the subject 'Data Deletion Request' and include your User ID or the email associated with your account."
            ],
            section2Title: "2. What Data is Deleted?",
            section2Text: "Once a deletion request is processed, the following information will be permanently removed from our servers:",
            deletedItems: [
                "Your profile information (Nickname, Avatar URL)",
                "Game statistics (Level, XP, Coins, Stars)",
                "Daily streak and solved words history",
                "Any social connections or leaderboard rankings"
            ],
            section3Title: "3. Processing Time",
            section3Text: "Manual email requests are typically processed within 3-5 business days. Once deleted, this information cannot be recovered.",
            backButton: "Back to Game",
        },
        ku: {
            title: "ڕێنمایێن ژێبرنا داتایان",
            lastUpdated: "دووماھیک نووژەنکرن: ٢ نیسان، ٢٠٢٦",
            intro: "ل پەیڤۆک، ئەم ڕێزێ ل تایبەتمەندیا تە دگرین و ڕێکەکا ب ساناھی دابین دکەین بۆ داخوازکرنا ژێبرنا داتایێن تە یێن کەسی یێن کو ب پەیڤۆک و فەیسبووکی ڤە گرێداینە.",
            section1Title: "١. چەوا داخوازا ژێبرنا داتایان بکەی",
            section1Text: "بۆ ژێبرنا داتایێن خوە ژ پەیڤۆک، تو دشێی ڤان پێنگاڤان پەیڕەو بکەی:",
            steps: [
                "پرۆفایلێ خوە یێ فەیسبووکی ڤەکە و ھەڕە 'Settings & Privacy' پاشان 'Settings'.",
                "ل 'Apps and Websites' بگەڕی و 'پەیڤۆک' ببینە.",
                "کلیکێ ل سەر دوگمەیا 'Remove' بکە.",
                "یان ژی، تو دشێی ئیمەیلەکێ بۆ support@peyvcin.com بفرێی ب ناڤونیشانێ 'Data Deletion Request' و ناسنامەیا خوە (User ID) یان ئیمەیلا خوە تێدا بنڤێسی."
            ],
            section2Title: "٢. کیژ داتای دێ ھێنە ژێبرن؟",
            section2Text: "پشتی کو داخوازا ژێبرنێ دھێتە جێبەجێکرن، ئەڤ زانیاریێن خوارێ دێ ب ئێکجاری ژ سێرڤەرێن مە ھێنە ڕەشکرن:",
            deletedItems: [
                "زانیاریێن پرۆفایلێ تە (ناڤ، وێنە)",
                "ئامارێن یاریێ (ئاست، XP، دینار، ستێرک)",
                "زانیاریێن رۆژانە و پەیڤێن تە یێن خەلاتکرین",
                "ھەر گرێدانەکا جڤاکی یان ڕیزبەندییا سەرکەفتووان"
            ],
            section3Title: "٣. دەمێ جێبەجێکرنێ",
            section3Text: "داخوازێن ب ڕێکا ئیمەیلێ ب گشتی د ناڤبەرا ٣-٥ رۆژێن کار دا دھێنە جێبەجێکرن. پشتی ژێبرنێ، ئەڤ زانیارییە ناھێنە ڤەگەراندن.",
            backButton: "ڤەگەڕە",
        }
    };

    const t = isKurdish ? content.ku : content.en;

    return (
        <div className="h-full bg-[#050510] text-[#f0f0f0] font-body selection:bg-primary/30 p-4 sm:p-8 md:p-12 relative">
            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-surface-container/20 backdrop-blur-3xl p-6 rounded-2xl border border-outline/10 shadow-2xl">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={handleClose}>
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-2xl">delete_sweep</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold font-heading  bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">پەیڤۆک</h1>
                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/80">Data Freedom</p>
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                        <button
                            onClick={() => setIsKurdish(false)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold  transition-all duration-500 flex items-center gap-2 ${!isKurdish ? 'bg-white text-black shadow-xl scale-105' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm">
                                <USFlag />
                            </div>
                            English
                        </button>
                        <button
                            onClick={() => setIsKurdish(true)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold  transition-all duration-500 flex items-center gap-2 ${isKurdish ? 'bg-primary text-white shadow-xl scale-105 shadow-primary/20' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <span>بەهدینی</span>
                            <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm">
                                <KurdistanFlag />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-surface-container/10 backdrop-blur-2xl border border-outline/10 rounded-3xl p-8 md:p-16 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/40 to-transparent" />
                    
                    <div className="flex flex-col items-center text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold  mb-4 leading-tight">{t.title}</h2>
                        <span className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold  tracking-widest text-primary uppercase">
                            {t.lastUpdated}
                        </span>
                    </div>

                    <div className="space-y-12">
                        <p className="text-lg text-text-dim/90 leading-relaxed font-medium transition-all duration-700">
                             {t.intro}
                        </p>

                        <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-bold ">{t.section1Title}</h3>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] space-y-4">
                                <p className="text-text-dim italic">{t.section1Text}</p>
                                <ul className="space-y-4">
                                    {t.steps.map((step, i) => (
                                        <li key={i} className="flex items-start gap-4 text-white/80 leading-relaxed">
                                            <span className="material-symbols-outlined text-primary text-xl mt-1">check_circle</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-6 animate-in slide-in-from-bottom-4 delay-100 duration-700">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-bold ">{t.section2Title}</h3>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] space-y-4">
                                <p className="text-text-dim italic">{t.section2Text}</p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {t.deletedItems.map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <span className="material-symbols-outlined text-secondary text-xl">delete</span>
                                            <span className="text-sm font-bold text-white/80">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-6 animate-in slide-in-from-bottom-4 delay-200 duration-700">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-bold ">{t.section3Title}</h3>
                            </div>
                            <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2rem]">
                                <p className="text-white/90 leading-relaxed font-medium">
                                    {t.section3Text}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-16 text-center space-y-8">
                    <div className="flex flex-wrap items-center justify-center gap-6 text-white/30 font-bold text-xs uppercase tracking-widest">
                        <button onClick={() => handleNavigate('/terms-of-service', 'terms')} className="hover:text-primary transition-colors">Terms of Service</button>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <button onClick={() => handleNavigate('/privacy-policy', 'privacy')} className="hover:text-primary transition-colors">Privacy Policy</button>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <button onClick={() => handleNavigate('/data-deletion', 'deletion')} className="text-primary hover:text-white transition-colors">Data Deletion</button>
                    </div>

                    <button 
                        onClick={handleClose}
                        className="bg-primary text-white px-10 py-5 rounded-2xl font-black  text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto pt-4 mt-8"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        {t.backButton}
                    </button>

                    <footer className="mt-12 text-center text-white/20 text-[10px] font-bold  uppercase tracking-[0.3em] antialiased">
                        © 2026 پەیڤۆک Team • Built for Heritage
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default DataDeletion;
