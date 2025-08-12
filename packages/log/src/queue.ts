import { LogEvent, QueueItem } from '../types/types'

export class EventQueue {
	private queue: QueueItem[] = []
	private maxSize: number

	constructor(maxSize = 100) {
		this.maxSize = maxSize
	}

	enqueue(event: LogEvent): void {
		if (this.queue.length >= this.maxSize) {
			// Remove oldest item when queue is full
			this.queue.shift()
		}

		this.queue.push({
			event,
			retryCount: 0,
			timestamp: Date.now()
		})
	}

	dequeue(): QueueItem | undefined {
		return this.queue.shift()
	}

	peek(): QueueItem | undefined {
		return this.queue[0]
	}

	size(): number {
		return this.queue.length
	}

	clear(): void {
		this.queue = []
	}

	isEmpty(): boolean {
		return this.queue.length === 0
	}

	getAll(): QueueItem[] {
		return [...this.queue]
	}

	remove(index: number): QueueItem | undefined {
		if (index >= 0 && index < this.queue.length) {
			return this.queue.splice(index, 1)[0]
		}
		return undefined
	}

	// Get items that are ready for transmission (not currently processing)
	getReadyItems(): QueueItem[] {
		return this.queue.filter((item) => item.retryCount < 3)
	}

	// Mark items for retry
	markForRetry(items: QueueItem[]): void {
		items.forEach((item) => {
			item.retryCount++
			item.timestamp = Date.now()
		})
	}

	// Remove successfully transmitted items
	removeTransmittedItems(items: QueueItem[]): void {
		items.forEach((item) => {
			const index = this.queue.indexOf(item)
			if (index > -1) {
				this.queue.splice(index, 1)
			}
		})
	}
}
