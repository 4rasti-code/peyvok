import React, { useCallback, memo } from 'react';
import { STATUS } from '../data/constants';
import { motion as Motion} from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { playKeyClickSfx } from '../utils/audio';
import InventoryBar from './InventoryBar';

// Kurdish Alphabet: 33 Characters in 4 Rows (9-9-9-6)
const ROWS = [
   ['پ', 'ۆ', 'ح', 'ع', 'ئ', 'ی', 'ێ', 'ت', 'ە'],
   ['ڕ', 'ر', 'و', 'ق', 'ل', 'ڵ', 'ک', 'ژ', 'ھ'],
   ['گ', 'غ', 'م', 'ن', 'ف', 'د', 'س', 'ش', 'ا'],
   ['ب', 'ڤ', 'ج', 'چ', 'خ', 'ز']
];

const SPECIAL_KEYS = {
   ENTER: 'تەمام',
   DELETE: 'backspace'
};

const MotionButton = Motion.button;
const MotionDiv = Motion.div;


const Key = memo(({ k, status, onKeyPress, isDisabled, isDark = true }) => {
   const getKeyStyle = () => {
      if (isDisabled) {
         return isDark
            ? 'bg-[#334155]/20 text-white/10 border-transparent cursor-not-allowed'
            : 'bg-slate-300/30 text-slate-400/20 border-transparent cursor-not-allowed';
      }

      if (isDark) {
         if (status === STATUS.CORRECT) return 'bg-[#538d4e] text-white border-transparent';
         if (status === STATUS.WRONG_POS) return 'bg-[#b59f3b] text-white border-transparent';
         if (status === STATUS.INCORRECT) return 'bg-[#262626] text-white opacity-50';
         return 'bg-[#525252] text-white border-transparent';
      } else {
         if (status === STATUS.CORRECT) return 'bg-[#6aaa64] text-white border-transparent';
         if (status === STATUS.WRONG_POS) return 'bg-[#c9b458] text-white border-transparent';
         if (status === STATUS.INCORRECT) return 'bg-[#D4D4D4] text-white opacity-50';
         return 'bg-[#E5E5E5] text-black border-transparent';
      }
   };

   return (
      <MotionButton
         variants={{
            initial: { y: 3 },
            animate: {
               y: 0,
               transition: { type: "spring", stiffness: 120, damping: 25 }
            }
         }}
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.92 }}
         transition={{ type: "spring", stiffness: 400, damping: 17 }}
         onPointerDown={(e) => { e.preventDefault(); !isDisabled && onKeyPress(k); }}
         className={`flex-1 h-[clamp(38px,6vh,55px)] rounded-md flex items-center justify-center font-heading font-light transition-[transform,background-color,border-color] border ${getKeyStyle()}`}
      >
         <span className="text-[clamp(1.3rem,4.5vw,1.9rem)] -translate-y-px">{k}</span>
      </MotionButton>
   );
});

const Keyboard = memo(({
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
   hintTaps = 0,
   hintLimit = 0,
   hidePowerups = false,
   isDark = true
}) => {

   const handleKeyPress = useCallback((key, isSpecial = false) => {
      if (gameState !== 'playing') return;

      playKeyClickSfx(keyboardSoundEnabled);
      if (hapticEnabled) triggerHaptic(10);

      if (isSpecial) {
         if (key === SPECIAL_KEYS.ENTER) onEnter();
         else if (key === SPECIAL_KEYS.DELETE) onDelete();
      } else {
         onKey(key);
      }
   }, [onKey, onDelete, onEnter, keyboardSoundEnabled, hapticEnabled, gameState]);

   return (
      <div className={`flex flex-col gap-2 w-full px-1.5 box-border select-none touch-manipulation relative z-10 transition-all duration-500 ${gameState !== 'playing' ? 'opacity-50 pointer-events-none grayscale' : ''}`} dir="rtl">

         {!hidePowerups && (
            <div className="md:hidden">
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
                  className="mb-1"
                  isDark={isDark}
               />
               <div className={`w-[40%] h-px ${isDark ? 'bg-white/5' : 'bg-slate-200'} mx-auto mb-3`} />
            </div>
         )}

         {ROWS.map((row, rowIndex) => (
            <MotionDiv
               key={`kbd-row-${rowIndex}`}
               className="flex gap-1 w-full justify-center"
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
               {rowIndex === 2 && (
                  <MotionButton
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
                     className="flex-[1.5] h-[clamp(38px,6vh,55px)] rounded-md bg-error text-white border border-white/10 flex items-center justify-center transition-all active:scale-95 shadow-md shadow-black/20"
                  >
                     <span className="material-symbols-outlined text-[20px]">backspace</span>
                  </MotionButton>
               )}

               {rowIndex === 3 && (
                  <MotionButton
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
                     className="flex-[1.8] h-[clamp(38px,6vh,55px)] rounded-md bg-primary text-white font-bold text-xs uppercase flex items-center justify-center transition-all active:scale-95 border border-white/10 shadow-md shadow-black/20"
                  >
                     <span className="font-rabar font-light text-lg">{SPECIAL_KEYS.ENTER}</span>
                  </MotionButton>
               )}

               {row.map((key) => (
                  <Key
                     key={key}
                     k={key}
                     status={usedKeys[key]}
                     isDisabled={(magnetDisabledKeys || []).includes(key)}
                     onKeyPress={handleKeyPress}
                     isDark={isDark}
                  />
               ))}
            </MotionDiv>
         ))}
      </div>
   );
});

export default Keyboard;

