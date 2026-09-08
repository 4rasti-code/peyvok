import React, { forwardRef, useImperativeHandle, memo, useEffect, useRef, useState } from 'react';

const chars = [
 'ئ', 'ا', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ', 'د', 'ر', 'ڕ', 'ز', 'ژ', 
 'س', 'ش', 'ع', 'غ', 'ف', 'ڤ', 'ق', 'ک', 'گ', 'ل', 'ڵ', 'م', 'ن', 'و', 
 'ۆ', 'وو', 'هـ', 'ە', 'ی', 'ێ'
];

const FloatingLetterBackground = forwardRef(({ baseOpacity = 0.7 }, ref) => {
 const canvasRef = useRef(null);
 
 // State for particles, initialized once
 const [particles] = useState(() => {
 return [...Array(34)].map((_, i) => ({
 id: i,
 char: chars[i % chars.length],
 baseX: 5 + Math.random() * 90, // Percentage 5-95
 baseY: 5 + Math.random() * 90, // Percentage 5-95
 delay: Math.random() * 20, // 0 to 20s
 duration: 45 + Math.random() * 30, // 45s to 75s
 
 // Physics state (offsets and spring logic)
 springX: 0,
 springY: 0,
 springRot: 0,
 springOpacity: baseOpacity,
 
 velX: 0,
 velY: 0,
 velRot: 0,
 velOpacity: 0,
 
 targetX: 0,
 targetY: 0,
 targetRot: 0,
 targetOpacity: baseOpacity,
 
 timeoutId: null
 }));
 });

 useImperativeHandle(ref, () => ({
 pulse: (px, py) => {
 particles.forEach(p => {
 // px, py are 0-1 relative coordinates
 const nx = p.baseX / 100;
 const ny = p.baseY / 100;

 const dx = nx - px;
 const dy = ny - py;
 const distance = Math.sqrt(dx * dx + dy * dy);

 if (distance < 0.4) {
 const force = (1 - distance / 0.4);

 // Flee vector in percentages
 const fleeX = (dx / distance) * force * 100;
 const fleeY = (dy / distance) * force * 100;
 const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);

 p.targetX = fleeX;
 p.targetY = fleeY;
 p.targetRot = targetAngle + 90;
 p.targetOpacity = 0.15;

 if (p.timeoutId) clearTimeout(p.timeoutId);
 p.timeoutId = setTimeout(() => {
 p.targetX = 0;
 p.targetY = 0;
 p.targetRot = 0;
 p.targetOpacity = baseOpacity;
 }, 1200 + Math.random() * 800);
 }
 });
 }
 }));

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d', { alpha: true });
 let animationFrameId;
 let lastTime = performance.now();

 const resize = () => {
 const dpr = window.devicePixelRatio || 1;
 canvas.width = window.innerWidth * dpr;
 canvas.height = window.innerHeight * dpr;
 canvas.style.width = `${window.innerWidth}px`;
 canvas.style.height = `${window.innerHeight}px`;
 ctx.scale(dpr, dpr);
 };

 window.addEventListener('resize', resize);
 resize();

 // Physics constants (Matches framer-motion stiffness: 15, damping: 40)
 const STIFFNESS = 15;
 const DAMPING = 40;

 const render = (time) => {
 // Delta time in seconds, capped at 0.05s to prevent physics explosions on lag
 const dt = Math.min((time - lastTime) / 1000, 0.05);
 lastTime = time;

 ctx.clearRect(0, 0, canvas.width, canvas.height);
 
 // Determine theme color
 const isDark = document.documentElement.classList.contains('dark');
 const textColor = isDark ? '241, 245, 249' : '15, 23, 42'; // mono-100 vs mono-900

 ctx.font = "bold 20px 'Rabar_029', sans-serif";
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.filter = 'blur(1px)';

 const w = window.innerWidth;
 const h = window.innerHeight;
 const timeSecs = time / 1000;

 particles.forEach(p => {
 // Physics integration (Sub-stepping for stability with high damping)
 const steps = 2;
 const subDt = dt / steps;
 for (let i = 0; i < steps; i++) {
 p.velX += (-STIFFNESS * (p.springX - p.targetX) - DAMPING * p.velX) * subDt;
 p.springX += p.velX * subDt;

 p.velY += (-STIFFNESS * (p.springY - p.targetY) - DAMPING * p.velY) * subDt;
 p.springY += p.velY * subDt;

 p.velRot += (-STIFFNESS * (p.springRot - p.targetRot) - DAMPING * p.velRot) * subDt;
 p.springRot += p.velRot * subDt;

 p.velOpacity += (-STIFFNESS * (p.springOpacity - p.targetOpacity) - DAMPING * p.velOpacity) * subDt;
 p.springOpacity += p.velOpacity * subDt;
 }

 // Drift Math (Approximating CSS keyframes with Lissajous curves)
 // t mapped to an oscillating progress 0 -> 1 -> 0
 const t = timeSecs + p.delay;
 const progress = (t / p.duration) % 2;
 const cycle = progress > 1 ? 2 - progress : progress;

 const driftX = Math.sin(cycle * Math.PI * 2) * 15;
 const driftY = Math.cos(cycle * Math.PI * 3) * 15;
 const driftRot = Math.sin(cycle * Math.PI * 2.5) * 4;

 // Final positions
 const x = (p.baseX + p.springX) * (w / 100) + driftX;
 const y = (p.baseY + p.springY) * (h / 100) + driftY;
 const rot = (p.springRot + driftRot) * (Math.PI / 180);

 ctx.save();
 ctx.translate(x, y);
 ctx.rotate(rot);
 
 // Clamp opacity safely between 0 and 1
 const finalOpacity = Math.max(0, Math.min(1, p.springOpacity));
 ctx.fillStyle = `rgba(${textColor}, ${finalOpacity})`;
 ctx.fillText(p.char, 0, 0);
 ctx.restore();
 });

 animationFrameId = requestAnimationFrame(render);
 };

 animationFrameId = requestAnimationFrame(render);

 return () => {
 window.removeEventListener('resize', resize);
 cancelAnimationFrame(animationFrameId);
 particles.forEach(p => { if (p.timeoutId) clearTimeout(p.timeoutId); });
 };
 }, [particles, baseOpacity]);

 return (
 <div className="absolute inset-0 pointer-events-none overflow-hidden z-[-1] bg-transparent transition-colors duration-500">
 <div className="absolute inset-0 bg-linear-to-b from-transparent via-mono-500/5 dark:via-white/5 to-transparent pointer-events-none" />
 <canvas 
 ref={canvasRef} 
 className="absolute inset-0 w-full h-full pointer-events-none"
 />
 </div>
 );
});

export default memo(FloatingLetterBackground);
