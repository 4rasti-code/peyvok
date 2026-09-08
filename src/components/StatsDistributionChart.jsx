import React from 'react';
import { motion as Motion } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';

export default function StatsDistributionChart({ title, dist, maxValue, color, textColor, icon, iconProps, modeId, bgColor, theme }) {
 const isCustomBg = !!bgColor;
 const isLight = theme === 'light';
 
 const cardBg = isCustomBg ? `${bgColor} mb-1 border-none` : "bg-mono-white dark:bg-mono-900/30 border border-mono-200 dark:border-mono-800";
 
 const baseText = isCustomBg ? (isLight ? 'text-amber-950' : 'text-white') : 'text-mono-800 dark:text-mono-200';
 const mutedText = isCustomBg ? (isLight ? 'text-amber-950/70' : 'text-white/70') : 'text-mono-400 dark:text-mono-500';
 
 const trackBg = isCustomBg ? (isLight ? 'bg-black/10' : 'bg-black/20') : 'bg-mono-100 dark:bg-mono-800/30';
 const tileBg = isCustomBg ? (isLight ? 'bg-black/5 border-black/10' : 'bg-black/20 border-black/20') : 'bg-mono-200 dark:bg-mono-800 border-mono-300 dark:border-mono-900';
 const tileText = isCustomBg ? baseText : 'text-mono-500 dark:text-mono-400';
 
 const maxTileBg = isCustomBg ? (isLight ? 'bg-amber-900 text-white border-black/20' : 'bg-white text-mono-900 border-black/20') : `${color} text-white border-black/20`;
 
 const barFill = isCustomBg ? (isLight ? 'bg-amber-900' : 'bg-white') : color;
 const barText = isCustomBg ? (isLight ? 'text-white' : 'text-mono-900') : 'text-white';

 return (
 <div className={`${cardBg} rounded-md p-5 transition-all duration-300 relative overflow-hidden`}>
 <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
 {typeof icon === 'string' ? (
 <span className={`material-symbols-outlined ${textColor} text-2xl`} style={{ fontVariationSettings: "'FILL' 1" }}>
 {icon || 'bar_chart'}
 </span>
 ) : typeof icon === 'function' || typeof icon === 'object' ? (
 <div className={`flex items-center justify-center ${modeId === 'classic' ? 'w-16' : 'w-8'} h-8`}>
 <div className={`scale-[0.5] origin-center flex items-center justify-center pointer-events-none ${modeId === 'classic' ? 'w-32' : 'w-16'} h-16`}>
 {React.createElement(icon, { className: `${modeId === 'classic' ? 'w-32' : 'w-16'} h-16`, ...iconProps })}
 </div>
 </div>
 ) : (
 <span className={`material-symbols-outlined ${textColor} text-2xl`} style={{ fontVariationSettings: "'FILL' 1" }}>
 bar_chart
 </span>
 )}
 <h4 className={`text-[14px] font-black uppercase font-rabar drop-shadow-sm ${baseText}`}>{title}</h4>
 </div>

 {/* Column Headers for Clarity */}
 <div className="flex items-center gap-3 px-1 mb-2 relative z-10">
 <span className={`shrink-0 text-center text-[9px] font-black ${mutedText} ${modeId === 'battle' ? 'w-16' : 'w-8'}`}>
 {modeId === 'battle' ? 'ئەنجام' : 'پێکۆڵ'}
 </span>
 <span className={`flex-1 text-left text-[9px] font-black ${mutedText} pr-2`}>
 {modeId === 'battle' ? 'هەژمار' : 'سەرکەفتن'}
 </span>
 </div>

 <div className="space-y-3 relative z-10">
 {Object.entries(dist).map(([key, value]) => {
 let label = toKuDigits(key);
 const isMax = value === maxValue && value > 0;
 return (
 <div key={key} className="flex items-center gap-3">
 {/* Tile Label */}
 <div className={`
 shrink-0 flex items-center justify-center font-black rounded-md border-b-[3px] transition-all duration-300
 ${modeId === 'battle' ? 'w-16 h-8 px-1 text-[11px]' : 'w-8 h-8 text-[14px]'} 
 ${isMax 
 ? `${maxTileBg} shadow-sm scale-105` 
 : `${tileBg} ${tileText}`}
 `}>
 {label}
 </div>

 {/* 3D Bar Track */}
 <div className={`flex-1 h-8 ${trackBg} rounded-md relative p-0.75 border-none shadow-inner`}>
 <Motion.div 
 initial={{ width: 0 }}
 animate={{ width: value > 0 ? `${(value / maxValue) * 100}%` : '0%' }}
 transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
 className={`h-full flex items-center justify-end px-2.5 relative rounded-sm transition-all
 ${value > 0 ? `${barFill} min-w-9 border-b-[3px] border-black/20 shadow-sm` : 'w-0 overflow-hidden'}
 `}
 >
 {value > 0 && <div className="absolute inset-0 bg-white/10 rounded-sm pointer-events-none" />}
 {value > 0 && (
 <span className={`text-[12px] font-black ${barText} tabular-nums drop-shadow-sm z-10 relative`}>
 {toKuDigits(value)}
 </span>
 )}
 </Motion.div>
 
 {/* Zero State Placeholder */}
 {value === 0 && (
 <div className="absolute inset-y-0 right-3 flex items-center">
 <span className="text-[11px] font-black text-mono-300 dark:text-mono-600 tabular-nums">٠</span>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
