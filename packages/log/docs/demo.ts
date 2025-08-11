import { createWebMonitor } from '../index'

// Mock server URL for demo (you can use a service like httpbin.org for testing)
const MOCK_SERVER_URL = 'https://httpbin.org/post'

// Initialize the Web Monitor SDK
const monitor = createWebMonitor({
	appId: 'demo-app-001',
	serverUrl: MOCK_SERVER_URL,
	enableConsoleLog: true,
	enableAutoTrack: true,
	maxQueueSize: 50,
	flushInterval: 5000 // 5 seconds for demo
})

// Initialize SDK
monitor.init()

// DOM elements
const sessionIdSpan = document.getElementById('session-id') as HTMLSpanElement
const userIdSpan = document.getElementById('user-id') as HTMLSpanElement
const consoleOutput = document.getElementById('console-output') as HTMLPreElement

// Update UI with SDK info
function updateUI(): void {
	sessionIdSpan.textContent = monitor.getSessionId()
	userIdSpan.textContent = monitor.getUserId() || 'Not set'
	// Note: In a real implementation, you'd need to expose queue size
	// queueSizeSpan.textContent = monitor.getQueueSize().toString();
}

// Console logging function
function log(message: string, data?: unknown): void {
	const timestamp = new Date().toLocaleTimeString()
	const logEntry = data
		? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}\n`
		: `[${timestamp}] ${message}\n`

	consoleOutput.textContent += logEntry
	consoleOutput.scrollTop = consoleOutput.scrollHeight
	console.log(message, data)
}

// Initial UI update
updateUI()
log('Web Monitor SDK initialized')

// Error tracking demos
document.getElementById('throw-error')?.addEventListener('click', () => {
	log('Throwing JavaScript error...')
	throw new Error('This is a demo JavaScript error')
})

document.getElementById('promise-reject')?.addEventListener('click', () => {
	log('Creating unhandled promise rejection...')
	Promise.reject(new Error('This is a demo promise rejection'))
})

document.getElementById('load-missing-image')?.addEventListener('click', () => {
	log('Loading missing image resource...')
	const img = document.createElement('img')
	img.src = '/nonexistent-image.jpg'
	img.style.display = 'none'
	document.body.appendChild(img)
})

// Network tracking demos
document.getElementById('fetch-request')?.addEventListener('click', async () => {
	log('Making fetch request...')
	try {
		const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
		const data = await response.json()
		log('Fetch request successful', data)
	} catch (error) {
		log('Fetch request failed', error)
	}
})

document.getElementById('xhr-request')?.addEventListener('click', () => {
	log('Making XHR request...')
	const xhr = new XMLHttpRequest()
	xhr.open('GET', 'https://jsonplaceholder.typicode.com/users/1')
	xhr.onload = function () {
		if (xhr.status === 200) {
			log('XHR request successful', JSON.parse(xhr.responseText))
		} else {
			log('XHR request failed', { status: xhr.status, statusText: xhr.statusText })
		}
	}
	xhr.onerror = function () {
		log('XHR request error')
	}
	xhr.send()
})

document.getElementById('failed-request')?.addEventListener('click', async () => {
	log('Making request to non-existent endpoint...')
	try {
		await fetch('https://nonexistent-domain-12345.com/api')
	} catch (error) {
		log('Request failed as expected', error)
	}
})

// Performance tracking demos
document.getElementById('custom-mark')?.addEventListener('click', () => {
	const markName = `demo-mark-${Date.now()}`
	log(`Creating performance mark: ${markName}`)
	monitor.mark(markName)
})

document.getElementById('custom-measure')?.addEventListener('click', () => {
	const measureName = `demo-measure-${Date.now()}`
	const startMark = `start-${Date.now()}`
	const endMark = `end-${Date.now()}`

	log(`Creating performance measure: ${measureName}`)
	monitor.mark(startMark)

	// Simulate some work
	setTimeout(() => {
		monitor.mark(endMark)
		monitor.measure(measureName, startMark, endMark)
	}, 100)
})

document.getElementById('heavy-operation')?.addEventListener('click', () => {
	log('Performing heavy operation (blocking main thread)...')
	monitor.mark('heavy-operation-start')

	// Simulate heavy computation
	const start = Date.now()
	let result = 0
	for (let i = 0; i < 10000000; i++) {
		result += Math.sqrt(i)
	}

	monitor.mark('heavy-operation-end')
	monitor.measure('heavy-operation', 'heavy-operation-start', 'heavy-operation-end')

	log(`Heavy operation completed in ${Date.now() - start}ms`, { result })
})

// Page tracking demos
document.getElementById('track-page')?.addEventListener('click', () => {
	const customUrl = `/demo-page-${Date.now()}`
	const customTitle = `Demo Page ${new Date().toLocaleTimeString()}`

	log(`Tracking custom page view: ${customUrl}`)
	monitor.trackPageView(customUrl, customTitle)
})

document.getElementById('navigate-hash')?.addEventListener('click', () => {
	const newHash = `#section-${Date.now()}`
	log(`Navigating to hash: ${newHash}`)
	window.location.hash = newHash
})

// Custom events demos
document.getElementById('custom-event')?.addEventListener('click', () => {
	const eventData = {
		eventType: 'custom' as const,
		category: 'user-interaction',
		action: 'button-click',
		label: 'demo-custom-event',
		value: Math.floor(Math.random() * 100),
		timestamp: Date.now()
	}

	log('Sending custom event', eventData)
	monitor.trackCustomEvent(eventData)
})

document.getElementById('user-action')?.addEventListener('click', () => {
	const actionData = {
		eventType: 'user-action' as const,
		action: 'feature-usage',
		feature: 'demo-feature',
		context: {
			page: window.location.pathname,
			timestamp: Date.now(),
			sessionDuration: Date.now() - parseInt(monitor.getSessionId().split('_')[1])
		}
	}

	log('Tracking user action', actionData)
	monitor.trackCustomEvent(actionData)
})

// SDK control demos
document.getElementById('set-user-id')?.addEventListener('click', () => {
	const userIdInput = document.getElementById('user-id-input') as HTMLInputElement
	const userId = userIdInput.value.trim()

	if (userId) {
		monitor.setUserId(userId)
		log(`User ID set to: ${userId}`)
		updateUI()
		userIdInput.value = ''
	} else {
		log('Please enter a user ID')
	}
})

document.getElementById('flush-events')?.addEventListener('click', async () => {
	log('Manually flushing events...')
	try {
		await monitor.flush()
		log('Events flushed successfully')
	} catch (error) {
		log('Failed to flush events', error)
	}
})

document.getElementById('clear-console')?.addEventListener('click', () => {
	consoleOutput.textContent = ''
	log('Console cleared')
})

// Auto-update UI every second
setInterval(updateUI, 1000)

// Listen for hash changes to demonstrate SPA navigation tracking
window.addEventListener('hashchange', () => {
	log(`Hash changed to: ${window.location.hash}`)
})

// Track when the demo starts
monitor.trackCustomEvent({
	eventType: 'demo-start' as const,
	timestamp: Date.now(),
	userAgent: navigator.userAgent,
	url: window.location.href
})

log('Demo page loaded and ready for testing')
