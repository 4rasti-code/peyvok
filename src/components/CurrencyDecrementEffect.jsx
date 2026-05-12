import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { FilsIcon, DerhemIcon, DinarIcon } from './CurrencyIcon';
import { toKuDigits } from '../utils/formatters';
import { playCoinSfx } from '../utils/audio';

/**
 * CurrencyDecrementEffect
 * A premium feedback component that displays a floating "-X [Icon]" animation 
 * whenever the provided value decreases.
 */
const CurrencyDecrementEffect = ({ value, currency, children, className = "", resetKey = "" }) => {
  const [changes, setChanges] = useState([]);
  const [isSettled, setIsSettled] = useState(false);
  const prevValue = useRef(null);
  const [componentMountTime] = useState(() => Date.now());

  // View Transition Stabilization: Reset settling period when navigation occurs
  useEffect(() => {
    setTimeout(() => {
      setIsSettled(false);
      setChanges([]); // Clear any pending animations when moving between views
    }, 0);
    const timer = setTimeout(() => setIsSettled(true), 2000); // Extended 2s silence window for initial syncs
    return () => clearTimeout(timer);
  }, [resetKey]);

  useEffect(() => {
    // 1. Skip if not settled or first run to prevent ghost animations during syncs
    if (prevValue.current === null || !isSettled) {
      prevValue.current = value;
      return;
    }

    const numericValue = Number(value) || 0;
    const previousNumericValue = Number(prevValue.current) || 0;

    // 2. GHOST GUARD: Ignore drops from common initialization defaults (1000, 50, 5)
    // unless they happen much later in the session.
    const isInitializationDrop = (previousNumericValue === 1000 || previousNumericValue === 50 || previousNumericValue === 5) 
                               && (Date.now() - componentMountTime < 5000);

    // 3. Only trigger if the change is a real decrease and we are settled and NOT a ghost drop
    if (numericValue < previousNumericValue && !isInitializationDrop) {
      const diff = previousNumericValue - numericValue;
      
      // Safety: Ignore unrealistic drops (> 300) during the first 5s of mounting OR while not settled
      // This prevents "Ghost -895" when jumping from high defaults to real low balances
      if ((diff > 300 && (Date.now() - componentMountTime < 5000)) || !isSettled) {
        prevValue.current = value;
        return;
      }

      const id = Date.now() + Math.random();
      
      // Play sound effect
      playCoinSfx();
      
      setTimeout(() => {
        setChanges(prev => [...prev.slice(-2), { id, diff }]);
      }, 0);
      
      // Auto-cleanup
      const timer = setTimeout(() => {
        setChanges(prev => prev.filter(c => c.id !== id));
      }, 2000);
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value, isSettled, componentMountTime]);

  const IconComponent = () => {
    const props = { className: "w-5 h-5", size: 20 };
    switch (currency) {
      case 'derhem': return <DerhemIcon {...props} />;
      case 'dinar': return <DinarIcon {...props} />;
      case 'fils':
      default: return <FilsIcon {...props} />;
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ isolation: 'isolate' }}>
      {children}
      
      {/* Animation Layer */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: 9999 }}>
        <AnimatePresence mode="popLayout">
          {changes.map(change => (
            <Motion.div
              key={change.id}
              initial={{ opacity: 0, y: 10, scale: 0.5, filter: 'blur(4px)' }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: -60, 
                scale: [0.5, 1.2, 1, 0.8],
                filter: 'blur(0px)'
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ 
                duration: 1.8, 
                times: [0, 0.2, 0.8, 1],
                ease: "easeOut" 
              }}
              className="absolute flex items-center gap-2 bg-linear-to-r from-red-500/20 to-transparent px-3 py-1 rounded-full border border-red-500/30 backdrop-blur-sm"
            >
              <span className="text-[#ff4d4d] font-black text-2xl drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">
                -{toKuDigits(change.diff)}
              </span>
              <div className="flex items-center justify-center drop-shadow-[0_0_5px_rgba(255,0,0,0.4)] brightness-125">
                 <IconComponent />
              </div>
            </Motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CurrencyDecrementEffect;

