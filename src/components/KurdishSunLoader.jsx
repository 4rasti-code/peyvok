import React from 'react';
import { motion as Motion } from 'framer-motion';

const KurdishSunLoader = ({ size = 80, color = "#FFD700", progress = 0 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-10">
      {/* The Sun Container with Glow */}
      <div className="relative flex items-center justify-center">
        <Motion.svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] z-10"
        >
          {/* Central Disk */}
          <circle cx="50" cy="50" r="18" fill={color} />

          {/* 21 Rays of the Kurdish Sun */}
          {Array.from({ length: 21 }).map((_, i) => {
            const angle = (i * 360) / 21;
            return (
              <Motion.path
                key={i}
                d="M50 15 L54 30 L46 30 Z"
                fill={color}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                transform={`rotate(${angle}, 50, 50)`}
              />
            );
          })}
        </Motion.svg>
        
        {/* Pulsing Outer Glow Background */}
        <Motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.35, 0.2] 
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-24 h-24 bg-yellow-500 rounded-full blur-3xl z-0"
        />
      </div>

      {/* Modern Progress Section */}
      <div className="w-64 flex flex-col items-center gap-4">
        {/* The Track */}
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
          {/* The Filling Bar */}
          <Motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
            className="absolute top-0 left-0 h-full bg-linear-to-r from-yellow-600 via-yellow-400 to-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.6)]"
          />
        </div>
        
        {/* Status Text & Percentage */}
        <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-yellow-500/90 uppercase tracking-[0.2em] font-rabar drop-shadow-sm">
                    چاڤەڕێبە...
                </span>
                <span className="text-sm font-black text-white tabular-nums font-mono drop-shadow-md">
                    {Math.round(progress)}%
                </span>
            </div>
            
            {/* Subtle sub-text based on progress */}
            <Motion.span 
                key={progress > 60 ? 'syncing' : 'connecting'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 0.5, y: 0 }}
                className="text-[9px] text-slate-400 font-medium uppercase tracking-widest"
            >
                {progress < 40 ? 'Connecting to Server' : progress < 80 ? 'Syncing Profile' : 'Finalizing'}
            </Motion.span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(KurdishSunLoader);


