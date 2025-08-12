const express = require('express')
const UserController = require('../controllers/userController')

const router = express.Router()

// 用户相关路由
router.get('/user/:id', UserController.getUserById)
router.post('/user', UserController.createUser)

module.exports = router