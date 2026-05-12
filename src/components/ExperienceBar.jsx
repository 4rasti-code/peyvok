import React, { useState, useEffect } from 'react';
import { toKuDigits } from '../utils/formatters';
import { useGame } from '../context/GameContext';

/**
 * ExperienceBar - High-fidelity 'Aqua Glass' HUD.
 * Now fully connected to the Global Game Context and Supabase Sync.
 * Features 11 Dynamic Color Tiers (Level 1-100).
 */
const ExperienceBar = () => {
  const { level, currentXP, maxXP, minXPForLevel, progressPercent } = useGame();
  const [animatedXP, setAnimatedXP] = useState(currentXP);

  // 1. Dynamic Tier Color Logic (Synchronized with RPG system)
  const getTierColors = (lvl) => {
    if (lvl < 5) return { top: '#00F2FE', bottom: '#4FACFE' }; 
    if (lvl < 10) return { top: '#FFC837', bottom: '#FF8008' }; 
    if (lvl < 20) return { top: '#E2E2E2', bottom: '#999999' }; 
    if (lvl < 35) return { top: '#FFDF00', bottom: '#D4AF37' }; 
    if (lvl < 50) return { top: '#50C878', bottom: '#228B22' }; 
    if (lvl < 75) return { top: '#FF416C', bottom: '#FF4B2B' }; 
    return { top: '#E0EAFC', bottom: '#CFDEF3' };
  };

  const theme = getTierColors(level);

  // 2. Smooth XP Number Interpolation Hook
  useEffect(() => {
    let animationFrameId;
    const start = animatedXP;
    const end = currentXP;
    
    // Smooth transition
    const duration = 1200; 
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = progress * (2 - progress);
      setAnimatedXP(Math.floor(start + (end - start) * easeOut));
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setAnimatedXP(end);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentXP]);

  const fillPercentage = progressPercent;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 3D Liquid Flow Animation Effects */}
      <style>
        {`
          @keyframes flowWavesGlobal { 0% { background-position: 200% 0; } 100% { background-position: 0% 0; } }
          .liquid-water-global {
            background: linear-gradient(90deg, 
              ${theme.bottom} 0%, ${theme.top} 25%, ${theme.bottom} 50%, ${theme.top} 75%, ${theme.bottom} 100%
            );
            background-size: 200% 100%; 
            animation: flowWavesGlobal 2.5s linear infinite;
            box-shadow: inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 4px 6px rgba(255,255,255,0.4);
            transform: scaleX(1);
            transform-origin: left;
            transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>

      {/* Slim & Seamless Bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '320px', height: '44px', margin: '0 auto' }}>
        <div style={{
            position: 'relative', flexGrow: 1, height: '18px', backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '50px 0 0 50px', border: '1.5px solid rgba(255,255,255,0.2)', borderRight: 'none', 
            boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.6)', overflow: 'hidden', marginRight: '14px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {/* LIQUID WATER FILL */}
          <div className="liquid-water-global" style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: '100%', transform: `scaleX(${fillPercentage / 100})`, zIndex: 1
            }}></div>

          {/* XP NUMBERS */}
          <span style={{ 
            position: 'relative', color: 'white', fontWeight: '900', fontSize: '10px', fontFamily: 'sans-serif', 
            zIndex: 2, display: 'inline-block', direction: 'ltr', unicodeBidi: 'bidi-override', textShadow: '0 2px 4px rgba(0,0,0,0.8)' 
          }}>
            {`${toKuDigits(animatedXP - minXPForLevel)} / ${toKuDigits(maxXP - minXPForLevel)}`}
          </span>
        </div>

        {/* DYNAMIC STAR BADGE - Perfectly centered on Y axis */}
        <div style={{
            position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', width: '90%', height: '90%', filter: `drop-shadow(0px 3px 4px ${theme.bottom}66)` }}>
            <defs>
              <linearGradient id="globalStarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.top} />
                <stop offset="100%" stopColor={theme.bottom} />
              </linearGradient>
            </defs>
            <path d="M50 15 L59 38 L83 40 L64 56 L69 80 L50 68 L31 80 L36 56 L17 40 L41 38 Z" fill="url(#globalStarGradient)" stroke="url(#globalStarGradient)" strokeWidth="12" strokeLinejoin="round" />
          </svg>
          
          <span style={{ 
            position: 'relative', 
            top: '1px',
            color: level >= 80 && level < 90 ? '#FFF' : (level >= 90 ? '#000' : '#FFFFFF'), 
            fontWeight: '900', fontSize: '16px', fontFamily: 'sans-serif', zIndex: 11, 
            textShadow: (level >= 80 && level < 90) || level >= 100 ? '0 2px 4px rgba(0,0,0,0.4)' : (level >= 90 ? 'none' : '0px 2px 4px rgba(0,0,0,0.6)') 
          }}>
            {toKuDigits(level)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExperienceBar;
