import React, { useEffect, useRef } from 'react';
import { FilsIcon, DerhemIcon, DinarIcon, HintIcon, MagnetIcon, SkipIcon, XPIcon, SpinTicketIcon } from './CurrencyIcon';
import MysteryBoxIcon from './MysteryBoxIcon';
import { playCoinSfx, playMagnetSfx, playPopSfx, playSuccessSfx } from '../utils/audio';

const CanvasParticleOverlay = () => {
  const canvasRef = useRef(null);
  const hiddenSpritesRef = useRef(null);
  const particlesRef = useRef([]);
  const spriteCache = useRef({});
  const animationFrameRef = useRef(null);

  // 1. Convert SVG DOM nodes into cached Canvas Images
  useEffect(() => {
    if (!hiddenSpritesRef.current) return;

    // We get all the child nodes of the hidden div
    const children = Array.from(hiddenSpritesRef.current.children);

    children.forEach(child => {
      const type = child.getAttribute('data-type');
      if (!type) return;

      // Coins now use external images inside their SVG, which fails Canvas serialization.
      // Load them directly instead.
      if (['fils', 'derhem', 'dinar'].includes(type)) {
        const img = new Image();
        img.onload = () => {
          spriteCache.current[type] = img;
        };
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
        img.src = `/icons/${capitalizedType}Icon.svg`;
        return;
      }

      // Extract the SVG element. If it's wrapped in a div, find the svg.
      const svgElement = child.tagName === 'SVG' ? child : child.querySelector('svg');
      if (!svgElement) return;

      // Clone and clean up for static rendering
      const clone = svgElement.cloneNode(true);
      clone.removeAttribute('data-type');
      clone.setAttribute('width', '44');
      clone.setAttribute('height', '44');

      // Convert to Blob URL
      const svgString = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        spriteCache.current[type] = img;
        URL.revokeObjectURL(url); // Clean up memory
      };
      img.src = url;
    });
  }, []);

  // 2. Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let lastTime = performance.now();

    const render = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const activeParticles = [];

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // --- COIN PHYSICS (Target-Seeking) ---
        if (p.category === 'coin') {
          if (p.delay > 0) {
            p.delay -= dt;
            activeParticles.push(p);
            continue;
          }

          // Trigger audio exactly once when delay finishes
          if (!p.audioPlayed) {
            p.audioPlayed = true;
            if (p.type === 'magnet') playMagnetSfx();
            else if (['hint', 'skip', 'spinTicket'].includes(p.type)) playPopSfx();
            else if (p.type === 'xp') playSuccessSfx();
            else playCoinSfx();
          }

          // Simple ease-in interpolation to target
          p.progress += dt * 1.2; // Speed multiplier

          if (p.progress >= 1) {
            p.progress = 1;
            // Bump logic executed once on impact
            if (!p.hitPlayed) {
              p.hitPlayed = true;
              let elementId = `topbar-${p.type}`;
              if (p.type === 'spinTicket') elementId = `nav-lucky-wheel`;
              else if (p.type === 'mystery_box') elementId = `nav-store`;
              else if (p.type === 'xp') elementId = `xp-progress`;

              const targetEl = document.getElementById(elementId);
              if (targetEl) {
                targetEl.classList.remove('animate-wheel-bump');
                void targetEl.offsetWidth;
                targetEl.classList.add('animate-wheel-bump');
                setTimeout(() => targetEl.classList.remove('animate-wheel-bump'), 500);
              }
              window.dispatchEvent(new CustomEvent('reward-coin-hit', { detail: { type: p.type } }));
            }
          } else {
            // Cubic bezier ease-in path
            const ease = p.progress * p.progress * p.progress;
            p.x = p.startX + (p.targetX - p.startX) * ease;
            p.y = p.startY + (p.targetY - p.startY) * ease;

            // Draw Sprite
            const img = spriteCache.current[p.type];
            if (img) {
              ctx.drawImage(img, p.x - 22, p.y - 22, 44, 44);
            }
            activeParticles.push(p);
          }
        }

        // --- CONFETTI PHYSICS (Gravity/Explosion) ---
        else if (p.category === 'confetti') {
          p.velocity *= 0.98; // Air resistance
          p.x += Math.cos(p.angle) * p.velocity * dt;
          p.y += Math.sin(p.angle) * p.velocity * dt + (300 * dt); // Gravity (300px/s^2)
          p.rot += 360 * p.dir * dt;

          p.life -= dt;

          if (p.life > 0) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);

            // Fade out in last 0.5s
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
            ctx.fillStyle = p.color;

            // Shadow for depth matching the old dropshadow
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 4;

            if (p.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }

            ctx.restore();
            activeParticles.push(p);
          }
        }
      }

      particlesRef.current = activeParticles;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 3. Event Listeners
  useEffect(() => {
    const handleFireCoins = (e) => {
      const { type = 'fils', amount = 0, startOffsetX = 0, startOffsetY = 0 } = e.detail;

      let length = 10;
      if (['hint', 'magnet', 'skip', 'spinTicket', 'mystery_box'].includes(type)) {
        length = amount > 0 ? amount : 1;
      } else if (type === 'xp') {
        length = 10;
      }

      // Find Target Position
      let elementId = `topbar-${type}`;
      if (type === 'spinTicket') elementId = `nav-lucky-wheel`;
      else if (type === 'mystery_box') elementId = `nav-store`;
      else if (type === 'xp') elementId = `xp-progress`;

      const targetEl = document.getElementById(elementId);
      let targetX = window.innerWidth * 0.42;
      let targetY = -window.innerHeight * 0.46;

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;

        if (type === 'spinTicket') {
          targetY -= 25;
          targetX -= 15;
        }
      }

      const cx = window.innerWidth / 2 + startOffsetX;
      const cy = window.innerHeight / 2 + startOffsetY;

      for (let i = 0; i < length; i++) {
        particlesRef.current.push({
          category: 'coin',
          type,
          startX: cx + (Math.random() * 40 - 20),
          startY: cy + (Math.random() * 40 - 20),
          targetX,
          targetY,
          x: cx,
          y: cy,
          delay: i * 0.15, // Stagger
          progress: 0,
          audioPlayed: false,
          hitPlayed: false
        });
      }
    };

    const handleFireConfetti = (e) => {
      const options = e.detail || {};
      const colors = options.colors || ['#FFD700', '#ffffff', '#3b82f6', '#facc15'];
      const count = options.particleCount || 40;

      const originX = options.origin?.x ? options.origin.x * window.innerWidth : window.innerWidth / 2;
      const originY = options.origin?.y ? options.origin.y * window.innerHeight : window.innerHeight / 2;

      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          category: 'confetti',
          x: originX,
          y: originY,
          angle: Math.random() * Math.PI * 2,
          velocity: 200 + Math.random() * 400, // Matches old Framer velocity
          size: 6 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * 360,
          dir: Math.random() > 0.5 ? 1 : -1,
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          life: 2.5 // 2.5 seconds max life
        });
      }
    };

    window.addEventListener('fire-coins', handleFireCoins);
    window.addEventListener('fire-confetti', handleFireConfetti);
    return () => {
      window.removeEventListener('fire-coins', handleFireCoins);
      window.removeEventListener('fire-confetti', handleFireConfetti);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-9999"
      />
      {/* Hidden Sprite Definitions - Used to render SVGs into Canvas Images exactly as they appear in React */}
      <div ref={hiddenSpritesRef} className="absolute opacity-0 pointer-events-none overflow-hidden w-0 h-0">
        <div data-type="fils"><FilsIcon size={44} /></div>
        <div data-type="derhem"><DerhemIcon size={44} /></div>
        <div data-type="dinar"><DinarIcon size={44} /></div>
        <div data-type="hint"><HintIcon size={44} /></div>
        <div data-type="magnet"><MagnetIcon size={44} /></div>
        <div data-type="skip"><SkipIcon size={44} /></div>
        <div data-type="xp"><XPIcon size={44} /></div>
        <div data-type="spinTicket"><SpinTicketIcon size={44} /></div>
        <div data-type="mystery_box"><MysteryBoxIcon asSvg={true} size={44} /></div>
      </div>
    </>
  );
};

export default CanvasParticleOverlay;
