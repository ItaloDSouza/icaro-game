import { useRef, useEffect, useCallback } from 'react';
import { telemetry } from '../services/telemetry';

// --- Types ---
interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  drift: number;
  phase: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface FloatingObject {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  type: 'fish' | 'jellyfish' | 'starfish';
  direction: number;
  wobble: number;
}

// --- Factories ---
function makeBubble(w: number, h: number, origin?: { x: number; y: number }): Bubble {
  const r = 3 + Math.random() * 28;
  return {
    x: origin ? origin.x + (Math.random() - 0.5) * 60 : Math.random() * w,
    y: origin ? origin.y : h + r + Math.random() * 40,
    r,
    speed: 0.3 + Math.random() * 1.2,
    opacity: 0.15 + Math.random() * 0.5,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.008 + Math.random() * 0.025,
    wobbleAmp: 6 + Math.random() * 18,
  };
}

function makeParticle(w: number, h: number): Particle {
  const colors = [
    'rgba(180, 220, 255,',
    'rgba(100, 200, 255,',
    'rgba(200, 240, 255,',
    'rgba(150, 255, 200,',
    'rgba(255, 220, 150,',
  ];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1 + Math.random() * 3,
    speed: 0.1 + Math.random() * 0.3,
    opacity: 0.2 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 0.3,
    phase: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function makeFloatingObject(w: number, h: number): FloatingObject {
  const types: FloatingObject['type'][] = ['fish', 'jellyfish', 'starfish'];
  const type = types[Math.floor(Math.random() * types.length)];
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: direction > 0 ? -40 : w + 40,
    y: h * 0.4 + Math.random() * h * 0.5,
    size: 15 + Math.random() * 25,
    speed: 0.2 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    type,
    direction,
    wobble: 0,
  };
}

// --- Drawing helpers ---
function drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, dir: number, wobble: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  const bodyColor = `hsla(${30 + wobble * 20}, 80%, 60%, 0.7)`;
  const finColor = `hsla(${30 + wobble * 20}, 90%, 50%, 0.5)`;

  // body
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();

  // tail
  ctx.beginPath();
  ctx.moveTo(-size * 0.8, 0);
  ctx.lineTo(-size * 1.4, -size * 0.5 + Math.sin(wobble * 5) * 3);
  ctx.lineTo(-size * 1.4, size * 0.5 + Math.sin(wobble * 5) * 3);
  ctx.closePath();
  ctx.fillStyle = finColor;
  ctx.fill();

  // eye
  ctx.beginPath();
  ctx.arc(size * 0.4, -size * 0.1, size * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.43, -size * 0.1, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fill();

  ctx.restore();
}

function drawJellyfish(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, phase: number) {
  ctx.save();
  ctx.translate(x, y);

  const pulse = Math.sin(phase * 2) * 0.15;

  // dome
  ctx.beginPath();
  ctx.ellipse(0, 0, size * (1 + pulse), size * 0.7 * (1 - pulse * 0.5), 0, Math.PI, 0);
  ctx.fillStyle = 'rgba(180, 130, 255, 0.35)';
  ctx.fill();

  // inner glow
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.15, size * 0.5 * (1 + pulse), size * 0.35, 0, Math.PI, 0);
  ctx.fillStyle = 'rgba(220, 180, 255, 0.25)';
  ctx.fill();

  // tentacles
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size * 0.25, 0);
    const tentLen = size * (1.2 + Math.sin(phase + i) * 0.3);
    ctx.quadraticCurveTo(
      i * size * 0.25 + Math.sin(phase * 1.5 + i * 0.8) * 8,
      tentLen * 0.5,
      i * size * 0.2 + Math.sin(phase * 2 + i) * 12,
      tentLen
    );
    ctx.strokeStyle = 'rgba(180, 130, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function drawStarfish(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, phase: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(phase * 0.1);

  const spikes = 5;
  const outerR = size;
  const innerR = size * 0.45;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 160, 80, 0.5)';
  ctx.fill();

  // center dot
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 200, 120, 0.6)';
  ctx.fill();

  ctx.restore();
}

// --- Sound ---
function playBubbleSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const gain2 = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 + Math.random() * 300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150 + Math.random() * 100, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.03, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 600);
  } catch {
    // audio not available
  }
}

// --- Component ---
export default function MovementScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const floatersRef = useRef<FloatingObject[]>([]);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const boostRef = useRef(0);

  useEffect(() => {
    telemetry.track('screen_enter', 'movement');
    return () => {
      telemetry.track('screen_exit', 'movement');
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize
    const init = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 40+ bubbles
      bubblesRef.current = [];
      for (let i = 0; i < 45; i++) {
        const b = makeBubble(w, h);
        b.y = Math.random() * h;
        bubblesRef.current.push(b);
      }

      // 60+ particles
      particlesRef.current = [];
      for (let i = 0; i < 65; i++) {
        particlesRef.current.push(makeParticle(w, h));
      }

      // 3-4 floating creatures
      floatersRef.current = [];
      for (let i = 0; i < 4; i++) {
        const f = makeFloatingObject(w, h);
        f.x = Math.random() * w;
        floatersRef.current.push(f);
      }
    };
    init();

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;
      const boost = boostRef.current;
      const speedMult = 1 + boost * 3;

      // --- Background: deep ocean gradient ---
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#020b18');
      bg.addColorStop(0.3, '#061a35');
      bg.addColorStop(0.6, '#0a2a50');
      bg.addColorStop(1, '#0d3565');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // --- Light rays from top ---
      for (let i = 0; i < 5; i++) {
        const rx = w * (0.15 + i * 0.18) + Math.sin(t * 0.3 + i * 1.5) * 30;
        const rw = 40 + Math.sin(t * 0.2 + i) * 15;
        const grad = ctx.createLinearGradient(rx, 0, rx, h * 0.7);
        grad.addColorStop(0, `rgba(100, 180, 255, ${0.06 + Math.sin(t * 0.5 + i) * 0.02})`);
        grad.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(rx - rw, 0);
        ctx.lineTo(rx + rw, 0);
        ctx.lineTo(rx + rw * 2.5 + Math.sin(t * 0.4 + i) * 20, h * 0.7);
        ctx.lineTo(rx - rw * 1.5 + Math.sin(t * 0.4 + i) * 20, h * 0.7);
        ctx.closePath();
        ctx.fill();
      }

      // --- Floating particles (dust/plankton) ---
      for (const p of particlesRef.current) {
        p.y -= p.speed * speedMult;
        p.x += p.drift + Math.sin(p.phase + t) * 0.2;
        p.phase += 0.01;

        const flicker = 0.5 + Math.sin(t * 2 + p.phase * 10) * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.opacity * flicker})`;
        ctx.fill();

        if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
      }

      // --- Floating objects (fish, jellyfish, starfish) ---
      for (let i = floatersRef.current.length - 1; i >= 0; i--) {
        const f = floatersRef.current[i];
        f.x += f.speed * f.direction * speedMult;
        f.y += Math.sin(f.phase + t * 0.8) * 0.4;
        f.phase += 0.015;
        f.wobble += 0.02;

        if (f.type === 'fish') drawFish(ctx, f.x, f.y, f.size, f.direction, f.wobble);
        else if (f.type === 'jellyfish') drawJellyfish(ctx, f.x, f.y, f.size, f.phase + t);
        else drawStarfish(ctx, f.x, f.y, f.size, f.phase + t);

        // recycle when off screen
        if ((f.direction > 0 && f.x > w + 60) || (f.direction < 0 && f.x < -60)) {
          floatersRef.current[i] = makeFloatingObject(w, h);
        }
      }

      // --- Bubbles ---
      for (const b of bubblesRef.current) {
        b.y -= b.speed * speedMult;
        b.wobblePhase += b.wobbleSpeed;
        const wx = b.x + Math.sin(b.wobblePhase) * b.wobbleAmp;

        // bubble body (layered for glass effect)
        const grad = ctx.createRadialGradient(
          wx - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1,
          wx, b.y, b.r
        );
        grad.addColorStop(0, `rgba(200, 230, 255, ${b.opacity * 0.3})`);
        grad.addColorStop(0.5, `rgba(120, 190, 255, ${b.opacity * 0.15})`);
        grad.addColorStop(1, `rgba(80, 150, 255, ${b.opacity * 0.05})`);

        ctx.beginPath();
        ctx.arc(wx, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // rim
        ctx.beginPath();
        ctx.arc(wx, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(160, 210, 255, ${b.opacity * 0.25})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // highlight
        ctx.beginPath();
        ctx.ellipse(wx - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, b.r * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 250, 255, ${b.opacity * 0.7})`;
        ctx.fill();

        // second small highlight
        ctx.beginPath();
        ctx.arc(wx + b.r * 0.15, b.y + b.r * 0.2, b.r * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 240, 255, ${b.opacity * 0.4})`;
        ctx.fill();

        // recycle
        if (b.y + b.r < -10) {
          b.y = h + b.r + Math.random() * 30;
          b.x = Math.random() * w;
          b.r = 3 + Math.random() * 28;
        }
      }

      // --- Water surface (top area with waves) ---
      const surfaceY = h * 0.08;
      for (let layer = 0; layer < 3; layer++) {
        const amp = 4 + layer * 3 + boost * 6;
        const freq1 = 0.006 + layer * 0.003;
        const freq2 = 0.012 + layer * 0.002;
        const speed1 = t * (0.8 + layer * 0.3);
        const speed2 = t * (1.1 + layer * 0.2);
        const alpha = 0.08 - layer * 0.02;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let x = 0; x <= w; x += 3) {
          const y = surfaceY
            + Math.sin(x * freq1 + speed1) * amp
            + Math.sin(x * freq2 + speed2) * (amp * 0.6)
            + Math.sin(x * 0.003 + t * 0.5) * (amp * 0.3);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, 0);
        ctx.closePath();
        ctx.fillStyle = `rgba(60, 160, 220, ${alpha})`;
        ctx.fill();
      }

      // --- Bottom sand/sea floor ---
      const floorY = h * 0.92;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 5) {
        const y = floorY + Math.sin(x * 0.02 + 1.5) * 8 + Math.sin(x * 0.05) * 3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const sandGrad = ctx.createLinearGradient(0, floorY, 0, h);
      sandGrad.addColorStop(0, 'rgba(60, 90, 80, 0.4)');
      sandGrad.addColorStop(1, 'rgba(30, 50, 40, 0.6)');
      ctx.fillStyle = sandGrad;
      ctx.fill();

      // seaweed
      for (let i = 0; i < 8; i++) {
        const sx = w * (0.05 + i * 0.13);
        const sheight = 40 + Math.sin(i * 2.3) * 20;
        ctx.beginPath();
        ctx.moveTo(sx, floorY);
        ctx.quadraticCurveTo(
          sx + Math.sin(t * 1.2 + i * 1.7) * 15,
          floorY - sheight * 0.5,
          sx + Math.sin(t * 0.8 + i * 2.1) * 20,
          floorY - sheight
        );
        ctx.strokeStyle = `rgba(40, 140, 60, ${0.3 + Math.sin(t + i) * 0.1})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // --- Ripples ---
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += 2.5;
        r.opacity -= 0.012;

        if (r.opacity <= 0) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 220, 255, ${r.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // inner ring
        if (r.radius > 15) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 230, 255, ${r.opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // --- Caustic light pattern on "floor" ---
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 6; i++) {
        const cx = w * (0.1 + i * 0.17) + Math.sin(t * 0.6 + i * 2) * 40;
        const cy = h * 0.85 + Math.sin(t * 0.4 + i * 1.3) * 10;
        const cr = 30 + Math.sin(t * 0.8 + i) * 10;
        const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cGrad.addColorStop(0, `rgba(80, 180, 220, ${0.08 + Math.sin(t + i * 1.5) * 0.03})`);
        cGrad.addColorStop(1, 'rgba(80, 180, 220, 0)');
        ctx.fillStyle = cGrad;
        ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
      }
      ctx.globalCompositeOperation = 'source-over';

      // --- Decay boost ---
      if (boostRef.current > 0) {
        boostRef.current = Math.max(0, boostRef.current - 0.003);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // spawn 6-8 bubbles in burst
    const count = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      bubblesRef.current.push(makeBubble(canvas.width, canvas.height, { x, y }));
    }

    // ripple effect
    ripplesRef.current.push({
      x, y,
      radius: 5,
      maxRadius: 80 + Math.random() * 40,
      opacity: 0.6,
    });

    // boost
    boostRef.current = Math.min(1, boostRef.current + 0.25);

    playBubbleSound();
    telemetry.track('click', 'movement', { x, y, target: 'canvas' });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
    />
  );
}
