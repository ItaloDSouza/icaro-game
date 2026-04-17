import { useState, useEffect, useCallback } from 'react';
import { telemetry } from '../services/telemetry';
import type { ScreenName } from '../types/telemetry';

export default function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // refresh data every second while visible
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleExport = useCallback(() => {
    const json = telemetry.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icaro-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (!visible) return null;

  const session = telemetry.getSession();
  const events = session.events;
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;

  const screens: ScreenName[] = ['movement', 'family', 'bathroom'];
  const stats = screens.map((screen) => {
    const screenEvents = events.filter((e) => e.screen === screen);
    const clicks = screenEvents.filter((e) => e.type === 'click').length;
    const choices = screenEvents.filter((e) => e.type === 'choice_selected').length;

    const enters = screenEvents.filter((e) => e.type === 'screen_enter');
    const exits = screenEvents.filter((e) => e.type === 'screen_exit');
    let totalTime = 0;
    for (let i = 0; i < enters.length; i++) {
      const exit = exits[i];
      if (exit) {
        totalTime += exit.timestamp - enters[i].timestamp;
      } else {
        totalTime += Date.now() - enters[i].timestamp;
      }
    }

    return { screen, clicks, choices, totalTime };
  });

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <strong>Debug</strong>
        <span style={styles.sessionId}>{session.sessionId.slice(0, 8)}</span>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Tela</th>
            <th style={styles.th}>Tempo</th>
            <th style={styles.th}>Cliques</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.screen}>
              <td style={styles.td}>{s.screen}</td>
              <td style={styles.td}>{(s.totalTime / 1000).toFixed(1)}s</td>
              <td style={styles.td}>{s.clicks + s.choices}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lastEvent && (
        <div style={styles.lastEvent}>
          Último: <strong>{lastEvent.type}</strong> em {lastEvent.screen}
        </div>
      )}
      <div style={styles.total}>
        Total eventos: {events.length}
      </div>
      <button onClick={handleExport} style={styles.exportBtn}>
        Exportar JSON
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.85)',
    color: '#e0e0e0',
    padding: '12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 9999,
    minWidth: '220px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
  },
  sessionId: {
    color: '#888',
    fontSize: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '8px',
  },
  th: {
    textAlign: 'left',
    padding: '2px 6px',
    borderBottom: '1px solid #333',
    fontSize: '11px',
    color: '#999',
  },
  td: {
    padding: '2px 6px',
    fontSize: '11px',
  },
  lastEvent: {
    marginBottom: '4px',
    fontSize: '11px',
    color: '#aaa',
  },
  total: {
    marginBottom: '8px',
    fontSize: '11px',
    color: '#aaa',
  },
  exportBtn: {
    width: '100%',
    padding: '6px',
    border: '1px solid #555',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
};
