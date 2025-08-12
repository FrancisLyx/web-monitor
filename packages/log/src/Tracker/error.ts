import { ErrorEvent } from '../../types/types'

/**
 * ErrorTracker is responsible for tracking and reporting JavaScript errors, promise rejections, and resource loading errors.
 * It intercepts and reports errors that occur in the global scope.
 */

export class ErrorTracker {
	private onError: (event: ErrorEvent) => void
	private sessionId: string
	private appId: string
	private userId?: string
	private errorHandler?: (event: globalThis.ErrorEvent) => void
	private rejectionHandler?: (event: PromiseRejectionEvent) => void
	private resourceErrorHandler?: (event: Event) => void

	constructor(
		onError: (event: ErrorEvent) => void,
		sessionId: string,
		appId: string,
		userId?: string
	) {
		this.onError = onError
		this.sessionId = sessionId
		this.appId = appId
		this.userId = userId
	}

	init(): void {
		this.setupJavaScriptErrorTracking()
		this.setupPromiseRejectionTracking()
		this.setupResourceErrorTracking()
	}

	private setupJavaScriptErrorTracking(): void {
		this.errorHandler = (event): void => {
			const errorEvent: ErrorEvent = {
				eventType: 'error',
				errorType: 'js',
				timestamp: Date.now(),
				sessionId: this.sessionId,
				userId: this.userId,
				url: window.location.href,
				userAgent: navigator.userAgent,
				appId: this.appId,
				message: event.message,
				stack: event.error?.stack,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno
			}

			this.onError(errorEvent)
		}

		window.addEventListener('error', this.errorHandler)
	}

	private setupPromiseRejectionTracking(): void {
		this.rejectionHandler = (event): void => {
			const errorEvent: ErrorEvent = {
				eventType: 'error',
				errorType: 'promise',
				timestamp: Date.now(),
				sessionId: this.sessionId,
				userId: this.userId,
				url: window.location.href,
				userAgent: navigator.userAgent,
				appId: this.appId,
				message: event.reason?.message || 'Unhandled Promise Rejection',
				stack: event.reason?.stack
			}

			this.onError(errorEvent)
		}

		window.addEventListener('unhandledrejection', this.rejectionHandler)
	}

	private setupResourceErrorTracking(): void {
		this.resourceErrorHandler = (event: Event): void => {
			const target = event.target as HTMLElement

			// Only handle resource loading errors
			if (
				target &&
				event.target !== window &&
				(target.tagName === 'IMG' ||
					target.tagName === 'SCRIPT' ||
					target.tagName === 'LINK')
			) {
				const errorEvent: ErrorEvent = {
					eventType: 'error',
					errorType: 'resource',
					timestamp: Date.now(),
					sessionId: this.sessionId,
					userId: this.userId,
					url: window.location.href,
					userAgent: navigator.userAgent,
					appId: this.appId,
					message: `Resource loading failed: ${target.tagName}`,
					filename: this.getResourceUrl(target)
				}

				this.onError(errorEvent)
			}
		}

		window.addEventListener('error', this.resourceErrorHandler, true) // Use capture phase for resource errors
	}

	private getResourceUrl(target: HTMLElement): string | undefined {
		if (target.tagName === 'IMG' || target.tagName === 'SCRIPT') {
			return (target as HTMLImageElement | HTMLScriptElement).src
		}
		if (target.tagName === 'LINK') {
			return (target as HTMLLinkElement).href
		}
		return undefined
	}

	// Manual error reporting
	reportError(error: Error, context?: Record<string, unknown>): void {
		const errorEvent: ErrorEvent = {
			eventType: 'error',
			errorType: 'js',
			timestamp: Date.now(),
			sessionId: this.sessionId,
			userId: this.userId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			appId: this.appId,
			message: error.message,
			stack: error.stack,
			...context
		}

		this.onError(errorEvent)
	}

	destroy(): void {
		// Remove all event listeners
		if (this.errorHandler) {
			window.removeEventListener('error', this.errorHandler)
			this.errorHandler = undefined
		}

		if (this.rejectionHandler) {
			window.removeEventListener('unhandledrejection', this.rejectionHandler)
			this.rejectionHandler = undefined
		}

		if (this.resourceErrorHandler) {
			window.removeEventListener('error', this.resourceErrorHandler, true)
			this.resourceErrorHandler = undefined
		}
	}
}
