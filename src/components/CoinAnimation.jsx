import React, { useEffect, useState } from 'react';
import { FilsIcon } from './CurrencyIcon';
import { playCoinSfx } from '../utils/audio';

const CoinAnimation = ({ trigger, isDaily, amount = 0 }) => {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    if (trigger) {
      // Dynamic Scaling: Number of coins based on reward amount
      // Standard win (~100 fils) = 20-25 coins
      // Daily win (~1000 fils) = 50-60 coins
      // Hard/Secret win (2500+ fils) = 80-100 coins
      let length = Math.min(100, Math.max(15, Math.floor((amount || 100) / 10)));
      if (isDaily) length = Math.max(length, 45); // Daily minimum boost
      
      // Multi-Play Sound Burst Logic (Scaled to intensity)
      const soundCount = Math.min(12, Math.max(3, Math.floor(length / 7)));
      for (let i = 0; i < soundCount; i++) {
        setTimeout(() => {
          playCoinSfx();
        }, i * (isDaily ? 50 : 80));
      }
      
      const newCoins = Array.from({ length }).map((_, i) => ({
        id: Date.now() + i,
        delay: i * (isDaily ? 0.04 : 0.06),
        x: Math.random() * 160 - 80, 
        y: Math.random() * 160 - 80,
      }));

      // Use a timeout to avoid synchronous setState in useEffect (cascading renders)
      const animationTimer = setTimeout(() => {
        setCoins(newCoins);
      }, 0);
      
      const cleanupTimer = setTimeout(() => {
        setCoins([]);
      }, 3500); // Clear after animation

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [trigger, isDaily, amount]);

  if (coins.length === 0) return null;

  const targetX = window.innerWidth * 0.42; 
  const targetY = -window.innerHeight * 0.46;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center pointer-events-none">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="coin-icon"
          style={{
            '--target-x': `${targetX}px`,
            '--target-y': `${targetY}px`,
            animationDelay: `${coin.delay}s`,
            left: `calc(50% + ${coin.x}px)`,
            top: `calc(50% + ${coin.y}px)`
          }}
        >
          <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
            <FilsIcon size={44} className="hover:scale-110 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoinAnimation;
