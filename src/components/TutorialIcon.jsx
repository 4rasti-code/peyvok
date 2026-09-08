import React from 'react';

export default function TutorialIcon({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes book-float {
 0%, 100% { transform: translateY(0px) rotate(0deg); filter: drop-shadow(0 10px 10px rgba(49,46,129,0.4)); }
 50% { transform: translateY(-6px) rotate(1deg); filter: drop-shadow(0 15px 12px rgba(49,46,129,0.3)); }
 }
 @keyframes page-flip {
 0% { transform: rotateY(0deg) skewY(0deg); opacity: 1; }
 50% { transform: rotateY(-90deg) skewY(-10deg); opacity: 0.8; }
 100% { transform: rotateY(-180deg) skewY(0deg); opacity: 0; }
 }
 @keyframes sparkle-glow {
 0%, 100% { transform: scale(0.8); opacity: 0.5; }
 50% { transform: scale(1.2); opacity: 1; }
 }
 `}
 </style>
 
 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
 <defs>
 <linearGradient id="coverGrad" x1="0" y1="0" x2="1" y2="1">
 <stop offset="0%" stopColor="#818cf8" />
 <stop offset="100%" stopColor="#4338ca" />
 </linearGradient>
 <linearGradient id="pageGrad" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0%" stopColor="#fef3c7" />
 <stop offset="50%" stopColor="#fde68a" />
 <stop offset="100%" stopColor="#fef3c7" />
 </linearGradient>
 </defs>
 
 <g style={{ animation: 'book-float 3s infinite ease-in-out', transformOrigin: '50px 50px' }}>
 
 {/* Shadow */}
 <path d="M 10 30 Q 50 15 50 30 Q 50 15 90 30 L 90 70 Q 50 55 50 70 Q 50 55 10 70 Z" fill="#312e81" transform="translate(0, 5)" opacity="0.6" />
 
 {/* Back Cover / Binding Thickness */}
 <path d="M 10 30 Q 50 15 50 30 Q 50 15 90 30 L 90 74 Q 50 59 50 74 Q 50 59 10 74 Z" fill="#3730a3" />
 
 {/* Main Cover inside (Visible at edges) */}
 <path d="M 10 30 Q 50 15 50 30 Q 50 15 90 30 L 90 70 Q 50 55 50 70 Q 50 55 10 70 Z" fill="url(#coverGrad)" stroke="#312e81" strokeWidth="2" strokeLinejoin="round" />
 
 {/* Pages Block Thickness */}
 <path d="M 12 33 Q 50 18 50 32 L 50 72 Q 50 58 12 72 Z" fill="#f59e0b" />
 <path d="M 88 33 Q 50 18 50 32 L 50 72 Q 50 58 88 72 Z" fill="#d97706" />

 {/* Top Pages */}
 <path d="M 12 33 Q 50 18 50 32 L 50 68 Q 50 55 12 68 Z" fill="url(#pageGrad)" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
 <path d="M 88 33 Q 50 18 50 32 L 50 68 Q 50 55 88 68 Z" fill="url(#pageGrad)" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
 
 {/* Bookmark */}
 <path d="M 30 25 L 40 21 L 40 45 L 35 40 L 30 45 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
 <path d="M 32 28 L 38 25 L 38 41 L 35 38 L 32 41 Z" fill="#fca5a5" opacity="0.6" />

 {/* Binding Center line */}
 <line x1="50" y1="30" x2="50" y2="74" stroke="#312e81" strokeWidth="3" strokeLinecap="round" />
 <line x1="50" y1="31" x2="50" y2="73" stroke="#818cf8" strokeWidth="1.5" />
 
 {/* Left Page Text Lines */}
 <line x1="20" y1="42" x2="42" y2="38" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
 <line x1="18" y1="50" x2="42" y2="46" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
 <line x1="16" y1="58" x2="35" y2="55" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
 
 {/* Right Page Text Lines */}
 <line x1="80" y1="42" x2="58" y2="38" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
 <line x1="82" y1="50" x2="58" y2="46" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
 <line x1="84" y1="58" x2="65" y2="55" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />

 {/* Animated Page Flip */}
 <g style={{ transformOrigin: '50px 50px', animation: 'page-flip 3s infinite cubic-bezier(0.4, 0, 0.2, 1)' }}>
 <path d="M 88 33 Q 50 18 50 32 L 50 68 Q 50 55 88 68 Z" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
 <line x1="80" y1="42" x2="58" y2="38" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
 <line x1="82" y1="50" x2="58" y2="46" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
 </g>

 {/* Magical Sparkles */}
 <circle cx="20" cy="20" r="2.5" fill="#fbbf24" style={{ animation: 'sparkle-glow 2s infinite alternate', transformOrigin: '20px 20px' }} />
 <circle cx="80" cy="25" r="3.5" fill="#fcd34d" style={{ animation: 'sparkle-glow 1.5s infinite alternate-reverse', transformOrigin: '80px 25px' }} />
 <circle cx="45" cy="15" r="2" fill="#fef3c7" style={{ animation: 'sparkle-glow 1s infinite alternate', transformOrigin: '45px 15px' }} />

 </g>
 </svg>
 </div>
 );
}
