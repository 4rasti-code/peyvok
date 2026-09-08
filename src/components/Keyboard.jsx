import React, { useCallback, memo, useState } from 'react';
import { STATUS } from '../data/constants';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { playKeyClickSfx } from '../utils/audio';
import { safeStorageGet } from '../utils/safeParse';
import InventoryBar from './InventoryBar';

// Kurdish Alphabet: 33 Characters iOS layout
const ROWS = [
 ['پ', 'ۆ', 'ی', 'ێ', 'ئ', 'ت', 'ڕ', 'ر', 'ە', 'و', 'ق'],
 ['ڵ', 'ل', 'ژ', 'ھ', 'ک', 'گ', 'ف', 'د', 'ش', 'س', 'ا'],
 ['غ', 'ع', 'ح', 'م', 'ن', 'ب', 'ڤ', 'چ', 'ج', 'خ', 'ز'],
 []
];

const SPECIAL_KEYS = {
 ENTER: 'تەمام',
 DELETE: 'backspace'
};




const areKeyEqual = (prev, next) => {
 return prev.k === next.k &&
 prev.status === next.status &&
 prev.isDisabled === next.isDisabled &&
 prev.isDark === next.isDark &&
 prev.isPointerTarget === next.isPointerTarget;
};

const Key = memo(({ k, status, onKeyPress, isDisabled, isDark = true, isPointerTarget = false }) => {
 const [isActive, setIsActive] = useState(false);

 const getKeyStyle = () => {
 if (isDisabled) {
 return isDark
 ? 'bg-[#334155]/20 text-white/10 border-transparent cursor-not-allowed shadow-[0_4px_0_rgba(51,65,85,0.4)]'
 : 'bg-slate-300/30 text-slate-400/20 border-transparent cursor-not-allowed shadow-[0_4px_0_rgba(203,213,225,0.5)]';
 }

 if (isDark) {
 if (status === STATUS.CORRECT) return 'bg-[#538d4e] text-white border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.3),0_4px_0_#3b6b37]';
 if (status === STATUS.WRONG_POS) return 'bg-[#f59e0b] text-white border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.4),0_4px_0_#b45309]';
 if (status === STATUS.INCORRECT) return 'bg-[#706d78] text-white opacity-80 shadow-[inset_0_3px_0_rgba(255,255,255,0.25),0_4px_0_#504e57]';
 return 'bg-[#fffefe] text-mono-900 font-bold border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.8),0_4px_0_#d8cbd8]';
 } else {
 if (status === STATUS.CORRECT) return 'bg-[#6aaa64] text-white border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.3),0_4px_0_#4e8a49]';
 if (status === STATUS.WRONG_POS) return 'bg-[#f59e0b] text-white border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.4),0_4px_0_#b45309]';
 if (status === STATUS.INCORRECT) return 'bg-[#D4D4D4] text-white opacity-50 shadow-[inset_0_3px_0_rgba(255,255,255,0.8),0_4px_0_#A3A3A3]';
 return 'bg-[#fffefe] text-mono-900 font-bold border-transparent shadow-[inset_0_3px_0_rgba(255,255,255,0.8),0_4px_0_#d8cbd8]';
 }
 };

 const getTextTranslateY = () => {
 const highKeys = ['و', 'ۆ', 'ر', 'ڕ', 'ز', 'ژ', 'خ', 'چ', 'ج', 'ح', 'ع', 'غ', 'س', 'ش', 'ی', 'ێ', 'ن', 'م'];
 const lowKeys = ['گ', 'ف', 'ڤ', 'ک', 'ڵ', 'ل', 'ق'];

 if (highKeys.includes(k)) return '-translate-y-[3px]';
 if (lowKeys.includes(k)) return 'translate-y-[3px]';
 return '-translate-y-[1px]';
 };

 const timeoutRef = React.useRef(null);

 const handlePointerDown = (e) => {
 e.preventDefault(); 
 e.currentTarget.setPointerCapture(e.pointerId);
 if (!isDisabled) {
 clearTimeout(timeoutRef.current);
 setIsActive(true);
 onKeyPress(k); 
 }
 };

 const handlePointerUp = (e) => {
 if (e && e.currentTarget && e.pointerId !== undefined) {
 try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_err) { /* ignore */ }
 }
 clearTimeout(timeoutRef.current);
 timeoutRef.current = setTimeout(() => {
 setIsActive(false);
 }, 100);
 };

 return (
 <Motion.button
 variants={{
 initial: { y: 3 },
 animate: {
 y: 0,
 transition: { type: "spring", stiffness: 120, damping: 25 }
 }
 }}
 whileHover={{ scale: isDisabled ? 1 : 1.05 }}
 whileTap={{ scale: isDisabled ? 1 : 0.92 }}
 transition={{ type: "spring", stiffness: 400, damping: 17 }}
 onPointerDown={handlePointerDown}
 onPointerUp={handlePointerUp}
 onPointerLeave={handlePointerUp}
 onPointerCancel={handlePointerUp}
 className={`flex-1 h-[clamp(34px,5.2vh,48px)] rounded-md flex items-center justify-center font-heading font-light transition-[transform,background-color,border-color] border relative ${getKeyStyle()}`}
 >
 <span className={`text-[clamp(1.3rem,4.5vw,1.9rem)] ${getTextTranslateY()}`}>{k}</span>
 
 {/* iOS-Style Key Popup */}
 <AnimatePresence>
 {isActive && !isDisabled && (
 <Motion.div
 initial={{ opacity: 0, y: 5 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, transition: { duration: 0.05 } }}
 transition={{ type: 'spring', stiffness: 600, damping: 25 }}
 className={`absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-[140%] h-[140%] rounded-xl shadow-2xl flex items-center justify-center pointer-events-none z-100 ${
 isDark ? 'bg-mono-500 border border-white/30 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]' : 'bg-white border border-slate-300 drop-shadow-[0_5px_15px_rgba(0,0,0,0.2)]'
 }`}
 >
 <span className={`text-[clamp(2rem,6vw,2.8rem)] font-heading ${isDark ? 'text-white' : 'text-black'} ${getTextTranslateY()}`}>
 {k}
 </span>
 </Motion.div>
 )}
 </AnimatePresence>

 {isPointerTarget && (
 <Motion.div
 initial={{ y: -10, opacity: 0 }}
 animate={{ y: [0, -10, 0], opacity: 1 }}
 transition={{ duration: 1, repeat: Infinity }}
 className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl z-50 pointer-events-none drop-shadow-md"
 >
 👇
 </Motion.div>
 )}
 </Motion.button>
 );
});

// Add custom equality function for Key to explicitly skip function prop comparison
Key.displayName = 'Key';
const MemoizedKey = memo(Key, areKeyEqual);

const Keyboard = ({
 onKey,
 onDelete,
 onEnter,
 usedKeys,
 gameState = 'playing',
 keyboardSoundEnabled = true,
 hapticEnabled = true,
 magnetDisabledKeys = [],
 onHint,
 onMagnet,
 onSkip,
 hintCount = 0,
 magnetCount = 0,
 skipCount = 0,
 magnetUsedInRound = false,
 skipsUsedInRound = 0,
 skipLimit = 1,
 hideSkip = false,
 hintTaps = 0,
 hintLimit = 0,
 hidePowerups = false,
 forceShowPowerups = false,
 isDark = true,
 allowedKeys = null,
 pointerKey = null
}) => {

 const callbacksRef = React.useRef({ onKey, onDelete, onEnter, keyboardSoundEnabled, hapticEnabled, gameState });
 
 React.useEffect(() => {
 callbacksRef.current = { onKey, onDelete, onEnter, keyboardSoundEnabled, hapticEnabled, gameState };
 });

 const handleKeyPress = useCallback((key, isSpecial = false) => {
 const cb = callbacksRef.current;
 if (cb.gameState !== 'playing') return;

 playKeyClickSfx(cb.keyboardSoundEnabled);
 
 // Read directly from storage to avoid Context re-renders on every keystroke
 const isHapticOn = safeStorageGet('peyvchin_haptic_enabled') !== 'false';
 if (isHapticOn) triggerHaptic(10, true);

 if (isSpecial) {
 if (key === SPECIAL_KEYS.ENTER) cb.onEnter();
 else if (key === SPECIAL_KEYS.DELETE) cb.onDelete();
 } else {
 cb.onKey(key);
 }
 }, []);

 return (
 <div className={`flex flex-col gap-2.5 w-full px-1.5 box-border select-none touch-manipulation relative z-10 transition-all duration-500 ${gameState !== 'playing' ? 'opacity-50 pointer-events-none grayscale' : ''}`} dir="rtl">

 {!hidePowerups && (
 <div className={forceShowPowerups ? "" : "md:hidden"}>
 <InventoryBar
 magnetCount={magnetCount}
 hintCount={hintCount}
 skipCount={skipCount}
 onHint={onHint}
 onMagnet={onMagnet}
 onSkip={onSkip}
 hintTaps={hintTaps}
 hintLimit={hintLimit}
 magnetUsedInRound={magnetUsedInRound}
 skipsUsedInRound={skipsUsedInRound}
 skipLimit={skipLimit}
 hideSkip={hideSkip}
 className="mb-1"
 isDark={isDark}
 />
 <div className={`w-[40%] h-px ${isDark ? 'bg-white/5' : 'bg-slate-200'} mx-auto mb-3`} />
 </div>
 )}

 {ROWS.map((row, rowIndex) => (
 <Motion.div
 key={`kbd-row-${rowIndex}`}
 className={`flex ${rowIndex === 3 ? 'gap-6' : 'gap-1.5'} w-full justify-center`}
 initial="initial"
 animate="animate"
 variants={{
 animate: {
 transition: {
 staggerChildren: 0.04,
 delayChildren: rowIndex * 0.08
 }
 }
 }}
 >
 {rowIndex === 3 && (
 <Motion.button
 variants={{
 initial: { y: 3 },
 animate: {
 y: 0,
 transition: { type: "spring", stiffness: 120, damping: 25 }
 }
 }}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 transition={{ type: "spring", stiffness: 400, damping: 17 }}
 onPointerDown={(e) => { e.preventDefault(); handleKeyPress(SPECIAL_KEYS.DELETE, true); }}
 className={`flex-1 h-[clamp(34px,5.2vh,48px)] rounded-md bg-error text-white flex items-center justify-center transition-all shadow-[0_4px_0_#be123c] relative ${allowedKeys && !allowedKeys.includes(SPECIAL_KEYS.DELETE) ? 'opacity-50 grayscale pointer-events-none' : 'active:scale-95'}`}
 >
 <span className="material-symbols-outlined text-[20px]">backspace</span>
 </Motion.button>
 )}

 {row.map((key) => (
 <MemoizedKey
 key={key}
 k={key}
 status={usedKeys[key]}
 isDisabled={(magnetDisabledKeys || []).includes(key) || (allowedKeys && !allowedKeys.includes(key))}
 isPointerTarget={pointerKey === key}
 onKeyPress={handleKeyPress}
 isDark={isDark}
 />
 ))}

 {rowIndex === 3 && (
 <Motion.button
 variants={{
 initial: { y: 3 },
 animate: {
 y: 0,
 transition: { type: "spring", stiffness: 120, damping: 25 }
 }
 }}
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.95 }}
 transition={{ type: "spring", stiffness: 400, damping: 17 }}
 onPointerDown={(e) => { e.preventDefault(); handleKeyPress(SPECIAL_KEYS.ENTER, true); }}
 className={`flex-1 h-[clamp(34px,5.2vh,48px)] rounded-md bg-primary text-white font-bold text-sm uppercase flex items-center justify-center transition-all shadow-[0_4px_0_#047857] relative ${allowedKeys && !allowedKeys.includes(SPECIAL_KEYS.ENTER) ? 'opacity-50 grayscale pointer-events-none' : 'active:scale-95'}`}
 >
 <span className="font-rabar font-light text-lg">{SPECIAL_KEYS.ENTER}</span>
 {pointerKey === SPECIAL_KEYS.ENTER && (
 <Motion.div
 initial={{ y: -10, opacity: 0 }}
 animate={{ y: [0, -10, 0], opacity: 1 }}
 transition={{ duration: 1, repeat: Infinity }}
 className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl z-50 pointer-events-none drop-shadow-md"
 >
 👇
 </Motion.div>
 )}
 </Motion.button>
 )}


 </Motion.div>
 ))}
 </div>
 );
};

const areKeyboardPropsEqual = (prev, next) => {
 if (prev.gameState !== next.gameState) return false;
 if (prev.isDark !== next.isDark) return false;
 if (prev.hintCount !== next.hintCount) return false;
 if (prev.magnetCount !== next.magnetCount) return false;
 if (prev.skipCount !== next.skipCount) return false;
 if (prev.magnetUsedInRound !== next.magnetUsedInRound) return false;
 if (prev.skipsUsedInRound !== next.skipsUsedInRound) return false;
 if (prev.hintTaps !== next.hintTaps) return false;
 if (prev.pointerKey !== next.pointerKey) return false;
 if (prev.hidePowerups !== next.hidePowerups) return false;
 if (prev.forceShowPowerups !== next.forceShowPowerups) return false;
 if (prev.keyboardSoundEnabled !== next.keyboardSoundEnabled) return false;
 if (prev.hapticEnabled !== next.hapticEnabled) return false;
 
 const pKeys = prev.usedKeys || {};
 const nKeys = next.usedKeys || {};
 const pKeysLen = Object.keys(pKeys).length;
 const nKeysLen = Object.keys(nKeys).length;
 if (pKeysLen !== nKeysLen) return false;
 for (const k in nKeys) {
 if (pKeys[k] !== nKeys[k]) return false;
 }

 const pMag = prev.magnetDisabledKeys || [];
 const nMag = next.magnetDisabledKeys || [];
 if (pMag.length !== nMag.length) return false;
 for (let i = 0; i < nMag.length; i++) {
 if (pMag[i] !== nMag[i]) return false;
 }

 const pAllow = prev.allowedKeys;
 const nAllow = next.allowedKeys;
 if (pAllow !== nAllow) {
 if (!pAllow || !nAllow || pAllow.length !== nAllow.length) return false;
 for (let i = 0; i < nAllow.length; i++) {
 if (pAllow[i] !== nAllow[i]) return false;
 }
 }
 return true;
};

export default memo(Keyboard, areKeyboardPropsEqual);

