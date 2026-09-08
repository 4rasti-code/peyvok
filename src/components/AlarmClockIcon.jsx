import React from 'react';

export const AlarmClockIcon = ({ className = "w-6 h-6", isRinging = false }) => {
 return (
 <svg 
 className={`${className} ${isRinging ? 'animate-[wiggle_0.5s_ease-in-out_infinite]' : ''}`} 
 viewBox="0 0 100 100" 
 fill="none" 
 xmlns="http://www.w3.org/2000/svg"
 >
 <defs>
 <linearGradient id="clockBody" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FF6B4A" />
 <stop offset="100%" stopColor="#D8311B" />
 </linearGradient>
 <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FF8B6A" />
 <stop offset="100%" stopColor="#C92915" />
 </linearGradient>
 <linearGradient id="innerFace" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FFFFFF" />
 <stop offset="100%" stopColor="#E5E7EB" />
 </linearGradient>
 <linearGradient id="glossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
 <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
 </linearGradient>
 
 {/* Glow and shadows */}
 <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
 <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.25"/>
 </filter>
 <filter id="innerShadow">
 <feOffset dx="0" dy="2"/>
 <feGaussianBlur stdDeviation="2" result="offset-blur"/>
 <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
 <feFlood floodColor="black" floodOpacity="0.15" result="color"/>
 <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
 <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
 </filter>
 </defs>

 {/* Left Foot */}
 <g transform="translate(32, 82) rotate(25)">
 <rect x="-4" y="0" width="8" height="14" rx="4" fill="#991B1B" filter="url(#shadow)" />
 </g>
 
 {/* Right Foot */}
 <g transform="translate(68, 82) rotate(-25)">
 <rect x="-4" y="0" width="8" height="14" rx="4" fill="#991B1B" filter="url(#shadow)" />
 </g>

 {/* Left Bell */}
 <g transform="translate(28, 28) rotate(-35)">
 <path d="M -16 0 A 16 16 0 0 1 16 0 Z" fill="url(#bellGrad)" filter="url(#shadow)" />
 <rect x="-16" y="-1" width="32" height="3" fill="#991B1B" />
 {/* Bell Gloss */}
 <path d="M -10 -4 A 8 8 0 0 1 0 -12 A 12 12 0 0 0 -10 -4 Z" fill="#FFFFFF" fillOpacity="0.5" />
 </g>

 {/* Right Bell */}
 <g transform="translate(72, 28) rotate(35)">
 <path d="M -16 0 A 16 16 0 0 1 16 0 Z" fill="url(#bellGrad)" filter="url(#shadow)" />
 <rect x="-16" y="-1" width="32" height="3" fill="#991B1B" />
 {/* Bell Gloss */}
 <path d="M -10 -4 A 8 8 0 0 1 0 -12 A 12 12 0 0 0 -10 -4 Z" fill="#FFFFFF" fillOpacity="0.5" />
 </g>

 {/* Hammer */}
 <g transform="translate(50, 15)">
 <rect x="-2" y="0" width="4" height="14" fill="#9CA3AF" />
 <rect x="-6" y="-4" width="12" height="6" rx="2" fill="#E5E7EB" filter="url(#shadow)" />
 </g>

 {/* Main Body Outer */}
 <circle cx="50" cy="55" r="36" fill="url(#clockBody)" filter="url(#shadow)" />
 
 {/* Gloss reflection on main body */}
 <circle cx="45" cy="50" r="28" fill="url(#glossGrad)" />

 {/* Bezel inner rim */}
 <circle cx="50" cy="55" r="28" fill="#991B1B" />
 
 {/* Clock Face */}
 <circle cx="50" cy="55" r="26" fill="url(#innerFace)" filter="url(#innerShadow)" />

 {/* Clock Ticks */}
 <circle cx="50" cy="33" r="1.5" fill="#374151" />
 <circle cx="50" cy="77" r="1.5" fill="#374151" />
 <circle cx="28" cy="55" r="1.5" fill="#374151" />
 <circle cx="72" cy="55" r="1.5" fill="#374151" />

 {/* Hour Hand */}
 <g transform="translate(50, 55) rotate(45)">
 <rect x="-2.5" y="-14" width="5" height="16" rx="2.5" fill="#1F2937" filter="url(#shadow)" />
 </g>

 {/* Minute Hand */}
 <g transform="translate(50, 55) rotate(-30)">
 <rect x="-2" y="-20" width="4" height="22" rx="2" fill="#1F2937" filter="url(#shadow)" />
 </g>

 {/* Center Pin */}
 <circle cx="50" cy="55" r="4.5" fill="#1F2937" filter="url(#shadow)" />
 <circle cx="50" cy="55" r="1.5" fill="#9CA3AF" />
 
 </svg>
 );
};
