export {
	createWebMonitor,
	destroyWebMonitorInstance,
	getWebMonitorConfig,
	getWebMonitorInstance,
	recreateWebMonitorInstance,
	WebMonitor
} from './src/index'
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
// export { ErrorTracker } from './src/plugin/error'
// export { NetworkTracker } from './src/plugin/network'
// export { PageTracker } from './src/plugin/page'
// export { PerformanceTracker } from './src/plugin/performance'
// export { EventQueue } from './src/plugin/queue'
// export { Transmitter } from './src/plugin/transmitter'
