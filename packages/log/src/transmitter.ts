import { LogEvent, QueueItem, TransmissionResult } from '../types/types'

/**
 * @description: 发送事件
 * @return {*}
 */
export class Transmitter {
	private serverUrl: string
	private timeout: number

	constructor(serverUrl: string, timeout = 5000) {
		this.serverUrl = serverUrl
		this.timeout = timeout
	}

	async send(events: LogEvent[]): Promise<TransmissionResult> {
		try {
			// 终止取消异步操作 controller.signal 用于传递需要取消的操作，controller.abort 用于终止操作
			const controller = new AbortController()

			// timeout后终止异步事件
			const timeoutId = setTimeout(() => controller.abort(), this.timeout)

			// 事件上报
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

			// 清除超时定时器
			clearTimeout(timeoutId)

			// 如果请求失败，返回错误信息
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

	// 事件组合上报
	async sendBatch(items: QueueItem[]): Promise<TransmissionResult> {
		if (items.length === 0) {
			return { success: true }
		}

		const events = items.map((item) => item.event)
		return this.send(events)
	}

	// 页面卸载上报
	sendBeacon(events: LogEvent[]): boolean {
		// 浏览器 原生方法
		if (!navigator.sendBeacon) {
			return false
		}

		const data = JSON.stringify({
			events,
			timestamp: Date.now()
		})

		return navigator.sendBeacon(this.serverUrl, data)
	}

	// 使用 image pixel 上报事件
	sendPixel(events: LogEvent[]): Promise<TransmissionResult> {
		return new Promise((resolve) => {
			const img = new Image()
			const data = encodeURIComponent(
				JSON.stringify({
					events,
					timestamp: Date.now()
				})
			)

			img.onload = (): void => resolve({ success: true })
			img.onerror = (): void =>
				resolve({
					success: false,
					error: 'Image pixel transmission failed'
				})

			img.src = `${this.serverUrl}?data=${data}`
		})
	}
}
