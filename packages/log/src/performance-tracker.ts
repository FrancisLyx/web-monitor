import { PerformanceEvent } from '../types/types'

interface LayoutShiftEntry extends PerformanceEntry {
	value: number
	hadRecentInput?: boolean
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
	element?: {
		tagName?: string
	}
}

export class PerformanceTracker {
	private onPerformanceEvent: (event: PerformanceEvent) => void
	private sessionId: string
	private appId: string
	private userId?: string
	private observer?: PerformanceObserver

	constructor(
		onPerformanceEvent: (event: PerformanceEvent) => void,
		sessionId: string,
		appId: string,
		userId?: string
	) {
		this.onPerformanceEvent = onPerformanceEvent
		this.sessionId = sessionId
		this.appId = appId
		this.userId = userId
	}

	init(): void {
		this.trackNavigationTiming()
		this.trackResourceTiming()
		this.trackLargestContentfulPaint()
		this.trackFirstInputDelay()
		this.trackCumulativeLayoutShift()
	}

	private trackNavigationTiming(): void {
		// Wait for page load to ensure timing data is available
		window.addEventListener('load', () => {
			setTimeout(() => {
				const timing = performance.timing
				const navigation = performance.navigation

				const metrics = {
					// DNS lookup time
					dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
					// TCP connection time
					connectTime: timing.connectEnd - timing.connectStart,
					// Request time
					requestTime: timing.responseEnd - timing.requestStart,
					// Response time
					responseTime: timing.responseEnd - timing.responseStart,
					// DOM processing time
					domTime: timing.domContentLoadedEventEnd - timing.domLoading,
					// Load event time
					loadTime: timing.loadEventEnd - timing.loadEventStart,
					// Total page load time
					totalTime: timing.loadEventEnd - timing.navigationStart,
					// Navigation type
					navigationType: navigation.type,
					// Redirect count
					redirectCount: navigation.redirectCount
				}

				this.createPerformanceEvent('navigation', metrics)
			}, 0)
		})
	}

	private trackResourceTiming(): void {
		if (!('PerformanceObserver' in window)) {
			return
		}

		this.observer = new PerformanceObserver((list) => {
			list.getEntries().forEach((entry) => {
				if (entry.entryType === 'resource') {
					const resourceEntry = entry as PerformanceResourceTiming

					const metrics = {
						duration: resourceEntry.duration,
						transferSize: resourceEntry.transferSize,
						encodedBodySize: resourceEntry.encodedBodySize,
						decodedBodySize: resourceEntry.decodedBodySize,
						dnsTime: resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart,
						connectTime: resourceEntry.connectEnd - resourceEntry.connectStart,
						requestTime: resourceEntry.responseEnd - resourceEntry.requestStart
					}

					this.createPerformanceEvent('resource', {
						...metrics,
						resourceUrl: resourceEntry.name,
						resourceType: this.getResourceType(resourceEntry.name)
					})
				}
			})
		})

		this.observer.observe({ entryTypes: ['resource'] })
	}

	private trackLargestContentfulPaint(): void {
		if (!('PerformanceObserver' in window)) {
			return
		}

		const lcpObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries()
			const lastEntry = entries[entries.length - 1] as LargestContentfulPaintEntry

			this.createPerformanceEvent('timing', {
				lcp: lastEntry.startTime,
				lcpElement: lastEntry.element?.tagName || 'unknown'
			})
		})

		try {
			lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
		} catch (e) {
			// LCP not supported
		}
	}

	private trackFirstInputDelay(): void {
		if (!('PerformanceObserver' in window)) {
			return
		}

		const fidObserver = new PerformanceObserver((list) => {
			list.getEntries().forEach((entry) => {
				const fidEntry = entry as PerformanceEventTiming

				this.createPerformanceEvent('timing', {
					fid: fidEntry.processingStart - fidEntry.startTime,
					inputType: fidEntry.name
				})
			})

			// Disconnect after first input
			fidObserver.disconnect()
		})

		try {
			fidObserver.observe({ entryTypes: ['first-input'] })
		} catch (e) {
			// FID not supported
		}
	}

	private trackCumulativeLayoutShift(): void {
		if (!('PerformanceObserver' in window)) {
			return
		}

		let clsValue = 0
		let sessionValue = 0
		let sessionEntries: PerformanceEntry[] = []

		const clsObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const layoutShiftEntry = entry as LayoutShiftEntry
				// Only count layout shifts without recent user input
				if (!layoutShiftEntry.hadRecentInput) {
					const firstSessionEntry = sessionEntries[0]
					const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

					// If the entry occurred less than 1 second after the previous entry and
					// less than 5 seconds after the first entry in the session, include it
					if (
						sessionValue &&
						entry.startTime - lastSessionEntry.startTime < 1000 &&
						entry.startTime - firstSessionEntry.startTime < 5000
					) {
						sessionValue += layoutShiftEntry.value
						sessionEntries.push(entry)
					} else {
						sessionValue = layoutShiftEntry.value
						sessionEntries = [entry]
					}

					// If the current session value is larger than the current CLS value,
					// update CLS and the entries contributing to it.
					if (sessionValue > clsValue) {
						clsValue = sessionValue

						this.createPerformanceEvent('timing', {
							cls: clsValue,
							clsEntries: sessionEntries.length
						})
					}
				}
			}
		})

		try {
			clsObserver.observe({ entryTypes: ['layout-shift'] })
		} catch (e) {
			// CLS not supported
		}
	}

	private createPerformanceEvent(
		metricType: 'timing' | 'navigation' | 'resource',
		metrics: Record<string, unknown>
	): void {
		const performanceEvent: PerformanceEvent = {
			eventType: 'performance',
			metricType,
			timestamp: Date.now(),
			sessionId: this.sessionId,
			userId: this.userId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			appId: this.appId,
			metrics
		}

		this.onPerformanceEvent(performanceEvent)
	}

	private getResourceType(url: string): string {
		const extension = url.split('.').pop()?.toLowerCase()

		if (['js', 'mjs'].includes(extension || '')) {
			return 'script'
		}
		if (['css'].includes(extension || '')) {
			return 'stylesheet'
		}
		if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension || '')) {
			return 'image'
		}
		if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) {
			return 'font'
		}
		if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
			return 'video'
		}
		if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
			return 'audio'
		}

		return 'other'
	}

	// Manual performance tracking
	mark(name: string): void {
		if ('performance' in window && performance.mark) {
			performance.mark(name)
		}
	}

	measure(name: string, startMark?: string, endMark?: string): void {
		if ('performance' in window && performance.measure) {
			try {
				const measure = performance.measure(name, startMark, endMark)

				this.createPerformanceEvent('timing', {
					customMetric: name,
					duration: measure.duration,
					startTime: measure.startTime
				})
			} catch (e) {
				// Measure failed
			}
		}
	}

	destroy(): void {
		if (this.observer) {
			this.observer.disconnect()
		}
	}
}
