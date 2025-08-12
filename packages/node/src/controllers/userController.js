/**
 * 用户控制器
 */
class UserController {
	/**
	 * 获取用户信息
	 */
	static getUserById(req, res) {
		const { id } = req.params

		if (!id || id === '0') {
			return res.fail('用户ID无效')
		}

		// 模拟用户数据
		const userData = {
			id: parseInt(id),
			name: `User${id}`,
			email: `user${id}@example.com`,
			createdAt: new Date().toISOString()
		}

		res.success(userData, '获取用户成功')
	}

	/**
	 * 创建用户
	 */
	static createUser(req, res) {
		const { name, email } = req.body

		if (!name || !email) {
			return res.fail('姓名和邮箱不能为空')
		}

		const newUser = {
			id: Date.now(),
			name,
			email,
			createdAt: new Date().toISOString()
		}

		res.success(newUser, '创建用户成功')
	}
}

module.exports = UserController