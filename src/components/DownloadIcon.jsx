import React from 'react';

export default function DownloadIcon({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes arrow-bounce-download {
 0%, 100% { transform: translateY(-5px); }
 50% { transform: translateY(5px); }
 }
 @keyframes box-glow-download {
 0%, 100% { filter: drop-shadow(0 4px 6px rgba(14,165,233,0.3)); }
 50% { filter: drop-shadow(0 8px 12px rgba(14,165,233,0.7)); }
 }
 `}
 </style>
 
 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
 <defs>
 <linearGradient id="trayGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#7dd3fc" />
 <stop offset="100%" stopColor="#0284c7" />
 </linearGradient>
 <linearGradient id="arrowGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#f0f9ff" />
 <stop offset="100%" stopColor="#38bdf8" />
 </linearGradient>
 </defs>
 
 <g style={{ animation: 'box-glow-download 3s infinite ease-in-out', transformOrigin: '50px 75px' }}>
 {/* Tray Shadow */}
 <path d="M 15 85 L 85 85 L 80 92 L 20 92 Z" fill="#0c4a6e" transform="translate(0, 4)" opacity="0.8" />
 
 {/* Tray Back Wall */}
 <path d="M 20 65 L 80 65 L 85 85 L 15 85 Z" fill="#0369a1" stroke="#075985" strokeWidth="2.5" strokeLinejoin="round" />
 
 {/* Tray Front Wall */}
 <path d="M 15 85 L 85 85 L 80 94 L 20 94 Z" fill="url(#trayGrad)" stroke="#0c4a6e" strokeWidth="2.5" strokeLinejoin="round" />
 
 {/* Tray Lip Highlight */}
 <path d="M 17 87 L 83 87" stroke="#e0f2fe" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
 
 {/* Inner Slot */}
 <rect x="25" y="72" width="50" height="8" rx="4" fill="#082f49" />
 </g>
 
 {/* Animated Arrow */}
 <g style={{ animation: 'arrow-bounce-download 2s infinite ease-in-out', transformOrigin: '50px 35px' }}>
 {/* Arrow Shadow */}
 <polygon points="42,15 58,15 58,50 75,50 50,75 25,50 42,50" fill="#082f49" transform="translate(0, 4)" opacity="0.6" />
 
 {/* Arrow Main Body */}
 <polygon points="42,15 58,15 58,50 75,50 50,75 25,50 42,50" fill="url(#arrowGrad)" stroke="#0c4a6e" strokeWidth="2.5" strokeLinejoin="round" />
 
 {/* Arrow Highlight */}
 <polygon points="44,17 56,17 56,50 67,50 50,68 33,50 44,50" fill="#bae6fd" opacity="0.8" />
 </g>
 </svg>
 </div>
 );
}
