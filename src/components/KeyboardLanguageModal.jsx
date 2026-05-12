import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const KeyboardLanguageModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          {/* Subtle Backdrop */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-mono-950/10"
          />

          {/* Precision Minimal Modal Content */}
          <Motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="relative w-full max-w-[200px] bg-white dark:bg-mono-900 rounded-md overflow-hidden shadow-lg border border-mono-200 dark:border-mono-800"
          >
            <div className="p-4 flex flex-col items-center text-center gap-4">
              <div className="space-y-1.5">
                <h2 className="text-sm font-bold text-mono-900 dark:text-mono-50">
                  زمانێ کیبۆردی
                </h2>
                <p className="text-[10px] text-mono-500 dark:text-mono-400 font-medium leading-tight">
                  کیبۆردێ خوە بگوهۆڕە بۆ <br/>
                  <span className="text-amber-600 dark:text-amber-500 font-bold">"Central Kurdish"</span>
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-1.5 bg-mono-900 dark:bg-mono-800 text-white rounded-md font-bold text-[10px] active:scale-95 transition-all"
              >
                باشە
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardLanguageModal;


