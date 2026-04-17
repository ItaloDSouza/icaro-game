import { useRef, useState, useEffect, useCallback } from 'react';
import { telemetry } from '../services/telemetry';

type Feedback = 'none' | 'correct' | 'redirect';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
}

function playPositiveSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.12 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // audio not available
  }
}

function playRedirectSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // audio not available
  }
}

export default function BathroomScreen() {
  const [feedback, setFeedback] = useState<Feedback>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const feedbackRef = useRef<Feedback>('none');
  const timeRef = useRef(0);
  const toiletPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  useEffect(() => {
    telemetry.track('screen_enter', 'bathroom');
    return () => {
      telemetry.track('screen_exit', 'bathroom');
    };
  }, []);

  // background animation
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

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;
      const fb = feedbackRef.current;

      // background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      if (fb === 'correct') {
        const pulse = 0.5 + Math.sin(t * 4) * 0.1;
        bg.addColorStop(0, `rgba(10, 40, 20, ${pulse})`);
        bg.addColorStop(1, `rgba(5, 25, 15, ${pulse + 0.3})`);
      } else {
        bg.addColorStop(0, '#0f1520');
        bg.addColorStop(1, '#0a1018');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // ambient particles
      for (let i = 0; i < 20; i++) {
        const px = (w * 0.1 + i * w * 0.045 + Math.sin(t * 0.5 + i * 1.3) * 20) % w;
        const py = (h * 0.1 + i * h * 0.06 + Math.cos(t * 0.3 + i * 0.9) * 15) % h;
        const pr = 1 + Math.sin(t * 2 + i * 2.7) * 0.5;
        const palpha = 0.1 + Math.sin(t * 1.5 + i) * 0.05;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 200, 255, ${palpha})`;
        ctx.fill();
      }

      // stars celebration (on correct)
      if (fb === 'correct') {
        // spawn stars
        if (starsRef.current.length < 30) {
          starsRef.current.push({
            x: Math.random() * w,
            y: h + 20,
            size: 8 + Math.random() * 16,
            speed: 1.5 + Math.random() * 2,
            opacity: 0.7 + Math.random() * 0.3,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.1,
          });
        }
      }

      // draw & update stars
      for (let i = starsRef.current.length - 1; i >= 0; i--) {
        const s = starsRef.current[i];
        s.y -= s.speed;
        s.rotation += s.rotSpeed;
        s.opacity -= 0.003;

        if (s.opacity <= 0 || s.y < -20) {
          starsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        // draw star shape
        const spikes = 5;
        const outerR = s.size;
        const innerR = s.size * 0.45;
        ctx.beginPath();
        for (let j = 0; j < spikes * 2; j++) {
          const r = j % 2 === 0 ? outerR : innerR;
          const angle = (j * Math.PI) / spikes - Math.PI / 2;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 220, 60, ${s.opacity})`;
        ctx.fill();

        // glow
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s.size * 1.5);
        glow.addColorStop(0, `rgba(255, 220, 60, ${s.opacity * 0.3})`);
        glow.addColorStop(1, 'rgba(255, 220, 60, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(-s.size * 1.5, -s.size * 1.5, s.size * 3, s.size * 3);

        ctx.restore();
      }

      // redirect arrow pointing to toilet
      if (fb === 'redirect') {
        const tp = toiletPosRef.current;
        if (tp.x > 0) {
          const arrowBob = Math.sin(t * 4) * 8;
          const ax = tp.x;
          const ay = tp.y - 80 + arrowBob;
          const arrowAlpha = 0.4 + Math.sin(t * 3) * 0.2;

          // pulsing glow around toilet area
          const glowR = 70 + Math.sin(t * 3) * 10;
          const tGlow = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, glowR);
          tGlow.addColorStop(0, `rgba(100, 200, 255, ${arrowAlpha * 0.15})`);
          tGlow.addColorStop(1, 'rgba(100, 200, 255, 0)');
          ctx.fillStyle = tGlow;
          ctx.fillRect(tp.x - glowR, tp.y - glowR, glowR * 2, glowR * 2);

          // arrow
          ctx.save();
          ctx.translate(ax, ay);
          ctx.beginPath();
          ctx.moveTo(0, 15);
          ctx.lineTo(-12, -5);
          ctx.lineTo(-5, -5);
          ctx.lineTo(-5, -20);
          ctx.lineTo(5, -20);
          ctx.lineTo(5, -5);
          ctx.lineTo(12, -5);
          ctx.closePath();
          ctx.fillStyle = `rgba(100, 200, 255, ${arrowAlpha})`;
          ctx.fill();
          ctx.restore();
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

  const handleToilet = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvas = canvasRef.current;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      toiletPosRef.current = {
        x: rect.left + rect.width / 2 - cr.left,
        y: rect.top + rect.height / 2 - cr.top,
      };
    }
    setFeedback('correct');
    starsRef.current = [];
    playPositiveSound();
    telemetry.track('choice_selected', 'bathroom', { choice: 'toilet', correct: true });
    setTimeout(() => setFeedback('none'), 3000);
  }, []);

  const handleShower = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvas = canvasRef.current;
    if (canvas) {
      const cr = canvas.getBoundingClientRect();
      // point arrow at where toilet button is (left side)
      // we need to know toilet position - approximate it
      toiletPosRef.current = {
        x: cr.width * 0.35,
        y: rect.top + rect.height / 2 - cr.top,
      };
    }
    setFeedback('redirect');
    playRedirectSound();
    telemetry.track('choice_selected', 'bathroom', { choice: 'shower', correct: false });
    setTimeout(() => setFeedback('none'), 2500);
  }, []);

  return (
    <div style={styles.wrapper}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.container}>
        <button
          onClick={handleToilet}
          style={{
            ...styles.choiceBtn,
            borderColor: feedback === 'correct' ? '#4ade80' : 'rgba(255,255,255,0.1)',
            boxShadow: feedback === 'correct'
              ? '0 0 40px rgba(74, 222, 128, 0.4), 0 0 80px rgba(74, 222, 128, 0.15)'
              : '0 4px 20px rgba(0,0,0,0.3)',
            transform: feedback === 'correct' ? 'scale(1.12)' : 'scale(1)',
          }}
        >
          <span style={styles.choiceEmoji}>🚽</span>
        </button>
        <button
          onClick={handleShower}
          style={{
            ...styles.choiceBtn,
            borderColor: feedback === 'redirect' ? 'rgba(100, 200, 255, 0.3)' : 'rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            opacity: feedback === 'redirect' ? 0.5 : 1,
            transform: feedback === 'redirect' ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          <span style={styles.choiceEmoji}>🚿</span>
        </button>
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
    gap: '4rem',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: '2rem',
  },
  choiceBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '180px',
    height: '180px',
    borderRadius: '32px',
    border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(8px)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    outline: 'none',
  },
  choiceEmoji: {
    fontSize: '5rem',
  },
};
