import React, { forwardRef } from 'react';

const GameResultRenderer = forwardRef(({ text }, ref) => {
 const lines = text.trim().split('\n');
 const title = lines[0];
 const gridLines = lines.slice(1).filter(l => l.trim().length > 0);

 const renderTitle = (textTitle) => {
 let gameName = textTitle;
 let badges = [];

 const formatTimeStr = (str) => {
 const nums = str.match(/\d+(\.\d+)?/g);
 if (nums) {
 if (nums.length >= 2) return `${nums[0]}:${nums[1].padStart(2, '0')}`;
 if (nums.length === 1) return nums[0];
 }
 return str;
 };

 if (textTitle.includes('🔥')) {
 const parts = textTitle.split('🔥');
 gameName = parts[0].trim();
 const afterFire = parts[1];
 if (afterFire.includes('⏱')) {
 const subParts = afterFire.split('⏱');
 badges.push({ icon: '⏱', text: formatTimeStr(subParts[1].trim()) });
 }
 } else if (textTitle.includes('⏱')) {
 const parts = textTitle.split('⏱');
 gameName = parts[0].trim();
 badges.push({ icon: '⏱', text: formatTimeStr(parts[1].trim()) });
 }
 
 return { gameName, badges };
 };

 const { gameName, badges } = renderTitle(title);

 const getOuterTheme = (name) => {
 if (name.includes('پەیڤۆک')) return 'btn-clash-yellow';
 if (name.includes('دژوار')) return 'btn-clash-red';
 if (name.includes('تایا پەیڤان')) return 'btn-clash-cyan';
 if (name.includes('مامک')) return 'btn-clash-green';
 return 'btn-clash-slate'; 
 };

 const getOuterTextStroke = (name) => {
 if (name.includes('پەیڤۆک')) return 'text-stroke-clash-brown';
 return 'text-stroke-clash';
 };

 const themeClass = getOuterTheme(gameName);
 const textStrokeClass = getOuterTextStroke(gameName);

 return (
 <div ref={ref} className={`flex flex-col gap-2 my-1.5 p-3 rounded-xl cursor-default w-full relative overflow-hidden btn-clash ${themeClass}`} onClick={e => e.stopPropagation()}>
 <div className="absolute inset-0 bg-black/10 pointer-events-none" />
 
 {/* Title Section */}
 <div className="relative z-10 flex flex-col items-center justify-center w-full pt-1">
 <span className={`font-black font-salar text-[20px] tracking-wide text-white ${textStrokeClass} drop-shadow-md whitespace-nowrap`}>{gameName}</span>
 {badges.length > 0 && gameName.includes('تایا پەیڤان') && (
 <div className="flex items-center justify-center gap-1 font-black text-[13.5px] opacity-95 text-white drop-shadow-sm mt-0.5">
 {badges.map((b, i) => (
 <span key={i} className="flex items-center justify-center gap-1 whitespace-nowrap" dir="rtl">
 <span className={`pt-0.5 tracking-wider ${textStrokeClass}`}>{b.text}</span>
 {gameName.includes('تایا پەیڤان') && (
 <span className={`text-[10px] pt-1 opacity-80 font-normal ${textStrokeClass}`}>{b.text.includes(':') ? 'خولەک' : 'چرکە'}</span>
 )}
 </span>
 ))}
 </div>
 )}
 </div>

 {/* Grid Section */}
 <div className="flex flex-col gap-0.75 items-center relative z-10 bg-black/15 p-2.5 rounded-[10px] border border-black/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] w-[90%] mx-auto">
 {gridLines.map((line, rIdx) => {
 const blocks = line.split(' ').filter(b => b.trim().length > 0);
 return (
 <div key={rIdx} className="flex gap-0.75 justify-center">
 {blocks.map((block, cIdx) => {
 const hasCorrect = block.includes('🟩');
 const hasWrongPos = block.includes('🟨');
 const hasAbsent = block.includes('⬛') || block.includes('⬜');

 const letter = block.replace(/[🟩🟨⬛⬜]/gu, '').trim();
 const isEmpty = letter === '' || letter === '_';

 let bgColor = "bg-transparent border-white/20";
 let textColor = "text-white/80";

 if (hasCorrect) {
 bgColor = "bg-[#22c55e] border-[#166534] border-b-[#14532d] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.25)]";
 textColor = "text-white drop-shadow-sm";
 } else if (hasWrongPos) {
 bgColor = "bg-[#f59e0b] border-[#b45309] border-b-[#78350f] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3)]";
 textColor = "text-white drop-shadow-sm";
 } else if (hasAbsent) {
 bgColor = "bg-slate-400 border-slate-500 border-b-slate-600 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.15)]";
 textColor = "text-white drop-shadow-sm";
 } else if (isEmpty) {
 bgColor = "bg-transparent border-white/30";
 } else {
 bgColor = "bg-white border-[#cbd5e1] border-b-[#94a3b8]";
 textColor = "text-[#181a20]";
 }

 return (
 <div key={cIdx} className={`w-5.5 h-5.5 rounded-sm flex items-center justify-center font-black text-[11px] ${bgColor} ${textColor} ${isEmpty || hasAbsent ? 'border border-b-2' : 'border border-b-2'} uppercase leading-none`}>
 {letter === '_' ? '' : letter}
 </div>
 );
 })}
 </div>
 );
 })}
 </div>
 </div>
 );
});

export default GameResultRenderer;
