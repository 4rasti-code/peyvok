import React from 'react';

export default function BrainIcon({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes brain-float {
 0%, 100% { transform: translateY(0px) scale(1); }
 50% { transform: translateY(-4px) scale(1.02); }
 }
 @keyframes brain-pulse {
 0%, 100% { filter: drop-shadow(0px 6px 10px rgba(0,0,0,0.3)); }
 50% { filter: drop-shadow(0px 10px 15px rgba(255,255,255,0.4)); }
 }
 @keyframes spark-flash {
 0%, 100% { opacity: 0; transform: scale(0.5); }
 10% { opacity: 1; transform: scale(1.2); }
 20% { opacity: 0; transform: scale(0.8); }
 }
 `}
 </style>

 <div 
 className="absolute inset-0 z-10 flex items-center justify-center"
 style={{ 
 animation: 'brain-float 3s infinite ease-in-out, brain-pulse 2s infinite ease-in-out',
 willChange: 'transform, filter'
 }}
 >
 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
 
 <g style={{ transformOrigin: '50px 50px' }}>
 
 {/* 3D Depth/Shadow Layer (Dark Pink) */}
 <path d="M20,48 C20,18 45,13 55,23 C65,13 85,28 80,48 C85,63 75,78 65,73 C55,78 50,68 45,63 C30,73 20,68 20,48 Z" fill="#be185d" transform="translate(0, 6)" />
 
 {/* Brain Stem (Depth) */}
 <path d="M45,65 L45,85 C45,90 55,90 55,85 L55,65 Z" fill="#9d174d" transform="translate(0, 6)" />
 {/* Cerebellum (Depth) */}
 <circle cx="65" cy="70" r="14" fill="#9d174d" transform="translate(0, 6)" />

 {/* Brain Stem (Front) */}
 <path d="M45,65 L45,85 C45,90 55,90 55,85 L55,65 Z" fill="#fbcfe8" />
 
 {/* Cerebellum (Front) */}
 <circle cx="65" cy="70" r="14" fill="#f9a8d4" />
 {/* Cerebellum Lines */}
 <path d="M 55,65 Q 65,60 75,65 M 53,70 Q 65,65 77,70 M 55,75 Q 65,70 75,75" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" fill="none" />

 {/* Main Brain Cloud (Front Layer - Pink) */}
 <path d="M20,45 C20,15 45,10 55,20 C65,10 85,25 80,45 C85,60 75,75 65,70 C55,75 50,65 45,60 C30,70 20,65 20,45 Z" fill="#f472b6" />
 
 {/* Brain Folds (Sulci) - The squiggly lines */}
 <g stroke="#be185d" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8">
 <path d="M 28,35 Q 40,20 50,35 T 70,30" />
 <path d="M 25,50 Q 35,45 42,55 T 58,50 T 72,55" />
 <path d="M 32,60 Q 40,50 45,60" />
 <path d="M 50,22 L 50,35" />
 <path d="M 68,26 Q 60,35 60,45" />
 <path d="M 45,45 Q 50,55 45,60" />
 <path d="M 25,40 Q 35,45 35,55" />
 <path d="M 75,40 Q 65,45 65,55" />
 </g>

 {/* Lightning / Energy Sparks (To show deep thinking) */}
 {/* Spark 1: Top Left */}
 <g style={{ transformOrigin: '25px 20px', animation: 'spark-flash 2.5s infinite 0.2s' }}>
 <polygon points="25,20 30,10 22,15 28,5 18,12 25,20" fill="#fde047" />
 </g>
 {/* Spark 2: Top Right */}
 <g style={{ transformOrigin: '75px 15px', animation: 'spark-flash 3.1s infinite 1.5s' }}>
 <polygon points="75,15 80,5 72,10 78,0 68,7 75,15" fill="#60a5fa" />
 </g>
 {/* Spark 3: Bottom Left */}
 <g style={{ transformOrigin: '20px 65px', animation: 'spark-flash 2.8s infinite 0.8s' }}>
 <polygon points="20,65 10,60 15,68 5,65 12,72 20,65" fill="#fde047" />
 </g>

 </g>
 </svg>
 </div>
 </div>
 );
}
