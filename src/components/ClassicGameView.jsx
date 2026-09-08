import React from 'react';
import TopAppBar from './TopAppBar';
import InfoBar from './InfoBar';
import Grid from './Grid';
import Keyboard from './Keyboard';
import InventoryBar from './InventoryBar';
import { useGameStore } from '../store/gameStore';
import { getLevelFromXP } from '../utils/progression';

const ClassicGameView = ({
 className,
 targetHint, category, gameMode, guesses, maxGuesses, timeLeft, isSuccessSplash,
 currentGuess, getLetterStatus, revealedIndices, hintIndices, targetWord, isShaking,
 onKey, onDelete, onEnter, usedKeys, isVictory, isDefeat, isLevelingUp, magnetDisabledKeys,
 onHint, onMagnet, onSkip, hintTaps, getMaxHintsForWord, magnetsUsedInRound, skipsUsedInRound,
 appSoundsEnabled, hapticEnabled, topAppBarProps
}) => {
  const fils = useGameStore(s => s.fils);
  const currentXP = useGameStore(s => s.currentXP);
  const minXPForLevel = useGameStore(s => s.minXPForLevel);
  const maxXP = useGameStore(s => s.maxXP);
  const level = getLevelFromXP(currentXP);
  const hintCount = useGameStore(s => s.hintCount);
  const magnetCount = useGameStore(s => s.magnetCount);
  const skipCount = useGameStore(s => s.skipCount);

  return (
 <div className={className}>
 <TopAppBar {...topAppBarProps} />
 {/* Tier 1 & 2: Info & Grid (Flex Grow) */}
 <div className="flex-1 flex flex-col items-center min-h-0 overflow-hidden no-scrollbar w-full">
 {/* Question Section */}
 <div className={`w-full md:max-w-lg md:mx-auto shrink-0 flex flex-col items-center my-1`}>
 <InfoBar
 targetHint={targetHint}
 category={category}
 gameMode={gameMode}
 guessesCount={guesses.length}
 maxGuesses={maxGuesses}
 fils={fils}
 currentXP={currentXP}
 minXP={minXPForLevel}
 maxXP={maxXP}
 level={level}
 targetDifficultyLevel={level}
 timeLeft={timeLeft}
 showSuccessSplash={isSuccessSplash}
 isDark={true}
 />
 </div>

 {/* Grid Section (Centers content in remaining space) */}
 <div className={`grid-protection-wrapper flex-1 flex flex-col justify-center overflow-hidden w-full md:max-w-lg md:mx-auto`}>
 <div className="game-grid-core w-full flex justify-center items-center">
 <Grid
 key={targetWord}
 guesses={guesses}
 currentGuess={currentGuess}
 wordLength={targetWord.length}
 getLetterStatus={getLetterStatus}
 revealedIndices={revealedIndices}
 hintIndices={hintIndices}
 lastHintIndex={-1}
 targetWord={targetWord}
 maxRows={maxGuesses}
 isShaking={isShaking}
 isDark={true}
 />
 </div>
 </div>
 </div>

 {/* Tier 3: Keyboard (Pinned to bottom) */}
 <div className={`shrink-0 w-full md:max-w-lg md:mx-auto z-50 px-2 pt-8 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-[#2d1155] border-none rounded-t-2xl transition-colors duration-500`}>
 <div className="mb-4">
 <InventoryBar
 magnetCount={magnetCount}
 hintCount={hintCount}
 skipCount={skipCount}
 onHint={onHint}
 onMagnet={onMagnet}
 onSkip={onSkip}
 hintTaps={hintTaps}
 hintLimit={getMaxHintsForWord(targetWord?.length || 5)}
 magnetUsedInRound={magnetsUsedInRound > 0}
 skipsUsedInRound={skipsUsedInRound}
 skipLimit={1}
 hideSkip={false}
 isDark={true}
 />
 </div>

 <Keyboard
 hidePowerups={true}
 onKey={onKey}
 onDelete={onDelete}
 onEnter={onEnter}
 usedKeys={usedKeys}
 isDark={true}
 gameState={isVictory ? 'won' : isDefeat ? 'lost' : isLevelingUp ? 'leveling-up' : 'playing'}
 magnetDisabledKeys={magnetDisabledKeys}
 onHint={onHint}
 onMagnet={onMagnet}
 onSkip={onSkip}
 hintCount={hintCount}
 magnetCount={magnetCount}
 skipCount={skipCount}
 hintTaps={hintTaps}
 hintLimit={getMaxHintsForWord(targetWord?.length || 5)}
 magnetUsedInRound={magnetsUsedInRound > 0}
 skipsUsedInRound={skipsUsedInRound}
 skipLimit={1}
 hideSkip={false}
 keyboardSoundEnabled={appSoundsEnabled}
 hapticEnabled={hapticEnabled}
 />
 </div>
 </div>
 );
};

export default ClassicGameView;
