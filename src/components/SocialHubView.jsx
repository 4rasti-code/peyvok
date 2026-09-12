import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { useAudio } from '../context/AudioContext';
import { triggerHaptic } from '../utils/haptics';
import Avatar from './Avatar';
import GameResultRenderer from './GameResultRenderer';
import PublicProfileModal from './PublicProfileModal';
import ReportModal from './ReportModal';
import ImageEditorModal from './ImageEditorModal';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useInView } from 'react-intersection-observer';
import { toKuDigits } from '../utils/formatters';
import ClashingSwords from './ClashingSwords';
import { getLevelTier, getLevelData } from '../utils/progression';
import { NAME_FONTS } from '../constants/nameFonts';
import { NAME_STYLES } from '../constants/nameStyles';
import { BUNDLES } from '../constants/bundles';
import PremiumName from './PremiumName';
import { MEDALS } from '../constants/medals';
import { FilsIcon, DerhemIcon, DinarIcon, HintIcon, MagnetIcon, XPIcon, SpinTicketIcon } from './CurrencyIcon';
import CloseButton from './CloseButton';

const renderPreviewText = (text) => {
 if (!text) return 'یێ ل سەر هێلێیە';

 if (text.includes('[VOICE:')) {
 return <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-[#00a884]">mic</span> دەنگ</span>;
 }

 if (text.includes('[IMAGE:')) {
 return <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] opacity-70">photo_camera</span> وێنە</span>;
 }

 if (text.includes('[STICKER:')) {
 return <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] opacity-70">mood</span> ستیکەر</span>;
 }

 if (text.includes('[MEDAL_SHARE:')) {
 const match = text.match(/\[MEDAL_SHARE:(.*?)\]/);
 if (match && match[1]) {
 const medalId = match[1];
 const medal = MEDALS.find(m => m.id === medalId);
 return (
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-[14px] text-amber-500">military_tech</span>
 {medal ? medal.title || medal.name : 'پلەیەک'}
 </span>
 );
 }
 }

 if (text.includes('[VOICE_FEATURE_CARD]')) {
 return <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-amber-500">campaign</span> تایبەتمەندییا نوی</span>;
 }

 if (text.includes('[TUTORIAL_SHARE:')) {
 return <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-[#3b82f6]">menu_book</span> فێرکاریا یاریێ</span>;
 }

 if (text.match(/^https?:\/\//)) {
 return <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] opacity-70">gif</span> گیف</span>;
 }
 if (text.startsWith('[BATTLE_RESULT]') ||
 (/پەیڤۆک|تایا پەیڤان|پەیڤێن دژوار|هەڤڕکی|مامک|ئەنجام/.test(text) && (text.includes('🟩') || text.includes('🟨') || text.includes('⬛') || text.includes('⬜')))
 ) {
 return <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-[#c9b458]">sports_esports</span> ئەنجامێن یاریێ</span>;
 }

 return text;
};

// Custom Long Press Hook for WhatsApp-like gestures
function useLongPress(onLongPress, onClick, ms = 500) {
 const timerRef = useRef();
 const isMovedRef = useRef(false);
 const startPosRef = useRef({ x: 0, y: 0 });

 const start = (e) => {
 isMovedRef.current = false;
 const clientX = e.touches ? e.touches[0].clientX : e.clientX;
 const clientY = e.touches ? e.touches[0].clientY : e.clientY;
 startPosRef.current = { x: clientX, y: clientY };

 timerRef.current = setTimeout(() => {
 if (!isMovedRef.current) {
 onLongPress(e);
 }
 }, ms);
 };

 const clear = (e, shouldClick = false) => {
 if (timerRef.current) clearTimeout(timerRef.current);
 if (shouldClick && !isMovedRef.current) {
 onClick?.(e);
 }
 };

 const move = (e) => {
 const clientX = e.touches ? e.touches[0].clientX : e.clientX;
 const clientY = e.touches ? e.touches[0].clientY : e.clientY;
 const dist = Math.sqrt(
 Math.pow(clientX - startPosRef.current.x, 2) + Math.pow(clientY - startPosRef.current.y, 2)
 );
 if (dist > 10) isMovedRef.current = true;
 };

 return {
 onMouseDown: start,
 onMouseUp: (e) => clear(e, true),
 onMouseLeave: (e) => clear(e, false),
 onTouchStart: start,
 onTouchEnd: (e) => clear(e, true),
 onTouchMove: move,
 onMouseMove: move,
 onContextMenu: (e) => {
 e.preventDefault();
 onLongPress(e);
 }
 };
}

const GAME_ICONS = [FilsIcon, HintIcon, MagnetIcon, DinarIcon, XPIcon, SpinTicketIcon, DerhemIcon];
// More material icons to increase the "doodle" variety
const MATERIAL_ICONS = ['forum', 'sports_esports', 'extension', 'emoji_emotions', 'favorite', 'payments', 'local_fire_department', 'bolt', 'star', 'menu_book', 'smart_toy', 'send', 'mail', 'trophy', 'rocket', 'music_note', 'local_cafe', 'brush', 'diamond', 'pets'];
const ALL_ICONS = [...GAME_ICONS, ...MATERIAL_ICONS];

const ChatWallpaperPattern = memo(() => {

 const patternItems = React.useMemo(() => {
 const items = [];
 const cols = 50;
 const rows = 50;
 const cellSize = 60; // 3000 / 50 = 60px

 // Stable pseudo-random generator
 const random = (seed) => {
 let x = Math.sin(seed) * 10000;
 return x - Math.floor(x);
 };

 let seed = 1;
 for (let r = 0; r < rows; r++) {
 for (let c = 0; c < cols; c++) {
 const item = ALL_ICONS[seed % ALL_ICONS.length];

 // Jitter: random offset between -40% and 40% of cell size
 const jitterX = (random(seed++) - 0.5) * 0.8 * cellSize;
 const jitterY = (random(seed++) - 0.5) * 0.8 * cellSize;

 const left = (c * cellSize) + (cellSize / 2) + jitterX;
 const top = (r * cellSize) + (cellSize / 2) + jitterY;

 const rotation = random(seed++) * 360;
 const scale = 0.8 + (random(seed++) * 0.7); // 0.8 to 1.5

 items.push({ id: `${r}-${c}`, item, left, top, rotation, scale });
 }
 }
 return items;
 }, []);

 return (
 <div className="absolute z-0 pointer-events-none opacity-[0.06] select-none"
 style={{
 width: '3000px',
 height: '3000px',
 left: '50%',
 top: '50%',
 marginLeft: '-1500px',
 marginTop: '-1500px',
 transform: 'rotate(-5deg)'
 }}>
 {patternItems.map(({ id, item, left, top, rotation, scale }) => {
 const Icon = item;
 return (
 <div key={id} className="absolute text-white"
 style={{
 left: `${left}px`,
 top: `${top}px`,
 transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`
 }}>
 {typeof item === 'string' ? (
 <span className="material-symbols-outlined block" style={{ fontSize: '18px' }}>{item}</span>
 ) : (
 <Icon size={18} disabled={true} />
 )}
 </div>
 );
 })}
 </div>
 );
});



function MessageContextMenu({ m, rect, isMe, onReact, onReply, onCopy, onDelete, onReport, onClose, isSticker = false, isFavorite = false, onToggleFavorite = null }) {
 const menuHeight = 220; // approximate max height of the context menu
 const menuWidth = 192; // max-w-48
 const screenW = window.innerWidth;
 const screenH = window.innerHeight;

 // Decide Y position intelligently:
 // 1. If there's space above the message (at least menuHeight), put it above.
 // 2. If there's space below the message, put it below.
 // 3. Otherwise, vertically center it on screen (it will overlap the message, but won't overlap top/bottom bars).
 let finalTop = null;
 let finalBottom = null;
 let originY = '';

 if (rect.top > menuHeight + 20) {
 // Fits above
 finalBottom = screenH - rect.top + 10;
 originY = 'bottom';
 } else if (screenH - rect.bottom > menuHeight + 20) {
 // Fits below
 finalTop = rect.bottom + 10;
 originY = 'top';
 } else {
 // Doesn't fit above or below (huge message). Center it on screen.
 finalTop = (screenH - menuHeight) / 2;
 originY = 'top';
 }

 // Decide X position:
 let finalRight = isMe ? Math.min(screenW - menuWidth, Math.max(10, screenW - rect.right)) : null;
 let finalLeft = !isMe ? Math.min(screenW - menuWidth, Math.max(10, rect.left)) : null;
 let originX = isMe ? 'right' : 'left';

 return (
 <div
 className="fixed inset-0 z-100 flex flex-col items-center justify-center p-4"
 onContextMenu={(e) => e.preventDefault()}
 >
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-transparent"
 />

 <Motion.div
 initial={{ scale: 0.8, opacity: 0, y: originY === 'bottom' ? 20 : -20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.8, opacity: 0, y: originY === 'bottom' ? 20 : -20 }}
 className="relative z-10 w-full max-w-48"
 style={{
 position: 'fixed',
 top: finalTop !== null ? finalTop : undefined,
 bottom: finalBottom !== null ? finalBottom : undefined,
 left: finalLeft !== null ? finalLeft : undefined,
 right: finalRight !== null ? finalRight : undefined,
 transformOrigin: `${originY} ${originX}`
 }}
 >
 {/* Reactions Header */}
 <div className="bg-white border border-black/10 rounded-[20px] shadow-[0_4px_0_#b4becd] mb-2 p-1.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
 {['❤️', '😂', '👍', '🔥', '😮', '🙏'].map((emoji, idx) => (
 <Motion.button
 key={emoji}
 whileHover={{ scale: 1.3, y: -5 }}
 whileTap={{ scale: 0.9 }}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.05 } }}
 onClick={() => { onReact(emoji); onClose(); }}
 className="w-8 h-8 flex items-center justify-center text-[20px] transition-colors cursor-pointer"
 >
 {emoji}
 </Motion.button>
 ))}
 </div>

 {/* Action List */}
 <div className="bg-white border border-black/10 rounded-[20px] shadow-[0_4px_0_#b4becd] p-1 flex flex-col gap-0.5">
 <button
 onClick={() => { onReply(m); onClose(); }}
 className="flex items-center justify-between w-full py-2 px-3 hover:bg-slate-100 active:bg-slate-200 text-slate-800 transition-all rounded-2xl"
 >
 <span className="font-bold text-[12px]">بەرسڤدان</span>
 <span className="material-symbols-outlined text-[13px] text-slate-400">reply</span>
 </button>

 <div className="h-px bg-slate-200/60 mx-2" />

 <button
 onClick={() => { onCopy(m.content || m.text); onClose(); }}
 className="flex items-center justify-between w-full py-2 px-3 hover:bg-slate-100 active:bg-slate-200 text-slate-800 transition-all rounded-2xl"
 >
 <span className="font-bold text-[12px]">ژبەرکرن</span>
 <span className="material-symbols-outlined text-[13px] text-slate-400">content_copy</span>
 </button>

 {isSticker && onToggleFavorite && (
 <>
 <div className="h-px bg-slate-200/60 mx-2" />
 <button
 onClick={() => { onToggleFavorite(); onClose(); }}
 className={`flex items-center justify-between w-full py-2 px-3 hover:bg-slate-100 active:bg-slate-200 transition-all rounded-2xl ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-slate-800'}`}
 >
 <span className="font-bold text-[12px]">{isFavorite ? 'لابرن ژ پەسەندکرییان' : 'زێدەکرن بۆ پەسەندکرییان'}</span>
 <span className="material-symbols-outlined text-[13px] text-yellow-500">{isFavorite ? 'heart_broken' : 'star'}</span>
 </button>
 </>
 )}

 {isMe && (
 <>
 <div className="h-px bg-slate-200/60 mx-2" />
 <button
 onClick={() => { onDelete(m); onClose(); }}
 className="flex items-center justify-between w-full py-2 px-3 hover:bg-red-50 active:bg-red-100 text-red-500 transition-all rounded-2xl"
 >
 <span className="font-bold text-[12px]">ژێبرن</span>
 <span className="material-symbols-outlined text-[13px]">delete</span>
 </button>
 </>
 )}

 {!isMe && onReport && (
 <>
 <div className="h-px bg-slate-200/60 mx-2" />
 <button
 onClick={() => { onReport(m); onClose(); }}
 className="flex items-center justify-between w-full py-2 px-3 hover:bg-orange-50 active:bg-orange-100 text-orange-500 transition-all rounded-2xl"
 >
 <span className="font-bold text-[12px]">ڕاپۆرتکرن</span>
 <span className="material-symbols-outlined text-[13px]">flag</span>
 </button>
 </>
 )}
 </div>
 </Motion.div>
 </div>
 );
}


const BattleResultRenderer = ({ text, onProfileClick: _onProfileClick }) => {
 let data = null;
 let hasError = false;
 try {
 const jsonStr = text.replace('[BATTLE_RESULT]', '').trim();
 data = JSON.parse(jsonStr);
 } catch (_e) {
 hasError = true;
 }

 if (hasError || !data) {
 return <div className="text-[10px] text-red-500 italic p-2 bg-red-500/10 rounded">هەڵە د خاندنا ئەنجامان دا</div>;
 }

 let myTier = { stop1: 'rgba(255,255,255,0.2)', stop2: 'rgba(255,255,255,0.2)' };
 let oppTier = { stop1: 'rgba(255,255,255,0.2)', stop2: 'rgba(255,255,255,0.2)' };
 try {
 const myLevel = data.myLevel || 1;
 myTier = getLevelTier(myLevel);
 const oppLevel = data.oppLevel || 1;
 oppTier = getLevelTier(oppLevel);
 } catch (_e) {
 // Ignore invalid level data safely
 }

 const oppWon = data.oppScore > data.myScore;

 let leftPlayer = {
 id: data.myId, name: data.myName, avatar: data.myAvatar, score: data.myScore, xp: data.myXP, tier: myTier
 };
 let rightPlayer = {
 id: data.oppId, name: data.oppName, avatar: data.oppAvatar, score: data.oppScore, xp: data.oppXP, tier: oppTier
 };

 if (oppWon) {
 leftPlayer = {
 id: data.oppId, name: data.oppName, avatar: data.oppAvatar, score: data.oppScore, xp: data.oppXP, tier: oppTier
 };
 rightPlayer = {
 id: data.myId, name: data.myName, avatar: data.myAvatar, score: data.myScore, xp: data.myXP, tier: myTier
 };
 }

 return (
 <div className="flex flex-col mt-3 mb-2 mx-auto cursor-default w-full max-w-100 btn-clash btn-clash-split relative overflow-hidden" onClick={e => e.stopPropagation()}>

 {/* Background Pattern (Carbon Fibre) matching Lobby */}
 <div className="absolute inset-0 z-0">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay pointer-events-none" />

 {/* Sword Light Sweep Effect */}
 <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
 <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-linear-to-r from-transparent via-white/30 to-transparent animate-glass-sweep mix-blend-overlay" />
 </div>
 </div>

 {/* 1. Header Notch (Attached to Top) */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
 <div className="bg-white/95 px-3 py-0.75 rounded-b-lg shadow-md border-x border-b border-black/10">
 <span className="text-mono-900 text-[10px] md:text-[11px] font-black whitespace-nowrap leading-none block pt-0.5">ئەنجامێن هەڤڕکیێ</span>
 </div>
 </div>

 {/* 2. Middle Area (Perfectly Divided Grid) */}
 {/* 1fr (Left) | 40px (Swords) | 1fr (Right) */}
 <div className="grid grid-cols-[1fr_40px_1fr] items-center w-full relative z-20 px-1.5 pt-6 pb-4" dir="ltr">

 {/* P1 (Left Side - Blue) */}
 <div className="flex items-center justify-between w-full">

 {/* Avatar (Fixed Size) */}
 <div
 className="p-0.5 rounded-full shadow-md shrink-0 flex items-center justify-center transition-all"
 style={{ background: `linear-gradient(135deg, ${leftPlayer.tier.stop1}, ${leftPlayer.tier.stop2})` }}
 >
 {leftPlayer.avatar && leftPlayer.avatar !== 'default' ? (
 <img src={leftPlayer.avatar} alt="Avatar" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover bg-white border border-black/10" />
 ) : (
 <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center text-[13px] font-black text-[#e65c00] uppercase border border-black/10">
 {(leftPlayer.name || 'ی')[0]}
 </div>
 )}
 </div>

 {/* Name (Flexible but STRICTLY limited so it doesn't touch others) */}
 <div className="flex-1 px-1.5 flex justify-start min-w-0">
 <span className="truncate text-[11px] md:text-xs font-bold text-white drop-shadow-sm text-left" dir="auto">
 {leftPlayer.name}
 </span>
 </div>

 {/* Score (Fixed Box) */}
 <div className="shrink-0 w-6 flex justify-center">
 <span className="text-2xl font-black drop-shadow-md text-white leading-none mt-1">
 {toKuDigits(leftPlayer.score)}
 </span>
 </div>

 </div>

 {/* Center: Swords (Fixed 40px Area) */}
 <div className="flex items-center justify-center relative z-40 w-10">
 <div className="bg-white/95 p-1.5 rounded-md shadow-md border border-black/10 flex items-center justify-center">
 <ClashingSwords className="w-5 h-5 text-mono-900" />
 </div>
 </div>

 {/* P2 (Right Side - Red) */}
 <div className="flex items-center justify-between w-full">

 {/* Score (Fixed Box) */}
 <div className="shrink-0 w-6 flex justify-center">
 <span className="text-2xl font-black drop-shadow-md text-white leading-none mt-1">
 {toKuDigits(rightPlayer.score)}
 </span>
 </div>

 {/* Name (Flexible but STRICTLY limited) */}
 <div className="flex-1 px-1.5 flex justify-end min-w-0">
 <span className="truncate text-[11px] md:text-xs font-bold text-white drop-shadow-sm text-right" dir="auto">
 {rightPlayer.name}
 </span>
 </div>

 {/* Avatar (Fixed Size) */}
 <div
 className="p-0.5 rounded-full shadow-md shrink-0 flex items-center justify-center transition-all"
 style={{ background: `linear-gradient(135deg, ${rightPlayer.tier.stop1}, ${rightPlayer.tier.stop2})` }}
 >
 {rightPlayer.avatar && rightPlayer.avatar !== 'default' ? (
 <img src={rightPlayer.avatar} alt="Avatar" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover bg-white border border-black/10" />
 ) : (
 <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center text-[13px] font-black text-[#e65c00] uppercase border border-black/10">
 {(rightPlayer.name || 'ی')[0]}
 </div>
 )}
 </div>

 </div>

 </div>

 {/* Footer Edge */}
 <div className="w-full relative z-10 bg-black/25 h-1.5"></div>
 </div>
 );
};



const CustomAudioPlayer = ({ src, isMe }) => {
 const audioRef = useRef(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const [duration, setDuration] = useState(0);
 const [currentTime, setCurrentTime] = useState(0);

 const togglePlayPause = () => {
 if (!audioRef.current) return;
 if (isPlaying) {
 audioRef.current.pause();
 } else {
 audioRef.current.play();
 }
 setIsPlaying(!isPlaying);
 };

 const onLoadedMetadata = () => {
 if (audioRef.current) {
 if (audioRef.current.duration === Infinity || isNaN(audioRef.current.duration)) {
 // Fix for Chrome WebM duration bug
 audioRef.current.currentTime = 1e101;
 audioRef.current.ontimeupdate = () => {
 audioRef.current.ontimeupdate = null;
 audioRef.current.currentTime = 0;
 setDuration(audioRef.current.duration);
 };
 } else {
 setDuration(audioRef.current.duration);
 }
 }
 };

 const onTimeUpdate = () => {
 if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
 };

 const onEnded = () => {
 setIsPlaying(false);
 setCurrentTime(0);
 if (audioRef.current) audioRef.current.currentTime = 0;
 };

 const handleSeek = (e) => {
 const time = Number(e.target.value);
 if (audioRef.current) {
 audioRef.current.currentTime = time;
 setCurrentTime(time);
 }
 };

 const formatTime = (time) => {
 if (!time || isNaN(time) || !isFinite(time)) return "0:00";
 const min = Math.floor(time / 60);
 const sec = Math.floor(time % 60);
 return `${min}:${sec < 10 ? '0' : ''}${sec}`;
 };

 const fakeWaveform = [20, 35, 25, 50, 70, 45, 30, 60, 80, 50, 40, 60, 75, 70, 40, 50, 65, 40, 20, 50, 65, 55, 30, 40, 20, 50, 30, 20, 35, 50, 70, 45, 40, 60, 30];
 const progressPercent = duration ? (currentTime / duration) * 100 : 0;

 return (
 <div className={`flex flex-col w-56 xs:w-60 sm:w-64 -my-0.5 ${isMe ? 'ml-5' : 'mr-4'}`} dir="ltr" onContextMenu={e => e.preventDefault()} onClick={e => e.stopPropagation()}>

 <div className="flex flex-row items-center gap-2">
 {/* Circular Solid Play Button */}
 <button
 onClick={togglePlayPause}
 className="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm ml-1"
 >
 {isPlaying ? (
 <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
 <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
 </svg>
 ) : (
 <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="ml-px">
 <path d="M8 5v14l11-7z" />
 </svg>
 )}
 </button>

 {/* Waveform Wrapper */}
 <div className="relative h-3.5 flex-1 flex items-center justify-between">
 {fakeWaveform.map((h, i) => {
 const barPercent = (i / fakeWaveform.length) * 100;
 const isPlayed = barPercent <= progressPercent;
 return (
 <div
 key={i}
 className={`w-[2.5px] rounded-full transition-colors duration-150 ${isPlayed ? 'bg-primary' : 'bg-current opacity-25'}`}
 style={{ height: `${Math.max(15, h)}%` }}
 />
 );
 })}

 {/* Invisible Range Slider */}
 <input
 type="range"
 min="0"
 max={duration || 100}
 value={currentTime}
 onChange={handleSeek}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 />
 </div>
 </div>

 <div className="flex justify-end items-center gap-1 text-[9px] font-bold font-inter leading-none pr-1 pt-0.5">
 <span className="opacity-60">{isPlaying ? formatTime(currentTime) : formatTime(duration)}</span>
 <span className="material-symbols-outlined text-[12px] opacity-70">mic</span>
 </div>

 <audio
 ref={audioRef}
 src={src}
 onLoadedMetadata={onLoadedMetadata}
 onTimeUpdate={onTimeUpdate}
 onEnded={onEnded}
 preload="metadata"
 className="hidden"
 />
 </div>
 );
};

const SingleAnimatedEmoji = memo(({ emoji, className = "inline-block object-contain w-[1em] h-[1em]" }) => {
 const [error, setError] = useState(false);

 const hexCode = React.useMemo(() => {
 let codePoints = [];
 for (let char of emoji) {
 let code = char.codePointAt(0);
 if (code !== 0xFE0F) {
 codePoints.push(code.toString(16));
 }
 }
 return codePoints.join('_');
 }, [emoji]);

 if (error || !hexCode) return <span className={className}>{emoji}</span>;

 return (
 <img
 src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${hexCode}/512.webp`}
 alt={emoji}
 className={className}
 onError={() => setError(true)}
 />
 );
});

const AnimatedEmojiRenderer = memo(({ text }) => {
 const emojis = React.useMemo(() => {
 try {
 if (window.Intl && window.Intl.Segmenter) {
 const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
 return Array.from(segmenter.segment(text)).map(s => s.segment).filter(s => s.trim().length > 0);
 }
 } catch (_e) { /* ignore */ }
 return Array.from(text).filter(s => s.trim().length > 0);
 }, [text]);

 return (
 <div className="flex items-center justify-center flex-wrap gap-1" dir="ltr">
 {emojis.map((emoji, idx) => (
 <SingleAnimatedEmoji key={idx} emoji={emoji} />
 ))}
 </div>
 );
});

const MessageItem = memo(function MessageItem({ m, isMe, onSeen, onLongPress, onReactionLongPress, currentUserId, currentUserNickname, showNickname = false, reactionUsers = {}, onProfileClick, topDailyPlayers = [], onImageClick, onOpenHowToPlay, isLastReadByPartner, partnerInfo }) {
 const { ref, inView } = useInView({
 threshold: 0.5,
 triggerOnce: true
 });

 const isDeleted = m.content === 'ئەڤ نامەیە هاتە ژێبرن' || m.content === '🚫 ئەڤ نامەیە هاتە ژێبرن';

 const msgContent = m.content || m.text || '';
 const isMentioned = !isMe && currentUserNickname && msgContent.includes(`@${currentUserNickname}`);
 const isOnlyVoice = /^\s*\[VOICE:.*?\]\s*$/.test(msgContent);
 const isOnlyEmoji = /^[\p{Emoji}\s]+$/u.test(msgContent) && msgContent.trim().length > 0 && !/[a-zA-Z0-9\u0600-\u06FF]/.test(msgContent);
 const isOnlySticker = /^\s*\[STICKER:.*?\]\s*$/.test(msgContent);
 const isMatchResult = msgContent.startsWith('[BATTLE_RESULT]') || ((msgContent.includes('🟩') || msgContent.includes('🟨') || msgContent.includes('⬛') || msgContent.includes('⬜')) && /پەیڤۆک|تایا پەیڤان|پەیڤێن دژوار|هەڤڕکی|مامک|ئەنجام/.test(msgContent));
 const isMedalShare = /^\s*\[MEDAL_SHARE:.*?\]\s*$/.test(msgContent);
 const isTutorialShare = /^\s*\[TUTORIAL_SHARE(?:|:[^\]]+)\]\s*$/.test(msgContent);
 const isDownloadShare = /^\s*\[DOWNLOAD_SHARE\]\s*$/.test(msgContent);

 const renderFormattedText = (text) => {
 if (!text) return null;
 const parts = text.split(/(\[IMAGE:.*?\]|\[STICKER:.*?\]|\[VOICE:.*?\]|\[MEDAL_SHARE:.*?\]|\[VOICE_FEATURE_CARD\]|\[TUTORIAL_SHARE(?:|:[^\]]+)\]|\[DOWNLOAD_SHARE\]|@\S+|https?:\/\/\S+)/g);
 return parts.map((part, i) => {
 if (part.startsWith('@')) {
 return <span key={i} className="font-bold text-primary px-0.5 bg-primary/10 rounded">{part}</span>;
 }
 if (part.startsWith('[IMAGE:') && part.endsWith(']')) {
 const url = part.substring(7, part.length - 1);
 return (
 <div key={i} className="relative block mt-2 mb-2 w-full max-w-64 aspect-auto overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/5 dark:border-white/5 group bg-mono-200 dark:bg-mono-800" onContextMenu={e => e.preventDefault()}>
 {/* Smooth Skeleton Loader background while loading */}
 <div className="absolute inset-0 animate-pulse bg-mono-300 dark:bg-mono-700 pointer-events-none" />
 <img
 src={url}
 alt="Attachment"
 className="relative z-0 w-full h-auto max-h-80 object-cover pointer-events-none select-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
 style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
 draggable="false"
 onLoad={(e) => { if (e.target.previousSibling) e.target.previousSibling.style.display = 'none'; }}
 />
 {/* The transparent overlay that prevents right click but handles fullscreen click */}
 <div
 className="absolute inset-0 z-10 cursor-pointer bg-black/0 transition-colors duration-200 group-hover:bg-black/10 dark:group-hover:bg-white/5"
 onContextMenu={e => e.preventDefault()}
 onClick={(e) => { e.stopPropagation(); if (onImageClick) onImageClick(url); }}
 />
 </div>
 );
 }
 if (part.startsWith('[STICKER:') && part.endsWith(']')) {
 const url = part.substring(9, part.length - 1);
 return (
 <img key={i} src={url} alt="Sticker" className="w-20 md:w-24 h-auto object-contain pointer-events-none select-none drop-shadow-md" loading="lazy" />
 );
 }
 if (part.startsWith('[VOICE:') && part.endsWith(']')) {
 const url = part.substring(7, part.length - 1);
 return <CustomAudioPlayer key={i} src={url} isMe={isMe} />;
 }
 if (part.startsWith('[MEDAL_SHARE:') && part.endsWith(']')) {
 const medalId = part.substring(13, part.length - 1);
 const medal = MEDALS.find(m => m.id === medalId);
 if (!medal) return <span key={i} className="text-xs text-mono-500 italic block mt-1">[پلە نەهاتە دیتن]</span>;

 const MedalIcon = medal.IconComponent;
 return (
 <div key={i} className="relative flex flex-col items-center justify-center mt-1 -mb-1 mx-auto w-full" dir="rtl">
 {/* The Medal/Rank Icon */}
 <MedalIcon size={84} className={`relative z-20 w-24 h-24 ${medal.color} drop-shadow-[0_6px_6px_rgba(0,0,0,0.3)] mb-2`} />

 {/* Text Pill below the medal */}
 <div className="relative bg-[#1e293b] rounded-[10px] px-4 py-2 flex flex-col items-center z-10 shadow-[0_4px_0_#0f172a] border border-[#334155] min-w-28 max-w-48 w-fit">
 <span className="text-[10px] text-white/60 font-bold mb-0.5">پلەیەکا نوی وەرگرت!</span>
 <span className={`text-[15px] font-black ${medal.color} text-center leading-tight`} style={{ whiteSpace: 'normal', wordBreak: 'keep-all' }}>{medal.name}</span>
 </div>
 </div>
 );
 }

 if (part === '[VOICE_FEATURE_CARD]') {
 return (
 <div key={i} className="my-2 bg-linear-to-b from-mono-white to-amber-50/30 dark:from-mono-900 dark:to-[#0f0a05] rounded-lg border border-amber-500/50 w-65 xs:w-[280px] sm:w-[320px] pt-5 pb-3 px-3 overflow-hidden flex flex-col relative transition-colors duration-500 shadow-xl shadow-amber-500/10 cursor-default" dir="rtl" onClick={e => e.stopPropagation()}>
 <div className="absolute -top-4 -right-2 z-20 opacity-20 pointer-events-none">
 <span className="material-symbols-outlined text-[64px] text-amber-500">campaign</span>
 </div>
 <h2 className="text-[14px] font-black text-mono-900 dark:text-white mb-2 relative z-10">
 تایبەتمەندییا نوی!
 </h2>
 <div className="bg-linear-to-br from-mono-100/80 to-white/50 dark:from-[#252525]/80 dark:to-[#181818]/40 rounded-md p-2.5 border border-mono-200/50 dark:border-white/5 flex gap-2.5 items-start relative z-10 hover:scale-[1.02] transition-transform">
 <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-lg border border-amber-500/20 shadow-inner">
 🎤
 </div>
 <div className="flex flex-col pt-0.5 min-w-0">
 <h3 className="text-[12px] font-black text-amber-600 dark:text-amber-400 mb-0.5 truncate">سیستەمێ ڤۆیس چات</h3>
 <p className="text-[10.5px] font-bold text-mono-600 dark:text-mono-300 leading-relaxed whitespace-normal wrap-break-word">
 نۆکە تو دشێی ب ڕێیا دەنگی دگەل هەڤرکێ خوە د ناڤ یارییا هەڤڕکیێ دا باخڤی!
 </p>
 </div>
 </div>
 </div>
 );
 }

 if (part.startsWith('[TUTORIAL_SHARE')) {
 const tabMatch = part.match(/^\[TUTORIAL_SHARE:?(.*)\]$/);
 const tabId = tabMatch && tabMatch[1] ? tabMatch[1] : 'classic';

 const tutorialStyles = {
 classic: {
 title: 'کلاسیک',
 modeName: 'پەیڤۆک کلاسیک',
 buttonColor: 'from-[#eab308] to-[#ca8a04]',
 buttonShadow: 'shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#854d0e,0_4px_6px_rgba(0,0,0,0.2)]',
 buttonActive: 'group-active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_0px_0_#854d0e,0_2px_4px_rgba(0,0,0,0.2)]',
 },
 multiplayer: {
 title: 'ھەڤڕکی',
 modeName: 'ھەڤڕکی',
 buttonColor: 'from-[#ef4444] to-[#3b82f6]',
 buttonShadow: 'shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#1e3a8a,0_4px_6px_rgba(0,0,0,0.2)]',
 buttonActive: 'group-active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_0px_0_#1e3a8a,0_2px_4px_rgba(0,0,0,0.2)]',
 },
 mamak: {
 title: 'مامک',
 modeName: 'مامک',
 buttonColor: 'from-[#22c55e] to-[#16a34a]',
 buttonShadow: 'shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#15803d,0_4px_6px_rgba(0,0,0,0.2)]',
 buttonActive: 'group-active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_0px_0_#15803d,0_2px_4px_rgba(0,0,0,0.2)]',
 },
 word_fever: {
 title: 'تایا پەیڤان',
 modeName: 'تایا پەیڤان',
 buttonColor: 'from-[#06b6d4] to-[#0891b2]',
 buttonShadow: 'shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#0e7490,0_4px_6px_rgba(0,0,0,0.2)]',
 buttonActive: 'group-active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_0px_0_#0e7490,0_2px_4px_rgba(0,0,0,0.2)]',
 },
 hard_words: {
 title: 'پەیڤێن دژوار',
 modeName: 'پەیڤێن دژوار',
 buttonColor: 'from-[#ef4444] to-[#dc2626]',
 buttonShadow: 'shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#b91c1c,0_4px_6px_rgba(0,0,0,0.2)]',
 buttonActive: 'group-active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_0px_0_#b91c1c,0_2px_4px_rgba(0,0,0,0.2)]',
 }
 };

 const currentStyle = tutorialStyles[tabId] || tutorialStyles['classic'];

 return (
 <div key={i} className="my-1 w-48 xs:w-[200px] sm:w-52 flex flex-col bg-[#636a7c] rounded-[14px] shadow-[inset_0_-6px_0_rgba(0,0,0,0.4),0_10px_20px_rgba(0,0,0,0.4)] relative font-rabar border-2 border-[#121316] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform group" dir="rtl" onClick={(e) => { e.stopPropagation(); triggerHaptic(10); if (onOpenHowToPlay) onOpenHowToPlay(tabId); }}>
 {/* Inner 3D Highlight Layer */}
 <div
 className="absolute inset-0 rounded-[12px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>

 {/* Inner 3D Shadow Layer */}
 <div className="absolute inset-0 rounded-[12px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight */}
 <div className="absolute top-1 inset-x-1 h-5 bg-[#727888] pointer-events-none z-0 rounded-t-md"></div>

 {/* Header */}
 <div className="w-full relative z-10 flex flex-col items-center justify-center pt-2 pb-1.5 shrink-0">
 <h2
 className="text-[12px] font-black text-white leading-none relative z-10 flex items-center gap-1.5"
 style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
 >
 فێرکاری: {currentStyle.title}
 </h2>
 <div className="absolute top-0 inset-x-0 h-px bg-white/10" />
 <div className="absolute bottom-0 inset-x-0 h-px bg-black/40" />
 </div>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col mx-1.5 mb-1.5 relative z-0">
 <div className="flex flex-col relative rounded-[8px] bg-[#e6ebf0] shadow-[0_2px_4px_rgba(0,0,0,0.2)] overflow-hidden p-2 shrink-0 z-10">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-2 border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-10"></div>

 <div className="relative z-20 flex flex-col items-center text-center">
 <p className="text-[10px] font-bold text-[#181a20] mb-1.5 mt-0 leading-tight">
 ڕێسایێن مۆدێ {currentStyle.modeName} بزانە.
 </p>

 {/* Understood/Open Button */}
 <div className={`relative shrink-0 w-full h-7 rounded-md font-black font-rabar text-[10px] transition-all flex items-center justify-center gap-1.5 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b ${currentStyle.buttonColor} ${currentStyle.buttonShadow} text-white ${currentStyle.buttonActive} group-active:translate-y-0.75`}>
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1px 0 #181a20' }}>
 ڤەکە
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 }

 if (part === '[DOWNLOAD_SHARE]') {
 return (
 <div key={i} className="my-1 w-56 xs:w-[240px] sm:w-64 flex flex-col bg-[#51596b] rounded-[14px] shadow-[inset_0_-6px_0_rgba(0,0,0,0.4),0_10px_20px_rgba(0,0,0,0.4)] relative font-rabar border-2 border-[#121316] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform group" dir="rtl" onClick={(e) => { e.stopPropagation(); triggerHaptic(10); window.dispatchEvent(new CustomEvent('openInstallModal')); }}>
 {/* Inner 3D Highlight Layer */}
 <div
 className="absolute inset-0 rounded-[12px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>

 {/* Inner 3D Shadow Layer */}
 <div className="absolute inset-0 rounded-[12px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight */}
 <div className="absolute top-1 inset-x-1 h-5 bg-[#646e82] pointer-events-none z-0 rounded-t-md"></div>

 {/* Header */}
 <div className="w-full relative z-10 flex flex-col items-center justify-center pt-2 pb-1.5 shrink-0">
 <h2
 className="text-[12px] font-black text-white leading-none relative z-10 flex items-center gap-1.5"
 style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
 >
 داگرتنا یاریێ
 </h2>
 <div className="absolute top-0 inset-x-0 h-px bg-white/10" />
 <div className="absolute bottom-0 inset-x-0 h-px bg-black/40" />
 </div>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col mx-1.5 mb-1.5 relative z-0">
 <div className="flex flex-col relative rounded-[8px] bg-[#e6ebf0] shadow-[0_2px_4px_rgba(0,0,0,0.2)] overflow-hidden p-2 shrink-0 z-10">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-2 border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-10"></div>

 <div className="relative z-20 flex flex-col items-center text-center">
 <p className="text-[11px] font-bold text-[#181a20] mb-2 mt-0.5 leading-tight px-1">
 یاریێ وەکی بەرنامە دەینە سەر شاشا مۆبایلێ.
 </p>

 {/* Understood/Open Button */}
 <div className={`relative shrink-0 w-full h-7 rounded-md font-black font-rabar text-[10px] transition-all flex items-center justify-center gap-1.5 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#34d399] to-[#059669] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#065f46,0_4px_6px_rgba(0,0,0,0.2)] text-white group-active:shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_0px_0_#065f46,0_2px_4px_rgba(0,0,0,0.2)] group-active:translate-y-0.75`}>
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 pointer-events-none rounded-sm bg-white/20"></div>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1px 0 #181a20' }}>
 داگرتن
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 }

 if (part.match(/^https?:\/\//)) {
 return (
 <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold" onClick={e => e.stopPropagation()} dir="ltr">
 {part}
 </a>
 );
 }
 return <span key={i}>{part}</span>;
 });
 };


 useEffect(() => {
 if (inView && !isMe && !m.is_read && onSeen) {
 onSeen(m.id);
 }
 }, [inView, isMe, m.id, m.is_read, onSeen]);

 const bind = useLongPress((e) => {
 if (isDeleted) return;
 triggerHaptic(20);
 const rect = e.target.closest('.message-bubble')?.getBoundingClientRect();
 if (rect) onLongPress(m, rect);
 });

 return (
 <Motion.div
 ref={ref}
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} group max-w-full mb-4`}
 >
 {showNickname && (() => {
 const headerBundleObj = BUNDLES[m.equipped_bundle] || BUNDLES['default'];
 const isPremiumBundle = headerBundleObj.id !== 'default';
 const headerNameStyleObj = NAME_STYLES[m.equipped_name_style] || NAME_STYLES['default'];
 const isPremiumStyle = headerNameStyleObj.id !== 'default';

 const actualNickname = reactionUsers[m.user_id]?.nickname ?? m.user_nickname;
 const userXp = reactionUsers[m.user_id]?.xp ?? m.user_xp ?? 0;
 const userAvatarUrl = reactionUsers[m.user_id]?.avatar_url ?? m.user_avatar ?? 'default';
 const userLvl = getLevelData(userXp).level;
 const msgTier = getLevelTier(userLvl);

 const cardBgClass = isPremiumBundle
 ? headerBundleObj.cardBg
 : isPremiumStyle
 ? headerNameStyleObj.cardBg
 : 'border border-mono-200/60';

 return (
 <div 
 className={`flex items-center gap-3 mb-1 h-9 px-2.5 rounded-[12px] border-none! ${cardBgClass} bg-black/40! dark:bg-black/90! shadow-sm ${!isMe ? 'flex-row-reverse' : 'flex-row'}`}
 style={{ outline: `2.5px solid ${msgTier.stop1}` }}
 >
 {(() => {
 const avatar = m.user_id === '9a813c24-b662-477d-a74a-6f822d17bbf1' ? (
 <div className="w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-mono-200 dark:border-mono-800 overflow-hidden bg-white dark:bg-[#141414]">
 <img src="/Peyvok-logo-01.png" alt="پەیڤۆک" className="w-full h-full object-cover block dark:hidden" />
 <img src="/Peyvok-logo-02.png" alt="پەیڤۆک" className="w-full h-full object-cover hidden dark:block" />
 </div>
 ) : (
 <div
 className="p-0.5 rounded-full shadow-sm shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
 style={{ background: `linear-gradient(135deg, ${msgTier.stop1}, ${msgTier.stop2})` }}
 onClick={(e) => {
 e.stopPropagation();
 onProfileClick?.({ id: m.user_id, nickname: actualNickname, avatar_url: userAvatarUrl, xp: userXp });
 }}
 >
 {userAvatarUrl && userAvatarUrl !== 'default' ? (
 <div className="w-6 h-6 rounded-full overflow-hidden border border-black/10 bg-white">
 <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover block" />
 </div>
 ) : (
 <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[12px] font-black text-[#e65c00] uppercase border border-black/10">
 {(actualNickname || 'ی')[0]}
 </div>
 )}
 </div>
 );

 return (
 <>
 {avatar}
 <div className={`social-hub-message flex items-center gap-2.5 ${!isMe ? 'flex-row-reverse' : 'flex-row'}`}>
 {(() => {
 const fontObj = NAME_FONTS[m.equipped_font] || NAME_FONTS['default-ku'];
 const styleObj = NAME_STYLES[m.equipped_name_style] || {};
 const bundleObj = BUNDLES[m.equipped_bundle] || BUNDLES['default'];

 const nameLen = Math.max(actualNickname?.length || 1, 1);
 const wideFonts = ['press-start-2p', 'bangers', 'blunt-wide', 'digiface', 'digital', 'lcd', 'runiga', 'god-of-war', 'fungky-brow', 'ncl-halloween-danger', 'awesome-christmas'];
 const isWideFont = wideFonts.includes(m.equipped_font);
 const baselineLen = isWideFont ? 5.5 : 8.5;
 const scaleFactor = Math.min(1, baselineLen / nameLen);

 const baseSize = fontObj.style?.fontSize ? 1.15 : 1;
 const dynamicFontSize = `${baseSize * scaleFactor}em`;

 return (
 <PremiumName
 text={m.user_id === '9a813c24-b662-477d-a74a-6f822d17bbf1' ? 'پەیڤۆک' : (actualNickname || 'بێناڤ')}
 styleId={bundleObj.id !== 'default' ? null : styleObj.id}
 className={`text-[11px] font-black ${m.user_id === '9a813c24-b662-477d-a74a-6f822d17bbf1' ? 'text-primary' : ''} ${bundleObj.id !== 'default' ? (bundleObj.fontKurdish + ' ' + bundleObj.textStyle) : ''}`}
 style={{
 fontSize: scaleFactor < 1 ? dynamicFontSize : undefined,
 ...(m.user_id !== '9a813c24-b662-477d-a74a-6f822d17bbf1' && bundleObj.id === 'default' && !styleObj.class ? { color: msgTier.stop1 } : {}),
 ...(m.user_id !== '9a813c24-b662-477d-a74a-6f822d17bbf1' && bundleObj.id === 'default' ? {
 ...fontObj.style,
 fontSize: dynamicFontSize,
 transform: fontObj.style?.transform ? 'translateY(0px)' : undefined
 } : {})
 }}
 />
 );
 })()}
 {m.user_id !== '9a813c24-b662-477d-a74a-6f822d17bbf1' && (
 <div className="relative w-4.5 h-5 flex items-center justify-center shrink-0">
 <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 115" fill="none">
 <path d="M50 0L95 20V55C95 80 50 115 50 115C50 115 5 80 5 55V20L50 0Z" fill={`url(#medalGradientChat-${m.id || m.user_id})`} />
 <defs>
 <linearGradient id={`medalGradientChat-${m.id || m.user_id}`} x1="50" y1="0" x2="50" y2="115" gradientUnits="userSpaceOnUse">
 <stop stopColor={msgTier.stop1} />
 <stop offset="1" stopColor={msgTier.stop2} />
 </linearGradient>
 </defs>
 </svg>
 <span className="relative z-10 text-[9px] font-black text-slate-950/80 leading-none mt-[0.5px]">{toKuDigits(userLvl)}</span>
 </div>
 )}
 {topDailyPlayers?.includes(m.user_id) && (
 <span className={`px-2 py-0.75 rounded-[3px] text-[7.5px] font-black uppercase leading-none flex items-center justify-center shadow-sm border ${topDailyPlayers.indexOf(m.user_id) === 0 ? 'bg-linear-to-b from-[#FFEA00] to-[#F59E0B] text-[#422006] border-[#D97706] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_0_#92400E]' :
 topDailyPlayers.indexOf(m.user_id) === 1 ? 'bg-linear-to-b from-[#F8FAFC] to-[#94A3B8] text-[#0F172A] border-[#64748B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_0_#475569]' :
 'bg-linear-to-b from-[#FDBA74] to-[#C2410C] text-[#431407] border-[#92400E] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_0_#78350F]'
 }`}>
 <span className="pt-px">TOP {topDailyPlayers.indexOf(m.user_id) + 1}</span>
 </span>
 )}
 </div>
 </>
 );
 })()}
 </div>
 );
 })()}



 <div className={`group/msg relative max-w-[85%] flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`} onContextMenu={(e) => e.preventDefault()}>

 {/* Chevron Button outside bubble */}
 {!isDeleted && !isOnlyEmoji && !isOnlySticker && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 const rect = e.target.closest('.group\\/msg')?.querySelector('.message-bubble')?.getBoundingClientRect();
 if (rect) onLongPress(m, rect);
 }}
 className={`flex opacity-60 hover:opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-all active:scale-95 w-5 h-5 items-center justify-center rounded-full bg-white border border-black/10 shadow-[0_2px_0_#b4becd] text-slate-500 hover:text-slate-800 shrink-0`}
 >
 <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
 </button>
 )}

 <div className={`relative group/bubble flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
 <div
 {...bind}
 onContextMenu={(e) => {
 if (isDeleted) return;
 e.preventDefault();
 const rect = e.target.closest('.message-bubble')?.getBoundingClientRect();
 if (rect) onLongPress(m, rect);
 }}
 style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
 className={`message-bubble transition-all relative cursor-pointer active:scale-[0.98] select-none ${(!isDeleted && (isOnlyEmoji || isOnlySticker || isMatchResult || isMedalShare || isTutorialShare || isDownloadShare))
 ? `bg-transparent shadow-none border-none p-0 ${(isOnlyEmoji || isOnlySticker) ? 'text-[54px] leading-none drop-shadow-sm' : ''}`
 : `px-3.5 pt-3.5 pb-1 rounded-[20px] text-[13.5px] font-rabar font-bold wrap-anywhere whitespace-pre-wrap border border-black/10 shadow-[0_4px_0_#b4becd] ${isMe
 ? 'bg-white text-[#1e293b] before:content-[""] before:absolute before:-right-1.5 before:top-4 before:w-3 before:h-3 before:bg-white before:border-t before:border-r before:border-black/10 before:rotate-45'
 : 'bg-white text-[#1e293b] before:content-[""] before:absolute before:-left-1.5 before:top-4 before:w-3 before:h-3 before:bg-white before:border-b before:border-l before:border-black/10 before:rotate-45'
 }`
 } ${isDeleted ? 'opacity-60 italic' : ''} ${isMentioned ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-mono-900 shadow-md shadow-primary/20' : ''}`}
 >

 {/* Quoted Message (Reply) */}
 {m.reply_to_text && !isDeleted && (
 <div className={`mb-2 w-full text-[10px] p-1.5 px-2.5 rounded-lg bg-black/5 dark:bg-white/5 border-r-4 border-primary/60 text-current opacity-80 italic overflow-hidden`}>
 {m.reply_to_text.startsWith('[BATTLE_RESULT]')
 ? <div className="scale-[0.85] origin-right opacity-80 -my-2"><BattleResultRenderer text={m.reply_to_text} isMe={isMe} onProfileClick={onProfileClick} /></div>
 : (
 (m.reply_to_text.includes('🟩') || m.reply_to_text.includes('🟨') || m.reply_to_text.includes('⬛') || m.reply_to_text.includes('⬜')) &&
 (/پەیڤۆک|تایا پەیڤان|پەیڤێن دژوار|هەڤڕکی|مامک|ئەنجام/.test(m.reply_to_text))
 )
 ? <div className="scale-[0.85] origin-right opacity-80 -my-1"><GameResultRenderer text={m.reply_to_text} /></div>
 : renderFormattedText(m.reply_to_text)
 }
 </div>
 )}



 {isDeleted ? 'ئەڤ نامەیە هاتە ژێبرن' : (
 (m.content || m.text).startsWith('[BATTLE_RESULT]')
 ? <BattleResultRenderer text={m.content || m.text} isMe={isMe} onProfileClick={onProfileClick} />
 : (
 ((m.content || m.text).includes('🟩') || (m.content || m.text).includes('🟨') || (m.content || m.text).includes('⬛') || (m.content || m.text).includes('⬜')) &&
 (/پەیڤۆک|تایا پەیڤان|پەیڤێن دژوار|هەڤڕکی|مامک|ئەنجام/.test(m.content || m.text)) &&
 m.user_id !== '9a813c24-b662-477d-a74a-6f822d17bbf1'
 )
 ? <GameResultRenderer text={m.content || m.text} />
 : (isOnlyEmoji ? <AnimatedEmojiRenderer text={m.content || m.text} /> : renderFormattedText(m.content || m.text))
 )}

 <div className={`flex items-center justify-end gap-1 ${isOnlyVoice ? 'absolute bottom-1 left-3 z-20' : 'mt-0.5'}`}>
 <div className={`text-[9px] font-bold opacity-70 ${(isMe && !isOnlyEmoji && !isOnlySticker) ? 'text-slate-600' : 'text-slate-600'}`}>
 {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
 </div>
 {isMe && !isDeleted && (
 <div className="flex items-center">
 {m.receiver_id === '9a813c24-b662-477d-a74a-6f822d17bbf1' ? (
 <span className="material-symbols-outlined text-[14px] text-slate-500 font-bold opacity-40" style={{ fontSize: '14px' }}>done</span>
 ) : m.is_read ? (
 <span className="material-symbols-outlined text-[14px] text-blue-500 font-bold" style={{ fontSize: '14px' }}>done_all</span>
 ) : m.id?.startsWith?.('temp-') ? (
 <span className="material-symbols-outlined text-[14px] text-slate-500 font-bold opacity-40" style={{ fontSize: '14px' }}>done</span>
 ) : (
 <span className="material-symbols-outlined text-[14px] text-slate-500 font-bold" style={{ fontSize: '14px' }}>done_all</span>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Seen By Partner Avatar */}
 {isLastReadByPartner && partnerInfo && isMe && (
 <div className={`mt-0.5 flex justify-end mr-2`}>
 <div className="w-4 h-4 rounded-full overflow-hidden border border-black/10 shadow-sm opacity-90 transition-all" title="هاتە دیتن">
 {partnerInfo.avatar_url && partnerInfo.avatar_url !== 'default' ? (
 <img src={partnerInfo.avatar_url} alt="Seen" className="w-full h-full object-cover" />
 ) : partnerInfo.id === '9a813c24-b662-477d-a74a-6f822d17bbf1' ? (
 <img src="/Peyvok-logo-02.png" alt="پەیڤۆک" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-white flex items-center justify-center text-[8px] font-black text-[#e65c00] uppercase">
 {(partnerInfo.nickname || 'ی')[0]}
 </div>
 )}
 </div>
 </div>
 )}

 {/* Reactions Display */}
 {m.reactions && Object.keys(m.reactions).length > 0 && !isDeleted && (
 <div className={`flex flex-wrap gap-2 ${isMedalShare ? '-mt-1 relative z-30' : isMatchResult ? '-mt-3 relative z-30' : 'mt-1'} ${isMe ? 'justify-end' : 'justify-start'}`} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}>
 {Object.entries(m.reactions).map(([emoji, users]) => {
 const isReactedByMe = users.some(u => (typeof u === 'string' ? u : u.id) === currentUserId);
 return (
 <div
 key={emoji}
 className={`group relative flex items-center gap-0.5 px-1.5 py-px rounded-md transition-all cursor-help select-none ${isReactedByMe ? 'bg-[#f0f9ff] border border-primary/30 shadow-[0_2px_0_#bae6fd] text-primary' : 'bg-white border border-black/10 shadow-[0_2px_0_#b4becd] text-[#1e293b] active:scale-95 active:translate-y-px active:shadow-[0_1px_0_#b4becd]'}`}
 onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 onReactionLongPress?.(m, emoji, e.clientX, e.clientY);
 }}
 >
 <span className="text-[10px] leading-none drop-shadow-sm pointer-events-none">{emoji}</span>
 <span className="text-[9px] font-black tabular-nums mt-px pointer-events-none">{users.length}</span>

 {/* Custom Tooltip for Desktop Hover */}
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 bg-mono-900 dark:bg-mono-100 text-mono-50 dark:text-mono-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all scale-95 group-hover:scale-100 z-100 shadow-lg border border-white/10 dark:border-black/10 hidden md:block">
 {users.map(u => {
 const id = typeof u === 'string' ? u : u.id;
 const uName = typeof u !== 'string' ? u.name : null;
 return reactionUsers[id]?.nickname || (uName !== 'بێناڤ' ? uName : null) || 'بێناڤ';
 }).join('، ')}
 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-mono-900 dark:border-t-mono-100"></div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </Motion.div>
 );
}, (prev, next) => {
 return prev.m === next.m &&
 prev.isMe === next.isMe &&
 prev.reactionUsers === next.reactionUsers &&
 prev.topDailyPlayers === next.topDailyPlayers &&
 prev.showNickname === next.showNickname;
});


export default function SocialHubView({
 initialChatPartner = null,
 initialTab = null,
 onViewMessages: _onViewMessages,
 onViewFriends: _onViewFriends,
 onKeyboardToggle,
 isVisible = true,
 onOpenHowToPlay
}) {
 const {
 user,
 userNickname,
 userAvatar,
 handleToggleBlock: toggleBlockInContext,
 loadingAuth
 } = useUser();
 const { onlineUsers } = usePresence();
 const {
 playNotifSound,
 playMessageSound: _playMessageSound,
 playMessageSentSound,
 playTabSound,
 playBubblePopSound
 } = useAudio();
 const [activeTab, setActiveTab] = useState(initialTab || (initialChatPartner ? 'private' : 'global'));
 const [messages, setMessages] = useState([]);
 const [privateChats, setPrivateChats] = useState([]);
 const [loading, setLoading] = useState(true);
 const [newMessage, setNewMessage] = useState('');
 const [selectedChat, setSelectedChat] = useState(initialChatPartner);
 const [chatMessages, setChatMessages] = useState([]);
 const [replyingTo, setReplyingTo] = useState(null);
 const [selectedPlayer, setSelectedPlayer] = useState(null);
 const [partnerIsTyping, setPartnerIsTyping] = useState(false);
 const [activeContextMenu, setActiveContextMenu] = useState(null);
 const [activeReactionModal, setActiveReactionModal] = useState(null); // { message, activeTab }
 const [reactionUsers, setReactionUsers] = useState({}); // { id: nickname }
 const [showCopySuccess, setShowCopySuccess] = useState(false);
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
 const [keyboardHeight, setKeyboardHeight] = useState(0);
 const [showEmojiPicker, setShowEmojiPicker] = useState(false);
 const [chatToDelete, setChatToDelete] = useState(null);
 const [isReportModalOpen, setIsReportModalOpen] = useState(false);
 const [showAllOnline, setShowAllOnline] = useState(false);
 const [unreadMessageCount, setUnreadMessageCount] = useState(0);
 const [newGlobalCount, setNewGlobalCount] = useState(0);
 const [topDailyPlayers, setTopDailyPlayers] = useState([]);
 const [globalViewers, setGlobalViewers] = useState([]);
 const globalPresenceChannelRef = useRef(null);
 const [marqueeAnnouncements, setMarqueeAnnouncements] = useState([]);
 const typingTimeoutRef = useRef(null);
 const typingChannelRef = useRef(null);
 const messagesContainerRef = useRef(null);
 const textareaRef = useRef(null);
 const fileInputRef = useRef(null);
 const [isUploadingImage, setIsUploadingImage] = useState(false);

 // --- GIF Picker State ---
 const [showGifPicker, setShowGifPicker] = useState(false);
 const [gifTab, setGifTab] = useState('trending'); // 'trending' | 'favorites'
 const [gifSearchQuery, setGifSearchQuery] = useState('');
 const [gifResults, setGifResults] = useState([]);
 const [isGifLoading, setIsGifLoading] = useState(false);
 const gifSearchTimeoutRef = useRef(null);

 const [favoriteStickers, setFavoriteStickers] = useState(() => {
 try {
 const saved = localStorage.getItem('peyvok_favorite_stickers');
 return saved ? JSON.parse(saved) : [];
 } catch {
 return [];
 }
 });

 const toggleFavoriteSticker = (url) => {
 setFavoriteStickers(prev => {
 const isFav = prev.includes(url);
 const newFavs = isFav ? prev.filter(u => u !== url) : [url, ...prev];
 localStorage.setItem('peyvok_favorite_stickers', JSON.stringify(newFavs));
 return newFavs;
 });
 };

 const [pendingImage, setPendingImage] = useState(null);
 const [pendingImagePreview, setPendingImagePreview] = useState(null);
 const [fullscreenImage, setFullscreenImage] = useState(null);
 const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);

 // --- Voice Notes State ---
 const [isRecording, setIsRecording] = useState(false);
 const [isRecordingPaused, setIsRecordingPaused] = useState(false);
 const [recordingTime, setRecordingTime] = useState(0);
 const mediaRecorderRef = useRef(null);
 const audioChunksRef = useRef([]);
 const recordingTimerRef = useRef(null);
 // -------------------------
 const activeTabRef = useRef(activeTab);
 const selectedChatRef = useRef(selectedChat);
 const fetchedReactionIdsRef = useRef(new Set());

 const [connectionError, setConnectionError] = useState(false);
 const globalFetchTimeoutRef = useRef(null);
 const privateFetchTimeoutRef = useRef(null);

 // Native Keyboard Overlay Listener
 useEffect(() => {
 if (!Capacitor.isNativePlatform()) return;

 let showListener;
 let hideListener;

 const setupKeyboard = async () => {
 const initialWindowHeight = window.innerHeight;

 showListener = await Keyboard.addListener('keyboardWillShow', info => {
 let height = info.keyboardHeight;
 if (height > initialWindowHeight * 0.5) {
 height = Math.round(height / window.devicePixelRatio);
 }
 
 setIsKeyboardVisible(true);
 
 setTimeout(() => {
 // If the WebView natively shrank, we don't need a spacer.
 if (window.innerHeight < initialWindowHeight - 100) {
 setKeyboardHeight(0);
 } else {
 setKeyboardHeight(height);
 }

 // Scroll to bottom when keyboard shows
 if (messagesContainerRef.current) {
 messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
 }
 }, 150);
 });

 hideListener = await Keyboard.addListener('keyboardWillHide', () => {
 setKeyboardHeight(0);
 setIsKeyboardVisible(false);
 });
 };

 setupKeyboard();

 return () => {
 if (showListener) showListener.remove();
 if (hideListener) hideListener.remove();
 };
 }, []);

 // Handle Initial Routing
 useEffect(() => {
 if (isVisible) {
 if (initialChatPartner) {
 setSelectedChat(initialChatPartner);
 setActiveTab('private');
 } else if (initialTab) {
 setActiveTab(initialTab);
 }
 } else {
 // Reset selected chat when leaving the view so the user isn't annoyed by returning to it
 setSelectedChat(null);
 }
 }, [initialChatPartner, initialTab, isVisible]);

 // Handle GIF Search
 useEffect(() => {
 if (!showGifPicker || gifTab !== 'trending') return;
 const fetchGifs = async () => {
 setIsGifLoading(true);
 try {
 const apiKey = 'Gc7131jiJuvI7IdN0HZ1D7nh0ow5BU6g'; // Working API key
 const endpoint = gifSearchQuery.trim()
 ? `https://api.giphy.com/v1/stickers/search?api_key=${apiKey}&q=${encodeURIComponent(gifSearchQuery)}&limit=21&rating=pg-13`
 : `https://api.giphy.com/v1/stickers/trending?api_key=${apiKey}&limit=21&rating=pg-13`;

 const res = await fetch(endpoint);
 const json = await res.json();
 setGifResults(json.data || []);
 } catch (err) {
 console.warn("Failed to fetch GIFs", err);
 } finally {
 setIsGifLoading(false);
 }
 };

 if (gifSearchTimeoutRef.current) clearTimeout(gifSearchTimeoutRef.current);
 gifSearchTimeoutRef.current = setTimeout(fetchGifs, 500);

 return () => clearTimeout(gifSearchTimeoutRef.current);
 }, [showGifPicker, gifSearchQuery, gifTab]);

 // Global Chat Presence
 useEffect(() => {
 if (!user?.id) return;
 const channel = supabase.channel('global_chat_presence', {
 config: {
 presence: {
 key: user.id,
 },
 },
 });

 channel.on('presence', { event: 'sync' }, () => {
 const state = channel.presenceState();
 const viewers = [];
 const ADMIN_IDS = ['e2052ae5-e2c7-4a08-9ba2-c33bc85b19ca', 'b082d89e-3daa-4067-9c20-506cd7b4994d', '9a813c24-b662-477d-a74a-6f822d17bbf1', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4'];
 for (const key in state) {
 if (key !== user.id && !ADMIN_IDS.includes(key) && state[key].length > 0) {
 viewers.push(state[key][0]);
 }
 }
 setGlobalViewers(viewers);
 });

 channel.subscribe(async (status) => {
 if (status === 'SUBSCRIBED') {
 globalPresenceChannelRef.current = channel;
 if (activeTab === 'global' && isVisible) {
 await channel.track({ id: user.id, nickname: userNickname, avatar_url: userAvatar });
 }
 }
 });

 return () => {
 channel.unsubscribe();
 globalPresenceChannelRef.current = null;
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.id]);

 useEffect(() => {
 const channel = globalPresenceChannelRef.current;
 if (!channel || !user?.id) return;
 if (activeTab === 'global' && isVisible) {
 channel.track({ id: user.id, nickname: userNickname, avatar_url: userAvatar });
 } else {
 channel.untrack();
 }
 }, [activeTab, isVisible, user?.id, userNickname, userAvatar]);

 // Real-time Top 3 Daily Players for Badges & Marquee Announcer
 useEffect(() => {
 if (!isVisible) return;

 let fetchTimeout;
 const fetchTopDaily = async () => {
 try {
 const todayISO = new Date().toISOString().split('T')[0];
 const { data, error } = await supabase
 .from('profiles')
 .select('id')
 .neq('nickname', 'Admin_4rasti')
 .neq('nickname', 'ADMIN_PEYVOK')
 .neq('nickname', 'پەیڤۆک')
 .neq('id', '9a813c24-b662-477d-a74a-6f822d17bbf1')
 .neq('id', '66bbf4d5-333a-4748-8529-ecd5bae9f3a4')
 .eq('daily_xp_date', todayISO)
 .gt('daily_xp', 0)
 .order('daily_xp', { ascending: false })
 .limit(3);
 if (!error && data) {
 const newTopIds = data.map(p => p.id);
 setTopDailyPlayers(newTopIds);
 }
 } catch (e) {
 console.warn("Failed to fetch top daily players", e);
 }
 };

 fetchTopDaily(); // Initial fetch on mount

 const top3Sub = supabase.channel('public:profiles:socialhub_top3')
 .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
 const updatedProfile = payload.new;
 if (updatedProfile && typeof updatedProfile.daily_xp !== 'undefined') {
 // Debounce fetch to avoid database spam
 if (fetchTimeout) clearTimeout(fetchTimeout);
 fetchTimeout = setTimeout(() => {
 fetchTopDaily();
 }, 2000);
 }
 }).subscribe();

 return () => {
 if (fetchTimeout) clearTimeout(fetchTimeout);
 supabase.removeChannel(top3Sub);
 };
 }, [isVisible, user]);

 // Global Announcements Marquee Logic
 useEffect(() => {
 if (!isVisible) return;

 // Fetch historical data from the last 15 minutes
 const fetchHistoricalAnnouncements = async () => {
 try {
 let combined = [];

 // Fetch users registered in the last 15 minutes (using updated_at as proxy for new accounts with 0 xp)
 const fifteenMinsAgoDate = new Date(Date.now() - 900000).toISOString();
 const { data: recentProfiles, error } = await supabase
 .from('profiles')
 .select('id, nickname, updated_at')
 .eq('xp', 0)
 .eq('level', 1)
 .gte('updated_at', fifteenMinsAgoDate);

 if (!error && recentProfiles) {
 recentProfiles.forEach(p => {
 combined.push({
 id: p.id,
 text: `🎉 ب خێرهاتی بۆ پەیڤۆک، ${p.nickname || 'مێهڤان'}!`,
 created_at: p.updated_at
 });
 });
 }

 // Sort by timestamp old to new
 combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

 const voiceUpdateExpiry = new Date('2026-08-19T23:59:59Z');
 if (new Date() < voiceUpdateExpiry) {
 combined.push({
 id: 'voice-update-announcement',
 text: '🎤 تایبەتمەندییا نوی: نۆکە تو دشێی ب ڕێیا دەنگی دگەل هەڤرکێ خوە د ناڤ یارییا هەڤڕکیێ دا باخڤی! 🗣️',
 created_at: new Date().toISOString()
 });
 }

 setMarqueeAnnouncements(combined);
 } catch (e) {
 console.warn("Failed to fetch historical announcements", e);
 }
 };
 fetchHistoricalAnnouncements();

 const welcomeSub = supabase.channel('public:profiles:welcome_marquee')
 .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
 const newProfile = payload.new;
 if (newProfile) {
 setMarqueeAnnouncements(prev => [...prev, {
 id: newProfile.id,
 text: `🎉 ب خێرهاتی بۆ پەیڤۆک، ${newProfile.nickname || 'مێهڤان'}!`,
 created_at: new Date().toISOString()
 }]);
 }
 })
 .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
 const newProfile = payload.new;
 if (newProfile && newProfile.nickname) {
 // Only process updates for users created in the last 2 minutes
 const isNewUser = newProfile.created_at && (Date.now() - new Date(newProfile.created_at).getTime() < 120000);

 if (isNewUser) {
 setMarqueeAnnouncements(prev => {
 const alreadyWelcomed = prev.some(a => a.id === newProfile.id && a.text.includes('ب خێرهاتی'));
 if (alreadyWelcomed) {
 // Update the placeholder 'مێهڤان' with the actual nickname (e.g. بێناڤ ٢٨٠٤)
 return prev.map(a =>
 (a.id === newProfile.id && a.text.includes('ب خێرهاتی'))
 ? { ...a, text: `🎉 ب خێرهاتی بۆ پەیڤۆک، ${newProfile.nickname}!` }
 : a
 );
 }
 // If we missed the INSERT somehow, add them now
 return [...prev, {
 id: newProfile.id,
 text: `🎉 ب خێرهاتی بۆ پەیڤۆک، ${newProfile.nickname}!`,
 created_at: new Date().toISOString()
 }];
 });
 }
 }
 })
 .on('broadcast', { event: 'level_up' }, (payload) => {
 const data = payload.payload;
 if (data && data.nickname && data.level) {
 setMarqueeAnnouncements(prev => [...prev, {
 id: `lvl-${data.id}-${data.level}`,
 text: `⭐ شەنگەستە! ${data.nickname} گەهشتە ئاستێ ${toKuDigits(data.level)}! 🏆`,
 created_at: new Date().toISOString()
 }]);
 }
 })
 .subscribe();



 const cleanupInterval = setInterval(() => {
 const fifteenMinsAgo = new Date(Date.now() - 900000).getTime();
 setMarqueeAnnouncements(prev => prev.filter(a => a.id === 'voice-update-announcement' || new Date(a.created_at).getTime() > fifteenMinsAgo));
 }, 60000);

 return () => {
 supabase.removeChannel(welcomeSub);
 clearInterval(cleanupInterval);
 };
 }, [isVisible]);

 // Fetch real names and avatars for missing users (senders and reactions)
 useEffect(() => {
 let hasMissing = false;
 const missingIds = new Set();

 const checkMessageUsers = (msg) => {
 if (msg?.user_id && !fetchedReactionIdsRef.current.has(msg.user_id)) {
 missingIds.add(msg.user_id);
 hasMissing = true;
 }
 if (msg?.reactions) {
 Object.values(msg.reactions).forEach(users => {
 users.forEach(u => {
 const id = typeof u === 'string' ? u : u.id;
 if (id && !fetchedReactionIdsRef.current.has(id)) {
 missingIds.add(id);
 hasMissing = true;
 }
 });
 });
 }
 };

 messages.forEach(checkMessageUsers);
 chatMessages.forEach(checkMessageUsers);
 if (activeReactionModal?.message) checkMessageUsers(activeReactionModal.message);

 if (hasMissing) {
 const missingArray = Array.from(missingIds);
 missingArray.forEach(id => fetchedReactionIdsRef.current.add(id));

 const fetchMissingNames = async () => {
 try {
 const { data } = await supabase.from('profiles').select('id, nickname, avatar_url, xp').in('id', missingArray);

 if (data && data.length > 0) {
 setReactionUsers(prev => {
 const newMap = { ...prev };
 data.forEach(p => {
 newMap[p.id] = { nickname: p.nickname || null, avatar_url: p.avatar_url || null, xp: p.xp || 0 };
 });
 return newMap;
 });
 }
 } catch (e) {
 console.warn("Failed to fetch reaction users:", e);
 }
 };
 fetchMissingNames();
 }
 }, [messages, chatMessages, activeReactionModal?.message]);

 useEffect(() => {
 if (!isVisible) {
 window.activeChatTab = null;
 return;
 }

 activeTabRef.current = activeTab;
 window.activeChatTab = activeTab;
 localStorage.setItem('activeChatTab', activeTab);

 // Sync URL without triggering full page reload
 const targetUrl = '/social_hub/' + activeTab;
 if (window.location.pathname !== targetUrl) {
 window.history.replaceState(null, '', targetUrl);
 }

 if (activeTab === 'global') {
 const now = new Date().toISOString();
 localStorage.setItem('lastOpenedGlobalChatTime', now);
 localStorage.setItem('last_seen_global_chat', now);
 window.dispatchEvent(new CustomEvent('globalChatOpened'));
 window.dispatchEvent(new Event('clear_global_notifs'));
 setNewGlobalCount(0);
 }

 return () => {
 window.activeChatTab = null;
 };
 }, [activeTab, isVisible]);

 useEffect(() => {
 const handleForceClose = () => {
 onKeyboardToggle?.(false);
 };
 window.addEventListener('forceCloseChat', handleForceClose);
 return () => window.removeEventListener('forceCloseChat', handleForceClose);
 }, [onKeyboardToggle]);

 useEffect(() => {
 selectedChatRef.current = selectedChat;
 window.activeChatId = selectedChat?.id || null;
 if (selectedChat?.id) {
 localStorage.setItem('activeChatId', selectedChat.id);
 } else {
 localStorage.removeItem('activeChatId');
 }
 return () => {
 window.activeChatId = null;
 localStorage.removeItem('activeChatId');
 };
 }, [selectedChat]);

 const fetchGlobalMessages = useCallback(async (signal = null) => {
 if (globalFetchTimeoutRef.current) clearTimeout(globalFetchTimeoutRef.current);

 return new Promise((resolve) => {
 globalFetchTimeoutRef.current = setTimeout(async () => {
 try {
 let query = supabase
 .from('messages')
 .select('id, content, user_id, user_nickname, created_at, reply_to_id, reply_to_text, reactions, sender:profiles!user_id(avatar_url, xp, equipped_font, equipped_name_style, equipped_bundle)')
 .is('receiver_id', null)
 .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
 .order('created_at', { ascending: false }) // Fetch descending so we get latest 100
 .limit(100);

 if (signal) query = query.abortSignal(signal);

 const { data, error } = await query;

 if (error) {
 if (error.name === 'AbortError' || error.message?.includes('aborted')) throw error;
 // Fallback if join syntax fails
 query = supabase.from('messages').select('id, content, user_id, user_nickname, created_at, reply_to_id, reply_to_text, reactions').is('receiver_id', null).gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false }).limit(100);
 if (signal) query = query.abortSignal(signal);
 const fallbackRes = await query;
 if (fallbackRes.error) throw fallbackRes.error;
 const userIds = [...new Set(fallbackRes.data.map(m => m.user_id))];
 const { data: profiles } = await supabase.from('profiles').select('id, avatar_url, xp, equipped_font, equipped_name_style, equipped_bundle').in('id', userIds);
 const avatarMap = {};
 if (profiles) profiles.forEach(p => avatarMap[p.id] = { avatar_url: p.avatar_url, xp: p.xp, equipped_font: p.equipped_font, equipped_name_style: p.equipped_name_style, equipped_bundle: p.equipped_bundle });
 fallbackRes.data.forEach(m => {
 m.user_avatar = avatarMap[m.user_id]?.avatar_url || 'default';
 m.user_xp = avatarMap[m.user_id]?.xp || 0;
 m.equipped_font = avatarMap[m.user_id]?.equipped_font;
 m.equipped_name_style = avatarMap[m.user_id]?.equipped_name_style;
 m.equipped_bundle = avatarMap[m.user_id]?.equipped_bundle;
 });
 setMessages(fallbackRes.data.reverse()); // Reverse to show ascending in UI
 setConnectionError(false);
 resolve();
 return;
 }

 if (data) {
 data.forEach(m => {
 m.user_avatar = m.sender?.avatar_url || 'default';
 m.user_xp = m.sender?.xp || 0;
 m.equipped_font = m.sender?.equipped_font;
 m.equipped_name_style = m.sender?.equipped_name_style;
 m.equipped_bundle = m.sender?.equipped_bundle;
 });
 setMessages(data.reverse()); // Reverse to show ascending in UI
 } else {
 setMessages([]);
 }
 setConnectionError(false);
 } catch (err) {
 if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
 console.warn("Global fetch error:", err);
 if (err.message?.includes('timeout') || err.message?.includes('504')) {
 setConnectionError(true);
 }
 } finally {
 setLoading(false);
 resolve();
 }
 }, 300);
 });
 }, []);



 const fetchPrivateConversations = useCallback(async (signal = null) => {
 if (loadingAuth || !user?.id || user.id === 'undefined') return;
 if (privateFetchTimeoutRef.current) clearTimeout(privateFetchTimeoutRef.current);

 return new Promise((resolve) => {
 privateFetchTimeoutRef.current = setTimeout(async () => {
 try {
 let query = supabase.rpc('get_user_conversations', { current_user_id: user.id });
 if (signal) query = query.abortSignal(signal);

 const { data, error } = await query;

 let allFormatted = [];

 if (!error && data) {
 allFormatted = data.map(row => ({
 id: row.partner_id,
 nickname: row.nickname,
 avatar_url: row.avatar_url,
 lastMsg: row.last_message,
 time: row.last_message_time,
 unreadCount: Number(row.unread_count),
 isBotChat: false
 }));
 } else {
 if (error?.message?.includes('AbortError') || error?.name === 'AbortError' || error?.code === '20') {
 resolve();
 return;
 }
 console.warn("WhatsApp RPC failed, falling back to basic fetch:", error);
 const fallbackQuery = supabase.from('messages').select('*').or(`user_id.eq.${user?.id},receiver_id.eq.${user?.id}`).not('receiver_id', 'is', null).order('created_at', { ascending: false }).limit(200);
 const { data: fallbackData, error: fErr } = await (signal ? fallbackQuery.abortSignal(signal) : fallbackQuery);
 if (!fErr && fallbackData) {
 const convosMap = new Map();
 fallbackData.forEach(m => {
 const partnerId = m.user_id == user?.id ? m.receiver_id : m.user_id;
 if (!convosMap.has(partnerId)) {
 convosMap.set(partnerId, { lastMsg: m.content, time: m.created_at, partnerId, unreadCount: 0 });
 }
 if (m.receiver_id === user?.id && !m.is_read) {
 convosMap.get(partnerId).unreadCount++;
 }
 });
 const partnerIds = Array.from(convosMap.keys());
 if (partnerIds.length > 0) {
 const { data: profiles } = await supabase.from('profiles').select('id, nickname, avatar_url, updated_at').in('id', partnerIds);
 allFormatted = (profiles || []).map(p => ({ ...p, ...convosMap.get(p.id), isBotChat: false }));
 }
 }
 }

 // If user is Admin, fetch Bot's conversations (only if they aren't the bot itself)
 if (user?.email === '4rasti@gmail.com' && user?.id !== '9a813c24-b662-477d-a74a-6f822d17bbf1') {
 const BOT_ID = '9a813c24-b662-477d-a74a-6f822d17bbf1';
 const botQuery = supabase.from('messages').select('*').or(`user_id.eq.${BOT_ID},receiver_id.eq.${BOT_ID}`).not('receiver_id', 'is', null).order('created_at', { ascending: false }).limit(200);
 const { data: botData, error: botErr } = await (signal ? botQuery.abortSignal(signal) : botQuery);

 if (!botErr && botData) {
 const convosMap = new Map();
 botData.forEach(m => {
 const partnerId = m.user_id == BOT_ID ? m.receiver_id : m.user_id;
 if (!convosMap.has(partnerId)) {
 convosMap.set(partnerId, { lastMsg: m.content, time: m.created_at, partnerId, unreadCount: 0 });
 }
 if (m.receiver_id === BOT_ID && !m.is_read) {
 convosMap.get(partnerId).unreadCount++;
 }
 });
 const partnerIds = Array.from(convosMap.keys());
 if (partnerIds.length > 0) {
 const { data: profiles } = await supabase.from('profiles').select('id, nickname, avatar_url, updated_at').in('id', partnerIds);
 const botFormatted = (profiles || []).map(p => ({ ...p, ...convosMap.get(p.id), isBotChat: true }));
 allFormatted = [...allFormatted, ...botFormatted];
 }
 }
 }

 // Sort combined
 const PROTECTED_ADMIN_IDS = ['e2052ae5-e2c7-4a08-9ba2-c33bc85b19ca', 'b082d89e-3daa-4067-9c20-506cd7b4994d', '9a813c24-b662-477d-a74a-6f822d17bbf1'];
 allFormatted = allFormatted.filter(row => {
 if (!PROTECTED_ADMIN_IDS.includes(row.id)) return true;
 const hts = localStorage.getItem(`hidden_chat_${user.id}_${row.id}`);
 if (!hts) return true;
 return new Date(row.time).getTime() > parseInt(hts, 10);
 });

 allFormatted.sort((a, b) => new Date(b.time) - new Date(a.time));

 let unread = 0;
 allFormatted.forEach(c => { unread += (c.unreadCount || 0); });

 setUnreadMessageCount(unread);
 setPrivateChats(allFormatted);
 setConnectionError(false);
 } catch (err) {
 if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
 console.warn("Private convo fetch failed:", err);
 if (err.message?.includes('timeout') || err.message?.includes('504')) {
 setConnectionError(true);
 }
 } finally {
 setLoading(false);
 resolve();
 }
 }, 300);
 });
 }, [user?.id, user?.email, loadingAuth]);

 const fetchPrivateChatHistory = useCallback(async (partnerId, isBotChat = false) => {
 if (loadingAuth || !user?.id || user.id === 'undefined' || !partnerId) return;
 try {
 const myId = isBotChat ? '9a813c24-b662-477d-a74a-6f822d17bbf1' : user.id;
 const { data, error } = await supabase
 .from('messages')
 .select('id, content, user_id, receiver_id, created_at, is_read, reactions')
 .or(`and(user_id.eq.${myId},receiver_id.eq.${partnerId}),and(user_id.eq.${partnerId},receiver_id.eq.${myId})`)
 .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
 .order('created_at', { ascending: false }) // Limit 30 descending
 .limit(30);
 if (error) throw error;
 let msgs = data ? data.reverse() : []; // Reverse to show ascending

 const PROTECTED_ADMIN_IDS = ['e2052ae5-e2c7-4a08-9ba2-c33bc85b19ca', 'b082d89e-3daa-4067-9c20-506cd7b4994d', '9a813c24-b662-477d-a74a-6f822d17bbf1'];
 if (PROTECTED_ADMIN_IDS.includes(partnerId)) {
 const hts = localStorage.getItem(`hidden_chat_${user.id}_${partnerId}`);
 if (hts) {
 msgs = msgs.filter(m => new Date(m.created_at).getTime() > parseInt(hts, 10));
 }
 }

 setChatMessages(msgs);
 } catch (err) {
 console.error("Chat history fetch error:", err);
 if (err.message?.includes('timeout') || err.message?.includes('504')) {
 setConnectionError(true);
 }
 }
 }, [user?.id, loadingAuth]);

 useEffect(() => {
 if (!user?.id) return;
 const currentUserId = user.id;

 let globalSub = null;
 let privateMsgSub = null;
 let typingChannel = null;
 let isMounted = true;

 const initializeChatChannels = () => {
 if (globalSub) supabase.removeChannel(globalSub);
 if (privateMsgSub) supabase.removeChannel(privateMsgSub);
 if (typingChannel) supabase.removeChannel(typingChannel);

 globalSub = supabase.channel('public:messages:global').on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: 'receiver_id=is.null' }, (payload) => {
 if (!isMounted) return;
 if (payload.eventType === 'INSERT') {
 const newMsg = payload.new;
 if (newMsg.user_id !== currentUserId) {
 playNotifSound();
 if (activeTabRef.current !== 'global') setNewGlobalCount(prev => prev + 1);
 }
 setMessages(prev => {
 const existingIdx = prev.findIndex(m => m.id === newMsg.id);
 if (existingIdx > -1) {
 const next = [...prev];
 next[existingIdx] = { ...next[existingIdx], ...newMsg, isPending: false };
 return next;
 }
 return [...prev, newMsg];
 });
 // Removed individual profile fetch here to prevent IO overload. 
 // The checkMessageUsers useEffect will batch-fetch the missing avatar.
 } else if (payload.eventType === 'UPDATE') {
 setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
 } else if (payload.eventType === 'DELETE') {
 setMessages(prev => prev.filter(m => m.id !== payload.old.id));
 }
 }).subscribe();

 privateMsgSub = supabase.channel('private:messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
 if (!isMounted) return;
 let involvedPayload = payload.new || payload.old;
 if (!involvedPayload) return;
 const isPrivate = involvedPayload.receiver_id !== null;
 const involvesMe = involvedPayload.user_id === currentUserId || involvedPayload.receiver_id === currentUserId;
 if (!isPrivate || !involvesMe) return;

 if (payload.eventType === 'INSERT') {
 const newMsg = payload.new;
 if (newMsg.user_id !== currentUserId) {
 // No longer playing sound if we are already viewing the chat
 }

 if (selectedChatRef.current && (newMsg.user_id === selectedChatRef.current.id || newMsg.receiver_id === selectedChatRef.current.id)) {
 setChatMessages(prev => {
 const existingIdx = prev.findIndex(m => m.id === newMsg.id);
 if (existingIdx > -1) {
 const next = [...prev];
 next[existingIdx] = { ...next[existingIdx], ...newMsg, isPending: false };
 return next;
 }
 return [...prev, newMsg];
 });
 }

 const partnerId = newMsg.user_id === currentUserId ? newMsg.receiver_id : newMsg.user_id;
 setPrivateChats(prev => {
 const existingIdx = prev.findIndex(c => c.id === partnerId);
 if (existingIdx > -1) {
 let newConvos = [...prev];
 const chat = { ...newConvos[existingIdx] };
 chat.lastMsg = newMsg.content;
 chat.time = newMsg.created_at;
 if (newMsg.user_id !== currentUserId && (!selectedChatRef.current || selectedChatRef.current.id !== partnerId || activeTabRef.current !== 'private')) {
 chat.unreadCount = (chat.unreadCount || 0) + 1;
 setUnreadMessageCount(c => c + 1);
 }
 newConvos.splice(existingIdx, 1);
 newConvos.unshift(chat);
 return newConvos;
 } else {
 fetchPrivateConversations();
 return prev;
 }
 });
 } else if (payload.eventType === 'UPDATE') {
 const updatedMsg = payload.new;
 if (selectedChatRef.current && (updatedMsg.user_id === selectedChatRef.current.id || updatedMsg.receiver_id === selectedChatRef.current.id)) {
 setChatMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
 }
 if (updatedMsg.is_read && updatedMsg.user_id === currentUserId) {
 const partnerId = updatedMsg.receiver_id;
 setPrivateChats(prev => {
 return prev.map(c => {
 if (c.id === partnerId && c.unreadCount > 0) {
 return { ...c, unreadCount: Math.max(0, c.unreadCount - 1) };
 }
 return c;
 });
 });
 }
 } else if (payload.eventType === 'DELETE') {
 const oldMsg = payload.old;
 if (selectedChatRef.current) {
 setChatMessages(prev => prev.filter(m => m.id !== oldMsg.id));
 }
 }
 }).subscribe();

 typingChannel = supabase.channel(`typing-${currentUserId}`).on('broadcast', { event: 'typing' }, ({ payload }) => {
 if (!isMounted) return;
 if (selectedChatRef.current && payload.sender_id === selectedChatRef.current.id) setPartnerIsTyping(true);
 }).on('broadcast', { event: 'stop' }, ({ payload }) => {
 if (!isMounted) return;
 if (selectedChatRef.current && payload.sender_id === selectedChatRef.current.id) setPartnerIsTyping(false);
 }).subscribe();

 typingChannelRef.current = typingChannel;
 };

 initializeChatChannels();

 let visibilityWakeTimeout = null;

 const handleVisibilityChange = () => {
 if (document.visibilityState === 'visible') {
 if (visibilityWakeTimeout) clearTimeout(visibilityWakeTimeout);
 visibilityWakeTimeout = setTimeout(() => {
 if (isMounted) initializeChatChannels();
 }, 800);
 }
 };

 document.addEventListener('visibilitychange', handleVisibilityChange);

 return () => {
 isMounted = false;
 if (visibilityWakeTimeout) clearTimeout(visibilityWakeTimeout);
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 if (globalSub) supabase.removeChannel(globalSub);
 if (privateMsgSub) supabase.removeChannel(privateMsgSub);
 if (typingChannel) supabase.removeChannel(typingChannel);
 };
 }, [user?.id, fetchPrivateConversations, playNotifSound, _playMessageSound]);

 useEffect(() => {
 const controller = new AbortController();

 // Only fetch the currently active tab immediately to reduce load.
 if (activeTab === 'global') {
 fetchGlobalMessages(controller.signal);
 setNewGlobalCount(0);
 } else if (activeTab === 'private') {
 fetchPrivateConversations(controller.signal);
 }

 return () => {
 controller.abort();
 };
 }, [activeTab, fetchGlobalMessages, fetchPrivateConversations]);

 useEffect(() => {
 setPartnerIsTyping(false);
 if (selectedChat) fetchPrivateChatHistory(selectedChat.id, selectedChat.isBotChat);
 }, [selectedChat, fetchPrivateChatHistory]);

 useEffect(() => {
 if ((activeTab === 'global' || selectedChat) && isVisible) {
 // Delay slightly to ensure display:none is removed and scrollHeight is accurate
 requestAnimationFrame(() => {
 if (messagesContainerRef.current) {
 const behavior = (messages.length > 0 || chatMessages.length > 0) ? 'auto' : 'smooth';
 messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior });
 }
 });
 }
 }, [messages.length, chatMessages.length, activeTab, selectedChat, isVisible, partnerIsTyping]);




 const sendTypingStatus = async (isTyping) => {
 if (!selectedChat || !user?.id) return;
 try {
 // Use a dedicated outbound channel for the current partner
 const outboundChannel = supabase.channel(`typing-${selectedChat.id}`);
 outboundChannel.subscribe(async (status) => {
 if (status === 'SUBSCRIBED') {
 await outboundChannel.send({
 type: 'broadcast',
 event: isTyping ? 'typing' : 'stop',
 payload: { sender_id: user.id }
 });
 // Cleanup outbound channel shortly after sending
 setTimeout(() => {
 if (outboundChannel) supabase.removeChannel(outboundChannel);
 }, 1000);
 }
 });
 } catch (e) {
 console.warn("Typing broadcast failed:", e);
 }
 };

 const handleInputChange = (val) => {
 setNewMessage(val);

 // Typing status logic
 if (selectedChat && activeTab === 'private') {
 if (val.length > 0) {
 // If first character or timeout was active
 if (!typingTimeoutRef.current) {
 sendTypingStatus(true);
 }

 // Clear existing timeout
 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

 // Set new timeout to stop typing after 2 seconds
 typingTimeoutRef.current = setTimeout(() => {
 sendTypingStatus(false);
 typingTimeoutRef.current = null;
 }, 2000);
 } else {
 // Explicitly stop if field cleared
 if (typingTimeoutRef.current) {
 clearTimeout(typingTimeoutRef.current);
 typingTimeoutRef.current = null;
 sendTypingStatus(false);
 }
 }
 }
 };

 const handleDeleteMessage = async (msg) => {
 if (!user?.id || msg.user_id !== user.id) return;
 try {
 const { error } = await supabase
 .from('messages')
 .update({ content: 'ئەڤ نامەیە هاتە ژێبرن' })
 .eq('id', msg.id)
 .eq('user_id', user.id);

 if (error) throw error;

 // Update UI optimistically
 if (activeTab === 'global') {
 setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: 'ئەڤ نامەیە هاتە ژێبرن' } : m));
 } else if (selectedChat) {
 setChatMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: 'ئەڤ نامەیە هاتە ژێبرن' } : m));
 }
 } catch (e) {
 console.error("Error deleting message:", e);
 alert("Delete Error: " + (e?.message || e?.toString()));
 }
 };

 const handleReport = async (msg) => {
 // Optimistically hide the message
 const updateLocalState = (prev) => prev.filter(m => m.id !== msg.id);
 if (activeContextMenu?.isPrivate) {
 setChatMessages(prev => updateLocalState(prev));
 } else {
 setMessages(prev => updateLocalState(prev));
 }

 // Insert into reported_messages table
 try {
 await supabase.from('reported_messages').insert([{
 message_id: msg.id,
 reporter_id: user?.id
 }]);
 } catch (err) {
 console.error("Failed to report message:", err);
 }
 };

 const preparePendingImage = (file) => {
 if (!file) return;

 // Clean up previous preview URL to avoid memory leaks
 if (pendingImagePreview) {
 URL.revokeObjectURL(pendingImagePreview);
 }

 setPendingImage(file);
 setPendingImagePreview(URL.createObjectURL(file));
 };

 const handleImageUpload = (e) => {
 preparePendingImage(e.target.files[0]);
 if (e.target) e.target.value = '';
 };

 const handlePaste = (e) => {
 const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
 if (!items) return;
 for (let index in items) {
 const item = items[index];
 if (item.kind === 'file' && item.type.startsWith('image/')) {
 const file = item.getAsFile();
 if (file) {
 preparePendingImage(file);
 e.preventDefault();
 break;
 }
 }
 }
 };

 // --- Voice Notes Methods ---
 const startRecording = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
 mediaRecorderRef.current = mediaRecorder;
 audioChunksRef.current = [];

 mediaRecorder.ondataavailable = (e) => {
 if (e.data.size > 0) audioChunksRef.current.push(e.data);
 };

 mediaRecorder.onstop = () => {
 const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
 stream.getTracks().forEach(track => track.stop());
 if (audioBlob.size > 0) {
 uploadAndSendVoiceNote(audioBlob);
 }
 };

 mediaRecorder.start();
 setIsRecording(true);
 setIsRecordingPaused(false);
 setRecordingTime(0);
 recordingTimerRef.current = setInterval(() => {
 setRecordingTime(prev => prev + 1);
 }, 1000);
 triggerHaptic(10);
 } catch (err) {
 console.error("Microphone access error:", err);
 alert("تکایە ڕێگە ب مایکڕۆفۆنی بدە بۆ هنارتنا دەنگی.");
 }
 };

 const stopRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 setIsRecording(false);
 setIsRecordingPaused(false);
 clearInterval(recordingTimerRef.current);
 }
 };

 const pauseRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 if (isRecordingPaused) {
 mediaRecorderRef.current.resume();
 setIsRecordingPaused(false);
 recordingTimerRef.current = setInterval(() => {
 setRecordingTime(prev => prev + 1);
 }, 1000);
 } else {
 mediaRecorderRef.current.pause();
 setIsRecordingPaused(true);
 clearInterval(recordingTimerRef.current);
 }
 triggerHaptic(10);
 }
 };

 const cancelRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.onstop = null; // Prevent sending
 mediaRecorderRef.current.stop();
 mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
 setIsRecording(false);
 setIsRecordingPaused(false);
 clearInterval(recordingTimerRef.current);
 setRecordingTime(0);
 triggerHaptic(10);
 }
 };

 const uploadAndSendVoiceNote = async (blob) => {
 if (!user?.id) return;
 setIsUploadingImage(true);
 try {
 const fileName = `${user.id}/${Date.now()}.webm`;
 const { error: uploadError } = await supabase.storage
 .from('chat_audio')
 .upload(fileName, blob, { cacheControl: '3600', upsert: false });

 if (uploadError) throw uploadError;

 const { data: { publicUrl } } = supabase.storage
 .from('chat_audio')
 .getPublicUrl(fileName);

 const finalMsgContent = `[VOICE:${publicUrl}]`;
 const currentUserId = user.id;
 const isGlobal = activeTab === 'global';
 const receiverId = isGlobal ? null : selectedChat?.id;

 let replyToId = null;
 let replyToText = null;
 if (replyingTo) {
 replyToId = replyingTo.id;
 replyToText = replyingTo.content;
 }

 // Optimistic update removed to prevent duplicates with realtime subscription.
 // Instead, we will fetch the real data after insertion.

 const { error } = await supabase.from('messages').insert([{
 content: finalMsgContent,
 user_id: currentUserId,
 user_nickname: userNickname,
 receiver_id: receiverId,
 reply_to_id: replyToId,
 reply_to_text: replyToText,
 is_read: isGlobal ? true : false
 }]);

 if (error) throw error;
 playMessageSentSound();
 setReplyingTo(null);

 // Refresh data just like handleSendMessage
 if (isGlobal) {
 fetchGlobalMessages();
 } else {
 fetchPrivateChatHistory(receiverId, selectedChat?.isBotChat);
 fetchPrivateConversations();
 }

 if (messagesContainerRef.current) {
 messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
 }
 } catch (err) {
 console.error("Voice upload error:", err);
 alert("خەلەتی د هنارتنا دەنگی دا چێبوو.");
 } finally {
 setIsUploadingImage(false);
 }
 };

 const formatRecordingTime = (seconds) => {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
 };
 // -------------------------

 const handleSendMessage = async (e, overrideContent = null) => {
 const msgToProcess = overrideContent || newMessage.trim();
 if ((!msgToProcess && !pendingImage) || !user?.id) return;

 const currentUserId = user?.id;
 triggerHaptic(15);
 playMessageSentSound();

 let finalMsgContent = msgToProcess;
 let uploadedImageUrl = null;

 if (pendingImage) {
 setIsUploadingImage(true);
 try {
 const fileExt = pendingImage.name ? pendingImage.name.split('.').pop() : 'png';
 const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

 const { error: uploadError } = await supabase.storage
 .from('chat_images')
 .upload(fileName, pendingImage, { cacheControl: '3600', upsert: false });

 if (uploadError) throw uploadError;

 const { data: { publicUrl } } = supabase.storage
 .from('chat_images')
 .getPublicUrl(fileName);

 uploadedImageUrl = publicUrl;
 } catch (err) {
 console.error("Image upload error:", err);
 alert("خەلەتی د ئاپلۆدکرنێدا چێبوو.");
 setIsUploadingImage(false);
 return; // Stop sending if image upload fails
 }
 }

 if (uploadedImageUrl) {
 finalMsgContent = `[IMAGE:${uploadedImageUrl}] ${finalMsgContent}`.trim();
 }

 // Clear input immediately for better UX
 if (!overrideContent) setNewMessage('');
 if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
 setPendingImage(null);
 setPendingImagePreview(null);
 setIsUploadingImage(false);

 if (textareaRef.current) {
 textareaRef.current.style.height = 'auto';
 }

 try {
 if (activeTab === 'global') {
 const payload = {
 content: finalMsgContent,
 user_id: currentUserId,
 user_nickname: userNickname || 'یاریزان',
 user_avatar: userAvatar,
 reply_to_id: replyingTo?.id,
 reply_to_text: replyingTo?.content || replyingTo?.text
 };

 // Optimistic update for Global
 const msgId = crypto.randomUUID();
 setMessages(prev => [...prev, { ...payload, created_at: new Date().toISOString(), id: msgId, isPending: true }]);
 setReplyingTo(null); // Clear reply state

 const { error } = await supabase.from('messages').insert([{
 id: msgId,
 content: payload.content,
 user_id: payload.user_id,
 user_nickname: payload.user_nickname,
 reply_to_id: payload.reply_to_id,
 reply_to_text: payload.reply_to_text
 }]);
 if (error) {
 console.error("Global send error:", error);
 throw error;
 }
 } else if (selectedChat) {
 const partnerId = selectedChat.id;
 const isBotChat = selectedChat.isBotChat;
 const myId = isBotChat ? '9a813c24-b662-477d-a74a-6f822d17bbf1' : currentUserId;
 const myNickname = isBotChat ? 'پەیڤۆک' : (userNickname || 'یاریزان');

 // Optimistic update for Private
 const msgId = crypto.randomUUID();
 const tempMsg = {
 id: msgId,
 content: finalMsgContent,
 user_id: myId,
 receiver_id: partnerId,
 reply_to_id: replyingTo?.id,
 reply_to_text: replyingTo?.content || replyingTo?.text,
 created_at: new Date().toISOString(),
 isPending: true
 };
 setChatMessages(prev => [...prev, tempMsg]);
 setReplyingTo(null); // Clear reply state after sending

 const { data: insertedMsg, error } = await supabase
 .from('messages')
 .insert([{
 id: msgId,
 content: finalMsgContent,
 user_id: myId,
 user_nickname: myNickname,
 receiver_id: partnerId,
 reply_to_id: tempMsg.reply_to_id,
 reply_to_text: tempMsg.reply_to_text,
 is_read: false
 }]).select();

 if (error) {
 console.error("Private send error:", error);
 throw error;
 }

 // --- FORWARD BOT MESSAGES TO REPORTED_MESSAGES ---
 if (partnerId === '9a813c24-b662-477d-a74a-6f822d17bbf1' && insertedMsg && insertedMsg[0] && !isBotChat) {
 try {
 await supabase.from('reported_messages').insert([{
 message_id: insertedMsg[0].id,
 reporter_id: currentUserId,
 reason: `[نامەیا بۆتی]: ${finalMsgContent}`
 }]);
 } catch (reportErr) {
 console.error("Failed to forward to reported_messages:", reportErr);
 }
 }
 // -------------------------------------------------

 // Refresh history to get real DB data (IDs, etc)
 fetchPrivateChatHistory(partnerId, isBotChat);
 // Also refresh conversations list to update last message
 fetchPrivateConversations();


 }
 } catch (err) {
 console.error("Failed to send message:", err);
 const errorMsg = err.message || "ئاریشەکا نەدیار";
 const errorCode = err.code || "unknown";
 alert(`ئاریشەیەک د ھنارتنا نامەیێ دا ھەبوو:\n\nMessage: ${errorMsg}\nCode: ${errorCode}\n\nهێڤییە دڵنیابە کو دەستھەڵاتێن Supabase دروستن.`);
 // On failure, we could restore the message to the box
 setNewMessage(finalMsgContent);
 }
 };

 const handleReact = async (msgId, emoji, isPrivate = false) => {
 if (!user?.id) return;
 triggerHaptic(10, true);
 const table = 'messages';

 // Optimistic UI update
 const updateLocalState = (prev) => prev.map(m => {
 if (m.id === msgId) {
 const reactions = { ...(m.reactions || {}) };
 const users = [...(reactions[emoji] || [])];
 const idx = users.findIndex(u => (typeof u === 'string' ? u : u.id) === user?.id);
 if (idx > -1) users.splice(idx, 1);
 else users.push({ id: user?.id, name: userNickname || 'بێناڤ' });

 if (users.length === 0) delete reactions[emoji];
 else reactions[emoji] = users;
 return { ...m, reactions };
 }
 return m;
 });

 if (isPrivate) setChatMessages(prev => updateLocalState(prev));
 else setMessages(prev => updateLocalState(prev));

 try {
 // Fetch message to check ownership
 const columns = 'reactions, user_id';
 const { data: msg, error: fetchError } = await supabase.from(table).select(columns).eq('id', msgId).single();
 if (fetchError) throw fetchError;

 // Prevent reacting to own messages
 const ownerId = msg.user_id;
 if (ownerId === user?.id) {
 console.warn("You cannot react to your own message.");
 // Revert optimistic UI
 if (isPrivate) setChatMessages(prev => updateLocalState(prev));
 else setMessages(prev => updateLocalState(prev));
 return;
 }

 let reactions = msg?.reactions || {};
 const users = reactions[emoji] || [];
 const userIndex = users.findIndex(u => (typeof u === 'string' ? u : u.id) === user?.id);

 if (userIndex > -1) users.splice(userIndex, 1);
 else users.push({ id: user?.id, name: user?.nickname || 'بێناڤ' });

 if (users.length === 0) delete reactions[emoji];
 else reactions[emoji] = users;

 await supabase.from(table).update({ reactions }).eq('id', msgId);
 } catch (err) {
 console.error("Database sync failed for reaction:", err);
 // Revert is handled by the next realtime sync/fetch
 }
 };


 const handleToggleBlock = async (currentStatus) => {
 if (!selectedPlayer || !user?.id) return;
 const success = await toggleBlockInContext(selectedPlayer.id, currentStatus);
 if (success) {
 if (!currentStatus) alert("یاریزان ھاتە بلۆککرن!");
 else alert("بلۆک ھاتە لابرن!");
 setSelectedPlayer(null); // Close modal after action
 }
 };

 return (
 <div className={`fixed inset-0 md:relative md:inset-auto md:flex-1 md:w-full flex flex-col bg-mono-white dark:bg-black text-mono-900 dark:text-mono-50 overflow-hidden transition-colors duration-300 pb-0`} dir="rtl">
 <div className="flex-1 flex flex-col w-full overflow-hidden relative">
 {/* Tabs - Clash Royale Style */}
 <div className="w-full bg-[#3b82f6] relative z-20 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.2)] pb-4 rounded-none border-b-4 border-black" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
 <div className="h-2 w-full" />
 <div className="relative h-9.5 w-full">
 <div className="flex items-center justify-center gap-3 w-full relative z-10 h-full px-4">
 {[
 {
 id: 'global',
 label: 'نامەیێن گشتی',
 icon: 'public',
 badge: messages.filter(m => m.content && userNickname && m.content.includes(`@${userNickname}`)).length > 0
 ? messages.filter(m => m.content && userNickname && m.content.includes(`@${userNickname}`)).length
 : (newGlobalCount > 0 ? -1 : 0)
 },
 { id: 'private', label: 'نامەیێن تایبەت', icon: 'chat', badge: unreadMessageCount }
 ].map(tab => {
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => {
 triggerHaptic(10);
 playTabSound();
 setActiveTab(tab.id);
 setSelectedChat(null);
 if (tab.id === 'global') {
 setNewGlobalCount(0); // clear local mentions/count on view
 }
 }}
 className={`h-8 flex-1 sm:flex-none sm:px-8 font-black uppercase tracking-normal font-rabar text-[11px] sm:text-[12px] transition-transform duration-100 flex items-center justify-center gap-1.5 outline-none btn-clash-sm ${isActive
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className="material-symbols-outlined text-[16px] drop-shadow-md">{tab.icon}</span>
 <span className={`relative z-20 ${isActive ? 'drop-shadow-md' : ''}`}>{tab.label}</span>

 {/* Badges */}
 {tab.badge > 0 && (
 <span className="absolute -top-2 -right-1 min-w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_0_#b91c1c,0_1px_2px_#000] z-20 border border-black/80">
 <span className="text-[10px] text-white font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none mt-0.5">
 {toKuDigits(tab.badge > 99 ? '99+' : tab.badge)}
 </span>
 </span>
 )}
 {tab.badge === -1 && (
 <span className="absolute top-1 right-3 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] z-20"></span>
 )}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* Welcome Marquee Container */}
 {activeTab === 'global' && (
 <div className="w-full relative overflow-hidden shrink-0 flex items-center h-8 md:h-10 bg-[#e6f1f8] border-b-2 border-black/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]" dir="ltr">
 {marqueeAnnouncements.length > 0 && (
 <div className="w-full relative flex items-center z-0">
 <div className="animate-marquee font-black text-[12px] md:text-[13px] text-[#1f2937] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] whitespace-nowrap tracking-wide py-2" dir="rtl">
 {marqueeAnnouncements.map(a => a.text).join('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0✦\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0')}
 </div>
 </div>
 )}

 </div>
 )}

 <AnimatePresence>
 {connectionError && (
 <Motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="px-4 mb-2"
 >
 <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-md p-2 flex items-center justify-center gap-2">
 <span className="material-symbols-outlined text-[16px]">cloud_off</span>
 <span className="text-xs font-black">ئاریشەیەک د پەیوەندیێ دا هەیە... بزاڤا دووبارە دکەین</span>
 </div>
 </Motion.div>
 )}
 </AnimatePresence>

 {/* Main Content Area - Layout Engine */}
 <div className="flex-1 overflow-hidden relative flex flex-col">
 {loading && (
 <div className="absolute inset-0 flex items-center justify-center bg-mono-white dark:bg-black z-10 transition-colors duration-500">
 <div className="w-10 h-10 border-4 border-mono-200 dark:border-mono-800 border-t-primary rounded-full animate-spin" />
 </div>
 )}

 {/* Global Chat View */}
 {activeTab === 'global' && (
 <div className="flex-1 relative overflow-hidden bg-[#16212b] transition-colors duration-500 dark">
 <ChatWallpaperPattern />

 <div
 ref={messagesContainerRef}
 className="relative z-10 flex-1 h-full overflow-y-auto p-4 flex flex-col space-y-4 no-scrollbar"
 >
 <div className="mt-auto flex-none" />
 <AnimatePresence initial={false}>
 {messages.map((m, idx) => (
 <MessageItem
 key={m.id || idx}
 m={m}
 isMe={m.user_id === user?.id}
 currentUserId={user?.id}
 currentUserNickname={userNickname}
 showNickname={true}
 reactionUsers={reactionUsers}
 topDailyPlayers={topDailyPlayers}
 onLongPress={(msg, rect) => setActiveContextMenu({ message: msg, rect, isPrivate: false })}
 onReact={handleReact}
 onReactionLongPress={(msg, emoji, x, y) => setActiveReactionModal({ message: msg, activeTab: emoji, x, y, isPrivate: false })}
 onProfileClick={setSelectedPlayer}
 onImageClick={setFullscreenImage}
 onOpenHowToPlay={onOpenHowToPlay}
 />
 ))}
 </AnimatePresence>

 {globalViewers.length > 0 && (
 <div className="flex items-center justify-start gap-1.5 mt-2 pt-2 border-t border-white/5 pr-1 w-full min-w-0 relative">
 <span className="text-[10px] text-mono-400 dark:text-mono-500 font-bold ml-1 shrink-0">سەرهێل:</span>

 {/* The Clickable Overlapping Avatars */}
 <button
 onClick={() => { triggerHaptic(10); setShowAllOnline(prev => !prev); }}
 className="flex flex-row-reverse -space-x-1.5 space-x-reverse items-center outline-none"
 >
 {globalViewers.slice(0, 5).map((v, i) => (
 <div key={v.id || i} className="w-5 h-5 rounded-full overflow-hidden border border-[#16212b] shadow-sm relative" style={{ zIndex: 5 - i }}>
 {v.avatar_url && v.avatar_url !== 'default' ? (
 <img src={v.avatar_url} alt={v.nickname} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-mono-200 dark:bg-mono-700 flex items-center justify-center text-[9px] font-black text-primary uppercase">
 {(v.nickname || 'ی')[0]}
 </div>
 )}
 </div>
 ))}
 {globalViewers.length > 5 && (
 <div className="w-5 h-5 rounded-full bg-mono-800 border border-[#16212b] flex items-center justify-center text-[8px] font-bold text-white relative z-0">
 +{globalViewers.length - 5}
 </div>
 )}
 </button>

 {/* The Delicate Dropdown List */}
 <AnimatePresence>
 {showAllOnline && (
 <Motion.div
 initial={{ opacity: 0, y: 5, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 5, scale: 0.95 }}
 className="absolute bottom-full right-1 mb-2 w-auto min-w-30 max-h-75 overflow-y-auto custom-scrollbar bg-[#1a1c23] border border-white/10 rounded-md shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-50 flex flex-col"
 >
 {globalViewers.map((v, i) => (
 <div key={v.id} className={`flex items-center gap-2 p-1.5 ${i !== globalViewers.length - 1 ? 'border-b border-white/5' : ''}`}>
 <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[#16212b]">
 {v.avatar_url && v.avatar_url !== 'default' ? (
 <img src={v.avatar_url} alt={v.nickname} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-mono-200 dark:bg-mono-700 flex items-center justify-center text-[9px] font-black text-primary uppercase">
 {(v.nickname || 'ی')[0]}
 </div>
 )}
 </div>
 <span className="text-[11px] font-bold text-mono-300 truncate max-w-24 leading-none pt-0.5">{v.nickname}</span>
 </div>
 ))}
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 )}
 </div>
 </div>
 )}



 {/* Private Chat View - Complex Layout Support */}
 {activeTab === 'private' && (
 <div className="flex-1 flex flex-col overflow-hidden">
 {selectedChat ? (
 <div className="flex-1 flex flex-col overflow-hidden bg-mono-50 dark:bg-black">
 <div className="shrink-0 p-3 bg-mono-white dark:bg-mono-900 border-b border-mono-200 dark:border-mono-800 flex items-center justify-between z-10 shadow-sm transition-colors duration-300">
 <div className="flex items-center gap-3">
 <button onClick={() => { playBubblePopSound(); setSelectedChat(null); }} className="material-symbols-outlined text-mono-400 hover:text-mono-900 dark:text-mono-500 dark:hover:text-mono-100">arrow_back</button>
 <div className="flex items-center gap-3 cursor-pointer" onClick={() => { triggerHaptic(10); playBubblePopSound(); setSelectedPlayer(selectedChat); }}>
 {selectedChat.id === '9a813c24-b662-477d-a74a-6f822d17bbf1' ? (
 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-mono-200 dark:border-mono-800 overflow-hidden bg-white dark:bg-[#141414]">
 <img src="/Peyvok-logo-01.png" alt="پەیڤۆک" className="w-full h-full object-cover block dark:hidden" />
 <img src="/Peyvok-logo-02.png" alt="پەیڤۆک" className="w-full h-full object-cover hidden dark:block" />
 </div>
 ) : (
 <Avatar src={selectedChat.avatar_url} lastActive={selectedChat.updated_at} isOnline={onlineUsers?.has(selectedChat.id)} showStatus={true} size="sm" />
 )}
 <div className="flex flex-col items-start">
 <span className="font-black text-sm hover:text-primary transition-colors text-mono-900 dark:text-mono-100">
 {selectedChat.id === '9a813c24-b662-477d-a74a-6f822d17bbf1' ? 'پەیڤۆک Peyvok' : selectedChat.nickname}
 </span>
 <span className="text-[10px] text-mono-500 dark:text-mono-400 font-medium">
 {onlineUsers?.has(selectedChat.id) ? 'سەرهێلە' : (() => {
 if (!selectedChat.updated_at) return 'دەرهێل';
 const diff = Math.floor((new Date() - new Date(selectedChat.updated_at)) / 1000);
 if (diff < 60) return 'دوماهیک دیتن چەند چرکەیەک ژبەری نۆکە';
 if (diff < 3600) return `دوماهیک دیتن ${toKuDigits(Math.floor(diff / 60))} خولەک ژبەری نۆکە`;
 if (diff < 86400) return `دوماهیک دیتن ${toKuDigits(Math.floor(diff / 3600))} دەمژمێر ژبەری نۆکە`;
 return `دوماهیک دیتن ${toKuDigits(Math.floor(diff / 86400))} ڕۆژ ژبەری نۆکە`;
 })()}
 </span>
 </div>
 </div>
 </div>

 {/* Clear Chat Button (For Normal Players) */}
 {selectedChat.id !== '9a813c24-b662-477d-a74a-6f822d17bbf1' && (
 <button
 onClick={() => {
 triggerHaptic(20);
 setChatToDelete(selectedChat);
 setShowDeleteConfirm(true);
 }}
 className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm shrink-0 ml-1"
 title="ژێبرنا نامەیان"
 >
 <span className="material-symbols-outlined text-[18px]">delete</span>
 </button>
 )}

 {/* Report Button (For Peyvok Bot ONLY) */}
 {selectedChat.id === '9a813c24-b662-477d-a74a-6f822d17bbf1' && (
 <button
 onClick={() => {
 triggerHaptic(20);
 setIsReportModalOpen(true);
 }}
 className="h-8 px-3 rounded-full bg-primary/10 text-primary flex items-center justify-center gap-1.5 hover:bg-primary hover:text-white transition-all shadow-sm shrink-0 ml-1"
 title="هنارتنا ڕاپۆرت یان پێشنیار"
 >
 <span className="material-symbols-outlined text-[17px]">report</span>
 <span className="text-[11px] font-bold">ڕاپۆرت</span>
 </button>
 )}
 </div>
 <div className="flex-1 relative overflow-hidden bg-[#16212b] transition-colors duration-500 dark">
 <ChatWallpaperPattern />

 <div
 ref={messagesContainerRef}
 className="relative z-10 flex-1 h-full overflow-y-auto p-4 flex flex-col space-y-4 no-scrollbar"
 >
 <div className="mt-auto flex-none" />
 {/* Disappearing Messages Notice */}
 <div className="flex justify-center mb-4 mt-2">
 <div className="bg-mono-200/60 dark:bg-mono-800/60 border border-mono-300/30 dark:border-mono-700/30 text-mono-600 dark:text-mono-300 text-[11.5px] leading-relaxed text-center px-4 py-2.5 rounded-xl max-w-[90%] shadow-sm flex items-start gap-2.5" dir="rtl">
 <span className="material-symbols-outlined text-[18px] shrink-0 text-mono-500 mt-0.5">schedule</span>
 <span>نامەیێن ڤی چاتی پشتی ٢٤ دەمژمێران ژ دەمێ هنارتنێ دێ ب شێوەیەکێ ئۆتۆماتیکی ژێ چن.</span>
 </div>
 </div>

 {(() => {
 const myId = selectedChat?.isBotChat ? '9a813c24-b662-477d-a74a-6f822d17bbf1' : user?.id;
 const lastReadMsgId = chatMessages.slice().reverse().find(msg => msg.user_id === myId && msg.is_read)?.id;

 return chatMessages.map((m, idx) => (
 <MessageItem
 key={m.id || idx}
 m={m}
 isMe={m.user_id === myId}
 currentUserId={myId}
 currentUserNickname={selectedChat?.isBotChat ? 'پەیڤۆک' : userNickname}
 reactionUsers={reactionUsers}
 topDailyPlayers={topDailyPlayers}
 onOpenHowToPlay={onOpenHowToPlay}
 isLastReadByPartner={m.id === lastReadMsgId}
 partnerInfo={selectedChat}
 onSeen={async (id) => {
 if (m.user_id !== myId && !m.is_read) {
 await supabase
 .from('messages')
 .update({ is_read: true })
 .eq('id', id);
 }
 }}
 onLongPress={(msg, rect) => setActiveContextMenu({ message: msg, rect, isPrivate: true })}
 onReact={(msgId, emoji) => handleReact(msgId, emoji, true)}
 onReactionLongPress={(msg, emoji, x, y) => setActiveReactionModal({ message: msg, activeTab: emoji, x, y, isPrivate: true })}
 onProfileClick={setSelectedPlayer}
 onImageClick={setFullscreenImage}
 />
 ));
 })()}

 {partnerIsTyping && (
 <Motion.div
 initial={{ opacity: 0, scale: 0.9, y: 5 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 className="flex items-center gap-2 mb-4 w-fit"
 >
 <div className="bg-white dark:bg-mono-900 px-3.5 py-2 rounded-md rounded-tl-none border border-mono-200 dark:border-mono-800 flex items-center gap-3 shadow-sm relative overflow-hidden" dir="ltr">

 <Motion.span
 animate={{ opacity: [0.6, 1, 0.6] }}
 transition={{ repeat: Infinity, duration: 1.5 }}
 className="text-[11px] font-bold text-mono-500 dark:text-mono-300 tracking-wide"
 dir="rtl"
 >
 دنڤیسیت...
 </Motion.span>

 <div className="flex gap-1.5 items-center">
 <Motion.span
 animate={{ y: [0, -5, 0], scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
 transition={{ repeat: Infinity, duration: 0.9, delay: 0, ease: "easeInOut" }}
 className="w-1.5 h-1.5 bg-[#00d26a] rounded-full shadow-[0_0_4px_rgba(0,210,106,0.6)]"
 />
 <Motion.span
 animate={{ y: [0, -5, 0], scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
 transition={{ repeat: Infinity, duration: 0.9, delay: 0.15, ease: "easeInOut" }}
 className="w-1.5 h-1.5 bg-[#00d26a] rounded-full shadow-[0_0_4px_rgba(0,210,106,0.6)]"
 />
 <Motion.span
 animate={{ y: [0, -5, 0], scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
 transition={{ repeat: Infinity, duration: 0.9, delay: 0.3, ease: "easeInOut" }}
 className="w-1.5 h-1.5 bg-[#00d26a] rounded-full shadow-[0_0_4px_rgba(0,210,106,0.6)]"
 />
 </div>

 </div>
 </Motion.div>
 )}
 </div>
 </div>
 </div>
 ) : (
 <div className="flex-1 relative overflow-hidden bg-[#16212b] transition-colors duration-500 dark">
 <div className="absolute inset-0 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar z-10 flex flex-col">
 {privateChats.length === 0 && !loading ? (
 <div className="flex-1 flex flex-col items-center justify-center space-y-8 mt-10">
 <div className="flex flex-col items-center space-y-4 opacity-50">
 <span className="material-symbols-outlined text-6xl text-white/50">forum</span>
 <div className="text-center">
 <div className="font-black text-lg text-mono-50">ھیچ نامەیەک نینە</div>
 <div className="text-xs font-light font-rabar text-white/60">دەستپێبکە ب نڤێسینا نامەیەکێ بۆ ھەڤالێن خوە</div>
 </div>
 <button
 onClick={() => { triggerHaptic(10); if (_onViewFriends) _onViewFriends(); }}
 className="px-6 py-2 bg-mono-900 text-white rounded-md text-xs font-black border border-mono-800 shadow-sm"
 >
 دیتنا ھەڤالان
 </button>
 </div>

 <div className="w-full max-w-sm p-4 rounded-xl bg-[#1e2d3b] border-2 border-[#2a3f54] flex flex-col items-center gap-3 shadow-[0_4px_0_#15202b] mx-auto mb-2">
 <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center border-2 border-green-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.3)]">
 <span className="material-symbols-outlined text-2xl text-white font-black drop-shadow-md">person_add</span>
 </div>
 <div className="text-center">
 <h4 className="text-[14px] font-black font-rabar text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">ھەڤالێن خوە داخواز بکە</h4>
 <p className="text-[11px] font-bold text-[#9ca3af] mt-1 px-4 leading-relaxed">ئەگەر تە ھەڤال نینن، لینکێ یاریێ کۆپی بکە و بۆ وان بهنێرە</p>
 </div>
 <button
 onClick={async () => {
 triggerHaptic(10);
 const shareLink = `https://www.peyvokgame.com/auth?invite=${user?.id || 'guest'}`;
 const shareText = `وەرە دگەل من یارییا پەیڤۆک بکە! ئەڤە لینکێ من یێ بانگهێشتکرنێ یە:\n${shareLink}`;
 if (navigator.share) {
 try {
 // Only send URL for strict apps like Snapchat
 await navigator.share({ url: shareLink });
 } catch (err) {
 if (err.name !== 'AbortError') {
 navigator.clipboard.writeText(shareText);
 alert('لینک ھاتە کۆپیکرن! بۆ ھەڤالێن خوە بهنێرە.');
 }
 }
 } else {
 navigator.clipboard.writeText(shareText);
 alert('لینک ھاتە کۆپیکرن! بۆ ھەڤالێن خوە بهنێرە.');
 }
 }}
 className="w-full py-2.5 mt-1 bg-green-600 text-white rounded-md font-black font-rabar text-[12px] hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
 >
 <span className="material-symbols-outlined text-base">share</span>
 بەلاڤکرنا لینکێ یاریێ
 </button>
 </div>
 </div>
 ) : (
 privateChats.map((chat, index) => {
 const isBot = chat.id === '9a813c24-b662-477d-a74a-6f822d17bbf1';
 return (
 <div
 key={`${chat.id}-${index}`}
 onClick={async () => {
 setSelectedChat(chat);
 if (chat.unreadCount > 0 && user?.id) {
 // Optimistically update
 setPrivateChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
 setUnreadMessageCount(prev => Math.max(0, prev - chat.unreadCount));

 const partnerId = chat.isBotChat ? '9a813c24-b662-477d-a74a-6f822d17bbf1' : chat.id;
 await supabase
 .from('messages')
 .update({ is_read: true })
 .eq('user_id', partnerId)
 .eq('receiver_id', user.id)
 .eq('is_read', false);
 }
 }}
 className={`shrink-0 flex items-center justify-between gap-4 py-5 px-4 cursor-pointer transition-all group relative overflow-hidden ${isBot
 ? 'bg-primary shadow-[0_4px_0_#047857] border-none rounded-md active:translate-y-0.5 active:shadow-[0_0px_0_#047857] mb-4'
 : 'btn-clash btn-clash-pale text-mono-900'
 }`}
 >
 {isBot && (
 <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
 )}
 {/* Left Group: Avatar + Content */}
 <div className="flex flex-1 items-center justify-start gap-3 min-w-0 relative z-10">
 {/* Avatar */}
 <div className="shrink-0" onClick={(e) => { e.stopPropagation(); triggerHaptic(10); setSelectedPlayer(chat); }}>
 {isBot ? (
 <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white/30 overflow-hidden bg-white dark:bg-[#141414]">
 <img src="/Peyvok-logo-01.png" alt="پەیڤۆک" className="w-[80%] h-[80%] object-contain block dark:hidden" />
 <img src="/Peyvok-logo-02.png" alt="پەیڤۆک" className="w-[80%] h-[80%] object-contain hidden dark:block" />
 </div>
 ) : (
 <Avatar
 src={chat.avatar_url}
 lastActive={chat.updated_at}
 isOnline={onlineUsers?.has(chat.id)}
 showStatus={true}
 size="md"
 border={false}
 className="transition-all"
 />
 )}
 </div>

 {/* Name and Message */}
 <div className="flex flex-col items-start min-w-0 flex-1">
 <span className={`font-black text-sm truncate w-full text-right transition-colors ${isBot
 ? 'text-white'
 : 'text-mono-900 group-hover:text-primary'
 }`}>
 {isBot ? 'پەیڤۆک Peyvok' : chat.nickname}
 </span>
 <div className={`flex items-center gap-1.5 text-xs font-rabar w-full justify-start ${isBot ? 'text-white/80 font-bold' : (chat.unreadCount > 0 ? 'text-mono-900 font-black' : 'text-mono-500 font-bold')}`}>
 <span className="material-symbols-outlined text-[14px]">chat</span>
 <span className="truncate flex items-center gap-1">
 {renderPreviewText(chat.lastMsg)}
 </span>
 </div>
 </div>
 </div>

 {/* Right Side: Time and Indicator */}
 <div className="flex flex-col items-end justify-center min-w-12.5 pr-1 relative z-10">
 <span className={`text-[10px] font-bold mb-1 ${isBot ? 'text-white/70' : 'text-mono-500'}`}>
 {new Date(chat.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
 </span>
 {chat.unreadCount > 0 && (
 <div className={`w-5 h-5 text-[10px] font-black rounded-full flex items-center justify-center ${isBot ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
 {toKuDigits(chat.unreadCount)}
 </div>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Public Profile Modal */}
 <AnimatePresence>
 {selectedPlayer && (
 <PublicProfileModal
 profile={selectedPlayer}
 currentUser={user}
 onClose={() => setSelectedPlayer(null)}
 onToggleBlock={handleToggleBlock}
 onOpenChat={(player) => {
 setSelectedPlayer(null);
 setActiveTab('private');
 setSelectedChat(player);
 }}
 onActionComplete={() => {
 fetchPrivateConversations();
 }}
 />
 )}
 {activeContextMenu && (() => {
 const content = activeContextMenu.message.content || activeContextMenu.message.text || '';
 const isSticker = /^\s*\[STICKER:(.*?)\]\s*$/.test(content);
 const stickerUrl = isSticker ? content.match(/^\s*\[STICKER:(.*?)\]\s*$/)[1] : null;
 const isFavorite = isSticker && favoriteStickers.includes(stickerUrl);

 return (
 <MessageContextMenu
 m={activeContextMenu.message}
 rect={activeContextMenu.rect}
 isMe={selectedChat?.isBotChat ? activeContextMenu.message.user_id === '9a813c24-b662-477d-a74a-6f822d17bbf1' : activeContextMenu.message.user_id === user?.id}
 onClose={() => setActiveContextMenu(null)}
 onReport={handleReport}
 onReact={(emoji) => handleReact(activeContextMenu.message.id, emoji, activeContextMenu.isPrivate)}
 onReply={(msg) => {
 triggerHaptic(10);
 setReplyingTo(msg);
 setTimeout(() => textareaRef.current?.focus(), 50);
 }}
 onCopy={(text) => {
 navigator.clipboard.writeText(text);
 triggerHaptic(50);
 setShowCopySuccess(true);
 setTimeout(() => setShowCopySuccess(false), 2000);
 }}
 onDelete={(msg) => handleDeleteMessage(msg)}
 isSticker={isSticker}
 isFavorite={isFavorite}
 onToggleFavorite={isSticker ? () => toggleFavoriteSticker(stickerUrl) : null}
 />
 );
 })()}
 </AnimatePresence>

 {/* Copy Success Toast */}
 <AnimatePresence>
 {showCopySuccess && (
 <Motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 20 }}
 className="fixed bottom-32 left-1/2 -translate-x-1/2 z-200 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-sm">check_circle</span>
 ھاتە ژبەرکرن
 </Motion.div>
 )}
 </AnimatePresence>

 {/* Input Area - WhatsApp Pill Style Swapped */}
 {(activeTab === 'global' || selectedChat) && (
 <>
 <div 
 className={`w-full shrink-0 ${isKeyboardVisible ? 'pb-[max(1.5rem,env(safe-area-inset-bottom))]' : 'pb-30'} bg-[#1a9bf0] dark:bg-[#1a9bf0] border-t border-black/20 shadow-[0_6px_15px_rgba(0,0,0,0.25)] relative z-30 transition-colors duration-300`}
 >
 {/* Reply Preview Box */}
 <AnimatePresence>
 {replyingTo && (
 <Motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="px-4 py-2 bg-mono-100/80 dark:bg-mono-900/80 border-b border-mono-200 dark:border-mono-800 flex items-center justify-between gap-3 overflow-hidden"
 >
 <div className="flex-1 min-w-0 border-r-4 border-primary/50 pr-3 py-1">
 <p className="text-[10px] font-black text-primary uppercase mb-0.5">بەرسڤدانا نامەیێ</p>
 <div className="text-xs text-mono-600 dark:text-mono-400 truncate flex items-center">{renderPreviewText(replyingTo.content || replyingTo.text)}</div>
 </div>
 <button
 onClick={() => { playBubblePopSound(); setReplyingTo(null); }}
 className="w-8 h-8 rounded-full flex items-center justify-center bg-mono-200 dark:bg-mono-800 hover:bg-mono-300 dark:hover:bg-mono-700 text-mono-600 dark:text-mono-400 transition-colors"
 >
 <span className="material-symbols-outlined text-[18px]">close</span>
 </button>
 </Motion.div>
 )}
 </AnimatePresence>
 <div className="bg-[#1a9bf0] dark:bg-[#1a9bf0] z-10 shrink-0 relative transition-colors duration-500">


 {/* Image Preview Container */}
 {pendingImagePreview && (
 <div className="px-4 pt-3 flex items-center justify-start" dir="rtl">
 <div className="relative rounded-lg overflow-hidden border border-mono-200 dark:border-mono-700 shadow-sm bg-mono-100 dark:bg-mono-900 w-24 h-24 sm:w-32 sm:h-32">
 <img src={pendingImagePreview} alt="Preview" className="w-full h-full object-cover" />

 {/* Close button */}
 <button
 onClick={() => {
 URL.revokeObjectURL(pendingImagePreview);
 setPendingImage(null);
 setPendingImagePreview(null);
 if (fileInputRef.current) fileInputRef.current.value = '';
 }}
 className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/90 text-white flex items-center justify-center hover:bg-black/95 transition-colors"
 >
 <span className="material-symbols-outlined text-[16px] font-bold">close</span>
 </button>

 {/* Edit button */}
 <button
 onClick={() => setIsImageEditorOpen(true)}
 className="absolute top-1 left-1 w-6 h-6 rounded-full bg-primary/80 text-white flex items-center justify-center hover:bg-primary transition-colors"
 >
 <span className="material-symbols-outlined text-[14px] font-bold">edit</span>
 </button>
 </div>
 </div>
 )}

 <div className="p-3 pb-3 flex items-center">
  <div className="relative w-10.5 h-10.5 shrink-0 me-2">
  {/* <AnimatePresence> */}
  {/* Conditional removed, both rendered */}
 <Motion.button
 key="btn-send"
  initial={false}
  animate={{ 
    opacity: (newMessage.trim() || pendingImage || isUploadingImage || !selectedChat) ? 1 : 0, 
    pointerEvents: (newMessage.trim() || pendingImage || isUploadingImage || !selectedChat) ? 'auto' : 'none' 
  }}
 transition={{ type: "spring", stiffness: 400, damping: 30 }}
 onClick={handleSendMessage}
 onPointerDown={(e) => e.preventDefault()}
 disabled={(!newMessage.trim() && !pendingImage && !isUploadingImage) || isUploadingImage}
 className={`absolute inset-0 flex items-center justify-center rounded-[10px] border border-[#0a203e] transition-all shrink-0 after:absolute after:top-0.5 after:right-0.75 after:w-2.5 after:h-2 after:bg-white/40 after:rounded-full after:blur-[1px] ${(newMessage.trim() || pendingImage || isUploadingImage)
 ? 'bg-linear-to-b from-[#8de635] to-[#4ab400] shadow-[0_4px_0_#388500,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1)] active:scale-95 active:translate-y-0.5 active:shadow-[0_1px_0_#388500,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:brightness-110'
 : 'bg-linear-to-b from-[#56c6ff] to-[#259cf3] shadow-[0_4px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1)] opacity-70 grayscale-20 cursor-not-allowed'}`}
 title="ھنارتن"
 >
 {isUploadingImage ? (
 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
 ) : (
 <svg viewBox="0 0 32 32" className="w-6.5 h-6.5 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] relative z-10" style={{ transform: 'translateX(-1px)' }}>
 <path d="M4 14 L28 4 L17 28 L13 18 Z" fill="url(#sendGrad)" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
 <path d="M28 4 L13 18" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
 <defs>
 <linearGradient id="sendGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#ffffff" />
 <stop offset="100%" stopColor="#e2e8f0" />
 </linearGradient>
 </defs>
 </svg>
 )}
 </Motion.button>
  {/* separator */}
 <Motion.button
 key="btn-mic"
  initial={false}
  animate={{ 
    opacity: !(newMessage.trim() || pendingImage || isUploadingImage || !selectedChat) ? 1 : 0, 
    pointerEvents: !(newMessage.trim() || pendingImage || isUploadingImage || !selectedChat) ? 'auto' : 'none' 
  }}
 transition={{ type: "spring", stiffness: 400, damping: 30 }}
 onClick={isRecording ? stopRecording : startRecording}
 disabled={isUploadingImage}
 className={`absolute inset-0 flex items-center justify-center rounded-[10px] border border-[#0a203e] transition-all shrink-0 after:absolute after:top-0.5 after:right-0.75 after:w-2.5 after:h-2 after:bg-white/40 after:rounded-full after:blur-[1px] ${isRecording
 ? 'bg-linear-to-b from-[#ff5e5e] to-[#e60000] shadow-[0_4px_0_#b30000,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1)] active:scale-95 active:translate-y-0.5 active:shadow-[0_1px_0_#b30000,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] animate-pulse'
 : 'bg-linear-to-b from-[#56c6ff] to-[#259cf3] shadow-[0_4px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1)] active:scale-95 active:translate-y-0.5 active:shadow-[0_1px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:brightness-110'}`}
 title={isRecording ? "هنارتنا دەنگی" : "تۆمارکرنا دەنگی"}
 >
 {isUploadingImage ? (
 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
 ) : isRecording ? (
 <svg viewBox="0 0 32 32" className="w-6.5 h-6.5 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] relative z-10" style={{ transform: 'translateX(-1px)' }}>
 <path d="M4 14 L28 4 L17 28 L13 18 Z" fill="url(#sendGradRec)" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
 <path d="M28 4 L13 18" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
 <defs>
 <linearGradient id="sendGradRec" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#ffffff" />
 <stop offset="100%" stopColor="#e2e8f0" />
 </linearGradient>
 </defs>
 </svg>
 ) : (
 <svg viewBox="0 0 32 32" className="w-6.5 h-6.5 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] relative z-10">
 <path d="M16 3 C13 3 11 5 11 9 L11 15 C11 19 13 21 16 21 C19 21 21 19 21 15 L21 9 C21 5 19 3 16 3 Z" fill="url(#micGrad)" stroke="#0f172a" strokeWidth="2" />
 <path d="M8 15 C8 20 11.5 24.5 16 25 C20.5 24.5 24 20 24 15" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
 <path d="M16 25 L16 30 M11 30 L21 30" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
 <defs>
 <linearGradient id="micGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#ffffff" />
 <stop offset="100%" stopColor="#e2e8f0" />
 </linearGradient>
 </defs>
 </svg>
  )}
 </Motion.button>
  {/* condition end */}
  {/* </AnimatePresence> */}
  </div>

 {isRecording ? (
 <div className="flex-1 bg-linear-to-b from-[#2573bd] to-[#155694] border border-[#0a203e] rounded-[10px] px-4 py-2.5 h-10.5 flex items-center justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.15)]" dir="ltr">
 <button onClick={cancelRecording} className="text-white/60 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/20">
 <span className="material-symbols-outlined font-black text-xl">delete</span>
 </button>
 <div className="flex items-center gap-3">
 <button onClick={pauseRecording} className={`text-white/60 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center rounded-full ${isRecordingPaused ? 'bg-red-500/20 text-red-400' : 'hover:bg-black/20'}`}>
 <span className="material-symbols-outlined font-black text-xl">{isRecordingPaused ? 'play_arrow' : 'pause'}</span>
 </button>
 <span className="text-sm font-bold text-red-500 font-inter min-w-9 text-center">{formatRecordingTime(recordingTime)}</span>
 <div className={`w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] ${isRecordingPaused ? 'opacity-50' : 'animate-pulse'}`} />
 </div>
 </div>
 ) : (
 <textarea
 ref={textareaRef}
 rows="1"
 value={newMessage}
 onPaste={handlePaste}
 onChange={(e) => {
 handleInputChange(e.target.value);
  const target = e.target;
  requestAnimationFrame(() => {
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  });
 }}
 onKeyDown={(e) => {
 const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
 if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
 e.preventDefault();
 handleSendMessage();
 }
 }}
 placeholder={selectedChat ? `بۆ ${selectedChat.nickname} بنڤێسە...` : "بنڤێسە..."}
 onFocus={() => {
 setIsKeyboardVisible(true);
 onKeyboardToggle?.(true);
 setShowEmojiPicker(false);
 setShowGifPicker(false);
 }}
 onBlur={() => {
 setIsKeyboardVisible(false);
 onKeyboardToggle?.(false);
 }}
 className="flex-1 min-w-0 bg-linear-to-b from-[#2573bd] to-[#155694] text-white placeholder-white/70 border border-[#0a203e] rounded-[10px] px-3.5 py-2.5 text-[13px] font-light font-rabar focus:ring-2 focus:ring-white/30 transition-colors duration-300 outline-none resize-none overflow-y-auto no-scrollbar shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.15)] min-h-10.5"
 />
 )}

 <input
 type="file"
 accept="image/*"
 ref={fileInputRef}
 style={{ display: 'none' }}
 onChange={handleImageUpload}
 />

 <AnimatePresence>
 {!isRecording && !(newMessage.trim().length > 0 || pendingImage || isUploadingImage) && (
  <Motion.div
  initial={false}
  animate={{ 
    opacity: !(newMessage.trim().length > 0 || pendingImage || isUploadingImage) ? 1 : 0, 
    width: !(newMessage.trim().length > 0 || pendingImage || isUploadingImage) ? "auto" : 0, 
    scale: !(newMessage.trim().length > 0 || pendingImage || isUploadingImage) ? 1 : 0.5, 
    marginInlineStart: !(newMessage.trim().length > 0 || pendingImage || isUploadingImage) ? 8 : 0 
  }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
 className="flex items-center gap-1 shrink-0"
 >
 <button
 onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
 className={`relative w-10.5 h-10.5 flex items-center justify-center rounded-[10px] bg-linear-to-b from-[#56c6ff] to-[#259cf3] border border-[#0a203e] transition-all shrink-0 hover:brightness-110 after:absolute after:top-0.5 after:right-0.75 after:w-2.5 after:h-2 after:bg-white/40 after:rounded-full after:blur-[1px] ${showGifPicker ? 'scale-95 translate-y-0.5 shadow-[0_1px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] brightness-95' : 'shadow-[0_4px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1)] active:scale-95 active:translate-y-0.5 active:shadow-[0_1px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)]'}`}
 title="GIF & Stickers"
 >
 <svg viewBox="0 0 32 32" className="w-6 h-6 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] relative z-10">
 <rect x="4" y="5" width="24" height="22" rx="4" fill="url(#gifGrad)" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
 <text x="16" y="21" fontFamily="sans-serif" fontWeight="900" fontSize="11" fill="#0f172a" textAnchor="middle">GIF</text>
 <defs>
 <linearGradient id="gifGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#ffffff" />
 <stop offset="100%" stopColor="#e2e8f0" />
 </linearGradient>
 </defs>
 </svg>
 </button>
 <button
 onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
 className={`relative w-10.5 h-10.5 flex items-center justify-center rounded-[10px] bg-linear-to-b from-[#56c6ff] to-[#259cf3] border border-[#0a203e] transition-all shrink-0 hover:brightness-110 after:absolute after:top-0.5 after:right-0.75 after:w-2.5 after:h-2 after:bg-white/40 after:rounded-full after:blur-[1px] ${showEmojiPicker ? 'scale-95 translate-y-0.5 shadow-[0_1px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] brightness-95' : 'shadow-[0_4px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1)] active:scale-95 active:translate-y-0.5 active:shadow-[0_1px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)]'}`}
 title="ئێمۆجی"
 >
 <svg viewBox="0 0 32 32" className="w-6.5 h-6.5 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] relative z-10">
 <path d="M6 10 C6 6 8 4 12 4 L20 4 C24 4 26 6 26 10 L26 18 C26 22 24 24 20 24 L15 24 L8 29 L9 24 C7 23 6 21 6 18 Z" fill="url(#emoteGrad)" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
 <circle cx="12" cy="12" r="2" fill="#0f172a" />
 <circle cx="20" cy="12" r="2" fill="#0f172a" />
 <path d="M11 16 Q16 22 21 16" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
 <defs>
 <linearGradient id="emoteGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#ffffff" />
 <stop offset="100%" stopColor="#e2e8f0" />
 </linearGradient>
 </defs>
 </svg>
 </button>

 {selectedChat && (
 <button
 onClick={() => fileInputRef.current?.click()}
 disabled={isUploadingImage}
 className="relative w-10.5 h-10.5 flex items-center justify-center rounded-[10px] bg-linear-to-b from-[#56c6ff] to-[#259cf3] border border-[#0a203e] transition-all shrink-0 hover:brightness-110 after:absolute after:top-0.5 after:right-0.75 after:w-2.5 after:h-2 after:bg-white/40 after:rounded-full after:blur-[1px] shadow-[0_4px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.1)] active:scale-95 active:translate-y-0.5 active:shadow-[0_1px_0_#146bb1,inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:grayscale"
 title="وێنەیەک بهنێرە"
 >
 <svg viewBox="0 0 32 32" className="w-6 h-6 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)] relative z-10">
 <rect x="3" y="4" width="26" height="24" rx="4" fill="url(#imgGrad)" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
 <circle cx="21" cy="11" r="3" fill="#0f172a" />
 <path d="M3 24 L12 14 L18 20 L22 16 L29 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
 <defs>
 <linearGradient id="imgGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#ffffff" />
 <stop offset="100%" stopColor="#e2e8f0" />
 </linearGradient>
 </defs>
 </svg>
 </button>
 )}
 </Motion.div>
 )}
 </AnimatePresence>

 {!isRecording && (
 <>
 {/* GIF Picker Popup */}
 <AnimatePresence>
 {showGifPicker && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowGifPicker(false)} onTouchStart={() => setShowGifPicker(false)} />
 <Motion.div
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 className="absolute bottom-full mb-3 left-2 md:left-4 z-50 bg-mono-50/95 dark:bg-mono-900/95 border border-mono-200/50 dark:border-white/10 rounded-xl shadow-2xl p-3 w-80 md:w-96 flex flex-col"
 dir="rtl"
 >
 <div className="flex bg-mono-200/50 dark:bg-mono-800/50 p-1 rounded-md mb-2">
 <button
 onClick={() => setGifTab('trending')}
 className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${gifTab === 'trending' ? 'bg-white dark:bg-mono-700 shadow-sm text-mono-900 dark:text-white' : 'text-mono-500 hover:text-mono-700 dark:hover:text-mono-300'}`}
 >
 🔥 بەربەلاڤ
 </button>
 <button
 onClick={() => setGifTab('favorites')}
 className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${gifTab === 'favorites' ? 'bg-white dark:bg-mono-700 shadow-sm text-mono-900 dark:text-white' : 'text-mono-500 hover:text-mono-700 dark:hover:text-mono-300'}`}
 >
 ⭐ پەسەندکری
 </button>
 </div>

 <input
 type="text"
 placeholder="ل ستیکەران بگەڕە..."
 value={gifSearchQuery}
 onChange={(e) => {
 setGifSearchQuery(e.target.value);
 if (e.target.value.trim() !== '') setGifTab('trending');
 }}
 className="w-full bg-mono-100 dark:bg-mono-800 border-none rounded-md px-3 py-2 text-sm font-rabar mb-2 focus:ring-2 focus:ring-primary/50 outline-none text-mono-900 dark:text-mono-100 placeholder-mono-500"
 />
 <div className="h-56 overflow-y-auto no-scrollbar relative rounded-md">
 {isGifLoading ? (
 <div className="absolute inset-0 flex items-center justify-center bg-mono-50/50 dark:bg-mono-900/50 z-10">
 <div className="w-8 h-8 border-4 border-mono-200 dark:border-mono-700 border-t-primary rounded-full animate-spin" />
 </div>
 ) : null}

 <div className="columns-3 gap-2 space-y-2">
 {(gifTab === 'favorites' ? favoriteStickers : gifResults).map((item, idx) => {
 const gifUrl = gifTab === 'favorites' ? item : (item.images?.fixed_width?.url || item.images?.original?.url);
 const keyId = gifTab === 'favorites' ? `fav-${idx}` : item.id;
 return (
 <div
 key={keyId}
 onClick={() => {
 if (gifUrl) {
 handleSendMessage(null, `[STICKER:${gifUrl}]`);
 setShowGifPicker(false);
 }
 }}
 className="relative group break-inside-avoid cursor-pointer hover:scale-105 active:scale-95 transition-transform"
 >
 <img src={gifUrl} alt="Sticker" className="w-full h-auto rounded-md bg-mono-100 dark:bg-mono-800" loading="lazy" />
 {/* Small fav icon in corner */}
 {favoriteStickers.includes(gifUrl) && (
 <div className="absolute top-1 right-1 text-yellow-400 drop-shadow-md text-sm pointer-events-none">⭐</div>
 )}
 </div>
 );
 })}
 </div>

 {!isGifLoading && gifTab === 'trending' && gifResults.length === 0 && (
 <div className="flex flex-col items-center justify-center h-full text-mono-500 text-sm font-bold opacity-70">
 چ ستیکەر نەهاتنە دیتن
 </div>
 )}

 {gifTab === 'favorites' && favoriteStickers.length === 0 && (
 <div className="flex flex-col items-center justify-center h-full text-mono-500 text-sm font-bold opacity-70 text-center px-4">
 چ ستیکەرێن پەسەندکری نینن.<br /><span className="text-[10px] font-normal opacity-70 mt-1">ل چاتێ پەنجێ ل ستیکەرەکێ بگرە دا خەزن بکەی</span>
 </div>
 )}
 </div>
 <div className="mt-2 text-center w-full flex justify-center opacity-30 pointer-events-none select-none">
 <span className="text-[9px] font-black tracking-widest">POWERED BY GIPHY</span>
 </div>
 </Motion.div>
 </>
 )}
 </AnimatePresence>

 {/* Emoji Picker Popup */}
 <AnimatePresence>
 {showEmojiPicker && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} onTouchStart={() => setShowEmojiPicker(false)} />
 <Motion.div
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 className="absolute bottom-full mb-3 left-2 md:left-4 z-50 bg-mono-50/95 dark:bg-mono-900/95 border border-mono-200/50 dark:border-white/10 rounded-xl shadow-2xl p-3 w-75"
 dir="ltr"
 >
 <div className="grid grid-cols-5 gap-2 max-h-50 overflow-y-auto no-scrollbar">
 {['😂', '❤️', '🔥', '👍', '👏', '😍', '😭', '🥺', '😡', '🤬', '🤦‍♀️', '🤷‍♀️', '🤯', '😎', '💩', '💀', '👀', '💯', '🙏', '🤫', '🏆', '👑', '💪', '✌️', '🎯', '⚔️', '🛡️', '⚡', '🧠', '💡', '📚', '☀️', '🦅', '🏔️', '🎉'].map(emoji => (
 <button
 key={emoji}
 onClick={() => setNewMessage(prev => prev + emoji)}
 className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-mono-200 dark:hover:bg-mono-800 transition-colors text-3xl active:scale-90"
 >
 <SingleAnimatedEmoji emoji={emoji} className="inline-block object-contain w-[1em] h-[1em]" />
 </button>
 ))}
  </div>
  </Motion.div>
 </>
 )}
 </AnimatePresence>
 </>
 )}
 </div>
 </div>
 </div>
 {keyboardHeight > 0 && <div style={{ height: keyboardHeight }} className="w-full shrink-0 transition-colors duration-300 pointer-events-none" />}
 </>
 )}

 {/* Reaction Details Modal (WhatsApp Web Style Centered Card) */}
 <AnimatePresence>
 {activeReactionModal && activeReactionModal.message && activeReactionModal.message.reactions && (
 <div className="fixed inset-0 z-150 flex flex-col items-center justify-center p-4">
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setActiveReactionModal(null)}
 className="absolute inset-0 bg-transparent"
 />
 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 10 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 10 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className="relative z-10 w-full max-w-65 bg-mono-50/95 dark:bg-mono-900/95 border border-mono-200/50 dark:border-white/10 rounded-md shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
 style={activeReactionModal.x && activeReactionModal.y ? {
 position: 'fixed',
 top: Math.max(20, Math.min(activeReactionModal.y, window.innerHeight - 300)),
 left: Math.max(20, Math.min(activeReactionModal.x - 130, window.innerWidth - 280)),
 transformOrigin: activeReactionModal.message.user_id === user?.id ? 'bottom right' : 'bottom left'
 } : {}}
 >
 <div className="flex flex-col p-3 pb-2 border-b border-mono-200 dark:border-mono-800 shrink-0">
 <h3 className="font-sans font-bold text-[13px] text-mono-600 dark:text-mono-300 mb-2 text-right w-full" dir="rtl">
 {toKuDigits(Object.values(activeReactionModal.message.reactions).flat().length)} کارڤەدان
 </h3>

 {/* Tabs for Emojis */}
 <div className="flex items-center justify-start gap-1 overflow-x-auto no-scrollbar shrink-0" dir="rtl">
 {Object.entries(activeReactionModal.message.reactions).map(([emoji, users]) => (
 <button
 key={emoji}
 onClick={() => setActiveReactionModal(prev => ({ ...prev, activeTab: emoji }))}
 className={`flex items-center justify-center gap-1.5 min-w-12 px-2 h-7 rounded-full font-bold text-[12px] whitespace-nowrap transition-colors border ${activeReactionModal.activeTab === emoji ? 'border-mono-300 dark:border-mono-600 bg-mono-100 dark:bg-mono-800 text-mono-900 dark:text-white' : 'border-transparent text-mono-500 hover:bg-mono-100 dark:hover:bg-mono-800'}`}
 >
 <span className="mt-0.5">{emoji}</span>
 <span className="text-[11px] tabular-nums mt-0.5">{toKuDigits(users.length)}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Users List */}
 <div className="p-2 overflow-y-auto no-scrollbar flex-1 max-h-50" dir="rtl">
 {Object.entries(activeReactionModal.message.reactions)
 .filter(([emoji]) => activeReactionModal.activeTab === 'all' || activeReactionModal.activeTab === emoji)
 .flatMap(([emoji, users]) => users.map(u => ({ emoji, user: u })))
 .map(({ emoji, user: u }, idx) => {
 const id = typeof u === 'string' ? u : u.id;
 const reactionData = reactionUsers[id];
 const uName = typeof u !== 'string' ? u.name : null;
 const name = reactionData?.nickname || (uName !== 'بێناڤ' ? uName : null) || 'بێناڤ';
 const avatarUrl = reactionData?.avatar_url;

 const isMeReaction = id === user?.id;

 return (
 <div
 key={idx}
 className={`flex items-center justify-between p-1.5 rounded-lg hover:bg-mono-50 dark:hover:bg-mono-800/50 transition-colors ${isMeReaction ? 'cursor-pointer' : ''}`}
 onClick={isMeReaction ? (e) => {
 e.stopPropagation();
 handleReact(activeReactionModal.message.id, emoji, activeReactionModal.isPrivate);

 // Optimistically update the modal's local state so the reaction disappears
 setActiveReactionModal(prev => {
 if (!prev) return prev;

 const newReactions = { ...prev.message.reactions };
 const usersArray = [...(newReactions[emoji] || [])];

 const userIdx = usersArray.findIndex(u => (typeof u === 'string' ? u : u.id) === user?.id);
 if (userIdx > -1) {
 usersArray.splice(userIdx, 1);
 }

 if (usersArray.length === 0) {
 delete newReactions[emoji];
 } else {
 newReactions[emoji] = usersArray;
 }

 if (Object.keys(newReactions).length === 0) {
 return null; // Close if no reactions left globally
 }

 let newTab = prev.activeTab;
 if (!newReactions[emoji] && prev.activeTab === emoji) {
 newTab = 'all';
 }

 return {
 ...prev,
 activeTab: newTab,
 message: {
 ...prev.message,
 reactions: newReactions
 }
 };
 });
 } : undefined}
 >
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full bg-[#f0f2f5] dark:bg-mono-800 flex items-center justify-center text-mono-500 dark:text-mono-400 font-black text-xs uppercase shrink-0 shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
 {avatarUrl && avatarUrl !== 'default' ? (
 <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
 ) : (
 name.charAt(0)
 )}
 </div>
 <div className="flex flex-col items-start">
 <span className="font-sans font-medium text-mono-900 dark:text-mono-100 text-[12px]">
 {isMeReaction ? 'تو' : name}
 </span>
 {isMeReaction && (
 <span className="text-[10px] text-mono-500 dark:text-mono-400 mt-0.5">
 ژێببە
 </span>
 )}
 </div>
 </div>
 <div className="w-6 h-6 flex items-center justify-center text-[15px]">
 {emoji}
 </div>
 </div>
 );
 })}
 </div>
 </Motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Delete Chat Confirmation Modal */}
 <AnimatePresence>
 {showDeleteConfirm && (
 <Motion.div
 key="delete-chat-confirm-overlay"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-110 bg-black/90 flex items-center justify-center p-4 sm:p-8"
 >
 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative w-full max-w-75 bg-mono-50 dark:bg-mono-900 border border-mono-200 dark:border-white/10 rounded-md p-5 flex flex-col items-center shadow-2xl overflow-hidden"
 dir="rtl"
 >
 <h3 className="text-sm font-light font-rabar text-mono-900 dark:text-white mb-3 drop-shadow-sm">تو پشتڕاستی ژ ژێبرنا نامەیان؟</h3>
 <p className="text-[11px] font-bold text-center text-mono-500 dark:text-white/50 mb-5 leading-relaxed">
 ئەڤە دێ هەمی نامەیێن تە و ڤی کەسی ب ئێکجاری ژێبەت و دێ ل دەڤ کەسێ بەرامبەر ژی ڕەش بن. ئەڤ کارە ناهێتە زڤڕاندن.
 </p>
 <div className="flex gap-2.5 w-full">
 <button
 onClick={async () => {
 triggerHaptic(50);
 try {
 const myId = user?.id;
 const partnerId = chatToDelete?.id;
 if (!myId || !partnerId) return;

 const PROTECTED_ADMIN_IDS = ['e2052ae5-e2c7-4a08-9ba2-c33bc85b19ca', 'b082d89e-3daa-4067-9c20-506cd7b4994d', '9a813c24-b662-477d-a74a-6f822d17bbf1'];

 if (PROTECTED_ADMIN_IDS.includes(partnerId)) {
 // Hide locally for admins so their messages are preserved
 localStorage.setItem(`hidden_chat_${myId}_${partnerId}`, Date.now().toString());
 } else {
 // Physically delete for normal users
 const { error } = await supabase.rpc('delete_chat_history', {
 user1_id: myId,
 user2_id: partnerId
 });
 if (error) throw error;
 }

 setChatMessages([]);
 setPrivateChats(prev => prev.filter(c => c.id !== partnerId));
 setSelectedChat(null);
 } catch (err) {
 console.error("Error clearing chat:", err);
 alert("شاشیەک ڕوویدا د ژێبرنا نامەیان دا.");
 } finally {
 setShowDeleteConfirm(false);
 setChatToDelete(null);
 }
 }}
 className="flex-1 bg-red-500 text-white hover:bg-red-600 py-2.5 rounded-md text-[13px] font-bold transition-colors shadow-[0_4px_15px_rgba(239,68,68,0.25)]"
 >
 ژێبرن
 </button>
 <button
 onClick={() => { triggerHaptic(10); setShowDeleteConfirm(false); setChatToDelete(null); }}
 className="flex-1 text-mono-700 dark:text-mono-300 bg-mono-200 hover:bg-mono-300 dark:bg-mono-800 dark:hover:bg-mono-700 py-2.5 rounded-md text-[13px] font-bold transition-colors"
 >
 پەشێمانم
 </button>
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>

 {/* Report Bug/Suggestion Modal */}
 <AnimatePresence>
 {isReportModalOpen && (
 <ReportModal
 isOpen={isReportModalOpen}
 onClose={() => setIsReportModalOpen(false)}
 user={user}
 />
 )}
 </AnimatePresence>

 {/* Image Editor Modal */}
 <AnimatePresence>
 {isImageEditorOpen && pendingImagePreview && (
 <ImageEditorModal
 imageUrl={pendingImagePreview}
 onClose={() => setIsImageEditorOpen(false)}
 onSave={(editedFile) => {
 // Update pending image with the edited file
 if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
 setPendingImage(editedFile);
 setPendingImagePreview(URL.createObjectURL(editedFile));
 setIsImageEditorOpen(false);
 }}
 />
 )}
 </AnimatePresence>

 {/* Fullscreen Image Viewer Overlay (In-Chat) */}
 {createPortal(
 <AnimatePresence>
 {fullscreenImage && (
 <Motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
 transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
 className="fixed inset-0 z-99999 flex flex-col bg-black/95 overflow-hidden"
 onClick={() => setFullscreenImage(null)}
 >
 {/* Top Action Bar */}
 <div className="w-full py-4 pt-12 md:pt-4 flex items-center justify-between px-4 bg-linear-to-b from-black/80 to-transparent absolute top-0 left-0 z-10" onClick={e => e.stopPropagation()}>
 <button
 onClick={() => setFullscreenImage(null)}
 className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-white/20 transition-colors"
 >
 <span className="material-symbols-outlined">arrow_back</span>
 </button>
 <button
 onClick={async (e) => {
 e.stopPropagation();
 try {
 const response = await fetch(fullscreenImage);
 const blob = await response.blob();
 const blobUrl = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = blobUrl;
 link.download = `Peyvok_Image_${Date.now()}.png`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(blobUrl);
 } catch (err) {
 console.error("Failed to download image", err);
 }
 }}
 className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-white/20 transition-colors"
 >
 <span className="material-symbols-outlined">download</span>
 </button>
 </div>

 {/* Image Container */}
 <div className="flex-1 min-h-0 w-full flex items-center justify-center p-4 pt-20 pb-10">
 <TransformWrapper
 initialScale={0.5}
 minScale={0.1}
 maxScale={5}
 centerOnInit={true}
 centerZoomedOut={false}
 limitToBounds={false}
 wheel={{ step: 0.005 }}
 doubleClick={{ step: 1 }}
 >
 {({ centerView }) => (
 <TransformComponent
 wrapperStyle={{ width: "100%", height: "100%" }}
 contentStyle={{ width: "max-content", height: "max-content" }}
 >
 <img
 src={fullscreenImage}
 alt="Fullscreen Preview"
 style={{ maxWidth: "100vw", maxHeight: "100vh" }}
 className="object-contain pointer-events-auto drop-shadow-2xl rounded-sm cursor-grab active:cursor-grabbing"
 draggable="false"
 onLoad={() => centerView()}
 onContextMenu={e => e.preventDefault()}
 onClick={e => e.stopPropagation()}
 />
 </TransformComponent>
 )}
 </TransformWrapper>
 </div>
 </Motion.div>
 )}
 </AnimatePresence>,
 document.body
 )}
 </div>
 </div>
 );
}













