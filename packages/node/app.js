const express = require('express')
const config = require('./config/app')
const { logger, responseFormatter } = require('./src/middleware')
const routes = require('./src/routes')
const ErrorHandler = require('./src/utils/errorHandler')

const app = express()

// 基础中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS 配置 - 允许跨域请求
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200)
    } else {
        next()
    }
})

// 自定义中间件
app.use(logger)
app.use(responseFormatter)

// 路由
app.use(routes)

// 错误处理
app.use(ErrorHandler.middleware)
app.use('*', ErrorHandler.notFound)

// 启动服务器
const server = app.listen(config.port, () => {
	console.log(`🚀 Server is running on port ${config.port}`)
	console.log(`📝 Environment: ${config.env}`)
	console.log(`🔍 Logging: ${config.logging.enabled ? 'enabled' : 'disabled'}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
	console.log('👋 SIGTERM received, shutting down gracefully')
	server.close(() => {
		console.log('✅ Process terminated')
	})
})

module.exports = app