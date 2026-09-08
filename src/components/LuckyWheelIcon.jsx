import React from 'react';
import { motion as Motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { FilsIcon, HintIcon, MagnetIcon, DerhemIcon, SkipIcon, DinarIcon } from './CurrencyIcon';
import MysteryBoxIcon from './MysteryBoxIcon';

import { WHEEL_REWARDS } from '../constants/wheelRewards';

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
 const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
 return {
 x: centerX + (radius * Math.cos(angleInRadians)),
 y: centerY + (radius * Math.sin(angleInRadians))
 };
}

function getSegmentPath(cx, cy, r, startAngle, endAngle) {
 const start = polarToCartesian(cx, cy, r, endAngle);
 const end = polarToCartesian(cx, cy, r, startAngle);
 const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
 return [
 "M", cx, cy,
 "L", start.x, start.y,
 "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
 "Z"
 ].join(" ");
}

export const LuckyWheelInner = ({ className, hideContent = false }) => {
 const numSegments = WHEEL_REWARDS.length;
 const segmentAngle = 360 / numSegments;
 const rotationOffset = -segmentAngle / 2;

 return (
 <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
 <defs>
 <radialGradient id="segmentHighlight" cx="50%" cy="50%" r="50%">
 <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
 <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
 </radialGradient>
 </defs>
 
 <g transform={`translate(50, 50) rotate(${rotationOffset})`}>
 {/* Segments */}
 <g stroke="rgba(0,0,0,0.2)" strokeWidth="0.5">
 {WHEEL_REWARDS.map((reward, i) => (
 <path 
 key={`segment-${i}`} 
 d={getSegmentPath(0, 0, 48, i * segmentAngle, (i + 1) * segmentAngle)} 
 fill={reward.color} 
 />
 ))}
 </g>
 
 {/* Segment Content */}
 {!hideContent && (
 <React.Fragment>
 {WHEEL_REWARDS.map((reward, i) => {
 const rotateAngle = (i * segmentAngle) + (segmentAngle / 2);
 const isSpecial = reward.type === 'mystery_box';
 return (
 <g key={`content-${i}`} transform={`rotate(${rotateAngle})`}>
 {isSpecial ? (
 <g transform={`translate(-6.5, -46)`}>
 <reward.Icon size={reward.size} asSvg={true} />
 </g>
 ) : (
 <g transform={`translate(-4.5, -42)`}><reward.Icon size={reward.size} /></g>
 )}
 <text 
 x="0" 
 y="-23" 
 fontSize={isSpecial ? "2.5" : "4.5"} 
 fontWeight="900" 
 fill="white" 
 stroke="rgba(0,0,0,0.6)" 
 strokeWidth="1" 
 paintOrder="stroke fill" 
 strokeLinejoin="round" 
 textAnchor="middle" 

 >
 {reward.label}
 </text>
 </g>
 );
 })}
 </React.Fragment>
 )}
 
 <circle cx="0" cy="0" r="48" fill="url(#segmentHighlight)" />
 <circle cx="0" cy="0" r="47" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
 <circle cx="0" cy="0" r="10.5" fill="rgba(0,0,0,0.3)" />
 </g>
 </svg>
 );
};

export const LuckyWheelFrame = ({ className, flickTrigger = 0, rotation }) => {
 const pointerRotation = useMotionValue(0);
 const defaultRotation = useMotionValue(0);
 const activeRotation = rotation || defaultRotation;

 React.useEffect(() => {
 if (flickTrigger > 0) {
 animate(pointerRotation, [-30, 0], {
 type: "spring",
 stiffness: 800,
 damping: 10,
 mass: 0.5
 });
 }
 }, [flickTrigger, pointerRotation]);

 React.useEffect(() => {
 if (!rotation) return;
 const numSegments = WHEEL_REWARDS.length;
 const segmentAngle = 360 / numSegments;
 const offset = segmentAngle / 2;
 let lastSegment = Math.floor((rotation.get() + offset) / segmentAngle);

 const unsubscribe = rotation.on("change", (latest) => {
 const currentSegment = Math.floor((latest + offset) / segmentAngle);
 if (currentSegment !== lastSegment) {
 lastSegment = currentSegment;
 animate(pointerRotation, [-30, 0], {
 type: "spring",
 stiffness: 800,
 damping: 10,
 mass: 0.5
 });
 }
 });
 return () => unsubscribe();
 }, [rotation, pointerRotation]);

 const pointerTransform = useTransform(pointerRotation, rot => `rotate(${rot} 50 -6)`);

 return (
 <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
 <defs>
 <linearGradient id="goldRimOuter" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FFF9C4" />
 <stop offset="20%" stopColor="#FBC02D" />
 <stop offset="50%" stopColor="#F57F17" />
 <stop offset="80%" stopColor="#FBC02D" />
 <stop offset="100%" stopColor="#FFF9C4" />
 </linearGradient>
 
 <linearGradient id="goldRimInner" x1="100%" y1="100%" x2="0%" y2="0%">
 <stop offset="0%" stopColor="#FFF9C4" />
 <stop offset="50%" stopColor="#FBC02D" />
 <stop offset="100%" stopColor="#F57F17" />
 </linearGradient>

 <radialGradient id="centerJewel" cx="35%" cy="35%" r="65%">
 <stop offset="0%" stopColor="#82B1FF" />
 <stop offset="30%" stopColor="#2979FF" />
 <stop offset="80%" stopColor="#0D47A1" />
 <stop offset="100%" stopColor="#000000" />
 </radialGradient>

 <linearGradient id="pointerJewel" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FF8A80" />
 <stop offset="100%" stopColor="#E91E63" />
 </linearGradient>

 <filter id="lightGlow">
 <feGaussianBlur stdDeviation="1.5" result="blur" />
 <feMerge>
 <feMergeNode in="blur" />
 <feMergeNode in="SourceGraphic" />
 </feMerge>
 </filter>

 <filter id="frameShadow" x="-20%" y="-20%" width="140%" height="140%">
 <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
 <feOffset dx="0" dy="3" result="offsetblur" />
 <feComponentTransfer>
 <feFuncA type="linear" slope="0.3" />
 </feComponentTransfer>
 <feMerge> 
 <feMergeNode />
 <feMergeNode in="SourceGraphic" />
 </feMerge>
 </filter>
 </defs>

 <g filter="url(#frameShadow)">
 <Motion.g style={{ rotate: activeRotation, transformOrigin: '50px 50px' }}>
 <circle cx="50" cy="50" r="47.5" fill="none" stroke="url(#goldRimOuter)" strokeWidth="3" />
 <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
 <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
 <circle cx="50" cy="50" r="45.5" fill="none" stroke="url(#goldRimInner)" strokeWidth="1.5" />

 {Array.from({ length: 72 }).map((_, i) => (
 <circle key={i} cx="50" cy="2.5" r="1.0" fill="#FFF59D" stroke="rgba(0,0,0,0.5)" strokeWidth="0.3" filter="url(#lightGlow)" transform={`rotate(${i * 5} 50 50)`} />
 ))}
 </Motion.g>

 <circle cx="50" cy="50" r="12" fill="url(#goldRimOuter)" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
 <circle cx="50" cy="50" r="10" fill="none" stroke="url(#goldRimInner)" strokeWidth="1.5" />
 
 <Motion.g transform={pointerTransform}>
 <path d="M 50 6 L 45 -6 A 5 5 0 1 1 55 -6 Z" fill="#FFFFFF" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" strokeLinejoin="round" />
 <path d="M 50 4.5 L 46.5 -6 A 3.5 3.5 0 1 1 53.5 -6 Z" fill="url(#pointerJewel)" strokeLinejoin="round" />
 <circle cx="50" cy="-6" r="1.5" fill="#FFFFFF" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
 </Motion.g>
 </g>
 </svg>
 );
};

const LuckyWheelIcon = ({ className, isIdleAnimated = false }) => (
 <div className={`relative flex items-center justify-center ${className}`}>
 <Motion.div 
 animate={isIdleAnimated ? { rotate: [0, 1080, 1080] } : {}}
 transition={isIdleAnimated ? { 
 repeat: Infinity, 
 duration: 6, 
 times: [0, 0.15, 1],
 ease: "easeInOut"
 } : {}}
 className="absolute inset-0 w-full h-full"
 >
 <LuckyWheelInner className="w-full h-full" hideContent={true} />
 </Motion.div>
 <LuckyWheelFrame className="absolute inset-0 w-full h-full" />
 </div>
);

export default LuckyWheelIcon;
