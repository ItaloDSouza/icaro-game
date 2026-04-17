export type TelemetryEventType =
  | 'screen_enter'
  | 'screen_exit'
  | 'click'
  | 'choice_selected'
  | 'audio_play';

export type ScreenName = 'movement' | 'family' | 'bathroom';

export interface TelemetryEvent {
  type: TelemetryEventType;
  screen: ScreenName;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface TelemetrySession {
  sessionId: string;
  startedAt: number;
  events: TelemetryEvent[];
}
