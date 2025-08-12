const config = require('../../config/app')

/**
 * 请求日志中间件
 */
const logger = (req, res, next) => {
	if (!config.logging.enabled) {
		return next()
	}

	const start = Date.now()
	const timestamp = new Date().toISOString()
	
	console.log(`[${timestamp}] ${req.method} ${req.url}`)
	console.log('Headers:', JSON.stringify(req.headers, null, 2))
	
	if (Object.keys(req.body || {}).length > 0) {
		console.log('Body:', JSON.stringify(req.body, null, 2))
	}
	
	// 拦截响应
	const originalSend = res.send
	res.send = function(data) {
		const duration = Date.now() - start
		console.log(`[${new Date().toISOString()}] Response ${res.statusCode} - ${duration}ms`)
		console.log('Response Data:', data)
		console.log('---')
		return originalSend.call(this, data)
	}
	
	next()
}

module.exports = logger