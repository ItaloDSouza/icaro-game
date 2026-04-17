import { useState, useEffect, useCallback } from 'react';
import { telemetry } from '../services/telemetry';

interface FamilyMember {
  id: string;
  label: string;
  emoji: string;
  color: string;
  frequency: number;
}

const members: FamilyMember[] = [
  { id: 'papa', label: 'Papai', emoji: '👨', color: '#4a90d9', frequency: 180 },
  { id: 'mama', label: 'Mamãe', emoji: '👩', color: '#d94a8a', frequency: 280 },
  { id: 'icaro', label: 'Ícaro', emoji: '👦', color: '#4ad9a0', frequency: 350 },
];

function playVoiceSound(frequency: number) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(frequency * 1.2, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(frequency * 0.9, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.25);
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

export default function FamilyScreen() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    telemetry.track('screen_enter', 'family');
    return () => {
      telemetry.track('screen_exit', 'family');
    };
  }, []);

  const handleClick = useCallback((member: FamilyMember) => {
    setActiveId(member.id);
    playVoiceSound(member.frequency);
    telemetry.track('click', 'family', { target: member.id, label: member.label });
    telemetry.track('audio_play', 'family', { target: member.id });

    setTimeout(() => setActiveId(null), 600);
  }, []);

  return (
    <div style={styles.container}>
      {members.map((m) => (
        <button
          key={m.id}
          onClick={() => handleClick(m)}
          style={{
            ...styles.card,
            borderColor: activeId === m.id ? m.color : 'rgba(255,255,255,0.15)',
            boxShadow: activeId === m.id ? `0 0 30px ${m.color}60` : 'none',
            transform: activeId === m.id ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          <div style={{ ...styles.avatar, backgroundColor: `${m.color}30` }}>
            <span style={styles.emoji}>{m.emoji}</span>
          </div>
          <span style={{ ...styles.label, color: m.color }}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '2rem',
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
    gap: '1rem',
    padding: '1.5rem',
    borderRadius: '24px',
    border: '3px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    color: 'inherit',
    fontFamily: 'inherit',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: '3.5rem',
  },
  label: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
};
