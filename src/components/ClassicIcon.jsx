import React from 'react';

const TILES = [
 // Single Row (Right-to-Left Guess: ی م پ ڤ ۆ ک)
 { char: 'ی', base: '#ca8a04', face: '#eab308', x: 152, y: 14, rot: -3, delay: '0s' }, // Pos 1 -> Yellow
 { char: 'م', base: '#4b5563', face: '#6b7280', x: 122, y: 16, rot: 2, delay: '0.1s' }, // Pos 2 -> Gray
 { char: 'پ', base: '#ca8a04', face: '#eab308', x: 92, y: 13, rot: -4, delay: '0.2s' }, // Pos 3 -> Yellow
 { char: 'ڤ', base: '#16a34a', face: '#22c55e', x: 62, y: 15, rot: 3, delay: '0.3s' }, // Pos 4 -> Green
 { char: 'ۆ', base: '#16a34a', face: '#22c55e', x: 32, y: 17, rot: -2, delay: '0.4s' }, // Pos 5 -> Green
 { char: 'ک', base: '#16a34a', face: '#22c55e', x: 2, y: 14, rot: 4, delay: '0.5s' }, // Pos 6 -> Green
];

const STARS = [
 { x: 75, y: 15, delay: '0.3s' }, // From ڤ
 { x: 45, y: 17, delay: '0.4s' }, // From ۆ
 { x: 15, y: 14, delay: '0.5s' }, // From ک
];

export default function ClassicIcon({ className = "w-16 h-16", continuous = false }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes grid-float {
 0%, 100% { transform: translateY(0px) rotate(0deg) translateZ(0); }
 33% { transform: translateY(-3px) rotate(1.5deg) translateZ(0); }
 66% { transform: translateY(3px) rotate(-1.5deg) translateZ(0); }
 }
 @keyframes wordle-jump {
 0%, 75% { transform: translateY(0) rotate(calc(var(--base-rot) * 1deg)); }
 82% { transform: translateY(-14px) rotate(calc(var(--base-rot) * 1deg - 8deg)); }
 88% { transform: translateY(2px) rotate(calc(var(--base-rot) * 1deg + 3deg)); }
 93% { transform: translateY(0) rotate(calc(var(--base-rot) * 1deg)); }
 100% { transform: translateY(0) rotate(calc(var(--base-rot) * 1deg)); }
 }
 @keyframes star-burst {
 0%, 86% { transform: scale(0) rotate(0deg); opacity: 0; }
 88% { transform: scale(1.5) rotate(45deg); opacity: 1; }
 95% { transform: scale(0.5) rotate(120deg); opacity: 0; }
 100% { opacity: 0; }
 }
 
 /* Continuous Loop Animations for Loading Screen */
 @keyframes wordle-jump-continuous {
 0% { transform: translateY(0) rotate(calc(var(--base-rot) * 1deg)); }
 20% { transform: translateY(-14px) rotate(calc(var(--base-rot) * 1deg - 8deg)); }
 40% { transform: translateY(2px) rotate(calc(var(--base-rot) * 1deg + 3deg)); }
 55%, 100% { transform: translateY(0) rotate(calc(var(--base-rot) * 1deg)); }
 }
 @keyframes star-burst-continuous {
 0%, 30% { transform: scale(0) rotate(0deg); opacity: 0; }
 35% { transform: scale(1.5) rotate(45deg); opacity: 1; }
 55% { transform: scale(0.5) rotate(120deg); opacity: 0; }
 100% { opacity: 0; }
 }
 `}
 </style>

 <svg viewBox="0 0 180 50" className="w-full h-full overflow-visible absolute inset-0 z-10" xmlns="http://www.w3.org/2000/svg">
 
 {/* Wordle Tiles */}
 {TILES.map((t, i) => (
 <g 
 key={i}
 style={{ 
 '--base-rot': t.rot, 
 animation: continuous 
 ? `wordle-jump-continuous 2s infinite ${t.delay} ease-in-out`
 : `wordle-jump 5s infinite ${t.delay} ease-in-out`,
 transformOrigin: `${t.x + 13}px ${t.y + 14}px`
 }}
 >
 {/* Base Border / Bottom 3D Depth with thin black stroke */}
 <rect x={t.x - 1} y={t.y - 1} width="28" height="31" rx="7" fill={t.base} stroke="#000000" strokeWidth="0.3" />
 
 {/* Main Face */}
 <rect x={t.x} y={t.y} width="26" height="26" rx="6" fill={t.face} />
 
 {/* Top Edge Reflection (Inset Top) */}
 <path d={`M ${t.x + 2} ${t.y} 
 Q ${t.x} ${t.y} ${t.x} ${t.y + 2} 
 L ${t.x} ${t.y + 4} 
 L ${t.x + 26} ${t.y + 4} 
 L ${t.x + 26} ${t.y + 2} 
 Q ${t.x + 26} ${t.y} ${t.x + 24} ${t.y} Z`} 
 fill="#ffffff" opacity="0.45" />

 {/* Mini Oval Reflection Top Right */}
 <rect x={t.x + 18} y={t.y + 2.5} width="5" height="2.5" rx="1.25" fill="#ffffff" opacity="0.8" />
 
 {/* Kurdish Letter Fill */}
 <text 
 x={t.x + 13} 
 y={t.y + 15} 
 fill="#ffffff" 
 fontSize="15" 
 fontWeight="900" 
 fontFamily="sans-serif" 
 textAnchor="middle" 
 alignmentBaseline="middle" 
 style={{ textShadow: '0px 2px 3px rgba(0,0,0,0.3)' }}
 >
 {t.char}
 </text>
 </g>
 ))}

 {/* Bursting Golden Stars (Winning Row Celebration) */}
 {STARS.map((s, i) => (
 <g key={`star-${i}`} transform={`translate(${s.x}, ${s.y})`}>
 <path 
 d="M 0 -6 L 1.5 -2 L 6 -2 L 2.5 1 L 4 5.5 L 0 3 L -4 5.5 L -2.5 1 L -6 -2 L -1.5 -2 Z"
 fill="#fde047"
 style={{
 animation: continuous
 ? `star-burst-continuous 2s infinite ${s.delay} ease-out`
 : `star-burst 5s infinite ${s.delay} ease-out`,
 transformOrigin: '0 0'
 }}
 />
 </g>
 ))}
 
 </svg>
 </div>
 );
}
