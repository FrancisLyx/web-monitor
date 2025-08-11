export interface LoggerConfig {
  appId: string;
  serverUrl: string;
  maxQueueSize?: number;
  flushInterval?: number;
  enableConsoleLog?: boolean;
  enableAutoTrack?: boolean;
}

export interface BaseEvent {
  eventType: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
  appId: string;
}

export interface ErrorEvent extends BaseEvent {
  eventType: 'error';
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  errorType: 'js' | 'promise' | 'resource';
}

export interface PageEvent extends BaseEvent {
  eventType: 'page';
  action: 'enter' | 'leave';
  referrer?: string;
  title: string;
  loadTime?: number;
}

export interface NetworkEvent extends BaseEvent {
  eventType: 'network';
  method: string;
  requestUrl: string;
  status: number;
  duration: number;
  requestSize?: number;
  responseSize?: number;
}

export interface PerformanceEvent extends BaseEvent {
  eventType: 'performance';
  metricType: 'timing' | 'navigation' | 'resource';
  metrics: Record<string, unknown>;
}

export interface CustomEvent extends BaseEvent {
  eventType: string; // Allow any string for custom events
  [key: string]: unknown; // Allow additional properties
}

export type LogEvent = ErrorEvent | PageEvent | NetworkEvent | PerformanceEvent | CustomEvent;

export interface QueueItem {
  event: LogEvent;
  retryCount: number;
  timestamp: number;
}

export interface TransmissionResult {
  success: boolean;
  error?: string;
}