import React from 'react';

export default function BombIcon({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes bomb-shake {
 0%, 100% { transform: rotate(0deg) scale(1); }
 25% { transform: rotate(-4deg) scale(1.02); }
 75% { transform: rotate(4deg) scale(0.98); }
 }
 @keyframes spark-flicker {
 0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
 50% { transform: scale(1.4) rotate(45deg); opacity: 0.8; }
 }
 @keyframes spark-fly {
 0% { transform: translate(0, 0) scale(1); opacity: 1; }
 100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
 }
 `}
 </style>

 <div 
 className="absolute inset-0 z-10 flex items-center justify-center"
 style={{ 
 animation: 'bomb-shake 0.5s infinite ease-in-out',
 willChange: 'transform'
 }}
 >
 <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)] overflow-visible" xmlns="http://www.w3.org/2000/svg">
 
 <g style={{ transformOrigin: '50px 60px' }}>
 
 {/* Fuse Cord */}
 <path d="M50,30 Q65,15 80,20" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
 
 {/* Metal Cap Base */}
 <path d="M40,32 L60,32 L63,38 L37,38 Z" fill="#4b5563" />
 <ellipse cx="50" cy="32" rx="10" ry="3" fill="#6b7280" />
 
 {/* Bomb Body (3D Sphere) */}
 <circle cx="50" cy="65" r="30" fill="#111827" />

 {/* Skull Decal (White paint on the bomb) */}
 <g transform="translate(50, 68) scale(0.6)" fill="#ffffff" opacity="0.7">
 <circle cx="0" cy="-5" r="12" />
 <rect x="-7" y="2" width="14" height="8" rx="2" />
 <circle cx="-5" cy="-5" r="4" fill="#111827" />
 <circle cx="5" cy="-5" r="4" fill="#111827" />
 <polygon points="0,0 -2,4 2,4" fill="#111827" />
 <path d="M-4,7 L-4,10 M0,7 L0,10 M4,7 L4,10" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
 </g>
 
 {/* Bomb Highlight (3D effect) */}
 <ellipse cx="38" cy="52" rx="8" ry="14" fill="#ffffff" opacity="0.15" transform="rotate(-30 38 52)" style={{ filter: 'blur(3px)' }} />

 {/* Spark Center (Explosion spark) */}
 <g transform="translate(80, 20)">
 {/* Flickering Star shape */}
 <g style={{ animation: 'spark-flicker 0.15s infinite alternate', transformOrigin: '0px 0px' }}>
 <polygon points="0,-14 3,-4 14,0 3,4 0,14 -3,4 -14,0 -3,-4" fill="#fef08a" />
 <polygon points="0,-10 2,-2 10,0 2,2 0,10 -2,2 -10,0 -2,-2" fill="#ef4444" />
 <circle cx="0" cy="0" r="4" fill="#ffffff" style={{ filter: 'blur(1px)' }} />
 </g>
 
 {/* Flying Sparks */}
 <circle cx="0" cy="0" r="2.5" fill="#fde047" style={{ '--tx': '25px', '--ty': '-25px', animation: 'spark-fly 0.5s infinite 0s linear' }} />
 <circle cx="0" cy="0" r="2" fill="#ef4444" style={{ '--tx': '30px', '--ty': '10px', animation: 'spark-fly 0.4s infinite 0.2s linear' }} />
 <circle cx="0" cy="0" r="3" fill="#fef08a" style={{ '--tx': '-15px', '--ty': '-30px', animation: 'spark-fly 0.6s infinite 0.4s linear' }} />
 <circle cx="0" cy="0" r="2" fill="#fb923c" style={{ '--tx': '-10px', '--ty': '20px', animation: 'spark-fly 0.45s infinite 0.1s linear' }} />
 </g>

 </g>
 </svg>
 </div>
 </div>
 );
}
