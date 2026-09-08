import React from 'react';

export default function ClipboardIcon({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes clipboard-float-simple {
 0%, 100% { transform: translateY(0px) rotate(0deg); }
 50% { transform: translateY(-3px) rotate(2deg); }
 }
 @keyframes pencil-write-simple {
 0%, 100% { transform: translate(0, 0) rotate(0deg); }
 25% { transform: translate(-2px, -2px) rotate(-4deg); }
 75% { transform: translate(2px, 2px) rotate(4deg); }
 }
 @keyframes star-pulse-simple {
 0%, 100% { transform: scale(1); opacity: 0.8; filter: drop-shadow(0 0 2px rgba(253,224,71,0.5)); }
 50% { transform: scale(1.3); opacity: 1; filter: drop-shadow(0 0 6px rgba(253,224,71,0.9)); }
 }
 `}
 </style>
 
 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
 
 {/* Main Group with NO Float Animation */}
 <g style={{ transformOrigin: '50px 50px' }}>
 
 {/* --- Board --- */}
 {/* Main Board Base */}
 <rect x="20" y="15" width="60" height="75" rx="8" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
 {/* Board Inner Highlight */}
 <rect x="22" y="17" width="56" height="71" rx="6" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
 
 {/* --- Paper --- */}
 <rect x="28" y="26" width="44" height="58" rx="2" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" />
 
 {/* Paper Lines */}
 <line x1="36" y1="42" x2="64" y2="42" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
 <line x1="36" y1="54" x2="64" y2="54" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
 <line x1="36" y1="66" x2="55" y2="66" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
 
 {/* --- Clip Mechanism --- */}
 {/* Clip Body */}
 <rect x="35" y="8" width="30" height="18" rx="4" fill="#4b5563" stroke="#374151" strokeWidth="2" />
 {/* Clip Highlight */}
 <rect x="36" y="9" width="28" height="16" rx="3" fill="none" stroke="#6b7280" strokeWidth="1" />
 {/* Clip Hole */}
 <rect x="42" y="13" width="16" height="5" rx="2.5" fill="#1f2937" />

 {/* --- Animated Pencil --- */}
 <g style={{ animation: 'pencil-write-simple 2s infinite ease-in-out', transformOrigin: '75px 65px' }}>
 {/* Position and rotate the pencil diagonally */}
 <g transform="translate(68, 40) rotate(35)">
 {/* Pencil Base / Wood */}
 <polygon points="0,0 12,0 12,35 0,35" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
 
 {/* Eraser End */}
 <path d="M 0,0 L 12,0 L 12,-8 C 12,-10 10,-12 6,-12 C 2,-12 0,-10 0,-8 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
 
 {/* Metal Band */}
 <rect x="0" y="-1" width="12" height="6" fill="#9ca3af" stroke="#4b5563" strokeWidth="1.5" />
 
 {/* Sharpened Wood Cone */}
 <polygon points="0,35 12,35 6,50" fill="#fef08a" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
 
 {/* Lead Tip */}
 <polygon points="3.5,44 8.5,44 6,50" fill="#374151" stroke="#374151" strokeWidth="1.5" strokeLinejoin="round" />
 </g>
 </g>

 </g>
 </svg>
 </div>
 );
}
