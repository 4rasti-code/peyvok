import React from 'react';

const Sword = ({ className, color = "amber" }) => {
 let gripLeft, gripRight;
 if (color === "blue") {
 gripLeft = "#60a5fa"; // blue-400
 gripRight = "#3b82f6"; // blue-500
 } else if (color === "red") {
 gripLeft = "#f87171"; // red-400
 gripRight = "#ef4444"; // red-500
 } else {
 gripLeft = "#9a3412";
 gripRight = "#7c2d12";
 }

 return (
 <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
 {/* Blade Left Face */}
 <polygon points="40,25 50,25 50,65 40,65" fill="#e2e8f0" />
 <polygon points="40,25 50,5 50,25" fill="#e2e8f0" />
 
 {/* Blade Right Face */}
 <polygon points="50,25 60,25 60,65 50,65" fill="#94a3b8" />
 <polygon points="50,5 60,25 50,25" fill="#94a3b8" />

 {/* Crossguard Top */}
 <rect x="22" y="63" width="56" height="12" rx="6" fill="#f59e0b" />
 {/* Crossguard Bottom Shadow */}
 <path d="M 22 69 L 78 69 A 6 6 0 0 1 72 75 L 28 75 A 6 6 0 0 1 22 69 Z" fill="#d97706" />

 {/* Handle Left Face */}
 <rect x="41" y="75" width="9" height="16" fill={gripLeft} />
 {/* Handle Right Face */}
 <rect x="50" y="75" width="9" height="16" fill={gripRight} />

 {/* Pommel Top */}
 <circle cx="50" cy="92" r="9" fill="#f59e0b" />
 {/* Pommel Bottom Shadow */}
 <path d="M 41 92 A 9 9 0 0 0 59 92 Z" fill="#d97706" />
 </svg>
 );
};

const Spark = ({ angle, distance }) => {
 const x = Math.cos(angle) * distance;
 const y = Math.sin(angle) * distance;
 const rot = angle * (180 / Math.PI);
 
 // White-hot center with sharp yellow/orange metal glow
 const metalGlow = '0 0 2px 1px #ffffff, 0 0 4px 1px #fef08a, 0 0 6px 1px #ea580c';
 
 return (
 <div
 className="absolute bg-white rounded-full"
 style={{
 width: '6px',
 height: '1px',
 top: '50%', left: '50%',
 marginLeft: '-3px', marginTop: '-0.5px', // Centers perfectly
 '--tx': `${x}px`,
 '--ty': `${y}px`,
 '--rot': `${rot}deg`,
 boxShadow: metalGlow,
 animation: 'sword-spark 5s infinite linear',
 willChange: 'transform, opacity',
 backfaceVisibility: 'hidden',
 WebkitTransform: 'translateZ(0)'
 }}
 />
 );
};

// Generate sparks in scattered random directions once at module load
const numSparks = 8;
const INITIAL_SPARKS = Array.from({ length: numSparks }).map((_, i) => ({
 id: i,
 angle: (i * (Math.PI * 2)) / numSparks + (Math.random() * 0.8 - 0.4),
 distance: 20 + Math.random() * 20,
}));

export default function ClashingSwords({ className = "w-16 h-16" }) {
 return (
 <div className={`relative flex items-center justify-center ${className}`}>
 <style>
 {`
 @keyframes sword-left-anim {
 0%, 6% { transform: rotate(35deg) translateZ(0); }
 10% { transform: rotate(-15deg) translateZ(0); }
 15% { transform: rotate(45deg) translateZ(0); }
 20%, 100% { transform: rotate(35deg) translateZ(0); }
 }
 @keyframes sword-right-anim {
 0%, 6% { transform: rotate(-35deg) translateZ(0); }
 10% { transform: rotate(15deg) translateZ(0); }
 15% { transform: rotate(-45deg) translateZ(0); }
 20%, 100% { transform: rotate(-35deg) translateZ(0); }
 }
 @keyframes sword-spark {
 0% { 
 transform: translate(0px, 0px) rotate(var(--rot)) scaleX(0) scaleY(0) translateZ(0); 
 opacity: 0; 
 visibility: hidden;
 }
 13% { 
 transform: translate(0px, 0px) rotate(var(--rot)) scaleX(0) scaleY(0) translateZ(0); 
 opacity: 0; 
 visibility: hidden;
 }
 14% { 
 /* Violent instantaneous metal spark burst */
 transform: translate(calc(var(--tx) * 0.1), calc(var(--ty) * 0.1)) rotate(var(--rot)) scaleX(3) scaleY(0.5) translateZ(0); 
 opacity: 1; 
 visibility: visible;
 animation-timing-function: cubic-bezier(0, 1, 0.2, 1);
 }
 22% { 
 /* Cools down and shrinks rapidly while moving */
 transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scaleX(0) scaleY(0) translateZ(0); 
 opacity: 0; 
 visibility: hidden;
 }
 100% { 
 transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scaleX(0) scaleY(0) translateZ(0); 
 opacity: 0; 
 visibility: hidden;
 }
 }
 `}
 </style>
 <div className="absolute inset-0" style={{ transform: 'translateY(-15%) translateZ(0)', backfaceVisibility: 'hidden' }}>
 
 {/* Left Sword */}
 <div
 className="absolute top-0 w-full h-full z-10"
 style={{ 
 transformOrigin: "50% 90%", left: "-25%", 
 animation: "sword-left-anim 5s infinite ease-in-out",
 willChange: "transform",
 backfaceVisibility: "hidden"
 }}
 >
 <Sword className="w-full h-full drop-shadow-xl overflow-visible" color="blue" />
 </div>

 {/* Right Sword */}
 <div
 className="absolute top-0 w-full h-full z-10"
 style={{ 
 transformOrigin: "50% 90%", left: "25%", 
 animation: "sword-right-anim 5s infinite ease-in-out",
 willChange: "transform",
 backfaceVisibility: "hidden"
 }}
 >
 <div style={{ transform: "scaleX(-1) translateZ(0)", width: "100%", height: "100%" }}>
 <Sword className="w-full h-full drop-shadow-xl overflow-visible" color="red" />
 </div>
 </div>

 {/* Sparks Container */}
 <div className="absolute z-20 w-0 h-0" style={{ top: '40%', left: '50%' }}>
 {INITIAL_SPARKS.map(spark => (
 <Spark key={spark.id} angle={spark.angle} distance={spark.distance} />
 ))}
 </div>
 </div>
 </div>
 );
}
