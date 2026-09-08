import React from 'react';

export default function TimerIcon({ className = "w-14 h-14" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes top-sand {
 0%, 10% { transform: translateY(0); }
 70%, 100% { transform: translateY(45px); }
 }
 @keyframes bottom-sand {
 0%, 10% { transform: translateY(45px); }
 70%, 100% { transform: translateY(0); }
 }
 @keyframes stream {
 0%, 10% { opacity: 0; }
 15%, 68% { opacity: 1; }
 70%, 100% { opacity: 0; }
 }
 @keyframes hourglass-flip {
 0%, 75% { transform: rotate(0deg); }
 95%, 100% { transform: rotate(180deg); }
 }
 `}
 </style>
 <div className="relative flex items-center justify-center w-full h-full">
 <svg 
 viewBox="0 0 100 120" 
 fill="none" 
 xmlns="http://www.w3.org/2000/svg"
 className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)] overflow-visible"
 >
 <defs>
 {/* HYPER-REALISTIC GRADIENTS (Symmetrical for seamless flip) */}
 <linearGradient id="pillar-grad" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor="#451a03" />
 <stop offset="25%" stopColor="#b45309" />
 <stop offset="50%" stopColor="#92400e" />
 <stop offset="75%" stopColor="#b45309" />
 <stop offset="100%" stopColor="#451a03" />
 </linearGradient>

 <linearGradient id="base-grad" x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" stopColor="#451a03" />
 <stop offset="20%" stopColor="#d97706" />
 <stop offset="50%" stopColor="#92400e" />
 <stop offset="80%" stopColor="#d97706" />
 <stop offset="100%" stopColor="#451a03" />
 </linearGradient>

 <linearGradient id="sand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor="#b45309" />
 <stop offset="30%" stopColor="#fcd34d" />
 <stop offset="70%" stopColor="#fcd34d" />
 <stop offset="100%" stopColor="#b45309" />
 </linearGradient>

 <radialGradient id="glass-glow" cx="50%" cy="50%" r="50%">
 <stop offset="50%" stopColor="rgba(255,255,255,0)" />
 <stop offset="95%" stopColor="rgba(255,255,255,0.25)" />
 <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
 </radialGradient>

 <clipPath id="top-glass">
 <path d="M 30 15 C 30 40, 46 55, 48 60 L 52 60 C 54 55, 70 40, 70 15 Z" />
 </clipPath>
 <clipPath id="bottom-glass">
 <path d="M 48 60 C 46 65, 30 80, 30 105 L 70 105 C 70 80, 54 65, 52 60 Z" />
 </clipPath>
 </defs>

 {/* ROTATING 3D GROUP */}
 <g style={{ transformOrigin: '50px 60px', animation: 'hourglass-flip 5s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55)' }}>
 
 {/* WOODEN PILLARS (3D Cylinders) */}
 <rect x="20" y="15" width="8" height="90" rx="4" fill="url(#pillar-grad)" />
 <rect x="72" y="15" width="8" height="90" rx="4" fill="url(#pillar-grad)" />

 {/* PILLAR MIDDLE RINGS */}
 <rect x="18" y="56" width="12" height="8" rx="4" fill="url(#base-grad)" />
 <rect x="70" y="56" width="12" height="8" rx="4" fill="url(#base-grad)" />

 {/* 3D SAND VOLUME */}
 <g clipPath="url(#top-glass)">
 <rect x="20" y="15" width="60" height="45" fill="url(#sand-grad)" style={{ animation: 'top-sand 5s infinite linear' }} />
 </g>
 <g clipPath="url(#bottom-glass)">
 <rect x="20" y="60" width="60" height="45" fill="url(#sand-grad)" style={{ animation: 'bottom-sand 5s infinite linear' }} />
 </g>

 {/* SAND STREAM */}
 <rect x="49" y="60" width="2" height="45" fill="#fcd34d" style={{ animation: 'stream 5s infinite' }} />

 {/* GLASS BODY (Reflective Glow & Borders) */}
 <path 
 d="M 30 15 C 30 40, 46 55, 48 60 C 46 65, 30 80, 30 105 L 70 105 C 70 80, 54 65, 52 60 C 54 55, 70 40, 70 15 Z" 
 fill="url(#glass-glow)" stroke="#7dd3fc" strokeWidth="2.5" strokeLinejoin="round" 
 />
 {/* Glass Outer Edge Highlight */}
 <path 
 d="M 30 15 C 30 40, 46 55, 48 60 C 46 65, 30 80, 30 105 L 70 105 C 70 80, 54 65, 52 60 C 54 55, 70 40, 70 15 Z" 
 fill="none" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" opacity="0.8"
 />

 {/* REALISTIC GLASS SHINES (Symmetrical) */}
 {/* Primary thick shines */}
 <path d="M 32 30 C 32 40, 42 50, 44 55" stroke="rgba(255,255,255,0.8)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
 <path d="M 68 90 C 68 80, 58 70, 56 65" stroke="rgba(255,255,255,0.8)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
 
 {/* Secondary thin gloss */}
 <path d="M 68 30 C 68 40, 58 50, 56 55" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
 <path d="M 32 90 C 32 80, 42 70, 44 65" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

 {/* WOODEN BASES (Rounded 3D Discs) */}
 <rect x="15" y="5" width="70" height="10" rx="5" fill="url(#base-grad)" />
 <rect x="15" y="105" width="70" height="10" rx="5" fill="url(#base-grad)" />
 </g>
 </svg>
 </div>
 </div>
 );
}
