import React from 'react';
import { motion as Motion } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';
import { HintIcon, MagnetIcon, SkipIcon } from './CurrencyIcon';

const PowerUpButton = ({ 
 icon, 
 count, 
 disabled, 
 onClick, 
 colorTheme, 
 ariaLabel, 
 id 
}) => {
 const themes = {
 green: "bg-linear-to-b from-[#D489FF] to-[#B352FF] shadow-[0_3px_0_#9A32DF,0_4px_6px_rgba(0,0,0,0.15)] w-14 h-14 rounded-full", // Purple target (Magnet)
 blue: "bg-linear-to-b from-[#FFA756] to-[#F27D26] shadow-[0_3px_0_#D96614,0_4px_6px_rgba(0,0,0,0.15)] w-14 h-14 rounded-full", // Orange magnifying glass (Hint)
 yellow: "bg-linear-to-b from-[#6EC6FF] to-[#39A4F8] shadow-[0_3px_0_#2386D4,0_4px_6px_rgba(0,0,0,0.15)] w-14 h-14 rounded-full" // Light blue circular (Skip)
 };

 const Icon = icon;

 return (
 <button
 id={id}
 onClick={onClick}
 disabled={disabled}
 aria-label={ariaLabel}
 className={`relative flex items-center justify-center transition-all duration-150 outline-none ${themes[colorTheme]} ${disabled ? 'opacity-50 grayscale cursor-not-allowed shadow-[0_2px_0_transparent] translate-y-1' : 'active:translate-y-1 active:shadow-[0_1px_0_var(--tw-shadow-color),0_2px_5px_rgba(0,0,0,0.1)] hover:brightness-110'}`}
 >
 <Icon className="w-8 h-8 drop-shadow-md z-10" disabled={disabled} />

 {count !== null && (
 <div className="absolute -bottom-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full bg-[#ef4444] shadow-sm flex items-center justify-center text-[13px] leading-none font-black text-white z-10">
 {count}
 </div>
 )}
 </button>
 );
};

const InventoryBar = ({ 
 magnetCount, 
 hintCount, 
 skipCount, 
 onHint, 
 onMagnet, 
 onSkip,
 hintTaps = 0,
 hintLimit = 3,
 magnetUsedInRound = false,
 skipsUsedInRound = 0,
 skipLimit = 1,
 isShop = false,
 hideSkip = false,
 isTutorialFocus = false,
 tutorialHighlightItem = null,
 className = ""
}) => {
 const getAnimate = (itemType) => {
 if (!isTutorialFocus) return {};
 if (tutorialHighlightItem === 'main') return { opacity: 1, scale: 1, y: 0 };
 if (tutorialHighlightItem === itemType) return { opacity: 1, scale: 1.2, y: -5 };
 return { opacity: 0.3, scale: 0.8, y: 0 };
 };

 const getTransition = (delay) => {
 if (tutorialHighlightItem === 'main') return { type: 'spring', bounce: 0.6, delay: delay };
 return { type: 'spring', bounce: 0.5 };
 };

 const displayHintCount = isShop 
 ? toKuDigits(hintCount || 0)
 : (hintLimit > 0 ? toKuDigits(Math.max(0, (hintCount || 0) <= 0 ? 0 : hintLimit - hintTaps)) : null);

 const displayMagnetCount = isShop
 ? toKuDigits(magnetCount || 0)
 : toKuDigits((magnetUsedInRound || (magnetCount || 0) <= 0) ? 0 : 1);

 const displaySkipCount = isShop
 ? toKuDigits(skipCount || 0)
 : (skipLimit > 0 ? toKuDigits(Math.max(0, (skipCount || 0) <= 0 ? 0 : skipLimit - skipsUsedInRound)) : null);

 const isHintDisabled = !isShop && (hintTaps >= hintLimit || hintLimit === 0 || (hintCount || 0) <= 0);
 const isMagnetDisabled = !isShop && (magnetUsedInRound || (magnetCount || 0) <= 0);
 const isSkipDisabled = !isShop && (skipsUsedInRound >= skipLimit || (skipCount || 0) <= 0);

 return (
 <div className={`flex items-center justify-center min-h-14 py-2 w-full ${className}`}>
 <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 py-1 px-1 sm:px-4 h-auto">
 
 {/* Hint Item */}
 <Motion.div 
 className="shrink-0"
 initial={isTutorialFocus ? { opacity: 0, scale: 0, y: 20 } : false}
 animate={getAnimate('bulb')}
 transition={getTransition(0.8)}
 >
 <PowerUpButton 
 id="btn-hint"
 icon={HintIcon}
 count={displayHintCount}
 disabled={isHintDisabled}
 onClick={onHint}
 colorTheme="blue"
 ariaLabel="Use Hint"
 />
 </Motion.div>

 {/* Magnet Item */}
 <Motion.div 
 className="shrink-0"
 initial={isTutorialFocus ? { opacity: 0, scale: 0, y: 20 } : false}
 animate={getAnimate('magnet')}
 transition={getTransition(1.6)}
 >
 <PowerUpButton 
 id="btn-magnet"
 icon={MagnetIcon}
 count={displayMagnetCount}
 disabled={isMagnetDisabled}
 onClick={onMagnet}
 colorTheme="green"
 ariaLabel="Use Magnet"
 />
 </Motion.div>

 {!hideSkip && (
 <Motion.div 
 className="shrink-0"
 initial={isTutorialFocus ? { opacity: 0, scale: 0, y: 20 } : false}
 animate={getAnimate('skip')}
 transition={getTransition(2.4)}
 >
 <PowerUpButton 
 id="btn-skip"
 icon={SkipIcon}
 count={displaySkipCount}
 disabled={isSkipDisabled}
 onClick={onSkip}
 colorTheme="yellow"
 ariaLabel="Use Skip"
 />
 </Motion.div>
 )}

 </div>
 </div>
 );
};

export default React.memo(InventoryBar);
