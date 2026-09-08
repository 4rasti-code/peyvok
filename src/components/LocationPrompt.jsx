import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ClashingSwords from './ClashingSwords';

export default function LocationPrompt({ user, profileData, onComplete }) {
 const [isVisible, setIsVisible] = useState(() => {
 if (!user || !profileData) return false;
 const hasSeen = localStorage.getItem('has_seen_location_prompt');
 const isMissingLocation = !profileData.latitude || !profileData.longitude;
 return isMissingLocation && !hasSeen;
 });
 const hasEvaluated = React.useRef(false);

 useEffect(() => {
 if (!user || !profileData || hasEvaluated.current) {
 return;
 }

 hasEvaluated.current = true;
 
 if (!isVisible) {
 onComplete();
 }
 }, [user, profileData, isVisible, onComplete]);

 const handleSkip = () => {
 localStorage.setItem('has_seen_location_prompt', 'true');
 setIsVisible(false);
 onComplete();
 };

 const handleAccept = () => {
 localStorage.setItem('has_seen_location_prompt', 'true');
 if ('geolocation' in navigator) {
 navigator.geolocation.getCurrentPosition(
 async (position) => {
 const { latitude, longitude } = position.coords;
 
 try {
 const { error } = await supabase
 .from('profiles')
 .update({ latitude, longitude })
 .eq('id', user.id);
 
 if (error) {
 console.error('Error updating location:', error);
 }
 } catch (err) {
 console.error('Failed to update location:', err);
 }
 
 setIsVisible(false);
 onComplete();
 },
 (error) => {
 console.warn('Geolocation error:', error);
 // Gracefully close on error/denial
 setIsVisible(false);
 onComplete();
 }
 );
 } else {
 // Geolocation not supported
 setIsVisible(false);
 onComplete();
 }
 };

 if (!isVisible) return null;

 return (
 <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/95 px-4 overflow-hidden" dir="rtl">
 <div className="bg-[#1a1c29] border-2 border-blue-500/20 rounded-3xl p-6 w-full max-w-85 shadow-[0_20px_60px_rgba(6,182,212,0.15)] flex flex-col items-center text-center relative overflow-hidden">
 {/* Glow Effects */}
 <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/30 blur-2xl rounded-full pointer-events-none"></div>
 <div className="absolute -top-12 -left-12 w-40 h-40 bg-cyan-400/30 blur-2xl rounded-full pointer-events-none"></div>
 
 {/* Carbon Texture Overlay */}
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay pointer-events-none"></div>

 {/* Premium Icon Container */}
 <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-[0_10px_40px_-10px_rgba(6,182,212,0.4)] border-2 border-cyan-400/30 relative z-10 overflow-hidden bg-linear-to-br from-blue-600 to-cyan-500">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
 
 {/* Inner ambient glows */}
 <div className="absolute top-0 left-0 w-full h-full bg-linear-to-t from-black/20 to-transparent"></div>
 
 <ClashingSwords className="w-14 h-14 text-white drop-shadow-2xl z-10 hover:scale-110 transition-transform duration-300" />
 </div>

 <h3 className="text-white text-[22px] font-black font-heading mb-4 relative z-10 drop-shadow-md flex items-center justify-center gap-2">
 <span>لێگەڕیانا نێزیک</span>
 <span className="text-2xl drop-shadow-sm">🎯</span>
 </h3>
 
 <p className="text-white/80 text-[14px] mb-8 leading-7 relative z-10 font-medium px-1 drop-shadow-sm">
 ل دەمێ لێگەڕیانا گشتی د مۆدێ هەڤڕکیێ دا، سیستەم دێ ب ئۆتۆماتیکی تە ل گەل وان یاریزانان ئێخیتە د یارییێ دا یێن کو ئاستێ وە وەکی ئێکە و نێزیکی تەنە.
 </p>

 <div className="flex flex-col w-full gap-3 relative z-10">
 <button 
 onClick={handleAccept} 
 className="w-full h-14 rounded-xl font-black text-white text-[16px] transition-all active:scale-95 shadow-[0_4px_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 relative overflow-hidden border border-cyan-400/40 group"
 >
 <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105 bg-linear-to-r from-blue-600 to-cyan-500"></div>
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
 <span className="relative z-10 pt-1 drop-shadow-md">بەردەوام بە</span>
 <span className="relative z-10 text-xl drop-shadow-md">✨</span>
 </button>
 
 <button 
 onClick={handleSkip} 
 className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 font-black text-mono-400 hover:text-white text-[13px] transition-all active:scale-95 border border-transparent hover:border-white/10 relative z-10"
 >
 پاشی
 </button>
 </div>
 </div>
 </div>
 );
}
