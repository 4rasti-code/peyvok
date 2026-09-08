import React from 'react';
import { motion as Motion } from 'framer-motion';

/**
 * High-Fidelity Kurdish & Ayyubid Historical Currency Icons
 * Refined to match real medieval hammered coin references.
 * 
 * 1. Fils (Bronze - Marwanid Eagle)
 * 2. Derhem (Silver - Square-in-Circle Seljuk style)
 * 3. Dinar (Gold - Ayyubid Concentric Dinar)
 */

// Shared "Hammered" coin base with irregular hand-struck edges
const HammeredBase = ({ fill, stroke, opacity = 1 }) => (
 <path
 d="M50 4.5C28 3.5 6 12 5 35C4 58 13 88 40 95C67 102 96 87 95 60C94 33 82 5.5 50 4.5Z"
 fill={fill}
 stroke={stroke}
 strokeWidth="3"
 fillOpacity={opacity}
 />
);

export const FilsIcon = ({ className = "", size = 24 }) => (
 <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: 'visible' }}>
 <image href="/icons/FilsIcon.svg" width="100" height="100" preserveAspectRatio="xMidYMid meet" />
 </svg>
);

export const DerhemIcon = ({ className = "", size = 24 }) => (
 <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: 'visible' }}>
 <image href="/icons/DerhemIcon.svg" width="100" height="100" preserveAspectRatio="xMidYMid meet" />
 </svg>
);

export const DinarIcon = ({ className = "", size = 24 }) => (
 <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: 'visible' }}>
 <image href="/icons/DinarIcon.svg" width="100" height="100" preserveAspectRatio="xMidYMid meet" />
 </svg>
);

// High-Fidelity PowerUp Icons

export const HintIcon = ({ className = "", size = 24, animate = false, disabled = false }) => (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={disabled ? "#9CA3AF" : "white"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
 {animate && !disabled && (
 <style>
 {`
 .search-glow { animation: pulseGlow 1.5s infinite alternate ease-in-out; }
 @keyframes pulseGlow {
 0% { filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.4)); transform: scale(1); }
 100% { filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)); transform: scale(1.1); }
 }
 `}
 </style>
 )}
 <circle cx="10" cy="10" r="6.5" className={animate && !disabled ? "search-glow" : ""} />
 <line x1="21" y1="21" x2="15" y2="15" className={animate && !disabled ? "search-glow" : ""} />
 </svg>
);

export const MagnetIcon = ({ className = "", size = 24, animate = false, disabled = false }) => (
 <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={disabled ? "#9CA3AF" : "white"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
 {animate && !disabled && (
 <style>
 {`
 .target-pulse { animation: targetAnim 1s infinite alternate ease-in-out; }
 @keyframes targetAnim {
 0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3)); }
 100% { transform: scale(1.1); filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6)); }
 }
 `}
 </style>
 )}
 <circle cx="12" cy="12" r="9" strokeWidth="2.5" className={animate && !disabled ? "target-pulse" : ""} style={{ transformOrigin: "center" }} />
 <circle cx="12" cy="12" r="4.5" strokeWidth="2.5" className={animate && !disabled ? "target-pulse" : ""} style={{ transformOrigin: "center" }} />
 <circle cx="12" cy="12" r="1.5" fill={disabled ? "#9CA3AF" : "white"} stroke="none" className={animate && !disabled ? "target-pulse" : ""} style={{ transformOrigin: "center" }} />
 
 {/* Arrow piercing the target */}
 <g className={animate && !disabled ? "target-pulse" : ""} style={{ transformOrigin: "center" }}>
 <line x1="3" y1="3" x2="11" y2="11" />
 <polyline points="7 11 11 11 11 7" />
 <line x1="1" y1="5" x2="5" y2="1" />
 </g>
 </svg>
);

export const SkipIcon = ({ className = "", size = 24, animate = false, disabled = false }) => (
 <svg width={size} height={size} viewBox="0 0 24 24" fill={disabled ? "#9CA3AF" : "white"} className={className}>
 {animate && !disabled && (
 <style>
 {`
 .skip-pulse { animation: skipAnim 1.5s infinite ease-in-out; }
 .skip-pulse-2 { animation-delay: 0.15s; }
 @keyframes skipAnim {
 0%, 100% { transform: translateX(0); opacity: 1; }
 50% { transform: translateX(3px); opacity: 0.7; }
 }
 `}
 </style>
 )}
 <path d="M5 6 L13 12 L5 18 Z" className={animate && !disabled ? "skip-pulse" : ""} />
 <path d="M13 6 L21 12 L13 18 Z" className={animate && !disabled ? "skip-pulse skip-pulse-2" : ""} />
 <rect x="20" y="6" width="2.5" height="12" rx="0.5" />
 </svg>
);

export const PowerUpBadge = ({ type, className = "", size = 40, animate = false }) => {
 const colors = {
 magnet: { from: '#D489FF', to: '#B352FF', shadow: '#9A32DF' },
 hint: { from: '#FFA756', to: '#F27D26', shadow: '#D96614' },
 skip: { from: '#6EC6FF', to: '#39A4F8', shadow: '#2386D4' }
 };
 const c = colors[type];
 if (!c) return null;
 const numSize = typeof size === 'number' ? size : 40;
 
 const w = 40;
 const h = 40;
 
 return (
 <svg width={numSize} height={numSize} viewBox={`0 0 ${w} ${h}`} className={className} style={{ overflow: 'visible' }}>
 <defs>
 <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={c.from} />
 <stop offset="100%" stopColor={c.to} />
 </linearGradient>
 </defs>
 
 <rect x="0" y="0" width={w} height={h} rx={h/2} fill={`url(#grad-${type})`} style={{ filter: `drop-shadow(0px 3px 0px ${c.shadow}) drop-shadow(0px 4px 4px rgba(0,0,0,0.15))` }} />
 
 {/* Inner Icon */}
 <svg x={w/2 - 12} y={h/2 - 12} width="24" height="24" viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
 {type === 'hint' && <HintIcon size={24} animate={animate} />}
 {type === 'magnet' && <MagnetIcon size={24} animate={animate} />}
 {type === 'skip' && <SkipIcon size={24} animate={animate} />}
 </svg>
 </svg>
 );
};

export const XPIcon = ({ className = "", size = 24, disabled = false }) => (
 <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Glow */}
 <circle cx="50" cy="50" r="40" fill={disabled ? "#4B5563" : "#FBBF24"} opacity="0.2" filter="blur(8px)" />
 {/* Star Outer */}
 <path d="M50 10L62 38L90 38L66 55L75 85L50 68L25 85L34 55L10 38L38 38L50 10Z" fill={disabled ? "#6B7280" : "#F59E0B"} stroke={disabled ? "#374151" : "#D97706"} strokeWidth="3" strokeLinejoin="round" />
 {/* Star Inner Highlight */}
 <path d="M50 20L58 41L80 41L61 55L68 76L50 63L32 76L39 55L20 41L42 41L50 20Z" fill={disabled ? "#9CA3AF" : "#FCD34D"} />
 </svg>
);

// Achievement SVGs
export const Level10Icon = ({ className = "", size = 24, disabled = false, _isShining = false, _isUnclaimed = false }) => (
 <Motion.svg
 width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}
 style={{ overflow: "visible" }}
 >
 {/* Base Shadow */}
 <path d="M 50 13 Q 75 18 85 23 C 85 63 70 88 50 99 C 30 88 15 63 15 23 Q 25 18 50 13 Z" fill={disabled ? "#1F2937" : "#1E293B"} opacity="0.6" />

 {/* Metallic Rim (Outer) */}
 <path d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z" fill={disabled ? "#4B5563" : "#64748B"} />

 {/* Metallic Rim (Bevel Shadow) */}
 <path d="M 50 12 Q 74 17 83 21 C 83 59 69 83 50 93 C 31 83 17 59 17 21 Q 26 17 50 12 Z" fill={disabled ? "#374151" : "#475569"} />

 {/* Magical Orbiting Blue Beam (Only active when unclaimed/shining) */}
 {!disabled && (
 <g style={{ filter: "drop-shadow(0 0 8px #94A3B8)" }}>
 {/* Fading Trailing Glow (Multiple layered paths for gradient fade-out) */}
 <g stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none">
 {/* Faint Long Tail */}
 <path d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z" pathLength="100" strokeDasharray="25 75" opacity="0.15">
 <animate attributeName="stroke-dashoffset" values="0;-100" dur="4.5s" repeatCount="indefinite" />
 </path>
 {/* Medium Mid Tail */}
 <path d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z" pathLength="100" strokeDasharray="17 83" opacity="0.35">
 <animate attributeName="stroke-dashoffset" values="-8;-108" dur="4.5s" repeatCount="indefinite" />
 </path>
 {/* Bright Base Glow (Under the core beam) */}
 <path d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z" pathLength="100" strokeDasharray="10 90" opacity="0.8">
 <animate attributeName="stroke-dashoffset" values="-15;-115" dur="4.5s" repeatCount="indefinite" />
 </path>
 </g>

 {/* Fading Bright Core Beam (White/Silver) */}
 <g stroke="#F1F5F9" strokeWidth="1.5" strokeLinecap="round" fill="none">
 {/* Faint White Tail */}
 <path d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z" pathLength="100" strokeDasharray="8 92" opacity="0.2">
 <animate attributeName="stroke-dashoffset" values="-17;-117" dur="4.5s" repeatCount="indefinite" />
 </path>
 {/* Medium White Tail */}
 <path d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z" pathLength="100" strokeDasharray="5 95" opacity="0.4">
 <animate attributeName="stroke-dashoffset" values="-20;-120" dur="4.5s" repeatCount="indefinite" />
 </path>
 {/* Brightest White Tip */}
 <path d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z" pathLength="100" strokeDasharray="2 98" opacity="1">
 <animate attributeName="stroke-dashoffset" values="-23;-123" dur="4.5s" repeatCount="indefinite" />
 </path>
 </g>

 {/* Scraping Sparks Trail (Dynamic SVG Particle System) */}
 <g strokeLinecap="round">
 {[
 { o: 1.2, c: "#FFFFFF", w: 1.0, x: 4, y: -3, d: 0.20 },
 { o: 1.4, c: "#E2E8F0", w: 0.8, x: -5, y: 4, d: 0.15 },
 { o: 1.1, c: "#94A3B8", w: 1.2, x: 6, y: 5, d: 0.25 },
 { o: 1.5, c: "#FFFFFF", w: 0.7, x: -3, y: -6, d: 0.10 },
 { o: 1.3, c: "#E2E8F0", w: 1.1, x: 7, y: 2, d: 0.30 },
 { o: 1.6, c: "#94A3B8", w: 0.9, x: -6, y: -4, d: 0.22 },
 { o: 1.2, c: "#FFFFFF", w: 1.0, x: 2, y: 7, d: 0.18 },
 { o: 1.4, c: "#E2E8F0", w: 0.8, x: 5, y: -5, d: 0.27 },
 { o: 1.1, c: "#94A3B8", w: 1.3, x: -4, y: 6, d: 0.12 },
 { o: 1.7, c: "#FFFFFF", w: 0.6, x: -7, y: 3, d: 0.35 },
 { o: 1.3, c: "#E2E8F0", w: 1.0, x: 3, y: -7, d: 0.20 },
 { o: 1.5, c: "#94A3B8", w: 0.8, x: 8, y: -2, d: 0.15 }
 ].map((spark, i) => (
 <path
 key={i}
 d="M 50 10 Q 75 15 85 20 C 85 60 70 85 50 96 C 30 85 15 60 15 20 Q 25 15 50 10 Z"
 fill="none" stroke={spark.c} strokeWidth={spark.w} opacity="0" pathLength="100" strokeDasharray={`0.2 99.8`}
 >
 <animate attributeName="stroke-dashoffset" values={`${-25 + spark.o};${-125 + spark.o}`} dur="4.5s" repeatCount="indefinite" />
 <animateTransform attributeName="transform" type="translate" values={`0,0; ${spark.x},${spark.y}`} dur="0.5s" begin={`${spark.d}s`} repeatCount="indefinite" />
 <animate attributeName="opacity" values="0; 1; 0" dur="0.5s" begin={`${spark.d}s`} repeatCount="indefinite" />
 </path>
 ))}
 </g>
 </g>
 )}

 {/* Wooden Core */}
 <path d="M 50 16 Q 71 20 78 24 C 78 57 66 79 50 88 C 34 79 22 57 22 24 Q 29 20 50 16 Z" fill={disabled ? "#4B5563" : "#5C4033"} />

 {/* Wooden Planks (Vertical Lines) */}
 <g stroke={disabled ? "#374151" : "#3E2723"} strokeWidth="1.5" opacity="0.8">
 <line x1="32" y1="26" x2="32" y2="64" />
 <line x1="41" y1="22" x2="41" y2="78" />
 <line x1="50" y1="18" x2="50" y2="86" />
 <line x1="59" y1="22" x2="59" y2="78" />
 <line x1="68" y1="26" x2="68" y2="64" />
 </g>

 {/* Inner Edge Depth Shadow (Makes the wood look recessed into the metal) */}
 <path d="M 50 16 Q 71 20 78 24 C 78 57 66 79 50 88 C 34 79 22 57 22 24 Q 29 20 50 16 Z" fill="none" stroke="#000000" strokeWidth="5" opacity="0.4" style={{ filter: "blur(2px)" }} />

 {/* Center Metallic Sun Emblem (Sharp, smaller, inside wood) */}
 <g style={{ opacity: disabled ? 0.5 : 1 }}>
 {/* Sun Rays (Sharp spikes) */}
 <g fill={disabled ? "#4B5563" : "#64748B"}>
 {[...Array(21)].map((_, i) => (
 <path key={i} d="M 48.5 42 L 51.5 42 L 50 28 Z" transform={`rotate(${i * (360 / 21)} 50 50)`} />
 ))}
 </g>

 {/* Sun Core Bevel Shadow */}
 <circle cx="50" cy="50" r="10" fill={disabled ? "#374151" : "#475569"} />

 {/* Sun Core Main */}
 <circle cx="50" cy="50" r="8" fill={disabled ? "#4B5563" : "#64748B"} />

 {/* Sun Core Highlight */}
 <circle cx="50" cy="48.5" r="6" fill={disabled ? "#6B7280" : "#94A3B8"} opacity="0.6" />
 </g>

 {/* 3D Wood Depth & Sun Lighting (Applied globally to both) */}
 <path d="M 50 16 Q 71 20 78 24 C 78 57 66 79 50 88 L 50 16 Z" fill="#000000" opacity="0.25" />
 <path d="M 50 16 Q 29 20 22 24 C 22 57 34 79 50 88 L 50 16 Z" fill="#FFFFFF" opacity="0.05" />

 {/* Rivets on the Metallic Rim (Drawn last to sit on top) */}
 <g fill={disabled ? "#6B7280" : "#94A3B8"}>
 <circle cx="50" cy="13.5" r="1.5" />
 <circle cx="32" cy="16" r="1.5" />
 <circle cx="68" cy="16" r="1.5" />
 <circle cx="19" cy="28" r="1.5" />
 <circle cx="81" cy="28" r="1.5" />
 <circle cx="21" cy="45" r="1.5" />
 <circle cx="79" cy="45" r="1.5" />
 <circle cx="26" cy="62" r="1.5" />
 <circle cx="74" cy="62" r="1.5" />
 <circle cx="35" cy="78" r="1.5" />
 <circle cx="65" cy="78" r="1.5" />
 <circle cx="50" cy="91" r="1.5" />
 </g>
 </Motion.svg>
);

const sunPaths = ["M248,52.5c5.8,15.6,15.7,35,26.2,47L248,90l-26.2,9.5C232.3,87.5,242.2,68.1,248,52.5z", "M260.5,54.4c0.9,16.6,4.7,38.1,11.1,52.6l-22.2-16.8l-27.8,1.3C235.2,83.2,250.3,67.6,260.5,54.4z", "M271.9,59.9c-4,16.2-6.8,37.8-4.9,53.6l-16.3-22.6L223.8,84C239.2,80,258.3,69.5,271.9,59.9z", "M281.2,68.5c-8.6,14.3-17.6,34.1-20.4,49.8l-8.9-26.3l-23.7-14.5C244,78.1,265.4,73.7,281.2,68.5z", "M287.5,79.5c-12.4,11.1-26.8,27.4-34.2,41.5l-0.7-27.8l-18.4-20.9C249.2,77.7,270.9,79.8,287.5,79.5z", "M290.3,91.8c-15.1,6.9-33.7,18.3-44.9,29.6l7.5-26.8l-11.4-25.4C254.3,78.8,274.3,87.2,290.3,91.8z", "M289.4,104.5c-16.5,2.2-37.6,7.5-51.7,15l15-23.4l-3.4-27.6C258.8,81.4,275.5,95.3,289.4,104.5z", "M284.8,116.2c-16.4-2.8-38.2-3.9-53.8-0.9l21.3-17.9l4.9-27.4C262.3,85.2,274.1,103.4,284.8,116.2z", "M276.9,126.2c-14.9-7.5-35.3-15-51.1-16.7l25.6-10.9l12.7-24.7C264.6,89.8,270.5,110.8,276.9,126.2z", "M266.4,133.3c-12-11.6-29.3-24.7-44-31l27.7-2.8l19.5-19.9C265.3,95,264.8,116.7,266.4,133.3z", "M254.3,137c-8.1-14.6-20.7-32.3-32.9-42.6l27.3,5.5l24.4-13.3C264.6,100.1,257.7,120.7,254.3,137z", "M241.6,137c-3.4-16.3-10.3-36.9-18.9-50.4l24.5,13.3l27.3-5.5C262.3,104.8,249.7,122.4,241.6,137z", "M229.5,133.3c1.6-16.6,1.1-38.3-3.2-53.7l19.5,19.9l27.7,2.8C258.8,108.6,241.5,121.7,229.5,133.3z", "M219.1,126.2c6.4-15.4,12.3-36.3,12.8-52.3l12.7,24.7l25.6,10.9C254.3,111.2,233.9,118.6,219.1,126.2z", "M211.2,116.2c10.6-12.8,22.5-31.1,27.6-46.2l4.9,27.4l21.3,17.9C249.3,112.3,227.6,113.5,211.2,116.2z", "M206.5,104.5c13.9-9.1,30.6-23.1,40-36l-3.4,27.6l15,23.4C244.1,112,223,106.6,206.5,104.5z", "M205.6,91.8c16-4.6,36.1-13,48.8-22.6L243,94.6l7.5,26.8C239.3,110.1,220.7,98.8,205.6,91.8z", "M208.4,79.5c16.7,0.3,38.3-1.8,53.3-7.2l-18.4,20.9l-0.7,27.8C235.2,106.9,220.8,90.6,208.4,79.5z", "M214.7,68.5c15.8,5.2,37.1,9.6,53.1,8.9l-23.7,14.6l-8.9,26.3C232.3,102.6,223.3,82.8,214.7,68.5z", "M224,59.9c13.6,9.6,32.7,20.1,48.1,24.1l-26.9,6.9l-16.3,22.5C230.8,97.6,228,76.1,224,59.9z", "M235.4,54.4c10.1,13.2,25.3,28.8,38.9,37.2l-27.8-1.3L224.3,107C230.8,92.5,234.5,71,235.4,54.4z"];

export const PahlawanIcon = ({ className = "", size = 24, disabled = false, isBadge = false }) => {
 return (
 <div
 className={`relative flex items-center justify-center ${className}`}
 style={{ width: size, height: size }}
 >
 <div className={`absolute inset-0 flex items-center justify-center ${isBadge ? 'scale-[1.6]' : ''}`}>
 {/* T-SHAPED GLOW BEHIND THE IMAGE */}
 {/* Used ellipses to tightly fit the hammer shape without hitting the SVG square alpha bounds */}
 {!disabled && (
 <svg viewBox="0 0 100 100" className="absolute w-full h-full z-0 pointer-events-none" style={{ overflow: 'visible' }}>
 <defs>
 <radialGradient id="pahlawan-glow" cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#EAB308" stopOpacity="0.8" />
 <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.4" />
 <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
 </radialGradient>
 </defs>
 <Motion.g
 animate={{ opacity: [0.7, 1, 0.7] }}
 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
 style={{ transformOrigin: "50% 50%" }}
 >
 {/* Hammer Silhouette Glow to perfectly match the shape */}
 <path
 d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z"
 fill="#EAB308"
 style={{ filter: "blur(20px)" }}
 transform="scale(0.2)"
 />
 </Motion.g>
 </svg>
 )}

 {/* T-SHAPED GLOW BEHIND THE IMAGE */}
 {/* Used ellipses to tightly fit the hammer shape without hitting the SVG square alpha bounds */}
 {!disabled && (
 <svg viewBox="0 0 100 100" className="absolute w-full h-full z-0 pointer-events-none" style={{ overflow: 'visible' }}>
 <defs>
 <radialGradient id="pahlawan-glow" cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#EAB308" stopOpacity="0.8" />
 <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.4" />
 <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
 </radialGradient>
 </defs>
 <Motion.g
 animate={{ opacity: [0.7, 1, 0.7] }}
 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
 style={{ transformOrigin: "50% 50%" }}
 >
 {/* Hammer Silhouette Glow to perfectly match the shape */}
 <path
 d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z"
 fill="#EAB308"
 style={{ filter: "blur(20px)" }}
 transform="scale(0.2)"
 />
 </Motion.g>
 </svg>
 )}

 <img
 src="/icons/pahlawan.svg?v=8"
 alt="Pahlawan"
 className="z-10 relative"
 style={{
 width: '100%',
 height: '100%',
 maxWidth: '100%',
 filter: disabled ? 'grayscale(100%) opacity(50%)' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
 }}
 />

 {/* Orbiting Energy Beam Overlay & Glowing God of War Runes */}
 <svg viewBox="0 0 500 500" className="absolute z-20 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>

 {/* Animated Sun in Center */}
 <g transform="translate(248, 95) scale(0.6) translate(-248, -95)">
 <Motion.g
 style={{ transformOrigin: "248px 95px" }}
 animate={disabled ? {} : { rotate: 360 }}
 transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
 >
 {/* Base Sun */}
 <g fill="#FBBF24" opacity={0.4}>
 <circle cx="248" cy="95" r="20" />
 {sunPaths.map((d, i) => <path key={'sun' + i} d={d} />)}
 </g>
 {/* Glowing Sun Syncing with God of War Pulse */}
 <Motion.g
 fill="#FDE047"
 style={{ filter: "drop-shadow(0 0 15px #FDE047) drop-shadow(0 0 5px #FFFFFF)" }}
 animate={disabled ? { opacity: 0 } : { opacity: [0, 0, 1, 0, 0] }}
 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", times: [0, 0.40, 0.50, 0.65, 1] }}
 >
 <circle cx="248" cy="95" r="20" />
 {sunPaths.map((d, i) => <path key={'glow' + i} d={d} />)}
 </Motion.g>
 </Motion.g>
 </g>

 {/* God of War: Sequentially Glowing Runes */}
 <g fill="#FFFBEB" style={{ filter: disabled ? "drop-shadow(0 0 2px #475569)" : "drop-shadow(0 0 10px #FDE047) drop-shadow(0 0 20px #F59E0B)" }}>
 {[{ "d": "M354.1,73.1c5.8-5.8,12.4-8.2,17.6-3c1.7,1.7,3,3.7,3.8,6.3l-1.2,0.5c-0.8-1.6-1.7-2.9-2.6-3.8c-4.2-4.2-10.2-1.8-15.5,3.5c-2.5,2.5-4.5,5.2-6.3,8.1c-0.7,1.2-1.4,2.4-1.9,3.6c-0.1,0.2,0,0.4,0,0.4c1,1,4.1,2,7.3,3.1c0.4,1.4,0.7,2.7,0.8,4l-0.1,0.1c-2.7-0.7-6.4-2.2-8.5-4.3c-1.6-1.6-2-3-2.4-4.6C345.9,84,349.9,77.3,354.1,73.1z M347.5,66.5c1.7,0,3.1-0.1,4.6-0.3c0.2,1.3,0.3,2.6,0.3,3.7c-1.5,0.2-2.9,0.2-4.6,0.1C347.6,68.6,347.5,67.6,347.5,66.5z M340.4,65.3c1.7,0,3.1-0.1,4.6-0.3c0.2,1.3,0.3,2.6,0.3,3.7c-1.5,0.2-2.9,0.2-4.6,0.1C340.5,67.4,340.4,66.4,340.4,65.3z M343.7,70.8c1.7,0,3.1-0.1,4.6-0.3c0.2,1.3,0.3,2.6,0.3,3.7c-1.5,0.2-2.9,0.2-4.6,0.1C343.8,72.9,343.7,72,343.7,70.8z", "times": [0, 0.3, 0.35, 0.45, 1], "op": [0, 0, 1, 0, 0] }, { "d": "M421.6,63.2c1.1-1.8,1.3-3,0.8-3.5c-0.8-0.8-2.3-1.3-4-1.5c-1.7-0.2-3.3-0.1-3.9,0.5c-1.5,1.5,3.1,5.8,3.4,8c0,0.9-0.2,1.7-1.2,2.7c-0.9,0.9-3.1,1.8-4.6,1.8c-3.3-0.1-7.2-1.5-9.5-3.8c-4-4-3.3-8.7,0.4-12.3c1.6-1.6,3.3-2.6,5.2-3.3l0.4,0.9c-1.5,0.8-2.7,1.6-3.6,2.5c-3.3,3.3-2.8,7.2,0.1,10.1c1.1,1.1,3.3,2.5,6.1,3.2c1.8,0.4,3.6,0.7,3.9,0.4c0.5-0.5-0.3-2.2-1.6-3.8c-1.3-1.7-2.2-3.3-2.1-4.2c0-0.8,0.2-1.5,0.9-2.2c1.7-1.7,4-2.5,6.4-2.5c2.5,0,5.5,0.6,6.7,1.8c0.6,0.6,0.7,1.2,0.3,2.2c-0.3,0.9-0.7,1.6-1.2,2c-0.4,0.4-1.7,0.9-2.6,1.2L421.6,63.2z", "times": [0, 0.33, 0.38, 0.48, 1], "op": [0, 0, 1, 0, 0] }, { "d": "M416.1,127.7c-1.4-1.4-2.1-2.9-1.6-4.2c0.1-0.4,0.4-0.7,0.7-1.1c0.9-0.9,2.1-1.5,3.3-1.5c1,0,1.8,0.2,2.4,0.8c1,1,0.9,2.6-0.1,4.7c-0.5,1.1-1.2,2.2-2.4,3.4c-0.8,0.8-1.4,1.2-2.3,1.3c-1.5-0.3-2.5-0.9-3.6-1.5c-1.8-1-4-2.5-5.5-4c-1.7-1.7-2.8-3.4-3.2-5.1c-0.4-1.8,0-3.6,1.5-5.1c1-1,2.2-1.8,3.7-2.2l0.3,0.7c-0.9,0.5-1.7,1-2.2,1.5c-1.1,1.1-1.5,2.7-1.1,4.3c0.4,1.6,1.6,3.1,3.1,4.7c1.4,1.4,3,2.6,4.7,3.6c0.7,0.4,1.4,0.8,2.2,1.1c0.4,0.2,1.2,0.5,1.4,0.3c0.1-0.1,0.2-0.2,0.2-0.3C417,128.6,416.6,128.2,416.1,127.7z M419,123c-0.8-0.8-2.1-0.8-2.5-0.4c-1,1,0.3,2.8,2.2,4.8C419.6,126,420,124,419,123z M420.2,119.7c0-1-0.1-1.8-0.2-2.7c0.8-0.1,1.5-0.2,2.1-0.2c0.1,0.9,0.1,1.7,0.1,2.7C421.4,119.6,420.9,119.7,420.2,119.7z M422.7,121.9c0-1-0.1-1.8-0.2-2.7c0.8-0.1,1.5-0.2,2.1-0.2c0.1,0.9,0.1,1.7,0.1,2.7C423.9,121.8,423.4,121.9,422.7,121.9z M423.4,117.8c0-1-0.1-1.8-0.2-2.7c0.8-0.1,1.5-0.2,2.1-0.2c0.1,0.9,0.1,1.7,0.1,2.7C424.7,117.7,424.1,117.8,423.4,117.8z", "times": [0, 0.37, 0.42, 0.52, 1], "op": [0, 0, 1, 0, 0] }, { "d": "M142.1,91c3.3,3.3,4.6,7.6,0.8,11.4c-1.8,1.8-4.1,2.7-6.6,3c-2.7,0.1-5-0.4-6.3-1.7c-1.6-1.6-2-4.3-1.1-7.4c0.9-3,2.8-6.4,5.9-9.5c2.6-2.6,5.7-4.4,9.5-5.2c6.3-1.3,10.2-0.4,12.5,1.9c2.6,2.6,4.4,6.1,5.3,10.8l-1.3,0.5c-0.7-2.1-1.8-3.7-3.1-5c-2.8-2.8-7.1-4.2-12.5-3.9c-2.6,0.1-5.4,0.6-7.3,2C139.4,88.7,140.8,89.7,142.1,91z M134.5,101.1c1.3,1.3,4.6,1.7,5.6,0.6c1.7-1.7,0.5-5.4-1.8-7.7c-1.1-1.1-2.3-2-3.5-2.8C132.7,94.8,132.1,98.7,134.5,101.1z M115.2,110.9c5.5-0.4,8.7-0.9,10.1-1.7l0.8,0.3c-0.8,1.1-1.1,4.4-0.6,10.3l-3.4,2.1l-0.2-0.2c0-4.7,0.2-7.7,0.6-9.2l-0.1-0.1c-1.8,0.6-4.6,1.1-8.8,1.3C114.1,112.8,114.6,111.8,115.2,110.9z", "times": [0, 0.85, 0.9, 0.98, 1], "op": [0, 0, 1, 0, 0] }, { "d": "M76.1,104.3c0.9,1.2,3,2.1,6.2,2.8c-0.1,0.8-0.2,1.6-0.3,2.5c3,2.7,5.8,5.5,8.6,8.2c1.2,1.2,2.7,4,3,6.1c-0.9,4-3.4,7.6-5.6,9.8c-2.6,2.6-5,3.5-7.3,3.3c-2-0.2-3.6-1.2-4.9-2.5c-1.7-1.7-2.8-3.5-3.4-5.5l0.9-0.4c0.5,1.1,1.1,2.1,2,3c1.8,1.8,3.6,2.5,5.7,1.9c1.8-0.4,3.3-1.5,4.6-2.8c2-2,3.9-4.6,5.1-8.3c0.3-0.8-0.1-1.3-2.2-3.4c-2.2-2.2-5.4-5-8.6-7.9c-1.2-1.1-2.3-1.9-3-2.5c-0.9-0.9-1.2-1.6-1.2-2.4c0-0.7,0-1.4,0.1-2L76.1,104.3z M76.5,116.5l-0.3,0.1c-0.7,1.6-0.8,3-0.2,4.1l1.6-1.6c1.4-1.4,2.6-1.4,3.5-0.5c2,2,1,4.8-0.8,6.5c-0.5,0.5-0.9,0.9-1.4,1.2l-2.1,0.5l-0.1-0.1c2.5-2.6,4.4-5.9,3.6-6.7c-0.2-0.2-0.7,0.3-2,1.6c-1.2,1.2-1.8,1.8-2,1.5l-0.8-0.8c-0.8-0.8-1.3-2.2-1.5-4c-0.1-1.7,0.1-3.3,0.6-3.8c0.3-0.3,0.6-0.3,0.9,0C75.9,114.9,76.2,115.7,76.5,116.5L76.5,116.5z", "times": [0, 0.89, 0.94, 0.99, 1], "op": [0, 0, 1, 0, 0] }, { "d": "M94.1,54.7l0.6,0.3c0.1,4,2.6,14.3-0.1,19.2c-1,1.9-2,3-3.3,4.3c-2.1,2-5.7,4.2-8.1,4.4c-4.3,0.1-7.6-1.4-10.1-3.9c-1.7-1.7-2.7-3.4-3-5.1c-0.8-3.9,0.7-7.7,4-11c2.3-2.3,5.8-3.7,8.5-4.4c2.1-0.6,4.5-0.9,7.6-0.9C91.5,56.6,92.8,55.7,94.1,54.7z M76.9,64.6c-2.5,2.5-1.8,7.3,1.1,10.2c2,2,4.3,3,7.1,3.4c1.9,0.3,3,0,3.7-0.7c1.1-1.2,1.6-3.4,1.9-5.5c0.3-3.1-0.2-6.7-1-9.8C83.8,61.6,79.4,62.1,76.9,64.6z", "times": [0, 0.08, 0.93, 0.98, 1], "op": [0.5, 0, 0, 1, 0.5] }].map((r, i) => (
 <Motion.path key={'rune' + i} d={r.d}
 animate={disabled ? { opacity: 0.2 } : { opacity: r.op }}
 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", times: r.times }}
 />
 ))}
 </g>

 {/* God of War: Sequentially Glowing Handle Symbols */}
 <g fill="none" stroke="#FFFBEB" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: disabled ? "drop-shadow(0 0 2px #475569)" : "drop-shadow(0 0 10px #FDE047) drop-shadow(0 0 20px #F59E0B)" }}>
 {[{ "type": "path", "d": "M232.6,199.8l15-15l15,15l-15,15L232.6,199.8z", "times": [0, 0.47, 0.5, 0.55, 0.82, 0.85, 0.9, 1], "op": [0, 0, 1, 0, 0, 1, 0, 0] }, { "type": "polyline", "pts": "233,242.5 248,257.5 263,242.5", "times": [0, 0.51, 0.54, 0.59, 0.78, 0.81, 0.86, 1], "op": [0, 0, 1, 0, 0, 1, 0, 0] }, { "type": "polyline", "pts": "233,304.5 248,289.5 263,304.5", "times": [0, 0.55, 0.58, 0.63, 0.74, 0.77, 0.82, 1], "op": [0, 0, 1, 0, 0, 1, 0, 0] }, { "type": "path", "d": "M233,353.5l15-15l15,15 M233,338.5l30,30", "times": [0, 0.59, 0.62, 0.67, 0.7, 0.73, 0.78, 1], "op": [0, 0, 1, 0, 0, 1, 0, 0] }].map((s, i) => (
 s.type === 'path' ? (
 <Motion.path key={'handle' + i} d={s.d} animate={disabled ? { opacity: 0.3 } : { opacity: s.op }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", times: s.times }} />
 ) : (
 <Motion.polyline key={'handle' + i} points={s.pts} animate={disabled ? { opacity: 0.3 } : { opacity: s.op }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", times: s.times }} />
 )
 ))}
 </g>

 {/* Orbiting Beam (Comet Tail Style matching Shield) */}
 {!disabled && (
 <g style={{ filter: "drop-shadow(0 0 12px #FBBF24)" }}>
 {/* Base Fading Trailing Glow */}
 <g stroke="#FBBF24" strokeWidth="7.5" strokeLinecap="round" fill="none">
 <path d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z" pathLength="100" strokeDasharray="25 75" opacity="0.15">
 <animate attributeName="stroke-dashoffset" values="23;-77" dur="6s" repeatCount="indefinite" />
 </path>
 <path d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z" pathLength="100" strokeDasharray="17 83" opacity="0.35">
 <animate attributeName="stroke-dashoffset" values="15;-85" dur="6s" repeatCount="indefinite" />
 </path>
 <path d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z" pathLength="100" strokeDasharray="10 90" opacity="0.8">
 <animate attributeName="stroke-dashoffset" values="8;-92" dur="6s" repeatCount="indefinite" />
 </path>
 </g>

 {/* Fading Bright Core Beam */}
 <g stroke="#FDE047" strokeWidth="7.5" strokeLinecap="round" fill="none">
 <path d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z" pathLength="100" strokeDasharray="8 92" opacity="0.2">
 <animate attributeName="stroke-dashoffset" values="6;-94" dur="6s" repeatCount="indefinite" />
 </path>
 <path d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z" pathLength="100" strokeDasharray="5 95" opacity="0.4">
 <animate attributeName="stroke-dashoffset" values="3;-97" dur="6s" repeatCount="indefinite" />
 </path>
 <path d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z" pathLength="100" strokeDasharray="2 98" opacity="1" stroke="#FFFFFF" strokeWidth="5">
 <animate attributeName="stroke-dashoffset" values="0;-100" dur="6s" repeatCount="indefinite" />
 </path>
 </g>

 {/* Scraping Sparks Trail */}
 <g strokeLinecap="round">
 {[
 { o: 0, c: "#FFFFFF", w: 5.0, x: 12, y: -9, d: 0.20 },
 { o: 0.2, c: "#FDE047", w: 4.0, x: -9, y: 9, d: 0.25 },
 { o: 0.4, c: "#F59E0B", w: 2.5, x: 9, y: 15, d: 0.15 },
 { o: 0.6, c: "#FFFFFF", w: 4.0, x: -12, y: -12, d: 0.30 },
 { o: 0.8, c: "#FDE047", w: 5.0, x: 15, y: 6, d: 0.22 },
 { o: 1.0, c: "#F59E0B", w: 2.5, x: -6, y: -15, d: 0.18 },
 ].map((spark, i) => (
 <path key={'spark' + i} d="M98,25h300l30,20v100l-30,20H288v230l5,40l-45,40l-45-40l5-40V165H98l-30-20V45L98,25z"
 fill="none" stroke={spark.c} strokeWidth={spark.w} pathLength="100" strokeDasharray="0.1 99.9">
 <animate attributeName="stroke-dashoffset" values={`${spark.o}; ${spark.o - 100}`} dur="6s" repeatCount="indefinite" />
 <animateTransform attributeName="transform" type="translate" values={`0,0; ${spark.x},${spark.y}`} dur={`${spark.d}s`} repeatCount="indefinite" />
 <animate attributeName="opacity" values="1;0" dur={`${spark.d}s`} repeatCount="indefinite" />
 </path>
 ))}
 </g>
 </g>
 )}
 </svg>
 </div>
 </div>
 );
};

export const SharezaCompassIcon = ({ className = "w-6 h-6", size = 24, disabled = false, _isUnclaimed = false }) => {
 const isActive = !disabled;
 const uid = React.useId().replace(/:/g, "");
 return (
 <Motion.svg
 width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}
 style={{ overflow: "visible" }}
 >
 <defs>
 <linearGradient id={`rimGold-${uid}`} x1="0.1" y1="0.1" x2="0.9" y2="0.9">
 <stop offset="0%" stopColor="#FFF48A" />
 <stop offset="20%" stopColor="#FDE047" />
 <stop offset="60%" stopColor="#D97706" />
 <stop offset="100%" stopColor="#78350F" />
 </linearGradient>

 <radialGradient id={`rimHighlight-${uid}`} cx="30%" cy="30%" r="50%">
 <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
 <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
 </radialGradient>

 <linearGradient id={`craterBevel-${uid}`} x1="0.1" y1="0.1" x2="0.9" y2="0.9">
 <stop offset="0%" stopColor="#5A2A06" />
 <stop offset="40%" stopColor="#92400E" />
 <stop offset="80%" stopColor="#D97706" />
 <stop offset="100%" stopColor="#FCD34D" />
 </linearGradient>

 {/* Magical Dark Stone Face */}
 <radialGradient id={`stoneFace-${uid}`} cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#1F2937" />
 <stop offset="70%" stopColor="#111827" />
 <stop offset="100%" stopColor="#0F172A" />
 </radialGradient>

 <linearGradient id={`softGlass-${uid}`} x1="0" y1="0" x2="0.8" y2="1">
 <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.08" />
 <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.05" />
 <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
 </linearGradient>

 <filter id={`shadowHeavy-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
 <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.25" />
 </filter>

 <filter id={`shadowNeedle-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
 <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
 </filter>

 <filter id={`smokeBlur4-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
 <feGaussianBlur stdDeviation="4" />
 </filter>
 <filter id={`smokeBlur2-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
 <feGaussianBlur stdDeviation="2" />
 </filter>
 <filter id={`smokeBlur1-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
 <feGaussianBlur stdDeviation="1" />
 </filter>
 </defs>

 {/* Magical Teal Ambient Glow (Medal Style) */}
 {isActive && (
 <g style={{ filter: "blur(3px)" }}>
 <g fill="none" stroke="#10B981" strokeWidth="2" opacity="0.6">
 <circle cx="50" cy="54" r="38" />
 <circle cx="50" cy="11" r="5" />
 <path d="M 40 20 C 44 14, 56 14, 60 20 L 55 26 L 45 26 Z" />
 <rect x="45" y="8" width="10" height="3" rx="0.5" />
 </g>
 <g fill="none" stroke="#34D399" strokeWidth="1" opacity="0.9">
 <circle cx="50" cy="54" r="38" />
 <circle cx="50" cy="11" r="5" />
 <path d="M 40 20 C 44 14, 56 14, 60 20 L 55 26 L 45 26 Z" />
 <rect x="45" y="8" width="10" height="3" rx="0.5" />
 </g>
 </g>
 )}





 <g filter={`url(#shadowHeavy-${uid})`}>
 {/* The Loop Ring (Drawn first so it falls behind the stem) */}
 <circle cx="50" cy="7" r="8" fill="none" stroke={`url(#rimGold-${uid})`} strokeWidth="2" />
 <circle cx="50" cy="7" r="8" fill="none" stroke="#FDE047" strokeWidth="0.5" opacity="0.8" />

 {/* --- GOLDEN STEM & CAP (Overlapping the ring) --- */}
 {/* Stem Body (Dark stone color matching the compass face) */}
 <rect x="46.5" y="11" width="7" height="10" fill="#0F172A" />
 <rect x="47" y="11" width="1.5" height="10" fill="#334155" opacity="0.8" /> {/* Highlight */}
 <rect x="52" y="11" width="1.5" height="10" fill="#020617" opacity="0.8" /> {/* Shadow */}

 {/* Stem Cap (Magical Neon Cyan/Green) */}
 <rect x="45" y="8" width="10" height="3" rx="0.5" fill="#34D399" style={{ filter: "drop-shadow(0 0 3px #10B981) drop-shadow(0 0 5px #34D399)" }} />
 <rect x="46" y="8" width="8" height="1" fill="#A7F3D0" opacity="0.9" /> {/* Bright Cyan Highlight */}

 {/* Stem Flared Gold Base */}
 <path d="M 40 20 C 44 14, 56 14, 60 20 L 55 26 L 45 26 Z" fill={`url(#rimGold-${uid})`} />
 <path d="M 41 20 C 45 15, 55 15, 59 20" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.7" />


 {/* --- MAIN COMPASS BODY --- */}
 <circle cx="50" cy="54" r="38" fill={`url(#rimGold-${uid})`} />
 <circle cx="50" cy="54" r="38" fill={`url(#rimHighlight-${uid})`} />

 {/* --- ORGANIC DENTS --- */}
 <path d="M 76 28 C 72 32, 73 35, 78 38 C 82 35, 81 32, 76 28 Z" fill={`url(#craterBevel-${uid})`} />
 <path d="M 76 28 C 72 32, 73 35, 78 38" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.08" />
 <path d="M 23 72 C 26 68, 30 67, 33 73 C 28 76, 25 75, 23 72 Z" fill={`url(#craterBevel-${uid})`} />
 <path d="M 48 91 C 50 88, 53 88, 55 91 C 53 93, 50 93, 48 91 Z" fill={`url(#craterBevel-${uid})`} />



 {/* --- INNER CRATER BEVEL --- */}
 <circle cx="50" cy="54" r="33" fill={`url(#craterBevel-${uid})`} />
 <circle cx="50" cy="54" r="30.5" fill="none" stroke="#111827" strokeWidth="1" opacity="0.4" />

 {/* --- MAGICAL STONE FACE --- */}
 <circle cx="50" cy="54" r="30" fill={`url(#stoneFace-${uid})`} />

 {/* Stone Pie Slices (Grooves) */}
 <g stroke="#030712" strokeWidth="1.2" opacity="0.8">
 <line x1="50" y1="24" x2="50" y2="84" />
 <line x1="20" y1="54" x2="80" y2="54" />
 <line x1="29" y1="33" x2="71" y2="75" />
 <line x1="71" y1="33" x2="29" y2="75" />
 </g>
 <g stroke="#4B5563" strokeWidth="0.4" opacity="0.3">
 <line x1="50.5" y1="24" x2="50.5" y2="84" />
 <line x1="20" y1="54.5" x2="80" y2="54.5" />
 <line x1="29.5" y1="33" x2="71.5" y2="75" />
 <line x1="71.5" y1="33" x2="29.5" y2="75" />
 </g>

 {/* Glowing Center Ring */}
 <circle cx="50" cy="54" r="12" fill="none" stroke="#1F2937" strokeWidth="2" />
 <circle cx="50" cy="54" r="8" fill="#2DD4BF" opacity="0.2" style={{ filter: "blur(2px)" }} />

 {/* --- OLD KURDISH ALPHABET (Glowing/Pulsing Sequentially) --- */}
 <g
 fill="#34D399"
 style={{ filter: "drop-shadow(0 0 2px #10B981) drop-shadow(0 0 5px #34D399)" }}
 fontSize="5.5" fontFamily="sans-serif" fontWeight="900" textAnchor="middle"
 >
 {[
 { x: 50, y: 34, char: 'Φ' },
 { x: 64, y: 39, char: 'Ш' },
 { x: 70, y: 56, char: '≏' },
 { x: 64, y: 73, char: '⍜' },
 { x: 50, y: 78, char: '⍋' },
 { x: 36, y: 73, char: '⋎' },
 { x: 30, y: 56, char: '∿' },
 { x: 36, y: 39, char: '⍲' }
 ].map((rune, index) => (
 <Motion.text
 key={index}
 x={rune.x}
 y={rune.y}
 animate={isActive ? { opacity: [0.1, 1, 0.1] } : { opacity: 0.3 }}
 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.375 }}
 >
 {rune.char}
 </Motion.text>
 ))}
 </g>

 {/* --- CLASSIC COMPASS NEEDLE --- */}
 <g transform="translate(50, 54)">
 <Motion.g
 style={{ originX: "3px", originY: "16px" }}
 animate={isActive ? {
 rotate: [-50, -20, -35, -85, -45, -65, -48, -53, -50]
 } : {
 rotate: [-50, -48, -52, -50]
 }}
 transition={{
 duration: isActive ? 12 : 8,
 repeat: Infinity,
 ease: "easeInOut"
 }}
 >
 {/* Tail (Green) */}
 <path d="M 0 0 L -3 0 L 0 -16 Z" fill="#34D399" />
 <path d="M 0 0 L 3 0 L 0 -16 Z" fill="#059669" />

 {/* Head (Red) */}
 <path d="M 0 0 L -3 0 L 0 20 Z" fill="#F87171" />
 <path d="M 0 0 L 3 0 L 0 20 Z" fill="#DC2626" />
 </Motion.g>
 </g>

 {/* --- STATIC CENTER PIVOT (Hub) --- */}
 <g style={{ filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" }}>
 <circle cx="50" cy="54" r="4" fill="#111827" stroke="#F59E0B" strokeWidth="1.2" />
 <circle cx="50" cy="54" r="1.5" fill="#FDE047" opacity="0.9" />
 </g>

 {/* --- GLASS COVER --- */}
 <circle cx="50" cy="54" r="30" fill={`url(#softGlass-${uid})`} />

 {/* Glass Edge Specular Highlight */}
 <path d="M 22 54 A 28 28 0 0 1 78 54" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.3" />


 </g>
 </Motion.svg>
 );
};


export const KurdishShieldIcon = ({ className = "w-6 h-6", size = 24, disabled = false, _isUnclaimed = false }) => {
 const isActive = !disabled;

 return (
 <svg
 width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}
 style={{ overflow: 'visible', transform: 'scale(1)' }}
 >
 <defs>
 <clipPath id="carpet-clip">
 <rect x="13" y="6" width="74" height="88" rx="3" />
 </clipPath>
 </defs>

 {/* Static Magic Carpet Container */}
 <g>
 {/* The Image */}
 <image
 href="/kurdistan-carpet.png"
 x="13" y="6" width="74" height="88"
 clipPath="url(#carpet-clip)"
 preserveAspectRatio="xMidYMid slice"
 style={{ opacity: disabled ? 0.5 : 1, filter: disabled ? "grayscale(100%)" : "none" }}
 />

 {/* Crisp Vector Text Plate (Overrides the blurry image text so it's readable when small) */}
 <g transform="translate(50, 16.5)">
 <rect x="-28" y="-6" width="56" height="11" fill={disabled ? "#4B5563" : "#1E3A8A"} rx="1" stroke="#FBBF24" strokeWidth="0.6" />
 <text x="0" y="2.5" fontSize="7.5" fontWeight="900" fontFamily="Georgia, serif" fill={disabled ? "#9CA3AF" : "#FBBF24"} textAnchor="middle" letterSpacing="0.5" style={{ filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))" }}>
 KURDISTAN
 </text>
 </g>

 {/* Inner Vignette / 3D Depth Shadow */}
 {!disabled && (
 <rect
 x="13" y="6" width="74" height="88" rx="3"
 fill="none" stroke="#000000" strokeWidth="12"
 clipPath="url(#carpet-clip)"
 style={{ filter: "blur(6px)", opacity: 0.7 }}
 />
 )}

 {/* Subtle glowing golden frame */}
 {isActive && (
 <rect
 x="13" y="6" width="74" height="88" rx="3"
 fill="none" stroke="#FDE047" strokeWidth="0.3"
 style={{ filter: "drop-shadow(0 0 3px #FBBF24)" }}
 />
 )}


 {/* Pulsing Sun Glow (Centered exactly over the flag's sun) */}
 {isActive && (
 <Motion.circle
 cx="50" cy="50" r="10"
 fill="#FDE047"
 style={{ filter: "blur(6px)" }}
 animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.6, 0.1] }}
 transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
 />
 )}

 {/* Magical Kurdistan Dust (Subtle floating flag-colored embers) */}
 {isActive && (
 <g>
 {[
 { x: 20, delay: 0, dur: 5, size: 0.6, drift: 5, color: "#EF4444", glow: "#DC2626" }, // Red
 { x: 35, delay: 2.5, dur: 6, size: 0.8, drift: -4, color: "#FDE047", glow: "#FBBF24" }, // Gold
 { x: 50, delay: 1, dur: 4.5, size: 0.5, drift: 6, color: "#10B981", glow: "#059669" }, // Green
 { x: 65, delay: 3, dur: 5.5, size: 0.7, drift: -5, color: "#EF4444", glow: "#DC2626" }, // Red
 { x: 80, delay: 0.5, dur: 5, size: 0.9, drift: 4, color: "#FDE047", glow: "#FBBF24" }, // Gold
 { x: 25, delay: 4, dur: 6.5, size: 0.5, drift: -3, color: "#10B981", glow: "#059669" }, // Green
 { x: 45, delay: 1.5, dur: 4, size: 0.6, drift: 5, color: "#EF4444", glow: "#DC2626" }, // Red
 { x: 75, delay: 3.5, dur: 5.2, size: 0.7, drift: -6, color: "#FDE047", glow: "#FBBF24" }, // Gold
 { x: 55, delay: 0.8, dur: 4.8, size: 0.4, drift: 4, color: "#10B981", glow: "#059669" }, // Green
 ].map((ember, i) => (
 <Motion.circle
 key={`ember-${i}`}
 cx={ember.x || 0}
 cy={94}
 r={ember.size || 0}
 fill={ember.color}
 style={{ filter: `drop-shadow(0 0 2px ${ember.glow})` }}
 animate={{
 y: [0, -94],
 opacity: [0, 0.9, 0],
 x: [0, ember.drift || 0, 0]
 }}
 transition={{
 duration: ember.dur || 5,
 repeat: Infinity,
 delay: ember.delay || 0,
 ease: "easeInOut"
 }}
 />
 ))}
 </g>
 )}
 </g>
 </svg>
 );
};

export const KingOfTheLettersIcon = ({ className = "w-6 h-6", size = 24, disabled = false }) => {
 return (
 <div
 className={`relative flex items-center justify-center ${className}`}
 style={{ width: size, height: size }}
 >
 {/* MAGMA GLOW BEHIND THE IMAGE */}
 {!disabled && (
 <svg viewBox="0 0 100 100" className="absolute w-full h-full z-0 pointer-events-none">
 <defs>
 <radialGradient id="magma-core" cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
 <stop offset="50%" stopColor="#EA580C" stopOpacity="0.8" />
 <stop offset="100%" stopColor="#9A3412" stopOpacity="0" />
 </radialGradient>
 </defs>
 <Motion.circle
 cx="50" cy="50" r="28"
 fill="url(#magma-core)"
 animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
 />
 </svg>
 )}

 <img
 src="/icons/king_of_the_letters.svg"
 alt="King of the Letters"
 className="z-10 relative"
 style={{
 width: '100%', height: '100%', maxWidth: '100%',
 objectFit: 'contain',
 filter: disabled ? "grayscale(100%) opacity(0.6)" : "drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
 }}
 />

 {/* Light Rays Emerging from Cracks */}
 {!disabled && (
 <svg viewBox="0 0 100 100" className="absolute w-full h-full z-20 pointer-events-none" style={{ overflow: 'visible' }}>
 {/* Intense screen blending overlay to force fire colors onto the cracks/gold */}
 <Motion.circle
 cx="50" cy="50" r="22"
 fill="url(#magma-core)"
 style={{ mixBlendMode: 'screen' }}
 animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.9, 1.1, 0.9] }}
 transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
 />

 {/* Floating Fire Embers */}
 {[
 { x: 45, y: 55, dur: 2.2, delay: 0 },
 { x: 55, y: 52, dur: 2.8, delay: 0.5 },
 { x: 48, y: 58, dur: 2.5, delay: 1.2 },
 { x: 52, y: 56, dur: 3.1, delay: 0.8 },
 { x: 42, y: 50, dur: 2.0, delay: 1.5 },
 { x: 58, y: 48, dur: 2.6, delay: 0.3 }
 ].map((ember, i) => (
 <Motion.circle
 key={`ember-${i}`}
 cx={ember.x} cy={ember.y} r="1"
 fill="#FEF08A"
 style={{ filter: 'drop-shadow(0 0 3px #EA580C)' }}
 animate={{
 y: [0, -20],
 x: [0, (i % 2 === 0 ? 1 : -1) * 3],
 opacity: [0, 1, 0],
 scale: [0.5, 1.5, 0.5]
 }}
 transition={{
 duration: ember.dur,
 delay: ember.delay,
 repeat: Infinity,
 ease: "easeOut"
 }}
 />
 ))}
 </svg>
 )}
 </div>
 );
};

export const MamostaBookIcon = ({ className = "w-6 h-6", size = 24, disabled = false, _isUnclaimed = false }) => {
 const isActive = !disabled;
 const uid = React.useId();
 return (
 <Motion.svg
 width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}
 style={{ overflow: "visible" }}
 >
 {/* Outer Glow (Hugging the edges like the Hammer) */}
 {isActive && (
 <g style={{ filter: "blur(3px)" }}>
 <rect x="20" y="12" width="60" height="76" rx="4" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.6" />
 <rect x="20" y="12" width="60" height="76" rx="4" fill="none" stroke="#67E8F9" strokeWidth="1" opacity="0.9" />
 </g>
 )}

 {/* Drop Shadow */}
 <rect x="25" y="16" width="60" height="76" rx="4" fill="#000" opacity="0.5" style={{ filter: "blur(4px)" }} />

 {/* Bookmark Ribbon (Drawn behind the cover so it comes from inside) */}
 <path d="M 59 86 L 59 102 L 62 99 L 65 102 L 65 86 Z" fill={disabled ? "#374151" : "#0F766E"} />
 <path d="M 59 86 L 59 102 L 62 99 L 65 102 L 65 86 Z" fill="none" stroke={disabled ? "#4B5563" : "#2DD4BF"} strokeWidth="1" />
 <circle cx="62" cy="94" r="1" fill={disabled ? "#6B7280" : "#A7F3D0"} />

 <defs>
 <radialGradient id={`magical-teal-grad-${uid}`} cx="50%" cy="50%" r="75%">
 <stop offset="0%" stopColor="#286A8C" />
 <stop offset="70%" stopColor="#1C5173" />
 <stop offset="100%" stopColor="#0F334A" />
 </radialGradient>
 <clipPath id={`expert-spine-clip-${uid}`}>
 <rect x="20" y="12" width="10" height="76" rx="3" />
 </clipPath>
 </defs>

 {/* Main Cover */}
 <rect x="25" y="12" width="55" height="76" rx="4" fill={disabled ? "#374151" : `url(#magical-teal-grad-${uid})`} />

 {/* Leather Scratches & Wear for ancient look */}
 {!disabled && (
 <g opacity="0.25" fill="none" stroke="#000" strokeWidth="0.5" strokeLinecap="round">
 <path d="M 32 22 L 35 28 M 31 25 L 34 25" />
 <path d="M 68 72 L 73 77 M 70 76 L 75 74" />
 <path d="M 40 80 L 45 82" />
 <path d="M 72 20 L 69 26" />
 <path d="M 75 40 Q 72 45 76 50" strokeWidth="0.8" opacity="0.15" />
 <path d="M 30 65 Q 33 60 28 55" strokeWidth="0.6" opacity="0.1" />
 </g>
 )}

 {/* Inner Cover 3D Bevel */}
 {/* Top and Left Light Bevel */}
 <path d="M 27 84 L 27 15 A 1 1 0 0 1 28 14 L 77 14" fill="none" stroke={disabled ? "#6B7280" : "#38BDF8"} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
 {/* Bottom and Right Dark Bevel */}
 <path d="M 78 16 L 78 85 A 1 1 0 0 1 77 86 L 29 86" fill="none" stroke={disabled ? "#111827" : "#082F49"} strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />

 {/* Spine with perfectly clipped corners */}
 <g clipPath="url(`#expert-spine-clip-${uid}`)">
 <rect x="20" y="12" width="10" height="76" rx="3" fill={disabled ? "#1F2937" : "#134461"} />
 {/* Spine Highlights for 3D cylinder feel */}
 <rect x="21" y="12" width="1" height="76" fill="#38BDF8" opacity="0.4" />
 <rect x="22" y="12" width="2" height="76" fill="#0284C7" opacity="0.2" />
 <rect x="27" y="12" width="1" height="76" fill="#000" opacity="0.2" />
 <rect x="28" y="12" width="2" height="76" fill="#000" opacity="0.4" />
 </g>

 {/* Metal Spine Hinges (Bronze) */}
 {/* Top Hinge */}
 {/* Drop Shadow on Cover */}
 <rect x="20.5" y="27" width="12" height="6" rx="1" fill="#000" opacity="0.3" />
 {/* Base Metal */}
 <rect x="20" y="26" width="12" height="6" rx="1" fill={disabled ? "#374151" : "#92400E"} />
 {/* Top Highlight Bevel */}
 <rect x="20" y="26" width="12" height="1.5" rx="0.5" fill={disabled ? "#4B5563" : "#D97706"} />
 {/* Spine Curve Shading overlaying bevels */}
 <rect x="20" y="26" width="1" height="6" fill="#000" opacity="0.4" />
 <rect x="21" y="26" width="1" height="6" fill="#000" opacity="0.2" />
 <rect x="22" y="26" width="1" height="6" fill="#000" opacity="0.1" />
 {/* Rivet */}
 <circle cx="29" cy="29" r="1.5" fill={disabled ? "#111827" : "#451A03"} />
 <circle cx="29" cy="28.7" r="0.8" fill={disabled ? "#6B7280" : "#B45309"} />
 <circle cx="28.8" cy="28.4" r="0.3" fill="#FFF" opacity="0.8" />

 {/* Bottom Hinge */}
 {/* Drop Shadow on Cover */}
 <rect x="20.5" y="69" width="12" height="6" rx="1" fill="#000" opacity="0.3" />
 {/* Base Metal */}
 <rect x="20" y="68" width="12" height="6" rx="1" fill={disabled ? "#374151" : "#92400E"} />
 {/* Top Highlight Bevel */}
 <rect x="20" y="68" width="12" height="1.5" rx="0.5" fill={disabled ? "#4B5563" : "#D97706"} />
 {/* Spine Curve Shading overlaying bevels */}
 <rect x="20" y="68" width="1" height="6" fill="#000" opacity="0.4" />
 <rect x="21" y="68" width="1" height="6" fill="#000" opacity="0.2" />
 <rect x="22" y="68" width="1" height="6" fill="#000" opacity="0.1" />
 {/* Rivet */}
 <circle cx="29" cy="71" r="1.5" fill={disabled ? "#111827" : "#451A03"} />
 <circle cx="29" cy="70.7" r="0.8" fill={disabled ? "#6B7280" : "#B45309"} />
 <circle cx="28.8" cy="70.4" r="0.3" fill="#FFF" opacity="0.8" />

 {/* Metal Corners (Bronze) */}
 {/* Top-Right Corner */}
 {/* Shadow falling onto the cover below diagonal edge */}
 <path d="M 65 13.5 L 80 31.5 L 80 30 L 66 12 Z" fill="#000" opacity="0.25" />
 {/* Base Metal */}
 <path d="M 66 12 L 76 12 A 4 4 0 0 1 80 16 L 80 30 L 66 12 Z" fill={disabled ? "#374151" : "#92400E"} />
 {/* Highlight on Top Edge */}
 <path d="M 66 12 L 76 12 A 4 4 0 0 1 80 16 L 80 18 L 76 14 L 68 14 Z" fill={disabled ? "#4B5563" : "#D97706"} />
 {/* Shadow on Diagonal Edge */}
 <path d="M 66 12 L 80 30 L 78 30 L 68 15 Z" fill={disabled ? "#1F2937" : "#451A03"} />
 {/* Rivet */}
 <circle cx="75" cy="18" r="1.5" fill={disabled ? "#111827" : "#451A03"} />
 <circle cx="75" cy="17.7" r="0.8" fill={disabled ? "#6B7280" : "#B45309"} />
 <circle cx="74.8" cy="17.4" r="0.3" fill="#FFF" opacity="0.8" />

 {/* Bottom-Right Corner */}
 {/* Base Metal */}
 <path d="M 66 88 L 76 88 A 4 4 0 0 0 80 84 L 80 70 L 66 88 Z" fill={disabled ? "#374151" : "#92400E"} />
 {/* Highlight on Diagonal Edge (facing light from top-left) */}
 <path d="M 66 88 L 80 70 L 80 73 L 69 88 Z" fill={disabled ? "#4B5563" : "#D97706"} />
 {/* Shadow on Bottom Edge */}
 <path d="M 66 88 L 76 88 A 4 4 0 0 0 80 84 L 80 82 L 76 86 L 68 86 Z" fill={disabled ? "#1F2937" : "#451A03"} />
 {/* Rivet */}
 <circle cx="75" cy="82" r="1.5" fill={disabled ? "#111827" : "#451A03"} />
 <circle cx="75" cy="81.7" r="0.8" fill={disabled ? "#6B7280" : "#B45309"} />
 <circle cx="74.8" cy="81.4" r="0.3" fill="#FFF" opacity="0.8" />


 {/* Kurdish Title */}
 <text
 x="53" y="27"
 fontSize="10" fontWeight="bold" fill={disabled ? "#9CA3AF" : "#D97706"}
 textAnchor="middle"
 style={{ fontFamily: "'Nizar Nastaliq Kurdish', 'Noto Nastaliq Urdu', 'Aref Ruqaa', serif", filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))" }}
 >
 مامۆستا
 </text>

 {/* Center Emblem (Kurdish Science Atom) */}
 <g transform="translate(53, 50) scale(0.85)">

 {/* Hawrami Circular Emblem - Bronze & Turquoise Magic */}

 {/* Outer Magical Turquoise Swirls */}
 {isActive && (
 <Motion.path
 d="M -15 -15 C -20 -10 -20 10 -15 15 C -10 20 10 20 15 15 C 20 10 20 -10 15 -15 C 10 -20 -10 -20 -15 -15 Z"
 fill="none" stroke="#2DD4BF" strokeWidth="0.5" opacity="0.5" style={{ filter: "blur(2px)" }}
 animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
 />
 )}

 {/* Outer Teardrops - Glowing Turquoise */}
 {Array.from({ length: 36 }).map((_, i) => (
 <path
 key={`outer-drop-${i}`}
 d="M -0.8 -16.5 L 0.8 -16.5 C 1.5 -18 0.5 -19.5 0 -20 C -0.5 -19.5 -1.5 -18 -0.8 -16.5 Z"
 fill={disabled ? "#6B7280" : "#2DD4BF"}
 transform={`rotate(${(i * 360) / 36})`}
 />
 ))}

 {/* Concentric Rings - Ancient Bronze */}
 <circle cx="0" cy="0" r="15.5" fill="none" stroke={disabled ? "#4B5563" : "#D97706"} strokeWidth="0.5" />
 <circle cx="0" cy="0" r="14" fill="none" stroke={disabled ? "#6B7280" : "#92400E"} strokeWidth="1.5" strokeDasharray="1.5 2.5" strokeLinecap="round" />
 <circle cx="0" cy="0" r="12.5" fill="none" stroke={disabled ? "#4B5563" : "#D97706"} strokeWidth="0.5" />

 {/* 4 Outer Teal Crosses */}
 {[0, 90, 180, 270].map((angle, index) => (
 <g key={`teal-cross-${index}`} transform={`rotate(${angle}) translate(0, -8.5) scale(0.35)`} fill="#0D9488">
 <rect x="-1.5" y="-6" width="3" height="12" rx="1.5" />
 <rect x="-6" y="-1.5" width="12" height="3" rx="1.5" />
 <circle cx="0" cy="-6" r="2" />
 <circle cx="0" cy="6" r="2" />
 <circle cx="-6" cy="0" r="2" />
 <circle cx="6" cy="0" r="2" />
 <circle cx="-3" cy="-4" r="1.5" />
 <circle cx="3" cy="-4" r="1.5" />
 <circle cx="-3" cy="4" r="1.5" />
 <circle cx="3" cy="4" r="1.5" />
 <circle cx="-4" cy="-3" r="1.5" />
 <circle cx="-4" cy="3" r="1.5" />
 <circle cx="4" cy="-3" r="1.5" />
 <circle cx="4" cy="3" r="1.5" />
 <circle cx="0" cy="0" r="1.5" fill={disabled ? "#1F2937" : "#042F2E"} />
 <circle cx="0" cy="0" r="0.8" fill="#2DD4BF" />
 </g>
 ))}

 {/* 4 Gold Boteh / Paisleys */}
 {[45, 135, 225, 315].map((angle, index) => (
 <g key={`boteh-${index}`} transform={`rotate(${angle}) translate(0, -8.5) scale(0.45)`} fill="#F59E0B">
 <path d="M 0 5 C 4 5 6 1 3 -2 C 2 -3 1 -4 0 -5 C -1 -6 0 -8 2 -8 C 0 -9 -4 -6 -3 -2 C -2 1 -4 5 0 5 Z" />
 <circle cx="0.5" cy="1" r="1.5" fill={disabled ? "#1F2937" : "#513C2C"} />
 <circle cx="0.5" cy="1" r="0.5" fill="#FEF3C7" />
 </g>
 ))}

 {/* Center Rings */}
 <circle cx="0" cy="0" r="5.5" fill="none" stroke={disabled ? "#6B7280" : "#D97706"} strokeWidth="0.8" strokeDasharray="1 1.5" strokeLinecap="round" />
 <circle cx="0" cy="0" r="4.5" fill="none" stroke={disabled ? "#4B5563" : "#F59E0B"} strokeWidth="0.5" />

 {/* Massive Glowing Turquoise Gem */}
 <circle cx="0" cy="0" r="4.5" fill={disabled ? "#4B5563" : "#0F766E"} />
 <circle cx="0" cy="0" r="3.5" fill={disabled ? "#6B7280" : "#14B8A6"} />
 {/* Gem Shine Reflection */}
 <path d="M -2 -1.5 C -1 -2.5 1 -2.5 2 -1.5 C 1.5 -0.5 -1.5 -0.5 -2 -1.5 Z" fill="#CCFBF1" opacity="0.8" />
 <circle cx="-1" cy="-2" r="0.6" fill="#FFF" />
 {isActive && (
 <Motion.circle cx="0" cy="0" r="6" fill="#2DD4BF" style={{ filter: "blur(3px)" }}
 animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
 />
 )}
 </g>


 {/* Fine Magical Stroke Sparks */}
 {isActive && (
 <g>
 {Array.from({ length: 30 }).map((_, i) => {
 // Angle around the center (360 degrees spread)
 const angle = (i * 12) * (Math.PI / 180);

 // Start from exactly inside the central blue seal (gem radius is 6)
 const rStart = (i % 3) * 2; // Radius 0, 2, 4
 const x = 50 + Math.cos(angle) * rStart;
 const y = 50 + Math.sin(angle) * rStart;

 // Travel enough to escape the seal but stay on the book (Max reach = 4 + 22 = 26)
 const flyDist = 10 + (i % 4) * 4; // 10, 14, 18, 22 pixels
 const flyX = Math.cos(angle) * flyDist;
 const flyY = Math.sin(angle) * flyDist;

 // Tiny needle length (small sparks)
 const lenX = Math.cos(angle) * 0.5;
 const lenY = Math.sin(angle) * 0.5;

 // Disappear quickly but move slowly
 const dur = 1.5 + (i % 3) * 0.5; // 1.5s to 2.5s
 const delay = (i % 12) * 0.2;

 return (
 <Motion.g
 key={`spark-line-${i}`}
 initial={{ opacity: 0, x: 0, y: 0 }}
 animate={{
 x: flyX,
 y: flyY,
 opacity: [0, 1, 0]
 }}
 transition={{
 duration: dur,
 repeat: Infinity,
 delay: delay,
 ease: "easeOut"
 }}
 >
 <line
 x1={x} y1={y}
 x2={x + lenX} y2={y + lenY}
 stroke={i % 2 === 0 ? "#CFFAFE" : "#22D3EE"}
 strokeWidth="0.3"
 strokeLinecap="round"
 />
 </Motion.g>
 );
 })}
 </g>
 )}
 </Motion.svg>
 );
};

export const SpinTicketIcon = ({ className = "w-6 h-6", size = 24, disabled = false }) => (
 <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Ticket Shadow & Depth */}
 <path d="M 15 32 L 85 32 L 85 43 A 7 7 0 0 0 85 57 L 85 68 L 15 68 L 15 57 A 7 7 0 0 0 15 43 Z" fill={disabled ? "#1F2937" : "#B45309"} transform="translate(0, 4)" />

 {/* Ticket Main Body */}
 <path d="M 15 32 L 85 32 L 85 43 A 7 7 0 0 0 85 57 L 85 68 L 15 68 L 15 57 A 7 7 0 0 0 15 43 Z" fill={disabled ? "#374151" : "#F59E0B"} />

 {/* Ticket Inner Bright Base */}
 <path d="M 18 35 L 82 35 L 82 43.5 A 6.5 6.5 0 0 0 82 56.5 L 82 65 L 18 65 L 18 56.5 A 6.5 6.5 0 0 0 18 43.5 Z" fill={disabled ? "#4B5563" : "#FBBF24"} />

 {/* Ticket Dashed Border */}
 <path d="M 22 39 L 78 39 M 22 61 L 78 61 M 26 39 L 26 61 M 74 39 L 74 61" stroke={disabled ? "#9CA3AF" : "#FDE047"} strokeWidth="1.5" strokeDasharray="3 3" />

 {/* Center Wheel Star / Token */}
 <circle cx="50" cy="50" r="10" fill={disabled ? "#6B7280" : "#F59E0B"} stroke={disabled ? "#374151" : "#B45309"} strokeWidth="2" />
 <path d="M 50 42 L 50 58 M 42 50 L 58 50 M 44.5 44.5 L 55.5 55.5 M 44.5 55.5 L 55.5 44.5" stroke={disabled ? "#9CA3AF" : "#FEF3C7"} strokeWidth="1.5" strokeLinecap="round" />

 {/* Ticket Side Text/Barcode Details */}
 <rect x="30" y="42" width="2" height="16" fill={disabled ? "#9CA3AF" : "#D97706"} />
 <rect x="34" y="45" width="2" height="10" fill={disabled ? "#9CA3AF" : "#D97706"} />
 <rect x="38" y="42" width="2" height="16" fill={disabled ? "#9CA3AF" : "#D97706"} />

 <rect x="68" y="42" width="2" height="16" fill={disabled ? "#9CA3AF" : "#D97706"} />
 <rect x="64" y="45" width="2" height="10" fill={disabled ? "#9CA3AF" : "#D97706"} />
 <rect x="60" y="42" width="2" height="16" fill={disabled ? "#9CA3AF" : "#D97706"} />

 {/* Star Sparkles */}
 <path d="M 20 28 L 22 23 L 24 28 L 29 30 L 24 32 L 22 37 L 20 32 L 15 30 Z" fill={disabled ? "#9CA3AF" : "#FEF08A"} />
 <path d="M 80 72 L 82 67 L 84 72 L 89 74 L 84 76 L 82 81 L 80 76 L 75 74 Z" fill={disabled ? "#9CA3AF" : "#FEF08A"} />
 </svg>
);
