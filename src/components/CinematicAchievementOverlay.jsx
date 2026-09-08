/* eslint-disable no-unused-vars */
import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAudio } from '../context/AudioContext';
import { triggerHaptic } from '../utils/haptics';

const CinematicAchievementOverlay = ({ Icon, title, medalId, onContinue }) => {
 const containerRef = useRef(null);

 // Motion values for pointer tracking
 const x = useMotionValue(0);
 const y = useMotionValue(0);

 // Spring configuration for smooth snapping
 const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
 const springX = useSpring(x, springConfig);
 const springY = useSpring(y, springConfig);

 // Transform coordinates to 3D rotations (-35deg to +35deg) for more dramatic 3D
 const rotateX = useTransform(springY, [-0.5, 0.5], [35, -35]);
 const rotateY = useTransform(springX, [-0.5, 0.5], [-35, 35]);

 // Transform coordinates to glare position (0% to 100%)
 const glareX = useTransform(springX, [-0.5, 0.5], [0, 100]);
 const glareY = useTransform(springY, [-0.5, 0.5], [0, 100]);

 const { 
 playNoberaSound, playPalawanSound, playExpertSound, playMamostaSound, 
 playShanaziKurdistanSound, playShanaziJihaniSound 
 } = useAudio();

 useEffect(() => {
 // Haptic feedback on mount
 triggerHaptic([20, 30, 20]);
 
 // Some sounds have a natural build-up and should play immediately, others need a slight delay
 if (medalId === 'expert') {
 playExpertSound();
 } else if (medalId === 'mamosta') {
 playMamostaSound();
 } else {
 const timer = setTimeout(() => {
 if (medalId === 'nobera') playNoberaSound();
 else if (medalId === 'palawan') playPalawanSound();
 else if (medalId === 'shanazi_kurdistan') playShanaziKurdistanSound();
 else if (medalId === 'shanazi_jihani') playShanaziJihaniSound();
 }, 300);
 return () => clearTimeout(timer);
 }
 }, [medalId, playNoberaSound, playPalawanSound, playExpertSound, playMamostaSound, playShanaziKurdistanSound, playShanaziJihaniSound]);

 const handlePointerMove = (e) => {
 if (!containerRef.current) return;

 // Support both mouse and touch events
 const clientX = e.touches ? e.touches[0].clientX : e.clientX;
 const clientY = e.touches ? e.touches[0].clientY : e.clientY;

 const rect = containerRef.current.getBoundingClientRect();

 // Calculate relative position (-0.5 to 0.5)
 const relX = (clientX - rect.left) / rect.width - 0.5;
 const relY = (clientY - rect.top) / rect.height - 0.5;

 x.set(relX);
 y.set(relY);
 };

 const handlePointerLeave = () => {
 x.set(0);
 y.set(0);
 };

 const handleClaimClick = () => {
 triggerHaptic(40);
 onContinue();
 };

 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0, transition: { duration: 0.3 } }}
 className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 overflow-hidden"
 style={{ zIndex: 999999 }}
 >
 {/* Dynamic Background Aura */}
 <motion.div
 className="absolute inset-0 flex items-center justify-center pointer-events-none"
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1, transition: { duration: 1, ease: "easeOut" } }}
 >
 <div className="w-75 h-75 sm:w-125 sm:h-125 rounded-full bg-linear-to-r from-yellow-500/20 via-orange-500/20 to-purple-500/20 blur-[60px] animate-pulse" />
 </motion.div>

 {/* Header */}
 <motion.h1
 initial={{ y: -50, opacity: 0 }}
 animate={{ y: 0, opacity: 1, transition: { delay: 0.2, type: "spring", stiffness: 200 } }}
 className="text-4xl sm:text-5xl font-black text-white mb-12 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] z-10 text-center"
 >
 دەستکەفتەکا نوی!
 </motion.h1>

 {/* 3D Holographic Container */}
 <div
 ref={containerRef}
 className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center z-10 cursor-pointer cinematic-icon-wrapper"
 style={{ perspective: "1200px" }}
 onMouseMove={handlePointerMove}
 onMouseLeave={handlePointerLeave}
 onTouchMove={handlePointerMove}
 onTouchEnd={handlePointerLeave}
 >
 <style>
 {`
 .cinematic-icon-wrapper svg {
 shape-rendering: geometricPrecision;
 }
 .cinematic-icon-wrapper img {
 image-rendering: -webkit-optimize-contrast;
 image-rendering: crisp-edges;
 }
 `}
 </style>
 <motion.div
 initial={{ scale: 0.3, opacity: 0, y: 40 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 transition={{ type: "spring", stiffness: 250, damping: 15, delay: 0.2 }}
 style={{
 rotateX,
 rotateY,
 transformStyle: "preserve-3d"
 }}
 className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center group"
 >
 {/* Main Icon floating in 3D */}
 <div 
 className="relative w-full h-full flex items-center justify-center drop-shadow-2xl pointer-events-none"
 style={{ transformStyle: "preserve-3d" }}
 >
 {/* No background glow planes to avoid Safari/Chrome 3D rendering bugs */}
 <Icon className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] z-10" size="100%" />

 {/* Glare effect removed because it causes a protruding circular orb around non-square icons */}
 </div>
 </motion.div>
 </div>

 {/* Achievement Name */}
 <motion.h3
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4, type: "spring", damping: 15 }}
 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-300 to-yellow-600 mt-16 sm:mt-20 z-10 text-center py-2 leading-relaxed"
 >
 {title}
 </motion.h3>

 {/* Continue Button */}
 <motion.button
 initial={{ y: 50, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ delay: 0.6, type: "spring" }}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleClaimClick}
 className="z-10 mt-12 px-12 py-4 bg-linear-to-r from-yellow-500 to-orange-500 rounded-full font-black text-xl text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] active:shadow-inner"
 >
 بەردەوام بە
 </motion.button>
 </motion.div>
 );
};

export default CinematicAchievementOverlay;
