import React from 'react';
import { categories } from '../data/wordList';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

export default function CategoryModal({ onSelect, isOpen, onClose }) {
  if (!isOpen) return null;

  const getCategoryColor = (idx) => {
    const colors = [
      'bg-[#0ea5e9]', // Sky Blue
      'bg-emerald-600 dark:bg-emerald-400', // Emerald
      'bg-[#f59e0b]', // Amber
      'bg-[#6366f1]', // Indigo
      'bg-[#f43f5e]', // Rose
      'bg-[#f97316]', // Orange
      'bg-[#8b5cf6]', // Purple
      'bg-[#06b6d4]', // Cyan
    ];
    return colors[idx % colors.length];
  };

  const getIcon = (catName) => {
    switch(catName) {
        case 'ھەموو': return 'apps';
        case 'ئاژەل': return 'pets';
        case 'خوارن': return 'restaurant';
        case 'باژێڕ': return 'location_city';
        case 'سروشت': return 'forest';
        case 'کەلوپەل': return 'inventory_2';
        case 'جھ_و_دەڤەر': return 'terrain';
        case 'کەلتوور': return 'fort';
        case 'جلوبەرگ': return 'styler';
        case 'ڕەنگ': return 'palette';
        case 'لەش': return 'accessibility_new';
        case 'وەلات': return 'public';
        case 'وەرزش': return 'sports_soccer';
        case 'میوە': return 'nutrition';
        case 'خێزان': return 'family_restroom';
        case 'هەست': return 'mood';
        default: return 'stars';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-2000 flex items-center justify-center p-4"
    >
      {/* Opaque Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { triggerHaptic(10); onClose(); }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-xl bg-[#1e293b] border-2 border-white/10 rounded-[40px] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative z-10 overflow-hidden  flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Block - SOLID */}
        <div className="flex flex-col items-center mb-10 pt-2 relative shrink-0">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic(10); onClose(); }}
            className="absolute top-0 right-0 w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl group z-50"
          >
            <span className="material-symbols-outlined text-3xl font-black">close</span>
          </motion.button>
          
          <h2 className="text-4xl font-black font-heading text-white tracking-tight text-center">بەشەکێ ھەلبژێرە</h2>
          <p className="text-[11px] font-black  text-[#facc15] uppercase tracking-[0.3em] mt-3 opacity-90">CHOOSE YOUR CHALLENGE</p>
        </div>

        {/* Scrollable Grid Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 overflow-y-auto no-scrollbar py-2 px-1">
          {categories.map((cat, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(cat)}
              className={`group flex flex-col items-center gap-4 p-6 rounded-[32px] border-2 border-white/10 transition-all shadow-xl cursor-pointer ${getCategoryColor(idx)}`}
            >
              <div className="w-16 h-16 rounded-[20px] bg-white/20 flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl text-white font-bold" style={{fontVariationSettings: "'FILL' 1"}}>
                  {getIcon(cat)}
                </span>
              </div>
              
              <span className="font-black font-rabar text-[16px] text-white tracking-tight text-center leading-none">
                {cat.replace(/_/g, ' ')}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Footer Accent Section */}
        <div className="mt-10 pt-4 flex justify-center text-center border-t-2 border-white/5 shrink-0">
            <span className="text-[11px] text-white/30 font-black  uppercase tracking-[0.25em]">سلێمانى • ھەولێر • دھۆک • کەرکووک</span>
        </div>
        
        {/* Floating Accent Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#facc15]"></div>
      </motion.div>
    </div>
  );
}
