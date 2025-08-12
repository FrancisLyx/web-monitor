/**
 * 错误处理工具
 */
class ErrorHandler {
	/**
	 * 统一错误处理中间件
	 */
	static middleware(err, req, res, next) {
		console.error('Error:', err.message)
		console.error('Stack:', err.stack)
		
		const statusCode = err.status || err.statusCode || 500
		const message = err.message || '服务器内部错误'
		
		res.error(message, statusCode)
	}

	/**
	 * 404 处理中间件
	 */
	static notFound(req, res) {
		res.error('接口不存在', 404)
	}

	/**
	 * 异步错误包装器
	 */
	static asyncWrapper(fn) {
		return (req, res, next) => {
			Promise.resolve(fn(req, res, next)).catch(next)
		}
	}
}

module.exports = ErrorHandler