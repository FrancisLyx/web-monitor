export { createWebMonitor, WebMonitor } from './src/web-monitor'
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
} from './types/types'

// Re-export individual components for advanced usage
export { ErrorTracker } from './src/error-tracker'
// export { NetworkTracker } from './src/network-tracker'
// export { PageTracker } from './src/page-tracker'
// export { PerformanceTracker } from './src/performance-tracker'
// export { EventQueue } from './src/queue'
// export { Transmitter } from './src/transmitter'
