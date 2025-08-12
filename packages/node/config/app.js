module.exports = {
	port: process.env.PORT || 3000,
	env: process.env.NODE_ENV || 'development',
	
	// 跨域配置
	cors: {
		origin: process.env.CORS_ORIGIN || '*',
		credentials: true
	},
	
	// 日志配置
	logging: {
		enabled: process.env.LOGGING !== 'false',
		level: process.env.LOG_LEVEL || 'info'
	}
}