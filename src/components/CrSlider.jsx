import React, { useRef, useState, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

export default function CrSlider({ value, onChange, onRelease }) {
 const sliderRef = useRef(null);
 const [isDragging, setIsDragging] = useState(false);
 const [prevValue, setPrevValue] = useState(value);
 const [localValue, setLocalValue] = useState(value);

 if (value !== prevValue) {
 setPrevValue(value);
 if (!isDragging) {
 setLocalValue(value);
 }
 }

 const trackHeight = 48;
 const paddingX = 8;
 const paddingY = 16;
 const innerTrackHeight = trackHeight - paddingY * 2; // 16
 const thumbHeight = 34;
 const thumbWidth = 22;

 const handleMove = useCallback((clientX) => {
 if (!sliderRef.current) return;
 const rect = sliderRef.current.getBoundingClientRect();
 const x = clientX - rect.left;
 
 const usableWidth = rect.width - (paddingX * 2) - thumbWidth;
 const relativeX = x - paddingX - (thumbWidth / 2);
 
 let percentage = (relativeX / usableWidth) * 100;
 percentage = Math.max(0, Math.min(100, percentage));
 
 setLocalValue(percentage);
 onChange(percentage);
 }, [onChange, paddingX, thumbWidth]);

 const handlePointerDown = (e) => {
 setIsDragging(true);
 triggerHaptic(10);
 handleMove(e.clientX || (e.touches && e.touches[0].clientX));
 };

 useEffect(() => {
 const handlePointerMove = (e) => {
 if (!isDragging) return;
 handleMove(e.clientX || (e.touches && e.touches[0].clientX));
 };

 const handlePointerUp = () => {
 setIsDragging(false);
 if (onRelease) onRelease();
 };

 if (isDragging) {
 window.addEventListener('pointermove', handlePointerMove);
 window.addEventListener('pointerup', handlePointerUp);
 return () => {
 window.removeEventListener('pointermove', handlePointerMove);
 window.removeEventListener('pointerup', handlePointerUp);
 };
 }
 }, [isDragging, handleMove, onRelease]);

 return (
 <div 
 className="w-full relative flex items-center cursor-pointer" 
 style={{ height: trackHeight, touchAction: 'none' }}
 dir="ltr" 
 ref={sliderRef} 
 onPointerDown={handlePointerDown} 
 >
 {/* Fat Background Track */}
 <div 
 className="absolute inset-0 bg-[#dbe4ec] rounded-[10px] pointer-events-none"
 ></div>
 
 {/* Green Fill Track */}
 <div 
 className={`absolute pointer-events-none ${isDragging ? '' : 'transition-all duration-200 ease-out'}`}
 style={{ 
 left: paddingX, 
 top: paddingY,
 height: innerTrackHeight,
 width: `calc((100% - ${paddingX * 2 + thumbWidth}px) * ${localValue / 100} + ${thumbWidth}px)`,
 borderTopLeftRadius: 5,
 borderBottomLeftRadius: 5,
 borderTopRightRadius: 0,
 borderBottomRightRadius: 0,
 background: '#40ea00'
 }} 
 >
 </div>
 
 {/* Thumb */}
 <div 
 className={`absolute z-10 flex flex-col items-center justify-center cursor-grab ${isDragging ? '' : 'transition-all duration-200 ease-out'}`}
 style={{ 
 left: `calc(${paddingX}px + (100% - ${paddingX * 2 + thumbWidth}px) * ${localValue / 100})`, 
 top: '50%', transform: 'translateY(-50%)' 
 }}
 >
 <div 
 className={`bg-[#1785fb] rounded-md border-2 border-[#083060] flex flex-col items-center justify-center gap-1 ${isDragging ? 'scale-95' : 'hover:brightness-110'} transition-transform relative overflow-hidden`}
 style={{ 
 width: thumbWidth, 
 height: thumbHeight,
 boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 2.5px 0 rgba(255,255,255,0.4), inset 0 -4px 0 #075bb8, 0 3px 5px rgba(0,0,0,0.2)'
 }}
 >
 {/* Thumb lines */}
 <div className="w-3.5 h-0.5 bg-[#06418c] rounded-full z-10 shadow-[0_0.5px_0_rgba(255,255,255,0.35)]"></div>
 <div className="w-3.5 h-0.5 bg-[#06418c] rounded-full z-10 shadow-[0_0.5px_0_rgba(255,255,255,0.35)]"></div>
 <div className="w-3.5 h-0.5 bg-[#06418c] rounded-full z-10 shadow-[0_0.5px_0_rgba(255,255,255,0.35)]"></div>
 </div>
 </div>
 </div>
 );
}
