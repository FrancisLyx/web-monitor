const express = require('express')

const router = express.Router()

// 数据上报接口 - 接收监控数据
router.post('/', (req, res) => {
	try {
		const { events } = req.body

		// 验证数据格式
		if (!events || !Array.isArray(events)) {
			return res.status(400).json({
				success: false,
				error: 'Invalid data format. Expected events array.'
			})
		}

		// 记录接收到的事件
		console.log(`Received ${events.length} events:`)
		events.forEach((event, index) => {
			console.log(`  Event ${index + 1}:`, {
				type: event.eventType,
				sessionId: event.sessionId,
				timestamp: new Date(event.timestamp).toISOString(),
				url: event.url
			})
		})

		// 模拟处理延迟
		setTimeout(() => {
			console.log(`Processing completed for ${events.length} events`)
		}, 100)

		res.json({
			success: true,
			received: events.length,
			timestamp: Date.now()
		})
	} catch (error) {
		console.error('Error processing flush request:', error)
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		})
	}
})

// 健康检查接口
router.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		service: 'web-monitor-flush',
		timestamp: Date.now()
	})
})

module.exports = router
