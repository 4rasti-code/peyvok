import React, { useMemo, useEffect, useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { motion, useSpring, useMotionValue, useTransform, animate, useMotionValueEvent } from 'framer-motion';

const FloatingLetter = memo(({ char, initialX, initialY, pulseMV }) => {
  // Movement springs - Low stiffness, High damping for "liquid" feel
  const springConfig = { damping: 40, stiffness: 15 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);
  const rotate = useSpring(0, springConfig);
  const opacity = useSpring(0.08, springConfig);

  // Pulse (Fish Reaction) Logic via MotionValue Subscription
  useMotionValueEvent(pulseMV, "change", (latest) => {
    if (!latest) return;

    // Relative coordinates
    const nx = initialX / 100;
    const ny = initialY / 100;

    const dx = nx - latest.x;
    const dy = ny - latest.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If within interaction range
    if (distance < 0.4) {
      const force = (1 - distance / 0.4);

      // Calculate flee vector
      const fleeX = (dx / distance) * force * 100;
      const fleeY = (dy / distance) * force * 100;

      // Calculate rotation - "face" away from the click
      const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Trigger Flee Animation
      x.set(fleeX);
      y.set(fleeY);
      rotate.set(targetAngle + 90);
      opacity.set(0.08);

      // Smoothly return
      setTimeout(() => {
        x.set(0);
        y.set(0);
        rotate.set(0);
        opacity.set(0.08);
      }, 1200 + Math.random() * 800);
    }
  });

  // Unique animation delay for organic feel
  const delay = useMemo(() => `${Math.random() * -20}s`, []);
  const duration = useMemo(() => `${45 + Math.random() * 30}s`, []);

  return (
    <motion.div
      className="absolute text-mono-900/10 dark:text-mono-100/10 font-bold text-[16px] select-none font-rabar pointer-events-none transition-opacity duration-1000"
      style={{
        left: `${initialX}%`,
        top: `${initialY}%`,
        x,
        y,
        rotate,
        opacity,
        animation: `drift ${duration} ease-in-out ${delay} infinite alternate`
      }}
    >
      {char}
    </motion.div>
  );
});

const FloatingLetterBackground = forwardRef((props, ref) => {
  const pulseMV = useMotionValue(null);
  const chars = ['ط¦ط§', 'ط¨', 'ظ¾', 'طھ', 'ط¬', 'ط¯', 'ع•', 'ط²', 'ع¤', 'عµ', 'غ†', 'غژ', 'ع¯', 'ع†', 'عک', 'ظ‡ظ€'];

  // Reduce count to 20 for better performance on mobile/low-end devices
  const letters = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      char: chars[i % chars.length],
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90
    }));
  }, []);

  useImperativeHandle(ref, () => ({
    pulse: (px, py) => {
      pulseMV.set({ x: px, y: py, t: Date.now() });
    }
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5] bg-white dark:bg-black transition-colors duration-500">
      <style>
        {`
          @keyframes drift {
            0% { transform: translate(0px, 0px) rotate(0deg); }
            33% { transform: translate(15px, -10px) rotate(4deg); }
            66% { transform: translate(-10px, 15px) rotate(-4deg); }
            100% { transform: translate(5px, 5px) rotate(2deg); }
          }
        `}
      </style>
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-mono-500/5 dark:via-white/5 to-transparent pointer-none" />

      {letters.map((letter) => (
        <FloatingLetter
          key={letter.id}
          char={letter.char}
          initialX={letter.x}
          initialY={letter.y}
          pulseMV={pulseMV}
        />
      ))}
    </div>
  );
});

export default memo(FloatingLetterBackground);
