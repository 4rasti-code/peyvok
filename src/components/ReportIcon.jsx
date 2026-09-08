import React from 'react';

export default function ReportIcon({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes megaphone-wiggle {
 0%, 100% { transform: rotate(0deg); }
 25% { transform: rotate(-6deg); }
 75% { transform: rotate(6deg); }
 }
 @keyframes sound-wave-pulse {
 0%, 100% { opacity: 0.2; transform: scale(0.9) translateX(-4px); }
 50% { opacity: 1; transform: scale(1.1) translateX(4px); filter: drop-shadow(0 0 5px #fbbf24); }
 }
 `}
 </style>
 
 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" style={{ transform: 'scaleX(-1)' }} xmlns="http://www.w3.org/2000/svg">
 <defs>
 <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#fcd34d" />
 <stop offset="50%" stopColor="#f59e0b" />
 <stop offset="100%" stopColor="#b45309" />
 </linearGradient>
 <linearGradient id="rimGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#fde68a" />
 <stop offset="100%" stopColor="#d97706" />
 </linearGradient>
 </defs>
 
 <g style={{ animation: 'megaphone-wiggle 3s infinite ease-in-out', transformOrigin: '40px 60px' }}>
 
 {/* Silhouette/Shadow */}
 <path d="M 23 35 L 75 15 L 75 65 L 23 45 Z" fill="#78350f" transform="translate(2, 4)" opacity="0.6" />
 
 {/* Handle Base & Shadow */}
 <rect x="37" y="58" width="12" height="30" rx="6" fill="#1f2937" />
 <rect x="35" y="56" width="12" height="30" rx="6" fill="#4b5563" stroke="#1f2937" strokeWidth="2.5" />
 <rect x="37" y="58" width="4" height="26" rx="2" fill="#9ca3af" />
 
 {/* Back Piece (Mouthpiece) */}
 <ellipse cx="25" cy="40" rx="10" ry="14" fill="#7f1d1d" />
 <ellipse cx="23" cy="40" rx="10" ry="14" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" />
 <ellipse cx="20" cy="40" rx="5" ry="9" fill="#450a0a" />
 <path d="M 23 28 C 26 28 26 52 23 52" fill="none" stroke="#fca5a5" strokeWidth="2" opacity="0.6" />

 {/* Main Cone Body */}
 <path d="M 23 28 L 75 15 L 75 65 L 23 52 Z" fill="url(#coneGrad)" stroke="#78350f" strokeWidth="2.5" strokeLinejoin="round" />
 
 {/* Cone Highlights */}
 <path d="M 25 31 L 70 19 L 70 28 L 25 38 Z" fill="#fef3c7" opacity="0.5" />
 <path d="M 24 50 L 73 62 L 73 64 L 24 52 Z" fill="#78350f" opacity="0.4" />

 {/* Front Rim */}
 <ellipse cx="75" cy="40" rx="10" ry="25" fill="#78350f" transform="translate(1, 1)" opacity="0.7" />
 <ellipse cx="75" cy="40" rx="10" ry="25" fill="url(#rimGrad)" stroke="#78350f" strokeWidth="2.5" />
 <ellipse cx="78" cy="40" rx="6" ry="20" fill="#450a0a" />
 <path d="M 72 17 C 76 17 76 63 72 63" fill="none" stroke="#fef3c7" strokeWidth="2" opacity="0.6" />

 {/* Sound Waves */}
 <g style={{ animation: 'sound-wave-pulse 1.5s infinite ease-in-out', transformOrigin: '85px 40px' }}>
 <path d="M 90 25 Q 102 40 90 55" fill="none" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
 <path d="M 98 15 Q 115 40 98 65" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
 </g>

 </g>
 </svg>
 </div>
 );
}
