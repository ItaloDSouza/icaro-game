import { useState, useEffect, useCallback } from 'react';
import { telemetry } from '../services/telemetry';

type Feedback = 'none' | 'correct' | 'redirect';

function playPositiveSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 700);
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
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
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

  useEffect(() => {
    telemetry.track('screen_enter', 'bathroom');
    return () => {
      telemetry.track('screen_exit', 'bathroom');
    };
  }, []);

  const handleToilet = useCallback(() => {
    setFeedback('correct');
    playPositiveSound();
    telemetry.track('choice_selected', 'bathroom', { choice: 'toilet', correct: true });
    setTimeout(() => setFeedback('none'), 2000);
  }, []);

  const handleShower = useCallback(() => {
    setFeedback('redirect');
    playRedirectSound();
    telemetry.track('choice_selected', 'bathroom', { choice: 'shower', correct: false });
    setTimeout(() => setFeedback('none'), 2000);
  }, []);

  return (
    <div style={styles.container}>
      {feedback === 'correct' && (
        <div style={styles.overlay}>
          <span style={styles.feedbackEmoji}>⭐</span>
          <span style={styles.feedbackText}>Muito bem!</span>
        </div>
      )}
      {feedback === 'redirect' && (
        <div style={styles.overlayRedirect}>
          <span style={styles.feedbackEmoji}>🚽</span>
          <span style={styles.feedbackTextRedirect}>Tenta o vaso!</span>
        </div>
      )}
      <div style={styles.choices}>
        <button onClick={handleToilet} style={styles.choiceBtn}>
          <span style={styles.choiceEmoji}>🚽</span>
          <span style={styles.choiceLabel}>Vaso</span>
        </button>
        <button onClick={handleShower} style={styles.choiceBtn}>
          <span style={styles.choiceEmoji}>🚿</span>
          <span style={styles.choiceLabel}>Box</span>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  choices: {
    display: 'flex',
    gap: '3rem',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem',
    borderRadius: '24px',
    border: '3px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    color: '#fff',
    fontFamily: 'inherit',
  },
  choiceEmoji: {
    fontSize: '4rem',
  },
  choiceLabel: {
    fontSize: '1.3rem',
    fontWeight: 600,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(40, 180, 80, 0.25)',
    zIndex: 10,
    animation: 'fadeIn 0.2s ease',
    gap: '1rem',
  },
  overlayRedirect: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(60, 100, 180, 0.2)',
    zIndex: 10,
    animation: 'fadeIn 0.2s ease',
    gap: '1rem',
  },
  feedbackEmoji: {
    fontSize: '5rem',
  },
  feedbackText: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#4ade80',
  },
  feedbackTextRedirect: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#93c5fd',
  },
};
