/**
 * 基础控制器
 */
class BaseController {
	/**
	 * 健康检查
	 */
	static health(req, res) {
		res.ok({
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		}, '服务运行正常')
	}

	/**
	 * 首页
	 */
	static home(req, res) {
		res.ok('Hello World', '欢迎访问API')
	}
}

module.exports = BaseController