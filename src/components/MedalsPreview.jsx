import React from 'react';
import CloseButton from './CloseButton';
import { motion as Motion } from 'framer-motion';
import { 
 Level10Icon, 
 PahlawanIcon, 
 MamostaBookIcon, 
 SharezaCompassIcon, 
 KurdishShieldIcon, 
 KingOfTheLettersIcon 
} from './CurrencyIcon';

export default function MedalsPreview({ onClose }) {
 const medals = [
 { name: 'سەرەتایی', Icon: Level10Icon, color: 'text-slate-300' },
 { name: 'پەهلەوان', Icon: PahlawanIcon, color: 'text-yellow-400' },
 { name: 'شارەزا', Icon: SharezaCompassIcon, color: 'text-emerald-400' },
 { name: 'مامۆستا', Icon: MamostaBookIcon, color: 'text-cyan-400' },
 { name: 'شانازیا کوردستانێ', Icon: KurdishShieldIcon, color: 'text-red-500' },
 { name: 'شاهێ پەیڤان', Icon: KingOfTheLettersIcon, color: 'text-purple-400' }
 ];

 return (
 <div className="fixed inset-0 z-9999 bg-mono-900/95 flex flex-col items-center justify-center p-4">
 
 <div className="bg-mono-800 border-2 border-mono-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
 <CloseButton onClick={onClose} className="absolute top-4 right-4" />

 <h2 className="text-white font-rabar font-black text-xl mb-6 text-center mt-2">
 تاقیکرنا لڤینا ئایکۆنان
 </h2>

 <div className="grid grid-cols-2 gap-8 place-items-center" dir="rtl">
 {medals.map((medal, idx) => (
 <div key={idx} className="flex flex-col items-center gap-4">
 <div className="w-28 h-28 bg-mono-900 rounded-full flex items-center justify-center border border-mono-700 shadow-[0_0_20px_rgba(255,255,255,0.08)] relative">
 {/* Background pulse effect for unclaimed state */}
 <Motion.div 
 className="absolute inset-0 rounded-full bg-white/5"
 animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
 />
 <medal.Icon size={85} className="" isUnclaimed={true} />
 </div>
 <span className={`text-[15px] font-rabar font-black text-center ${medal.color}`}>
 {medal.name}
 </span>
 </div>
 ))}
 </div>

 <p className="text-mono-400 text-xs font-rabar text-center mt-8 px-4 leading-relaxed" dir="rtl">
 ئەڤە تەنیا بۆ تاقیکرنێ یە، ئەگەر ب دڵێ تە بوون ئەم دێ بێخینە ناڤ پڕۆفایلی ب فەرمی.
 </p>

 </div>

 </div>
 );
}
