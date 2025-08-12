import { LogEvent, LoggerConfig } from '../types/types'
import { EventQueue } from './queue'
import { ErrorTracker } from './Tracker/error'
import { NetworkTracker } from './Tracker/network'
import { PageTracker } from './Tracker/page'
import { PerformanceTracker } from './Tracker/performance'
import { Transmitter } from './transmitter'

/**
 * @description: WebMonitor 类是 Web 监控的核心类，负责初始化、配置、事件跟踪和数据传输。
 * @return {*}
 */
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
			enableAutoFlush: false,
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

		// Start periodic flushing 间隔上报数据
		if (this.config.enableAutoFlush) {
			this.startPeriodicFlush()
		}

		// Handle page unload
		this.setupUnloadHandler()

		this.isInitialized = true
		this.log('WebMonitor initialized')

		return this
	}

	// initialize trackers
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
		const handleUnload = (): void => {
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

	// 页面关闭时候，同步上报事件
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

// Singleton instance storage
let globalInstance: WebMonitor | null = null
let globalConfig: LoggerConfig | null = null

// Export singleton instance factory
export function createWebMonitor(config: LoggerConfig): WebMonitor {
	// 如果已经有实例
	if (globalInstance) {
		// 检查配置是否相同
		const configChanged = JSON.stringify(globalConfig) !== JSON.stringify(config)

		if (configChanged) {
			console.warn('WebMonitor: Different config detected. Options:')
			console.warn('1. Use existing instance with original config')
			console.warn('2. Call destroyWebMonitorInstance() first to recreate')
			console.warn('3. Use getWebMonitorInstance() to get existing instance')
			console.warn('Current config:', globalConfig)
			console.warn('New config:', config)
		} else {
			console.info('WebMonitor: Returning existing instance with same config')
		}

		return globalInstance
	}

	// 创建新实例并存储配置
	globalInstance = new WebMonitor(config)
	globalConfig = { ...config } // 深拷贝配置

	console.info('WebMonitor: Created new singleton instance')
	return globalInstance
}

// 获取现有实例（如果存在）
export function getWebMonitorInstance(): WebMonitor | null {
	return globalInstance
}

// 销毁单例实例
export function destroyWebMonitorInstance(): void {
	if (globalInstance) {
		globalInstance.destroy()
		globalInstance = null
		globalConfig = null
		console.info('WebMonitor: Singleton instance destroyed')
	}
}

// 强制重新创建实例（销毁现有实例并创建新实例）
export function recreateWebMonitorInstance(config: LoggerConfig): WebMonitor {
	destroyWebMonitorInstance()
	return createWebMonitor(config)
}

// 获取当前配置
export function getWebMonitorConfig(): LoggerConfig | null {
	return globalConfig ? { ...globalConfig } : null
}
