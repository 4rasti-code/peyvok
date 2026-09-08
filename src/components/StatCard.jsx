import React from 'react';
import { toKuDigits } from '../utils/formatters';

export default function StatCard({ label, value, suffix = '', icon, color = 'text-sky-500', className = '' }) {
 return (
 <div className={`bg-mono-white dark:bg-mono-900/40 rounded-[12px] border border-mono-200 dark:border-mono-800/60 p-3.5 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02] hover:border-mono-300 dark:hover:border-mono-700 ${className}`}>
 {icon && (
 typeof icon === 'string' ? (
 <span className={`material-symbols-outlined ${color} text-2xl mb-0.5`}>
 {icon}
 </span>
 ) : (
 <div className={`${color} h-6 w-full mb-0.5 flex items-center justify-center`}>
 {icon}
 </div>
 )
 )}
 <div className="w-full text-center leading-tight">
 <span className="text-base font-black text-mono-900 dark:text-white tabular-nums inline-block wrap-break-word max-w-full">
 {toKuDigits(value)}
 </span>
 {suffix && <span className="text-[10px] font-bold mr-1.5 inline-block">{suffix}</span>}
 </div>
 <span className="text-[10px] font-bold text-mono-400 dark:text-mono-500 uppercase text-center leading-tight mt-0.5 w-full">
 {label}
 </span>
 </div>
 );
}
