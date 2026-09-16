import React, { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';

// The exact arrow/dart from MagnetIcon
const MagnetArrow = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible' }}>
    <g>
      <polygon points="6,2 4,0 3,3 0,4 2,6 5,5" fill="white" strokeWidth="0" />
      <line x1="5" y1="5" x2="12" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2" fill="white" strokeWidth="0" />
    </g>
  </svg>
);

export default function MagnetProjectileOverlay({ startCoords, targets, onHit, onComplete }) {
  const [mounted, setMounted] = useState(false);
  const onHitRef = React.useRef(onHit);
  const onCompleteRef = React.useRef(onComplete);

  useEffect(() => {
    onHitRef.current = onHit;
    onCompleteRef.current = onComplete;
  }, [onHit, onComplete]);

  useEffect(() => {
    // Slight delay to ensure DOM is ready and state is flushed
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Precise timing for impact synchronization to bypass React render delay
  useEffect(() => {
    if (!mounted || !targets) return;

    const timeouts = targets.map((target, index) => {
      const delayMs = index * 200; // 0.2s stagger
      const durationMs = 700; // 0.7s flight
      
      // Fire 30ms early so the state update and DOM render finish EXACTLY as the arrow hits
      return setTimeout(() => {
        onHitRef.current(target.key);
      }, delayMs + durationMs - 30);
    });

    const completeTimeout = setTimeout(() => {
      onCompleteRef.current();
    }, (targets.length * 200) + 700 + 800);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [mounted, targets]);

  if (!startCoords || !targets || targets.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-9999">
      {targets.map((target, index) => {
        // Calculate the center of the start button
        const startX = startCoords.left + startCoords.width / 2;
        const startY = startCoords.top + startCoords.height / 2;

        // Calculate the center of the target key
        const endX = target.coords.left + target.coords.width / 2;
        const endY = target.coords.top + target.coords.height / 2;

        const dx = endX - startX;
        
        // Calculate arc peak
        const peakY = Math.min(startY, endY) - 150;
        const peakX = startX + (dx / 2);

        // Calculate raw angles
        let rawStart = Math.atan2(peakY - startY, peakX - startX) * (180 / Math.PI);
        let rawEnd = Math.atan2(endY - peakY, endX - peakX) * (180 / Math.PI);

        // Prevent backflips by normalizing rotation direction
        if (startX > endX) {
          // Shooting left: should rotate counter-clockwise (angle decreases)
          if (rawEnd > rawStart) rawEnd -= 360;
        } else {
          // Shooting right: should rotate clockwise (angle increases)
          if (rawEnd < rawStart) rawEnd += 360;
        }
        
        // Base angle of the SVG arrow is 45 degrees (pointing bottom-right)
        // We subtract 45 so it aligns correctly.
        const startRotation = rawStart - 45;
        const endRotation = rawEnd - 45;
        
        // Stagger the flights
        const delay = index * 0.2; // Slightly longer stagger for slower flight

        const midRotation = (startRotation + endRotation) / 2;

        return (
          <Motion.div
            key={target.key}
            initial={{ 
              x: startX - 12, // Center the 24x24 SVG
              y: startY - 12, 
              scale: 0, 
              opacity: 0,
              rotate: startRotation
            }}
            animate={mounted ? {
              x: [startX - 12, peakX - 12, endX - 12],
              y: [startY - 12, peakY - 12, endY - 12],
              scale: [0, 1.5, 1, 0], // Instantly vanish at impact
              opacity: [0, 1, 1, 0],
              rotate: [startRotation, midRotation, endRotation, endRotation]
            } : {}}
            transition={{
              duration: 0.7, // Slower flight
              delay: delay,
              ease: "easeInOut",
              scale: { duration: 0.7, delay, times: [0, 0.2, 0.99, 1] },
              opacity: { duration: 0.7, delay, times: [0, 0.1, 0.99, 1] },
              rotate: { duration: 0.7, delay, times: [0, 0.5, 0.99, 1] }
            }}
            className="absolute top-0 left-0"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
          >
            <MagnetArrow />
          </Motion.div>
        );
      })}
    </div>
  );
}
