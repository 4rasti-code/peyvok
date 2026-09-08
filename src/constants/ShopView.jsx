import React, { useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { THEMES } from '../data/themes';
import { FilsIcon, DerhemIcon, DinarIcon, HintIcon, MagnetIcon, SkipIcon } from './CurrencyIcon';
import { toKuDigits } from '../utils/formatters';
import InventoryBar from './InventoryBar';
import { NAME_STYLES } from '../constants/nameStyles';
import { NAME_FONTS } from '../constants/nameFonts';
import { BUNDLES } from '../constants/bundles';
import { useUser } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import Avatar from './Avatar'; const SHOP_ITEMS = {
 POWERUPS: [
 { id: 'attractor_field', name: 'پیتژێبرک', description: 'دەرئێخستنا پیتێن شاش', icon: 'auto_fix_high', price: 1000, color: 'from-purple-500 to-indigo-600', glow: 'shadow-purple-500/40', currency: 'fils' },
 { id: 'hint_pack', name: 'پیتبین', description: 'پەیداکرنا پیتەکا راست', icon: 'lightbulb', price: 2500, color: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/40', currency: 'fils' },
 { id: 'full_skip', name: 'دەربازبوون', description: 'دەربازبوونا ب تەمام ژ پەیڤێ', icon: 'fast_forward', price: 5000, color: 'from-blue-400 to-cyan-600', glow: 'shadow-blue-500/40', currency: 'fils' }
 ],
 SPECIALS: [
 { id: 'fils_pack_small', name: '٥٠٠ فلس', description: 'بڕەکا کێم ژ دراوی بۆ یاریێ', icon: 'payments', price_usd: 0.99, price_iqd: 1500, amount: 500, color: 'from-blue-400 to-indigo-500', glow: 'shadow-blue-500/30', type: 'currency' },
 { id: 'fils_pack_medium', name: '٢٥٠٠ فلس', description: 'پاکێجا ناڤین و ب مفاتر', icon: 'savings', price_usd: 2.99, price_iqd: 4500, amount: 2500, color: 'from-emerald-400 to-teal-600', glow: 'shadow-emerald-500/30', type: 'currency' },
 { id: 'fils_pack_large', name: '٧٥٠٠ فلس', description: 'مەزنترین بڕا دراوی بۆ یاریزانێن زیرەک', icon: 'account_balance_wallet', price_usd: 6.99, price_iqd: 10000, amount: 7500, color: 'from-amber-400 to-orange-600', glow: 'shadow-amber-500/40', type: 'currency' }
 ],
 AVATARS: []
};

const PowerUpCard = ({ item, onRequestPurchase, canAfford }) => {
 const getDynamicStyles = (id) => {
 switch (id) {
 case 'hint_pack': return 'bg-[#98A3F8] shadow-[0_4px_0_#7A85D9] dark:bg-[#98A3F8]/90 dark:shadow-[0_4px_0_rgba(122,133,217,0.8)]';
 case 'attractor_field': return 'bg-[#A2E263] shadow-[0_4px_0_#85C14B] dark:bg-[#A2E263]/90 dark:shadow-[0_4px_0_rgba(133,193,75,0.8)]';
 case 'full_skip': return 'bg-[#FF9F1C] shadow-[0_4px_0_#E68A00] dark:bg-[#FF9F1C]/90 dark:shadow-[0_4px_0_rgba(230,138,0,0.8)]';
 default: return 'bg-mono-white shadow-[0_4px_0_#e5e5e5] dark:bg-mono-900 dark:shadow-[0_4px_0_#262626]';
 }
 };

 const dynamicClass = getDynamicStyles(item.id);

 return (
 <div className="flex items-stretch gap-2 sm:gap-3 w-full">
 {/* Info Card (Right Side in RTL) */}
 <div className={`flex-1 min-w-0 relative px-3 sm:px-4 py-3 ${dynamicClass} rounded-[8px] flex items-center gap-2 sm:gap-3 overflow-visible transition-all mb-1`}>
 <div className="w-11 h-11 rounded-md bg-white/20 dark:bg-black/20 flex items-center justify-center text-white shrink-0 relative z-10 border border-white/30">
 {item.id === 'hint_pack' ? (
 <HintIcon className="w-7 h-7 drop-shadow-md" />
 ) : item.id === 'attractor_field' ? (
 <MagnetIcon className="w-7 h-7 drop-shadow-md" />
 ) : item.id === 'full_skip' ? (
 <SkipIcon className="w-7 h-7 drop-shadow-md" />
 ) : (
 <span className="material-symbols-outlined text-[24px] drop-shadow-md text-white">{item.icon}</span>
 )}
 </div>

 <div className="flex-1 text-right min-w-0 relative z-10 pr-1">
 <h3 className="text-[16px] font-black text-white dark:text-mono-50 mb-0.5 leading-tight truncate drop-shadow-sm">{item.name}</h3>
 <p className="text-[11px] font-bold text-white/90 dark:text-mono-200 leading-tight truncate">{item.description}</p>
 </div>
 </div>

 {/* Price Button (Left Side in RTL) */}
 <button
 onClick={() => {
 if (canAfford) {
 triggerHaptic(10);
 onRequestPurchase(item);
 } else {
 triggerHaptic([50, 30, 50]);
 }
 }}
 className={`group shrink-0 w-21.25 sm:w-23.75 flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-2 py-3 ${dynamicClass} rounded-[8px] transition-all duration-150 relative mb-1 border-2 border-white/30 dark:border-white/10 ${!canAfford ? 'opacity-80 active:translate-y-1 active:shadow-[0_0px_0_transparent] cursor-not-allowed' : 'active:translate-y-1 active:shadow-[0_0px_0_transparent] dark:active:shadow-[0_0px_0_transparent] hover:scale-[1.04] hover:brightness-110'}`}
 >
 <div className="flex flex-col items-center leading-none relative z-10">
 <span className="text-[17px] font-black text-white drop-shadow-sm">{toKuDigits(item.price || 0)}</span>
 </div>
 <div className={`w-5 h-5 flex items-center justify-center text-white relative z-10 group-hover:rotate-12 transition-transform duration-300 ${!canAfford ? 'grayscale opacity-60' : 'drop-shadow-md'}`}>
 {item.currency === 'derhem' ? <DerhemIcon /> : item.currency === 'dinar' ? <DinarIcon /> : <FilsIcon />}
 </div>
 </button>
 </div>
 );
};


export default function ShopView({ fils, derhem, dinar, magnetCount, hintCount, skipCount, onPurchase, onPurchaseAvatar, onEquipAvatar, ownedAvatars = ['default'], equippedAvatar = 'default', ownedNameStyles = ['default'], equippedNameStyle = 'default', onPurchaseNameStyle, onEquipNameStyle, ownedFonts = ['default'], equippedFont = 'default', onPurchaseFont, onEquipFont, ownedBundles = ['default'], equippedBundle = 'default', onPurchaseBundle, onEquipBundle }) {
 const { playPurchaseSound } = useAudio();
 const { user: _user, userNickname, loadingAuth } = useUser();
 const bgRef = useRef(null);
 const [fontTab, setFontTab] = useState('kurdish');

 const getCurrencyAmount = (currency) => currency === 'derhem' ? derhem : currency === 'dinar' ? dinar : fils;
 const renderCurrencyIcon = (currency) => currency === 'derhem' ? <DerhemIcon /> : currency === 'dinar' ? <DinarIcon /> : <FilsIcon />;

 const getNameStyleDynamicClass = (id) => {
 switch (id) {
 case 'gold-gradient': return 'bg-mono-white shadow-[0_4px_0_#FBBF24] dark:bg-mono-900 dark:shadow-[0_4px_0_#B45309] border-yellow-400/50';
 case 'neon-purple': return 'bg-mono-white shadow-[0_4px_0_#94A3B8] dark:bg-mono-900 dark:shadow-[0_4px_0_#475569] border-slate-400/50';
 case 'fire': return 'bg-mono-white shadow-[0_4px_0_#FB923C] dark:bg-mono-900 dark:shadow-[0_4px_0_#C2410C] border-orange-400/50';
 case 'ocean': return 'bg-mono-white shadow-[0_4px_0_#38BDF8] dark:bg-mono-900 dark:shadow-[0_4px_0_#0369A1] border-cyan-400/50';
 case 'princess': return 'bg-mono-white shadow-[0_4px_0_#F472B6] dark:bg-mono-900 dark:shadow-[0_4px_0_#BE185D] border-pink-400/50';
 case 'kurdistan': return 'bg-mono-white shadow-[0_4px_0_#4ADE80] dark:bg-mono-900 dark:shadow-[0_4px_0_#15803D] border-green-500/50';
 default: return 'bg-mono-white shadow-[0_4px_0_#e5e5e5] dark:bg-mono-900 dark:shadow-[0_4px_0_#262626] border-mono-200/50 dark:border-mono-800/50';
 }
 };

 const handleBackgroundClick = (e) => {
 if (e.target === e.currentTarget || e.target.classList.contains('bg-trigger-zone')) {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = (e.clientX - rect.left) / rect.width;
 const y = (e.clientY - rect.top) / rect.height;
 bgRef.current?.pulse(x, y);
 }
 };

 const executePurchase = (payload) => {
 const { type, data } = payload;

 // Haptic immediately for instant feedback
 triggerHaptic(20);
 if (playPurchaseSound) playPurchaseSound();

 if (type === 'powerup') {
 onPurchase(data);
 } else if (type === 'avatar') {
 onPurchaseAvatar(data.id, data.price, data.currency);
 } else if (type === 'theme') {
 onPurchase({ ...data, type: 'theme' });
 } else if (type === 'name_style') {
 onPurchaseNameStyle(data.id, data.price, data.currency);
 } else if (type === 'font') {
 onPurchaseFont(data.id, data.price, data.currency);
 } else if (type === 'bundle') {
 onPurchaseBundle(data.id, data.price, data.currency);
 }
 };

 if (loadingAuth) {
 return (
 <div className="flex-1 w-full flex items-center justify-center bg-mono-white dark:bg-black transition-colors duration-500">
 <div className="w-12 h-12 border-4 border-mono-200 dark:border-white/10 border-t-primary rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div
 onClick={handleBackgroundClick}
 className="flex-1 w-full bg-mono-white dark:bg-black px-4 pt-6 pb-30 max-w-full flex flex-col gap-6 animate-in fade-in duration-700 overflow-x-hidden relative bg-trigger-zone transition-colors"
 >

 <div className="relative z-20 shrink-0 bg-mono-50 dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-md p-6 shadow-sm overflow-hidden group transition-colors duration-300">
 <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-50" />
 <div className="relative z-10 flex flex-col items-center">
 <InventoryBar
 magnetCount={magnetCount}
 hintCount={hintCount}
 skipCount={skipCount}
 isShop={true}
 className="scale-100 sm:scale-110"
 />
 </div>
 </div>

 <div className="relative z-20 w-full transition-colors duration-300">
 <div className="flex flex-col gap-6 mt-2">
 {/* PowerUps Section */}
 <div className="bg-mono-white/5 dark:bg-mono-900/40 border border-mono-200/50 dark:border-mono-800/50 rounded-xl p-4 shadow-sm flex flex-col gap-4">
 <h2 className="text-[16px] sm:text-[18px] font-rabar font-black text-mono-900 dark:text-mono-100 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-[22px]">bolt</span>
 هاریکار
 </h2>
 <div className="grid grid-cols-1 gap-4">
 {SHOP_ITEMS.POWERUPS.map(item => (
 <PowerUpCard key={item.id} item={item} onRequestPurchase={(i) => executePurchase({ data: i, type: 'powerup' })} canAfford={fils >= item.price} />
 ))}
 </div>
 </div>


 {/* Avatars Section */}
 <div className="bg-mono-white/5 dark:bg-mono-900/40 border border-mono-200/50 dark:border-mono-800/50 rounded-xl p-4 shadow-sm flex flex-col gap-4">
 <h2 className="text-[16px] sm:text-[18px] font-rabar font-black text-mono-900 dark:text-mono-100 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-[22px]">face</span>
 ئێمۆجی
 </h2>
 <div className="flex flex-col gap-3">
 {SHOP_ITEMS.AVATARS.map(avatar => (
 <Motion.div
 key={avatar.id}
 className={`bg-mono-white dark:bg-mono-900 py-3 px-4 rounded-md border border-mono-200 dark:border-mono-800 flex items-center gap-3 transition-all shadow-sm ${ownedAvatars.includes(avatar.id) && equippedAvatar === avatar.id ? 'border-primary/50 ring-1 ring-primary/10' : ''}`}
 >
 <div className="w-12 h-12 rounded-md bg-mono-100 dark:bg-white/10 border border-mono-200 dark:border-white/5 p-0.5 shrink-0 overflow-hidden relative group shadow-sm">
 <img src={avatar.image} alt={avatar.name} className="w-full h-full object-cover rounded-[8px] animate-character-idle" />
 </div>
 <div className="flex-1 text-right min-w-0">
 <h3 className="text-md font-bold text-mono-900 dark:text-mono-50 mb-0 truncate">{avatar.name}</h3>
 <p className="text-[9px] font-bold text-mono-500 dark:text-mono-400 leading-tight truncate">{avatar.description}</p>
 </div>
 <div className="shrink-0 flex items-center">
 {ownedAvatars.includes(avatar.id) ? (
 <button
 onClick={() => { triggerHaptic(10); onEquipAvatar(avatar.id); }}
 className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all ${equippedAvatar === avatar.id ? 'bg-primary text-white shadow-md' : 'bg-mono-100 dark:bg-white/10 text-mono-600 dark:text-mono-300 hover:bg-mono-200'}`}
 >
 {equippedAvatar === avatar.id ? 'چالاکە' : 'بکاربینە'}
 </button>
 ) : (
 <div className="relative">
 <button
 onClick={() => {
 if (getCurrencyAmount(avatar.currency) >= avatar.price) {
 triggerHaptic(10);
 executePurchase({ data: avatar, type: 'avatar' });
 } else {
 triggerHaptic([50, 30, 50]);
 }
 }}
 className={`flex items-center gap-1.5 px-3.5 py-1 rounded-md transition-all shadow-sm ${(getCurrencyAmount(avatar.currency) >= avatar.price) ? 'bg-mono-100 dark:bg-mono-800 text-mono-700 dark:text-mono-200 border border-mono-200 dark:border-mono-700' : 'bg-mono-100 dark:bg-mono-900 text-mono-400 dark:text-mono-500 border border-mono-200/50 dark:border-mono-800/50 cursor-not-allowed'}`}
 >
 {avatar.price === 0 ? (
 <div className="flex flex-col items-center leading-none">
 <span className="text-[11px] font-bold text-green-500">بکاربینە</span>
 </div>
 ) : (
 <>
 <div className="flex flex-col items-center leading-none">
 <span className="text-[11px] font-bold">{toKuDigits(avatar.price)}</span>
 </div>
 <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
 {renderCurrencyIcon(avatar.currency)}
 </div>
 </>
 )}
 </button>
 </div>
 )}
 </div>
 </Motion.div>
 ))}
 </div>
 </div>


 {/* Name Styles Section */}
 <div className="bg-mono-white/5 dark:bg-mono-900/40 border border-mono-200/50 dark:border-mono-800/50 rounded-xl p-4 shadow-sm flex flex-col gap-4">
 <h2 className="text-[16px] sm:text-[18px] font-rabar font-black text-mono-900 dark:text-mono-100 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-[22px]">palette</span>
 کارتێکەرێن ناڤی
 </h2>
 <div className="flex flex-col gap-3">
 {Object.values(NAME_STYLES).filter(style => style.id !== 'default').map(style => {
 const isOwned = ownedNameStyles.includes(style.id);
 const isEquipped = equippedNameStyle === style.id;
 const canAfford = getCurrencyAmount(style.currency) >= style.price;
 const dynamicClass = getNameStyleDynamicClass(style.id);

 return (
 <div key={style.id} className="flex items-stretch gap-2 sm:gap-3 w-full">
 {/* Info Card (Right Side in RTL) */}
 <div className={`flex-1 min-w-0 relative px-3 sm:px-4 py-3 ${dynamicClass} rounded-[8px] flex items-center gap-2 sm:gap-3 overflow-visible transition-all mb-1 border-2 ${isEquipped ? 'border-primary/50 ring-1 ring-primary/10' : 'border-mono-200/50 dark:border-mono-800/50'}`}>
 <div className="flex-1 text-right min-w-0 flex items-center justify-center">
 <span className={`text-[17px] font-black tracking-normal uppercase truncate leading-normal ${style.class}`}>{style.name}</span>
 </div>
 </div>

 {/* Price / Equip Button (Left Side in RTL) */}
 {isOwned ? (
 <button
 onClick={() => { triggerHaptic(10); onEquipNameStyle(style.id); }}
 className={`shrink-0 w-21.25 sm:w-23.75 flex items-center justify-center font-bold text-[11px] sm:text-[13px] rounded-[8px] transition-all duration-150 relative mb-1 border-2 border-mono-200 dark:border-mono-800 ${dynamicClass} active:translate-y-1 active:shadow-[0_0px_0_transparent] ${isEquipped ? 'bg-primary/10 text-primary border-primary/50' : 'text-mono-600 dark:text-mono-300'}`}
 >
 {isEquipped ? 'چالاکە' : 'بکاربینە'}
 </button>
 ) : (
 <button
 onClick={() => {
 if (canAfford) {
 triggerHaptic(10);
 executePurchase({ data: style, type: 'name_style' });
 } else {
 triggerHaptic([50, 30, 50]);
 }
 }}
 className={`group shrink-0 w-21.25 sm:w-23.75 flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-2 py-3 ${dynamicClass} rounded-[8px] transition-all duration-150 relative mb-1 border-2 border-mono-200/50 dark:border-mono-800/50 ${!canAfford ? 'opacity-80 active:translate-y-1 active:shadow-[0_0px_0_transparent] cursor-not-allowed' : 'active:translate-y-1 active:shadow-[0_0px_0_transparent] dark:active:shadow-[0_0px_0_transparent] hover:scale-[1.04] hover:brightness-110 text-mono-700 dark:text-mono-200'}`}
 >
 {style.price === 0 ? (
 <div className="flex flex-col items-center leading-none relative z-10">
 <span className="text-[11px] font-bold text-green-500">بکاربینە</span>
 </div>
 ) : (
 <>
 <div className="flex flex-col items-center leading-none relative z-10">
 <span className="text-[14px] sm:text-[15px] font-black tabular-nums">{toKuDigits(style.price)}</span>
 </div>
 <div className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 relative z-10 group-hover:rotate-12 transition-transform duration-300 ${!canAfford ? 'grayscale opacity-60' : 'drop-shadow-sm'}`}>
 {renderCurrencyIcon(style.currency)}
 </div>
 </>
 )}
 </button>
 )}
 </div>
 );
 })}
 </div>
 </div>


 {/* Fonts Section */}
 <div className="bg-mono-white/5 dark:bg-mono-900/40 border border-mono-200/50 dark:border-mono-800/50 rounded-xl p-4 shadow-sm flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <h2 className="text-[16px] sm:text-[18px] font-rabar font-black text-mono-900 dark:text-mono-100 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-[22px]">text_fields</span>
 فۆنت
 </h2>

 <div className="flex bg-mono-100 dark:bg-mono-800 p-1 rounded-lg">
 <button
 onClick={() => { triggerHaptic(5); setFontTab('kurdish'); }}
 className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${fontTab === 'kurdish' ? 'bg-white dark:bg-mono-600 text-primary shadow-sm' : 'text-mono-500 dark:text-mono-400'}`}
 >
 کوردی
 </button>
 <button
 onClick={() => { triggerHaptic(5); setFontTab('english'); }}
 className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${fontTab === 'english' ? 'bg-white dark:bg-mono-600 text-primary shadow-sm' : 'text-mono-500 dark:text-mono-400'}`}
 >
 ئینگلیزی
 </button>
 </div>
 </div>
 <div className="flex flex-col gap-3 mt-2">
 {Object.values(NAME_FONTS).filter(font => font.language === fontTab).map(font => {
 const isOwned = ownedFonts.includes(font.id);
 const isEquipped = equippedFont === font.id;
 const canAfford = getCurrencyAmount(font.currency) >= font.price;
 const dynamicClass = 'bg-mono-white shadow-[0_4px_0_#e5e5e5] dark:bg-mono-900 dark:shadow-[0_4px_0_#262626] border-mono-200/50 dark:border-mono-800/50';

 return (
 <div key={font.id} className="flex items-stretch gap-2 sm:gap-3 w-full">
 {/* Info Card (Right Side in RTL) */}
 <div className={`flex-1 min-w-0 relative px-3 sm:px-4 py-3 ${dynamicClass} rounded-[8px] flex items-center gap-2 sm:gap-3 overflow-visible transition-all mb-1 border-2 ${isEquipped ? 'ring-2 ring-primary/30' : ''}`}>
 <div className="flex-1 text-right min-w-0 flex items-center justify-center">
 <span
 className={`text-[17px] sm:text-[19px] font-black tracking-normal truncate leading-normal text-mono-900 dark:text-white flex-1 text-center ${NAME_STYLES[equippedNameStyle]?.class || ''}`}
 style={{ ...font.style, paddingBottom: '0.2em' }}
 >
 {font.language === 'kurdish' ? 'کوردستان' : 'Kurdistan'}
 </span>
 </div>
 </div>

 {/* Price / Equip Button (Left Side in RTL) */}
 {isOwned ? (
 <button
 onClick={() => { triggerHaptic(10); onEquipFont(font.id); }}
 className={`shrink-0 w-21.25 sm:w-23.75 flex items-center justify-center font-bold text-[11px] sm:text-[13px] rounded-[8px] transition-all duration-150 relative mb-1 border-2 border-mono-200 dark:border-mono-800 ${dynamicClass} active:translate-y-1 active:shadow-[0_0px_0_transparent] ${isEquipped ? 'bg-primary/10 text-primary border-primary/50' : 'text-mono-600 dark:text-mono-300'}`}
 >
 {isEquipped ? 'چالاکە' : 'بکاربینە'}
 </button>
 ) : (
 <button
 onClick={() => {
 if (canAfford) {
 triggerHaptic(10);
 executePurchase({ data: font, type: 'font' });
 } else {
 triggerHaptic([50, 30, 50]);
 }
 }}
 className={`group shrink-0 w-21.25 sm:w-23.75 flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-2 py-3 ${dynamicClass} rounded-[8px] transition-all duration-150 relative mb-1 border-2 border-mono-200/50 dark:border-mono-800/50 ${!canAfford ? 'opacity-80 active:translate-y-1 active:shadow-[0_0px_0_transparent] cursor-not-allowed' : 'active:translate-y-1 active:shadow-[0_0px_0_transparent] dark:active:shadow-[0_0px_0_transparent] hover:scale-[1.04] hover:brightness-110 text-mono-700 dark:text-mono-200'}`}
 >
 {font.price === 0 ? (
 <div className="flex flex-col items-center leading-none relative z-10">
 <span className="text-[11px] font-bold text-green-500">بکاربینە</span>
 </div>
 ) : (
 <>
 <div className="flex flex-col items-center leading-none relative z-10">
 <span className="text-[14px] sm:text-[15px] font-black tabular-nums">{toKuDigits(font.price)}</span>
 </div>
 <div className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 relative z-10 group-hover:rotate-12 transition-transform duration-300 ${!canAfford ? 'grayscale opacity-60' : 'drop-shadow-sm'}`}>
 {renderCurrencyIcon(font.currency)}
 </div>
 </>
 )}
 </button>
 )}
 </div>
 );
 })}
 </div>
 </div>



 {/* Bundles Section */}
 <div className="bg-mono-white/5 dark:bg-mono-900/40 border border-mono-200/50 dark:border-mono-800/50 rounded-xl p-4 shadow-sm flex flex-col gap-4">
 <h2 className="text-[16px] sm:text-[18px] font-rabar font-black text-mono-900 dark:text-mono-100 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-[22px]">layers</span>
 پاکێجان
 </h2>
 <div className="flex flex-col gap-4">
 {equippedBundle !== 'default' && (
 <button
 onClick={() => { triggerHaptic(10); onEquipBundle('default'); }}
 className="w-full bg-mono-100 dark:bg-mono-800 border border-mono-200 dark:border-mono-700 hover:bg-mono-200 dark:hover:bg-mono-700/80 transition-colors rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-sm"
 >
 <span className="material-symbols-outlined text-[18px] text-mono-600 dark:text-mono-300">layers_clear</span>
 <span className="font-black text-[13px] text-mono-800 dark:text-mono-100">لادانا پاکێجێ (زڤڕین بۆ ئاسایی)</span>
 </button>
 )}
 {Object.values(BUNDLES).filter(b => b.id !== 'default').map(bundle => (
 <Motion.div
 key={bundle.id}
 className={`flex flex-col border rounded-xl overflow-hidden shadow-sm transition-all relative ${equippedBundle === bundle.id ? 'border-primary/50 ring-1 ring-primary/20' : 'border-mono-200 dark:border-mono-800'} ${bundle.cardBg || 'bg-mono-50 dark:bg-mono-900'}`}
 >
 {/* Top Bar: Preview Section */}
 <div className="flex flex-col items-center justify-center py-8 px-4 relative z-10">
 <div className={`w-20 h-20 rounded-full overflow-hidden shadow-md shrink-0 relative z-10 mb-4 bg-mono-100 dark:bg-mono-800 ${bundle.avatarRing}`}>
 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userNickname || 'Peyivcin'}`} alt="Avatar Preview" className="w-full h-full object-cover" />
 </div>
 <span
 className={`text-3xl tracking-normal uppercase truncate leading-normal text-center w-full ${bundle.previewTextStyle} ${bundle.fontKurdish}`}
 >
 {userNickname}
 </span>
 </div>

 {/* Bottom Bar: Action Button & Info */}
 <div className="flex flex-col sm:flex-row justify-between items-center bg-black/95 p-3 px-4 w-full relative z-10 gap-3 border-t border-white/10 overflow-visible">
 <div className="flex flex-col text-center sm:text-right w-full sm:w-auto">
 <h3 className="text-[17px] font-black text-white">{bundle.name}</h3>
 <p className="text-[11px] text-white/80 font-bold mt-1">تێکەلیا پاشبنەما، فۆنت و بازنەیێ پرۆفایلی</p>
 </div>
 <div className="w-full sm:w-auto shrink-0">
 {ownedBundles.includes(bundle.id) ? (
 <button
 onClick={() => { triggerHaptic(10); onEquipBundle(bundle.id); }}
 className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-[13px] transition-all flex items-center justify-center gap-1.5 ${equippedBundle === bundle.id ? 'bg-primary text-white shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}
 >
 {equippedBundle === bundle.id ? (
 <>
 <span className="material-symbols-outlined text-[15px]">check_circle</span>
 چالاکە
 </>
 ) : 'بکاربینە'}
 </button>
 ) : (
 <button
 onClick={() => {
 if (getCurrencyAmount(bundle.currency) >= bundle.price) {
 triggerHaptic(10);
 executePurchase({ data: bundle, type: 'bundle' });
 } else {
 triggerHaptic([50, 30, 50]);
 }
 }}
 className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl transition-all shadow-sm border ${getCurrencyAmount(bundle.currency) >= bundle.price ? 'bg-white text-mono-900 border-mono-200 hover:bg-mono-100' : 'bg-black/50 text-white/50 border-white/10 cursor-not-allowed'}`}
 >
 <span className="text-[14px] font-black tabular-nums">{toKuDigits(bundle.price || 0)}</span>
 <div className="w-5 h-5 flex items-center justify-center shrink-0">
 {renderCurrencyIcon(bundle.currency)}
 </div>
 </button>
 )}
 </div>
 </div>
 </Motion.div>
 ))}
 </div>
 </div>
 </div>

 {/* Store Compliance Virtual Currency Disclaimer */}
 <div className="relative z-20 mt-6 px-4 py-3 bg-mono-100/50 dark:bg-mono-900/50 border border-mono-200 dark:border-mono-800 rounded-md text-center shadow-inner">
 <p className="text-[9px] sm:text-[10px] font-bold text-mono-500 dark:text-mono-400 leading-relaxed max-w-sm mx-auto">
 فلس، درهەم، و دینار دراڤێن خەیالی یێن ناڤ یاریێ نە و چ بهایەکێ ڕاستەقینە یان مادی نینە. ئەڤ یارییە چ پەیوەندی ب قومارێ و گۆڕینا دراڤی ب پارێ ڕاستەقینە ڤە نینە.
 </p>
 </div>
 </div>
 </div>
 );
}


