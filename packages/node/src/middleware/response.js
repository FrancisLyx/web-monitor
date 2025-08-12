/**
 * 响应格式化中间件
 * 统一 API 响应格式，与前端 ResponseData 接口匹配
 */
const responseFormatter = (req, res, next) => {
	// 成功响应
	res.success = (data = null, message = '操作成功', code = 200) => {
		res.status(code).json({
			code,
			success: true,
			data,
			message
		})
	}

	// 错误响应
	res.error = (message = '操作失败', code = 500, data = null) => {
		res.status(code >= 400 ? code : 500).json({
			code,
			success: false,
			data,
			message
		})
	}

	// 快捷方法
	res.ok = (data, msg) => res.success(data, msg)
	res.fail = (msg, code = 400) => res.error(msg, code)

	next()
}

module.exports = responseFormatter