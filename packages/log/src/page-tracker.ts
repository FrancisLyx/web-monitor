import { PageEvent } from '../types/types'

export class PageTracker {
	private onPageEvent: (event: PageEvent) => void
	private sessionId: string
	private appId: string
	private userId?: string
	private currentPageStartTime = 0

	constructor(
		onPageEvent: (event: PageEvent) => void,
		sessionId: string,
		appId: string,
		userId?: string
	) {
		this.onPageEvent = onPageEvent
		this.sessionId = sessionId
		this.appId = appId
		this.userId = userId
	}

	init(): void {
		this.trackInitialPageView()
		this.setupPageChangeTracking()
		this.setupPageUnloadTracking()
	}

	private trackInitialPageView(): void {
		this.currentPageStartTime = Date.now()

		const pageEvent: PageEvent = {
			eventType: 'page',
			action: 'enter',
			timestamp: this.currentPageStartTime,
			sessionId: this.sessionId,
			userId: this.userId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			appId: this.appId,
			referrer: document.referrer,
			title: document.title,
			loadTime: this.getPageLoadTime()
		}

		this.onPageEvent(pageEvent)
	}

	private setupPageChangeTracking(): void {
		// Handle history changes for SPA
		const originalPushState = history.pushState
		const originalReplaceState = history.replaceState

		history.pushState = (...args) => {
			this.trackPageLeave()
			originalPushState.apply(history, args)
			setTimeout(() => this.trackPageEnter(), 0)
		}

		history.replaceState = (...args) => {
			this.trackPageLeave()
			originalReplaceState.apply(history, args)
			setTimeout(() => this.trackPageEnter(), 0)
		}

		// Handle browser back/forward buttons
		window.addEventListener('popstate', () => {
			this.trackPageLeave()
			setTimeout(() => this.trackPageEnter(), 0)
		})

		// Handle hash changes
		window.addEventListener('hashchange', () => {
			this.trackPageLeave()
			setTimeout(() => this.trackPageEnter(), 0)
		})
	}

	private setupPageUnloadTracking(): void {
		window.addEventListener('beforeunload', () => {
			this.trackPageLeave()
		})

		// Use Page Visibility API for better tracking
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				this.trackPageLeave()
			} else {
				this.trackPageEnter()
			}
		})
	}

	private trackPageEnter(): void {
		this.currentPageStartTime = Date.now()

		const pageEvent: PageEvent = {
			eventType: 'page',
			action: 'enter',
			timestamp: this.currentPageStartTime,
			sessionId: this.sessionId,
			userId: this.userId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			appId: this.appId,
			referrer: document.referrer,
			title: document.title
		}

		this.onPageEvent(pageEvent)
	}

	private trackPageLeave(): void {
		if (this.currentPageStartTime === 0) {
			return
		}

		const duration = Date.now() - this.currentPageStartTime

		const pageEvent: PageEvent = {
			eventType: 'page',
			action: 'leave',
			timestamp: Date.now(),
			sessionId: this.sessionId,
			userId: this.userId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			appId: this.appId,
			title: document.title,
			loadTime: duration
		}

		this.onPageEvent(pageEvent)
		this.currentPageStartTime = 0
	}

	private getPageLoadTime(): number | undefined {
		if (!window.performance?.timing) {
			return undefined
		}

		const timing = window.performance.timing
		const loadTime = timing.loadEventEnd - timing.navigationStart

		return loadTime > 0 ? loadTime : undefined
	}

	// Manual page tracking
	trackPageView(url?: string, title?: string): void {
		const pageEvent: PageEvent = {
			eventType: 'page',
			action: 'enter',
			timestamp: Date.now(),
			sessionId: this.sessionId,
			userId: this.userId,
			url: url || window.location.href,
			userAgent: navigator.userAgent,
			appId: this.appId,
			title: title || document.title
		}

		this.onPageEvent(pageEvent)
	}

	destroy(): void {
		// Clean up event listeners
		this.trackPageLeave()
	}
}
