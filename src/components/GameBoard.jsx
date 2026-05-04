import React from 'react';
import { motion as Motion } from 'framer-motion';

const GameBoard = ({ gridState = [] }) => {
  return (
    <div className="grid grid-cols-5 gap-2 p-4 justify-center">
      {gridState.map((row, rIndex) => (
        row.map((cell, cIndex) => (
          <Motion.div
            key={`cell-${rIndex}-${cIndex}`}
            initial={false}
            animate={{
              backgroundColor: cell.color || '#1e293b',
              scale: cell.letter ? 1.05 : 1
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-bold text-white rounded shadow-lg border border-white/5"
          >
            {cell.letter}
          </Motion.div>
        ))
      ))}
    </div>
  );
};

export default GameBoard;


