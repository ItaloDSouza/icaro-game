import { useRef, useState, useEffect, useCallback } from 'react';
import { telemetry } from '../services/telemetry';

interface FamilyMember {
  id: string;
  label: string;
  emoji: string;
  color: string;
  glowColor: string;
  frequency: number;
}

const members: FamilyMember[] = [
  { id: 'papa', label: 'Papai', emoji: '👨', color: '#4a90d9', glowColor: '74, 144, 217', frequency: 180 },
  { id: 'mama', label: 'Mamãe', emoji: '👩', color: '#d94a8a', glowColor: '217, 74, 138', frequency: 280 },
  { id: 'icaro', label: 'Ícaro', emoji: '👦', color: '#4ad9a0', glowColor: '74, 217, 160', frequency: 350 },
];

// floating particles behind cards
interface FloatParticle {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  hue: number;
}

function playVoiceSound(frequency: number) {
  try {
    const ctx = new AudioContext();

    // warm tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(frequency * 1.15, ctx.currentTime + 0.12);
    osc1.frequency.linearRampToValueAtTime(frequency * 0.95, ctx.currentTime + 0.5);
    gain1.gain.setValueAtTime(0.1, ctx.currentTime);
    gain1.gain.setValueAtTime(0.1, ctx.currentTime + 0.3);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.4);
    gain2.gain.setValueAtTime(0.04, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 800);
  } catch {
    // audio not available
  }
}

export default function FamilyScreen() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FloatParticle[]>([]);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const burstRef = useRef<{ x: number; y: number; color: string; time: number } | null>(null);

  useEffect(() => {
    telemetry.track('screen_enter', 'family');
    return () => {
      telemetry.track('screen_exit', 'family');
    };
  }, []);

  // background canvas animation
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

    // init particles
    particlesRef.current = [];
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1 + Math.random() * 3,
        speed: 0.15 + Math.random() * 0.3,
        opacity: 0.1 + Math.random() * 0.3,
        hue: Math.random() * 360,
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;

      // background
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, '#0f1a2e');
      bg.addColorStop(1, '#060d1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // subtle flowing aurora
      for (let i = 0; i < 3; i++) {
        const ax = w * 0.5 + Math.sin(t * 0.3 + i * 2) * w * 0.3;
        const ay = h * 0.4 + Math.cos(t * 0.2 + i * 1.5) * h * 0.2;
        const ar = 150 + Math.sin(t * 0.5 + i) * 50;
        const aGrad = ctx.createRadialGradient(ax, ay, 0, ax, ay, ar);
        const hue = (200 + i * 60 + t * 10) % 360;
        aGrad.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.04)`);
        aGrad.addColorStop(1, `hsla(${hue}, 70%, 50%, 0)`);
        ctx.fillStyle = aGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // floating particles
      for (const p of particlesRef.current) {
        p.y -= p.speed;
        p.x += Math.sin(t + p.hue) * 0.2;
        const flicker = 0.5 + Math.sin(t * 3 + p.hue * 0.1) * 0.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.opacity * flicker})`;
        ctx.fill();

        if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }
      }

      // click burst effect
      if (burstRef.current) {
        const b = burstRef.current;
        const age = t - b.time;
        if (age < 1.5) {
          const progress = age / 1.5;
          const numRings = 3;
          for (let i = 0; i < numRings; i++) {
            const ringProgress = Math.max(0, progress - i * 0.15);
            const radius = ringProgress * 120;
            const alpha = Math.max(0, 0.4 - ringProgress * 0.4);
            ctx.beginPath();
            ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${b.color}, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // sparkles
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dist = progress * 80;
            const sx = b.x + Math.cos(angle + progress) * dist;
            const sy = b.y + Math.sin(angle + progress) * dist;
            const salpha = Math.max(0, 0.6 - progress * 0.6);
            ctx.beginPath();
            ctx.arc(sx, sy, 2 + (1 - progress) * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${b.color}, ${salpha})`;
            ctx.fill();
          }
        } else {
          burstRef.current = null;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleClick = useCallback((member: FamilyMember, e: React.MouseEvent) => {
    setActiveId(member.id);
    playVoiceSound(member.frequency);

    // burst at card center
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      burstRef.current = {
        x: rect.left + rect.width / 2 - canvasRect.left,
        y: rect.top + rect.height / 2 - canvasRect.top,
        color: member.glowColor,
        time: timeRef.current,
      };
    }

    telemetry.track('click', 'family', { target: member.id });
    telemetry.track('audio_play', 'family', { target: member.id });

    setTimeout(() => setActiveId(null), 800);
  }, []);

  return (
    <div style={styles.wrapper}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.container}>
        {members.map((m) => {
          const isActive = activeId === m.id;
          return (
            <button
              key={m.id}
              onClick={(e) => handleClick(m, e)}
              style={{
                ...styles.card,
                borderColor: isActive ? m.color : 'rgba(255,255,255,0.1)',
                boxShadow: isActive
                  ? `0 0 40px rgba(${m.glowColor}, 0.4), 0 0 80px rgba(${m.glowColor}, 0.2), inset 0 0 30px rgba(${m.glowColor}, 0.1)`
                  : '0 4px 20px rgba(0,0,0,0.3)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <div
                style={{
                  ...styles.avatarRing,
                  borderColor: isActive ? m.color : 'rgba(255,255,255,0.15)',
                  boxShadow: isActive ? `0 0 20px rgba(${m.glowColor}, 0.5)` : 'none',
                }}
              >
                <div style={{ ...styles.avatar, backgroundColor: `rgba(${m.glowColor}, 0.15)` }}>
                  <span style={styles.emoji}>{m.emoji}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  container: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    gap: '2.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: '2rem',
    flexWrap: 'wrap',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    borderRadius: '28px',
    border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(8px)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    outline: 'none',
    color: 'inherit',
    fontFamily: 'inherit',
  },
  avatarRing: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  avatar: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: '4rem',
  },
};
