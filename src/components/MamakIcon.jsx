import React from 'react';

const LETTERS = [
 { char: 'م', tx: -30, ty: -35, rot: -45, delay: '0s' },
 { char: 'پ', tx: 30, ty: -25, rot: 30, delay: '0.6s' },
 { char: 'ۆ', tx: -15, ty: -45, rot: -15, delay: '1.2s' },
 { char: 'ک', tx: 35, ty: -40, rot: 50, delay: '1.8s' },
 { char: 'ی', tx: -35, ty: -20, rot: -60, delay: '2.4s' },
 { char: 'ا', tx: 15, ty: -50, rot: 20, delay: '3.0s' },
];

export default function MamakIcon({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes parzink-float {
 0%, 100% { transform: translateY(0px) rotate(0deg); }
 50% { transform: translateY(-4px) rotate(2deg); }
 }
 @keyframes question-pulse {
 0%, 100% { transform: scale(1); opacity: 0.9; }
 50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0px 0px 4px rgba(253,224,71,0.8)); }
 }
 @keyframes letter-fly {
 0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
 15% { opacity: 1; }
 100% { transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(var(--trot)); opacity: 0; }
 }
 `}
 </style>

 <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)] overflow-visible absolute inset-0 z-10" xmlns="http://www.w3.org/2000/svg">
 
 <g style={{ transformOrigin: '50px 70px' }}>
 
 {/* Inside the dark bag opening */}
 <path d="M32,35 Q50,28 68,35 Q50,42 32,35 Z" fill="#450a0a" />
 <path d="M32,35 Q50,28 68,35" fill="none" stroke="#78350f" strokeWidth="2" />

 {/* Flying Letters */}
 {LETTERS.map((l, i) => (
 <text 
 key={i}
 x="50" 
 y="44" 
 fill="#ffffff" 
 fontSize="14" 
 fontWeight="900" 
 fontFamily="sans-serif" 
 textAnchor="middle" 
 alignmentBaseline="middle" 
 style={{ 
 '--tx': `${l.tx}px`, 
 '--ty': `${l.ty}px`, 
 '--trot': `${l.rot}deg`,
 animation: `letter-fly 5s infinite ${l.delay} ease-out`,
 textShadow: '0px 1px 2px rgba(0,0,0,0.5)'
 }}
 >
 {l.char}
 </text>
 ))}

 {/* Front Body of Parzink (Rug/Kilim fabric) */}
 <path d="M32,35 Q50,42 68,35 C70,50 74,65 74,75 C74,82 26,82 26,75 C26,65 30,50 32,35 Z" fill="#b91c1c" stroke="#ffffff" strokeWidth="0.5" />

 {/* Woven Rim at the Mouth (Beautiful finished edge) */}
 <path d="M32,35 Q50,42 68,35" fill="none" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
 <path d="M32,35 Q50,42 68,35" fill="none" stroke="#1e3a8a" strokeWidth="1" strokeDasharray="2 2" strokeLinecap="round" />

 {/* Woven Strap (Handle hanging downwards in front) */}
 <path d="M32,35 C20,85 80,85 68,35" fill="none" stroke="#1e3a8a" strokeWidth="5" strokeLinecap="round" />
 <path d="M32,35 C20,85 80,85 68,35" fill="none" stroke="#fde047" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />

 {/* Tassels (Rishik - Traditional fringes at the bottom) */}
 <path d="M28,78 L26,90 M40,80 L39,92 M50,80 L50,93 M60,80 L61,92 M72,78 L74,90" fill="none" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
 <path d="M34,79 L33,91 M45,80 L45,92 M55,80 L55,92 M66,79 L67,91" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

 {/* Decorative Woven Borders (Top and Bottom) */}
 <path d="M29,45 C40,48 60,48 71,45" fill="none" stroke="#fde047" strokeWidth="2" />
 <path d="M28.5,49 C40,52 60,52 71.5,49" fill="none" stroke="#1e3a8a" strokeWidth="2" />
 <path d="M27.5,66 C40,69 60,69 72.5,66" fill="none" stroke="#fde047" strokeWidth="2" />
 <path d="M27,70 C40,73 60,73 73,70" fill="none" stroke="#1e3a8a" strokeWidth="2" />

 {/* Center Diamond (Gul) with Question Mark */}
 <g style={{ transformOrigin: '50px 57px' }}>
 <polygon points="50,46 62,57 50,68 38,57" fill="#fde047" />
 <polygon points="50,49 58,57 50,65 42,57" fill="#1e3a8a" />
 <text x="50" y="58" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" alignmentBaseline="middle">?</text>
 </g>

 </g>
 </svg>
 </div>
 );
}
