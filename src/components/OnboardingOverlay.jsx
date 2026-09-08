import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const OnboardingOverlay = ({ steps, onComplete }) => {
 const [currentStep, setCurrentStep] = useState(0);
 const [targetRect, setTargetRect] = useState(null);

 useEffect(() => {
 let timeout;
 const updateTarget = () => {
 const step = steps[currentStep];
 if (!step) return;
 const el = document.getElementById(step.targetId);
 if (el) {
 const rect = el.getBoundingClientRect();
 setTargetRect({
 top: rect.top,
 left: rect.left,
 width: rect.width,
 height: rect.height,
 });
 } else {
 // Retry if element not found yet
 timeout = setTimeout(updateTarget, 100);
 }
 };

 updateTarget();
 window.addEventListener('resize', updateTarget);
 return () => {
 if (timeout) clearTimeout(timeout);
 window.removeEventListener('resize', updateTarget);
 };
 }, [currentStep, steps]);

 if (!targetRect || !steps[currentStep]) return null;

 const step = steps[currentStep];

 const handleNext = (e) => {
 if (e && e.stopPropagation) e.stopPropagation();
 if (currentStep < steps.length - 1) {
 setCurrentStep(c => c + 1);
 } else {
 if (onComplete) onComplete();
 }
 };

 const padding = 6;
 const tTop = targetRect.top - padding;
 const tLeft = targetRect.left - padding;
 const tWidth = targetRect.width + padding * 2;
 const tHeight = targetRect.height + padding * 2;
 const radius = 24; // rounded-full approximation

 const isPositionTop = step.position === 'top';

 return (
 <div className="fixed inset-0 z-9999 pointer-events-auto font-rabar flex items-center justify-center">
 {/* SVG Mask for Dimming */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
 <defs>
 <mask id="cutout-mask">
 <rect width="100%" height="100%" fill="white" />
 <rect x={tLeft} y={tTop} width={tWidth} height={tHeight} rx={radius} fill="black" />
 </mask>
 </defs>
 <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#cutout-mask)" />
 </svg>

 {/* Click Blocker outside cutout */}
 <div className="absolute inset-0 z-10" />

 {/* The Cutout Interactive Area */}
 <div 
 className="absolute z-20 cursor-pointer"
 style={{ top: tTop, left: tLeft, width: tWidth, height: tHeight, borderRadius: radius }}
 onClick={(e) => {
 const el = document.getElementById(step.targetId);
 if (el) el.click();
 handleNext(e);
 }}
 >
 <span className="absolute inset-0 rounded-full animate-ping bg-white opacity-20"></span>
 </div>

 {/* Absolute positioned hand pointing exactly at the target cutout */}
 <Motion.div
 className="absolute z-40 pointer-events-none drop-shadow-lg flex justify-center"
 style={{
 left: tLeft + (tWidth / 2),
 top: isPositionTop ? tTop - 65 : tTop + tHeight + 5,
 transform: 'translateX(-50%)'
 }}
 animate={{ y: isPositionTop ? [0, 15, 0] : [0, -15, 0] }}
 transition={{ repeat: Infinity, duration: 1.5 }}
 >
 <span className={`text-5xl inline-block ${isPositionTop ? 'rotate-180' : ''}`}>👆</span>
 </Motion.div>

 {/* Coachmark Text Card */}
 <Motion.div 
 key={currentStep}
 initial={{ opacity: 0, scale: 0.9, y: isPositionTop ? 20 : -20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 className="absolute inset-x-0 mx-auto z-30 flex flex-col items-center pointer-events-none px-6"
 style={{
 top: isPositionTop ? 'auto' : tTop + tHeight + 70,
 bottom: isPositionTop ? window.innerHeight - tTop + 70 : 'auto',
 width: '100%',
 maxWidth: '400px'
 }}
 >

 <div className="w-full flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden z-50 p-6 text-center">
 {/* Inner 3D Highlight Layer (Tapered Top) */}
 <div 
 className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>
 
 {/* Inner 3D Shadow Layer (Bottom & Sides) */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight */}
 <div className="absolute top-1.5 inset-x-1.5 h-12 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>

 <h3 
 className="text-[22px] font-black text-[#2bd873] leading-none mb-4 relative z-10"
 style={{ textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)` }}
 >
 {step.title}
 </h3>
 {/* Inner Content Area */}
 <div className="w-full flex flex-col relative rounded-[10px] bg-[#e6ebf0] shadow-[0_6px_12px_rgba(0,0,0,0.15)] overflow-hidden p-4 sm:p-5 shrink-0 z-20">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[10px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-10"></div>
 
 <p className="text-[14px] font-black text-[#181a20] leading-relaxed mb-6 relative z-20 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] px-1">
 {step.text}
 </p>
 
 {steps.length > 1 && (
 <div className="flex items-center justify-center w-full relative z-20 pb-2">
 <div className="flex gap-1.5">
 {steps.map((_, i) => (
 <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 border border-black/40 shadow-sm ${i === currentStep ? 'bg-[#24a85c] scale-125' : 'bg-[#4b5162]'}`} />
 ))}
 </div>
 </div>
 )}
 </div>
 </div>

 </Motion.div>
 </div>
 );
};

export default OnboardingOverlay;
