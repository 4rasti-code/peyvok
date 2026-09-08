import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const fallbackAds = [
 {
 id: 'fallback-1',
 is_fallback: true,
 title: 'ڕیکلاما خوە ل ڤێرێ بکە!',
 subtitle: 'بۆ دانانا ڕیکلاما بزنسێ خوە ل ڤێرێ، نۆکە پەیوەندیێ ب مە بکە.',
 icon: 'campaign',
 bgClass: 'bg-mono-900 dark:bg-black border border-amber-500/20 overflow-hidden',
 shadowClass: 'shadow-md dark:shadow-none',
 glowColor: 'bg-amber-500/20',
 iconColor: 'text-amber-400'
 },
 {
 id: 'fallback-2',
 is_fallback: true,
 title: 'بزنسێ خوە پێشبێخە!',
 subtitle: 'ئەڤ بۆشاییە یا تەرخانکریە بۆ ڕیکلامکرنا بزنس و کارێن وە.',
 icon: 'trending_up',
 bgClass: 'bg-mono-900 dark:bg-black border border-cyan-500/20 overflow-hidden',
 shadowClass: 'shadow-md dark:shadow-none',
 glowColor: 'bg-cyan-500/20',
 iconColor: 'text-cyan-400'
 }
];

const AdBanner = () => {
 const [dbAds, setDbAds] = useState([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchAds = async () => {
 try {
 const { data, error } = await supabase
 .from('advertisements')
 .select('*')
 .eq('is_active', true)
 .order('created_at', { ascending: false });

 if (!error && data && data.length > 0) {
 setDbAds(data);
 }
 } catch (err) {
 console.warn("Could not fetch ads, using fallback:", err);
 } finally {
 setLoading(false);
 }
 };

 fetchAds();
 }, []);

 const displayAds = dbAds.length > 0 ? dbAds : fallbackAds;

 useEffect(() => {
 if (displayAds.length > 1) {
 const interval = setInterval(() => {
 setCurrentIndex((prev) => (prev + 1) % displayAds.length);
 }, 5000); // 5 seconds per slide

 return () => clearInterval(interval);
 }
 }, [displayAds.length]);

 if (loading) return null;

 const slideVariants = {
 enter: { x: '-100%', opacity: 1 },
 center: { zIndex: 1, x: 0, opacity: 1 },
 exit: { zIndex: 0, x: '100%', opacity: 1 }
 };

 const currentAd = displayAds[currentIndex];

 return (
 <div className="col-span-2 relative mt-1 aspect-2/1 w-full rounded-md overflow-hidden bg-mono-white dark:bg-black" style={{ boxShadow: currentAd.is_fallback ? 'none' : '0 5px 0 rgba(0,0,0,0.5)' }}>
 <AnimatePresence initial={false}>
 <Motion.div
 key={currentAd.id}
 variants={slideVariants}
 initial="enter"
 animate="center"
 exit="exit"
 transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
 className={`absolute inset-0 w-full h-full border-none outline-none ${currentAd.is_fallback ? currentAd.bgClass + ' ' + currentAd.shadowClass : ''}`}
 >
 {/* Badge */}
 <div className="absolute top-2 right-2 z-20 bg-black/90 px-2.5 py-0.5 rounded border border-white/10 shadow-sm">
 <span className="text-[10px] text-white/90 font-bold tracking-normal uppercase drop-shadow-sm font-rabar">سپۆنسەر</span>
 </div>

 {currentAd.is_fallback ? (
 <div className="relative w-full h-full flex items-center justify-between p-4 pt-8 overflow-hidden gap-3">
 {/* Animated Glow Backdrops */}
 <div className={`absolute -top-12 -left-12 w-40 h-40 rounded-full ${currentAd.glowColor} opacity-30 animate-pulse`} />
 <div className={`absolute -bottom-12 -right-12 w-40 h-40 rounded-full ${currentAd.glowColor} opacity-30 animate-pulse`} style={{ animationDelay: '1.5s' }} />
 
 <div className="relative z-10 flex flex-col items-start text-right flex-1">
 <h3 className="text-base sm:text-lg font-black font-heading text-white drop-shadow-md w-full mb-1 whitespace-normal leading-tight">{currentAd.title}</h3>
 <span className="text-[11px] sm:text-xs font-medium font-rabar text-white/60 leading-relaxed whitespace-normal">{currentAd.subtitle}</span>
 </div>
 <div className="flex items-center justify-center relative shrink-0 z-10">
 <Motion.div 
 animate={{ y: [0, -5, 0] }} 
 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
 className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 shadow-inner"
 >
 <span className={`material-symbols-outlined text-[24px] sm:text-[28px] drop-shadow-md ${currentAd.iconColor}`}>{currentAd.icon}</span>
 </Motion.div>
 </div>
 {/* Subtle glass overlay */}
 <div className="absolute inset-0 bg-linear-to-br from-white/4 to-transparent pointer-events-none" />
 </div>
 ) : (
 <>
 <img 
 src={currentAd.image_url} 
 alt={currentAd.title || 'Ad'} 
 className="w-full h-full object-cover"
 />
 {currentAd.title && (
 <div className="absolute bottom-0 inset-x-0 h-1/2 bg-linear-to-t from-black/80 to-transparent flex items-end justify-end p-3 pb-4 pointer-events-none">
 <span className="text-white font-bold text-xs shadow-sm text-right font-rabar">{currentAd.title}</span>
 </div>
 )}
 </>
 )}
 </Motion.div>
 </AnimatePresence>
 </div>
 );
};

export default AdBanner;
