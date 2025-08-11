import { LogEvent, LoggerConfig } from '../types/types'
import { ErrorTracker } from './error-tracker'
import { NetworkTracker } from './network-tracker'
import { PageTracker } from './page-tracker'
import { PerformanceTracker } from './performance-tracker'
import { EventQueue } from './queue'
import { Transmitter } from './transmitter'

export class WebMonitor {
	private config: Required<LoggerConfig>
	private queue: EventQueue
	private transmitter: Transmitter
	private errorTracker?: ErrorTracker
	private pageTracker?: PageTracker
	private networkTracker?: NetworkTracker
	private performanceTracker?: PerformanceTracker
	private sessionId: string
	private userId?: string
	private flushTimer?: number
	private isInitialized = false

	constructor(config: LoggerConfig) {
		this.config = {
			maxQueueSize: 100,
			flushInterval: 10000, // 10 seconds
			enableConsoleLog: false,
			enableAutoTrack: true,
			...config
		}

		this.sessionId = this.generateSessionId()
		this.queue = new EventQueue(this.config.maxQueueSize)
		this.transmitter = new Transmitter(this.config.serverUrl)
	}

	init(): WebMonitor {
		if (this.isInitialized) {
			console.warn('WebMonitor already initialized')
			return this
		}

		// Initialize trackers if auto-tracking is enabled
		if (this.config.enableAutoTrack) {
			this.initializeTrackers()
		}

		// Start periodic flushing
		this.startPeriodicFlush()

		// Handle page unload
		this.setupUnloadHandler()

		this.isInitialized = true
		this.log('WebMonitor initialized')

		return this
	}

	private initializeTrackers(): void {
		// Error tracking
		this.errorTracker = new ErrorTracker(
			(event) => this.enqueueEvent(event),
			this.sessionId,
			this.config.appId,
			this.userId
		)
		this.errorTracker.init()

		// Page tracking
		this.pageTracker = new PageTracker(
			(event) => this.enqueueEvent(event),
			this.sessionId,
			this.config.appId,
			this.userId
		)
		this.pageTracker.init()

		// Network tracking
		this.networkTracker = new NetworkTracker(
			(event) => this.enqueueEvent(event),
			this.sessionId,
			this.config.appId,
			this.userId
		)
		this.networkTracker.init()

		// Performance tracking
		this.performanceTracker = new PerformanceTracker(
			(event) => this.enqueueEvent(event),
			this.sessionId,
			this.config.appId,
			this.userId
		)
		this.performanceTracker.init()
	}

	private enqueueEvent(event: LogEvent): void {
		this.queue.enqueue(event)
		this.log('Event enqueued:', event.eventType, event)
	}

	private startPeriodicFlush(): void {
		this.flushTimer = window.setInterval(() => {
			this.flush()
		}, this.config.flushInterval)
	}

	private setupUnloadHandler(): void {
		const handleUnload = () => {
			this.flushSync()
		}

		window.addEventListener('beforeunload', handleUnload)
		window.addEventListener('pagehide', handleUnload)

		// Use Page Visibility API as fallback
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				this.flushSync()
			}
		})
	}

	// Public API methods

	setUserId(userId: string): void {
		this.userId = userId
	}

	getUserId(): string | undefined {
		return this.userId
	}

	getSessionId(): string {
		return this.sessionId
	}

	// Manual event tracking
	trackError(error: Error, context?: Record<string, unknown>): void {
		if (this.errorTracker) {
			this.errorTracker.reportError(error, context)
		}
	}

	trackPageView(url?: string, title?: string): void {
		if (this.pageTracker) {
			this.pageTracker.trackPageView(url, title)
		}
	}

	trackCustomEvent(eventData: Partial<LogEvent>): void {
		const event: LogEvent = {
			eventType: 'custom',
			timestamp: Date.now(),
			sessionId: this.sessionId,
			userId: this.userId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			appId: this.config.appId,
			...eventData
		} as LogEvent

		this.enqueueEvent(event)
	}

	// Performance tracking helpers
	mark(name: string): void {
		if (this.performanceTracker) {
			this.performanceTracker.mark(name)
		}
	}

	measure(name: string, startMark?: string, endMark?: string): void {
		if (this.performanceTracker) {
			this.performanceTracker.measure(name, startMark, endMark)
		}
	}

	// Queue management
	async flush(): Promise<void> {
		if (this.queue.isEmpty()) {
			return
		}

		const items = this.queue.getReadyItems()
		if (items.length === 0) {
			return
		}

		this.log(`Flushing ${items.length} events`)

		try {
			const result = await this.transmitter.sendBatch(items)

			if (result.success) {
				this.queue.removeTransmittedItems(items)
				this.log(`Successfully transmitted ${items.length} events`)
			} else {
				this.queue.markForRetry(items)
				this.log('Transmission failed:', result.error)
			}
		} catch (error) {
			this.queue.markForRetry(items)
			this.log('Transmission error:', error)
		}
	}

	private flushSync(): void {
		if (this.queue.isEmpty()) {
			return
		}

		const items = this.queue.getAll()
		const events = items.map((item) => item.event)

		// Try beacon API first
		const beaconSent = this.transmitter.sendBeacon(events)

		if (beaconSent) {
			this.queue.clear()
			this.log(`Beacon sent with ${events.length} events`)
		} else {
			// Fallback to synchronous request (may be blocked by browser)
			this.log('Beacon not available, events may be lost')
		}
	}

	// Configuration
	getConfig(): Required<LoggerConfig> {
		return { ...this.config }
	}

	updateConfig(newConfig: Partial<LoggerConfig>): void {
		this.config = { ...this.config, ...newConfig }
	}

	// Utility methods
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	private log(...args: unknown[]): void {
		if (this.config.enableConsoleLog) {
			console.log('[WebMonitor]', ...args)
		}
	}

	// Cleanup
	destroy(): void {
		this.flush()

		if (this.flushTimer) {
			clearInterval(this.flushTimer)
		}

		if (this.errorTracker) {
			this.errorTracker.destroy()
		}

		if (this.pageTracker) {
			this.pageTracker.destroy()
		}

		if (this.networkTracker) {
			this.networkTracker.destroy()
		}

		if (this.performanceTracker) {
			this.performanceTracker.destroy()
		}

		this.isInitialized = false
		this.log('WebMonitor destroyed')
	}
}

// Export singleton instance factory
export function createWebMonitor(config: LoggerConfig): WebMonitor {
	return new WebMonitor(config)
}
