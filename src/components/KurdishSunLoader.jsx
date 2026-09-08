import React from 'react';
import { motion as Motion } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';

const KurdishSunLoader = ({ progress = 0, statusText = null }) => {
 // Generate dynamic Kurdish status text if none is provided
 const getStatusText = (p) => {
 if (statusText) return statusText;
 if (p < 20) return 'گرێدان ب سێرڤەران...';
 if (p < 40) return 'پشکنینا داتایێن یاریزانان...';
 if (p < 60) return 'بارکرنا تابلۆیا یاریێ...';
 if (p < 80) return 'ئامادەکرنا فۆنت و دیزاینان...';
 if (p < 99) return 'دوماهیک...';
 return 'ئامادەیە!';
 };
 const currentStatus = getStatusText(progress);

 return (
 <div className="flex flex-col items-center justify-center">
 {/* Modern Progress Section */}
 <div className="w-80 flex flex-col items-center gap-2">
 {/* Status Text & Percentage Layout */}
 <div className="flex w-full items-center justify-center px-2 mb-1">
 <span className="text-sm font-bold text-yellow-600 dark:text-yellow-500/90 font-rabar">
 چاڤەڕێبە...
 </span>
 </div>

 {/* The Track */}
 <div className="w-full h-6 bg-mono-200 dark:bg-mono-900/80 rounded-md overflow-hidden border border-mono-300 dark:border-mono-800 relative p-0.5">
 {/* The Filling Bar */}
 <Motion.div
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 transition={{ duration: 0.5, ease: "easeOut" }}
 className="h-full rounded-sm bg-yellow-500 relative"
 />
 {/* Percentage inside the bar */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
 <span className="text-xs font-black text-white tabular-nums font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" dir="ltr">
 {toKuDigits(Math.round(progress))}٪
 </span>
 </div>
 </div>

 {/* Subtle sub-text based on progress */}
 <div className="h-6 mt-3 flex items-center justify-center">
 <Motion.span
 key={currentStatus}
 initial={{ opacity: 0, y: 5 }}
 animate={{ opacity: 0.5, y: 0 }}
 className="text-xs text-mono-500 dark:text-mono-400 font-medium font-vazirmatn"
 >
 {currentStatus}
 </Motion.span>
 </div>
 </div>
 </div>
 );
};

export default React.memo(KurdishSunLoader);


