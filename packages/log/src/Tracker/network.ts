import { NetworkEvent } from '../../types/types'

export class NetworkTracker {
	private onNetworkEvent: (event: NetworkEvent) => void
	private sessionId: string
	private appId: string
	private userId?: string
	private originalFetch: typeof fetch
	private originalXHROpen: typeof XMLHttpRequest.prototype.open
	private originalXHRSend: typeof XMLHttpRequest.prototype.send

	constructor(
		onNetworkEvent: (event: NetworkEvent) => void,
		sessionId: string,
		appId: string,
		userId?: string
	) {
		this.onNetworkEvent = onNetworkEvent
		this.sessionId = sessionId
		this.appId = appId
		this.userId = userId

		// Store original methods
		this.originalFetch = window.fetch.bind(window)
		this.originalXHROpen = XMLHttpRequest.prototype.open
		this.originalXHRSend = XMLHttpRequest.prototype.send
	}

	init(): void {
		this.interceptFetch()
		this.interceptXHR()
	}

	private interceptFetch(): void {
		window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			const url =
				input instanceof URL
					? input.href
					: input instanceof Request
						? input.url
						: input.toString()
			const method = init?.method || 'GET'
			const startTime = Date.now()

			try {
				const response = await this.originalFetch(input as RequestInfo, init)
				const duration = Date.now() - startTime

				this.trackNetworkRequest({
					method,
					requestUrl: url,
					status: response.status,
					duration,
					requestSize: this.getRequestSize(init),
					responseSize: this.getResponseSize(response)
				})

				return response
			} catch (error) {
				const duration = Date.now() - startTime

				this.trackNetworkRequest({
					method,
					requestUrl: url,
					status: 0, // Network error
					duration,
					requestSize: this.getRequestSize(init)
				})

				throw error
			}
		}
	}

	private interceptXHR(): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this

		XMLHttpRequest.prototype.open = function (
			method: string,
			url: string | URL,
			async?: boolean,
			user?: string | null,
			password?: string | null
		): void {
			// Store request info on the XHR instance
			;(this as XMLHttpRequest & { _trackingInfo?: unknown })._trackingInfo = {
				method,
				url: url.toString(),
				startTime: 0
			}

			return self.originalXHROpen.call(this, method, typeof url === 'string' ? url : url.toString(), async ?? true, user, password)
		}

		XMLHttpRequest.prototype.send = function (
			body?: Document | BodyInit | null
		): void {
			const trackingInfo = (this as XMLHttpRequest & { _trackingInfo?: unknown })
				._trackingInfo as
				| {
						method: string
						url: string
						startTime: number
						requestSize?: number
				  }
				| undefined

			if (trackingInfo) {
				trackingInfo.startTime = Date.now()
				trackingInfo.requestSize = self.getXHRRequestSize(body)

				// Set up response tracking
				this.addEventListener('loadend', () => {
					const duration = Date.now() - trackingInfo.startTime

					self.trackNetworkRequest({
						method: trackingInfo.method,
						requestUrl: trackingInfo.url,
						status: this.status,
						duration,
						requestSize: trackingInfo.requestSize,
						responseSize: self.getXHRResponseSize(this)
					})
				})
			}

			return self.originalXHRSend.call(this, body as any)
		}
	}

	private trackNetworkRequest(requestInfo: {
		method: string
		requestUrl: string
		status: number
		duration: number
		requestSize?: number
		responseSize?: number
	}): void {
		const networkEvent: NetworkEvent = {
			eventType: 'network',
			timestamp: Date.now(),
			sessionId: this.sessionId,
			userId: this.userId,
			url: window.location.href,
			userAgent: navigator.userAgent,
			appId: this.appId,
			...requestInfo
		}

		this.onNetworkEvent(networkEvent)
	}

	private getRequestSize(init?: RequestInit): number | undefined {
		if (!init?.body) {
			return undefined
		}

		if (typeof init.body === 'string') {
			return new Blob([init.body]).size
		}

		if (init.body instanceof FormData) {
			// Approximate size for FormData
			let size = 0
			for (const [key, value] of init.body.entries()) {
				size += key.length
				if (typeof value === 'string') {
					size += value.length
				} else if (value instanceof File) {
					size += value.size
				}
			}
			return size
		}

		if (init.body instanceof Blob) {
			return init.body.size
		}

		if (init.body instanceof ArrayBuffer) {
			return init.body.byteLength
		}

		return undefined
	}

	private getResponseSize(response: Response): number | undefined {
		const contentLength = response.headers.get('content-length')
		return contentLength ? parseInt(contentLength, 10) : undefined
	}

	private getXHRRequestSize(body?: Document | BodyInit | null): number | undefined {
		if (!body) {
			return undefined
		}

		if (typeof body === 'string') {
			return new Blob([body]).size
		}

		if (body instanceof FormData) {
			// Approximate size for FormData
			let size = 0
			for (const [key, value] of body.entries()) {
				size += key.length
				if (typeof value === 'string') {
					size += value.length
				} else if (value instanceof File) {
					size += value.size
				}
			}
			return size
		}

		if (body instanceof Blob) {
			return body.size
		}

		if (body instanceof ArrayBuffer) {
			return body.byteLength
		}

		return undefined
	}

	private getXHRResponseSize(xhr: XMLHttpRequest): number | undefined {
		const contentLength = xhr.getResponseHeader('content-length')
		if (contentLength) {
			return parseInt(contentLength, 10)
		}

		// Fallback: estimate response size
		if (xhr.responseText) {
			return new Blob([xhr.responseText]).size
		}

		return undefined
	}

	destroy(): void {
		// Restore original methods
		window.fetch = this.originalFetch
		XMLHttpRequest.prototype.open = this.originalXHROpen
		XMLHttpRequest.prototype.send = this.originalXHRSend
	}
}
