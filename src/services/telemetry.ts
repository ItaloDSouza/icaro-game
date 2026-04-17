import type { TelemetryEvent, TelemetryEventType, TelemetrySession, ScreenName } from '../types/telemetry';

function generateId(): string {
  return crypto.randomUUID();
}

class TelemetryService {
  private session: TelemetrySession;

  constructor() {
    this.session = {
      sessionId: generateId(),
      startedAt: Date.now(),
      events: [],
    };
  }

  track(type: TelemetryEventType, screen: ScreenName, data?: Record<string, unknown>) {
    const event: TelemetryEvent = {
      type,
      screen,
      timestamp: Date.now(),
      data,
    };
    this.session.events.push(event);
  }

  getSession(): TelemetrySession {
    return this.session;
  }

  exportJSON(): string {
    return JSON.stringify(this.session, null, 2);
  }

  reset() {
    this.session = {
      sessionId: generateId(),
      startedAt: Date.now(),
      events: [],
    };
  }
}

export const telemetry = new TelemetryService();
