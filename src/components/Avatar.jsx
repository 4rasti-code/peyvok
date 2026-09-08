import React, { memo } from 'react';
import { AVATARS, DEFAULT_AVATAR } from '../data/avatars';

/**
 * Avatar Component
 * Handles dual-source logic: local assets vs Supabase Storage URLs.
 * Implements smart versioning (?v=) for remote images to bypass cache.
 */
const Avatar = memo(({
 src,
 symbol,
 lastActive, // Timestamp to check online status
 isOnline: explicitIsOnline, // Explicit override for real-time presence
 showStatus = false,
 className = "",
 size = "md", // 'sm', 'md', 'lg', 'xl', '2xl'
 badgeSize = null,
 border = true,
 level = null
}) => {
 const isRemote = typeof src === 'string' && src.startsWith('http');
 const isLocalRelative = typeof src === 'string' && src.startsWith('/');
 const avatarData = AVATARS.find(a => a.id === src);

 // Calculate online status: Prefer explicit boolean, fallback to 3-minute logic
 const isOnline = showStatus && (
 explicitIsOnline === true ||
 (explicitIsOnline !== false && lastActive && (new Date() - new Date(lastActive)) < 3 * 60 * 1000)
 );

 // Asset vs. Storage Logic: ONLY apply versioning if it's a remote URL
 let displaySrc = avatarData?.img || (isRemote || isLocalRelative ? src : null);

 // Fix for custom domain blocking in Kurdistan
 if (typeof displaySrc === 'string' && displaySrc.includes('auth.peyvokgame.com')) {
 displaySrc = displaySrc.replace('https://auth.peyvokgame.com', import.meta.env.VITE_SUPABASE_URL);
 }

 // Cache busting removed: Uploaded avatars now include Date.now() in their filenames,
 // so the URL itself changes on upload. Appending ?v= based on profile.updated_at
 // causes the browser to re-download the image every time XP changes, leading to ERR_CONNECTION_CLOSED.

 const hasImage = !!displaySrc;

 // Standardised sizes based on existing UI
 const sizeClasses = {
 'xs': 'w-8 h-8 text-xs',
 'sm': 'w-10 h-10 text-lg',
 'md': 'w-12 h-12 text-xl',
 'lg': 'w-14 h-14 text-2xl',
 'xl': 'w-20 h-20 text-4xl',
 '2xl': 'w-28 h-28 text-5xl',
 '3xl': 'w-36 h-36 text-6xl',
 '4xl': 'w-48 h-48 text-7xl',
 'full': 'w-full h-full text-3xl'
 };

 const selectedSizeClass = sizeClasses[size] || sizeClasses['md'];

 const getBadgeStyles = (s) => {
 switch (s) {
 case 'xs': return { w: 14, h: 16, text: 'text-[6px]', top: '-top-0.5', left: '-left-1' };
 case 'sm': return { w: 18, h: 21, text: 'text-[8px]', top: '-top-0.5', left: '-left-1' };
 case 'md': return { w: 22, h: 25, text: 'text-[9px]', top: '-top-1', left: '-left-1.5' };
 case 'lg': return { w: 26, h: 30, text: 'text-[10px]', top: '-top-1', left: '-left-2' };
 case 'xl': return { w: 32, h: 37, text: 'text-[12px]', top: '-top-1.5', left: '-left-2.5' };
 case '2xl': return { w: 40, h: 46, text: 'text-[14px]', top: '-top-2', left: '-left-3' };
 case '3xl': return { w: 48, h: 55, text: 'text-[16px]', top: '-top-2.5', left: '-left-3.5' };
 case '4xl': return { w: 56, h: 64, text: 'text-[20px]', top: '-top-3', left: '-left-4' };
 case 'full': return { w: 18, h: 21, text: 'text-[8px]', top: '-top-0.5', left: '-left-1' };
 default: return { w: 22, h: 25, text: 'text-[9px]', top: '-top-1', left: '-left-1.5' };
 }
 };
 const badge = getBadgeStyles(badgeSize || size);

 return (
 <div className={`relative shrink-0 rounded-full ${selectedSizeClass} group ${className}`}>
 {/* LEVEL SHIELD BADGE */}
 {level !== null && (
 <div className={`absolute ${badge.top} ${badge.left} z-25 flex items-center justify-center transform hover:scale-110 transition-transform cursor-default select-none`}>
 <div className="relative filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
 <svg width={badge.w} height={badge.h} viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
 <path
 d="M14 0L2 4.5V14C2 21.5 7.5 28.5 14 31C20.5 28.5 26 21.5 26 14V4.5L14 0Z"
 fill="url(#shieldGoldGradient)"
 stroke="white"
 strokeWidth="1.5"
 />
 <defs>
 <linearGradient id="shieldGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FDE68A" />
 <stop offset="50%" stopColor="#F59E0B" />
 <stop offset="100%" stopColor="#B45309" />
 </linearGradient>
 </defs>
 </svg>
 <span className={`absolute inset-0 flex items-center justify-center ${badge.text} font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] pb-[10%] pr-[2%]`}>
 {level}
 </span>
 </div>
 <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-[10px] -z-10 animate-pulse" />
 </div>
 )}

 <div className={`relative w-full h-full shrink-0 rounded-full overflow-hidden ${border ? 'border border-white/10' : ''}`}>
 <div className="w-full h-full flex items-center justify-center relative">
 {hasImage ? (
 <img
 src={displaySrc}
 alt="User Avatar"
 className="w-full h-full object-cover"
 loading="lazy"
 onError={(e) => {
 e.target.style.display = 'none';
 e.target.nextSibling.style.display = 'flex';
 }}
 />
 ) : null}

 <div
 className={`w-full h-full flex items-center justify-center bg-slate-800 ${hasImage ? 'hidden' : ''}`}
 >
 <span className="select-none leading-none drop-shadow-md flex items-center justify-center">
 {symbol || avatarData?.symbol || (src && src !== 'default' && !isRemote ? '👤' : DEFAULT_AVATAR.symbol)}
 </span>
 </div>


 </div>
 </div>

 {/* STATUS INDICATORS - Outside overflow-hidden */}
 {showStatus && (
 <div className={`absolute bottom-0 right-0 ${size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-600'} border-2 border-slate-900 rounded-full z-20 transition-all duration-300`} />
 )}
 </div>
 );
});

export default Avatar;
