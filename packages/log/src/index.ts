export type {
	BaseEvent,
	CustomEvent,
	ErrorEvent,
	LogEvent,
	LoggerConfig,
	NetworkEvent,
	PageEvent,
	PerformanceEvent,
	QueueItem,
	TransmissionResult
} from '../types/types'
export { createWebMonitor, WebMonitor } from './web-monitor'

// Re-export individual components for advanced usage
export { ErrorTracker } from './error-tracker'
export { NetworkTracker } from './network-tracker'
export { PageTracker } from './page-tracker'
export { PerformanceTracker } from './performance-tracker'
export { EventQueue } from './queue'
export { Transmitter } from './transmitter'