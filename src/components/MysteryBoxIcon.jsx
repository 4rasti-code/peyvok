import React from 'react';

export default function MysteryBoxIcon({ className = "w-16 h-16", isOpen = false, isIdleAnimated = false, asSvg = false, size }) {
 const content = (
 <svg 
 viewBox="0 0 100 100" 
 className={asSvg ? className : "w-full h-full overflow-visible"} 
 width={size} 
 height={size} 
 xmlns="http://www.w3.org/2000/svg"
 >
 <style>
 {`
 .chest-lid {
 transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
 transform-origin: 50px 50px;
 }
 .chest-lid.open {
 transform: translateY(-40px) scale(1.05);
 }
 .chest-padlock {
 transition: all 0.4s ease-in;
 transform-origin: 50px 50px;
 }
 .chest-padlock.open {
 transform: translateY(30px) rotate(45deg);
 opacity: 0;
 }
 .chest-inside-glow {
 transition: opacity 0.8s ease-in 0.2s, transform 0.8s ease-out;
 opacity: 0;
 transform: scale(0.5) translateY(10px);
 }
 .chest-inside-glow.open {
 opacity: 1;
 transform: scale(1) translateY(0);
 }
 @keyframes idleGlowPulse {
 0% { opacity: 0.3; transform: scale(0.95); }
 50% { opacity: 1; transform: scale(1.1); }
 100% { opacity: 0.3; transform: scale(0.95); }
 }
 .chest-idle-glow {
 transform-origin: 50px 50px;
 animation: idleGlowPulse 2s ease-in-out infinite;
 }
 @keyframes padlockShake {
 0%, 80%, 100% { transform: rotate(0deg); }
 82%, 86%, 90%, 94%, 98% { transform: rotate(-4deg); }
 84%, 88%, 92%, 96% { transform: rotate(4deg); }
 }
 .chest-padlock.idle-shake {
 animation: padlockShake 2.5s infinite;
 transform-origin: 50px 50px;
 }
 `}
 </style>
 
 <defs>
 <radialGradient id="boxIdleGlow" cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.8" />
 <stop offset="60%" stopColor="#FFA000" stopOpacity="0.3" />
 <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
 </radialGradient>
 <radialGradient id="boxOpenGlow" cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#fdf4ff" stopOpacity="0.9" />
 <stop offset="30%" stopColor="#d946ef" stopOpacity="0.7" />
 <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
 </radialGradient>
 <path id="magicStar" d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#FFF59D" />
 </defs>

 {/* Shining Thin Stroke Outline (STATIC) */}
 {!isOpen && (
 <path d="M 12 50 C 12 20, 88 20, 88 50 L 88 85 L 12 85 Z" fill="none" stroke="#FFF59D" strokeWidth="1.5" transform="scale(1.05)" transformOrigin="50 50" opacity="0.9" />
 )}

 {/* Idle Animated Glow and Stars */}
 {isIdleAnimated && !isOpen && (
 <g className="chest-idle-glow">
 {/* Golden radial glow behind the box */}
 <circle cx="50" cy="50" r="55" fill="url(#boxIdleGlow)" />
 </g>
 )}

 {/* Main Group (NO Animation) */}
 <g style={{ transformOrigin: '50px 50px' }}>
 
 {/* Dark Brown Outer Silhouette/Border */}
 <path d="M 12 50 C 12 20, 88 20, 88 50 L 88 85 L 12 85 Z" fill="#5c2e16" transform="translate(0, 1) scale(1.03)" transformOrigin="50 50" />
 <path d="M 12 50 C 12 20, 88 20, 88 50 L 88 85 L 12 85 Z" fill="#5c2e16" transform="translate(0, -1) scale(1.03)" transformOrigin="50 50" />
 <path d="M 12 50 C 12 20, 88 20, 88 50 L 88 85 L 12 85 Z" fill="#5c2e16" transform="translate(1, 0) scale(1.03)" transformOrigin="50 50" />
 <path d="M 12 50 C 12 20, 88 20, 88 50 L 88 85 L 12 85 Z" fill="#5c2e16" transform="translate(-1, 0) scale(1.03)" transformOrigin="50 50" />

 {/* ======================================= */}
 {/* INSIDE HOLE (Revealed when open) */}
 {/* ======================================= */}
 <path d="M 15 50 C 15 30, 85 30, 85 50 L 15 50 Z" fill="#2b1408" />
 
 {/* Magic Glow inside (Using radialGradient instead of filter=blur to fix iOS/WebKit rendering bugs) */}
 <ellipse cx="50" cy="40" rx="35" ry="12" fill="url(#boxOpenGlow)" className={`chest-inside-glow ${isOpen ? 'open' : ''}`} />

 {/* ======================================= */}
 {/* BASE (Bottom Rectangle) */}
 {/* ======================================= */}
 <g>
 <rect x="15" y="50" width="70" height="32" fill="#8f4614" />
 <rect x="15" y="60" width="70" height="12" fill="#a15822" />
 
 {/* Base Outline & Planks */}
 <rect x="15" y="50" width="70" height="32" fill="none" stroke="#5c2e16" strokeWidth="2.5" />
 <line x1="15" y1="60" x2="85" y2="60" stroke="#5c2e16" strokeWidth="1.5" />
 <line x1="15" y1="72" x2="85" y2="72" stroke="#5c2e16" strokeWidth="1.5" />

 {/* Wood Grain Highlights */}
 <path d="M 20 66 Q 30 64, 40 66" fill="none" stroke="#b86b2e" strokeWidth="1.5" strokeLinecap="round" />
 <path d="M 60 77 Q 70 75, 80 77" fill="none" stroke="#b86b2e" strokeWidth="1.5" strokeLinecap="round" />
 
 {/* Base Vertical Straps */}
 <rect x="28" y="50" width="8" height="32" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
 <rect x="64" y="50" width="8" height="32" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />

 {/* Strap Highlight lines Base */}
 <rect x="29.5" y="50" width="2" height="32" fill="#fef3c7" stroke="none" />
 <rect x="65.5" y="50" width="2" height="32" fill="#fef3c7" stroke="none" />

 {/* Rivets Base */}
 <circle cx="32" cy="56" r="1.5" fill="#fef3c7" />
 <circle cx="32" cy="66" r="1.5" fill="#fef3c7" />
 <circle cx="32" cy="76" r="1.5" fill="#fef3c7" />

 <circle cx="68" cy="56" r="1.5" fill="#fef3c7" />
 <circle cx="68" cy="66" r="1.5" fill="#fef3c7" />
 <circle cx="68" cy="76" r="1.5" fill="#fef3c7" />
 </g>

 {/* ======================================= */}
 {/* LID (Domed Top) - THIS MOVES */}
 {/* ======================================= */}
 <g className={`chest-lid ${isOpen ? 'open' : ''}`}>
 {/* Lid Base */}
 <path d="M 15 50 C 15 25, 85 25, 85 50 Z" fill="#a15822" />
 
 {/* Wood Planks in Lid */}
 <path d="M 17 40 C 30 35, 70 35, 83 40 L 85 50 L 15 50 Z" fill="#8f4614" />
 <path d="M 22 30 C 35 26, 65 26, 78 30 L 83 40 C 70 35, 30 35, 17 40 Z" fill="#a15822" />
 <path d="M 28 23 C 40 20, 60 20, 72 23 L 78 30 C 65 26, 35 26, 22 30 Z" fill="#b86b2e" />
 
 {/* Planks Outline */}
 <path d="M 15 50 C 15 25, 85 25, 85 50 Z" fill="none" stroke="#5c2e16" strokeWidth="2.5" />
 <path d="M 17 40 C 30 35, 70 35, 83 40" fill="none" stroke="#5c2e16" strokeWidth="1.5" />
 <path d="M 22 30 C 35 26, 65 26, 78 30" fill="none" stroke="#5c2e16" strokeWidth="1.5" />

 {/* Wood Grain Highlights */}
 <path d="M 25 35 Q 35 33, 45 35" fill="none" stroke="#b86b2e" strokeWidth="1.5" strokeLinecap="round" />

 {/* Lid Vertical Straps */}
 <path d="M 28 50 L 36 50 L 36 26.5 C 34 26, 30 26.5, 28 27 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
 <path d="M 64 50 L 72 50 L 72 27 C 70 26.5, 66 26, 64 26.5 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />

 {/* Strap Highlight lines Lid */}
 <rect x="29.5" y="27" width="2" height="23" fill="#fef3c7" stroke="none" />
 <rect x="65.5" y="27" width="2" height="23" fill="#fef3c7" stroke="none" />

 {/* Rivets Lid */}
 <circle cx="32" cy="32" r="1.5" fill="#fef3c7" />
 <circle cx="32" cy="42" r="1.5" fill="#fef3c7" />

 <circle cx="68" cy="32" r="1.5" fill="#fef3c7" />
 <circle cx="68" cy="42" r="1.5" fill="#fef3c7" />

 {/* Center Horizontal Gold Rim - attached to Lid */}
 <rect x="12" y="47" width="76" height="7" rx="1.5" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
 <rect x="12" y="48" width="76" height="1.5" rx="0.5" fill="#fef3c7" opacity="0.8" />
 
 <circle cx="17" cy="50.5" r="1.5" fill="#fef3c7" />
 <circle cx="83" cy="50.5" r="1.5" fill="#fef3c7" />
 </g>

 {/* ======================================= */}
 {/* CENTER PADLOCK - THIS FALLS OFF */}
 {/* ======================================= */}
 <g className={`chest-padlock ${isOpen ? 'open' : ''} ${isIdleAnimated && !isOpen ? 'idle-shake' : ''}`}>
 {/* Padlock Shackle Background (Outline) */}
 <path d="M 44 48 C 44 35, 56 35, 56 48" fill="none" stroke="#6b7280" strokeWidth="5.5" strokeLinecap="round" />
 {/* Padlock Shackle Fill (Silver) */}
 <path d="M 44 48 C 44 35, 56 35, 56 48" fill="none" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />

 {/* Padlock Body (Gold) */}
 <rect x="38" y="45" width="24" height="20" rx="4" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
 {/* Highlight */}
 <rect x="40" y="46.5" width="20" height="3" rx="1.5" fill="#fef3c7" />
 
 {/* Keyhole */}
 <circle cx="50" cy="52" r="2.5" fill="#451a03" />
 <polygon points="48.5,52 51.5,52 52.5,60 47.5,60" fill="#451a03" />
 </g>

 </g>
 </svg>
 );

 if (asSvg) return content;

 return (
 <div className={`relative flex items-center justify-center ${className}`} style={size ? { width: size, height: size } : {}}>
 {content}
 </div>
 );
}
