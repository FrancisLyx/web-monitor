import { LogEvent, QueueItem, TransmissionResult } from '../types/types'

export class Transmitter {
	private serverUrl: string
	private timeout: number

	constructor(serverUrl: string, timeout = 5000) {
		this.serverUrl = serverUrl
		this.timeout = timeout
	}

	async send(events: LogEvent[]): Promise<TransmissionResult> {
		try {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), this.timeout)

			const response = await fetch(this.serverUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					events,
					timestamp: Date.now()
				}),
				signal: controller.signal
			})

			clearTimeout(timeoutId)

			if (!response.ok) {
				return {
					success: false,
					error: `HTTP ${response.status}: ${response.statusText}`
				}
			}

			return { success: true }
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown transmission error'
			}
		}
	}

	async sendBatch(items: QueueItem[]): Promise<TransmissionResult> {
		if (items.length === 0) {
			return { success: true }
		}

		const events = items.map((item) => item.event)
		return this.send(events)
	}

	// Send using beacon API for page unload scenarios
	sendBeacon(events: LogEvent[]): boolean {
		if (!navigator.sendBeacon) {
			return false
		}

		const data = JSON.stringify({
			events,
			timestamp: Date.now()
		})

		return navigator.sendBeacon(this.serverUrl, data)
	}

	// Send using image pixel for fallback scenarios
	sendPixel(events: LogEvent[]): Promise<TransmissionResult> {
		return new Promise((resolve) => {
			const img = new Image()
			const data = encodeURIComponent(
				JSON.stringify({
					events,
					timestamp: Date.now()
				})
			)

			img.onload = () => resolve({ success: true })
			img.onerror = () =>
				resolve({
					success: false,
					error: 'Image pixel transmission failed'
				})

			img.src = `${this.serverUrl}?data=${data}`
		})
	}
}
