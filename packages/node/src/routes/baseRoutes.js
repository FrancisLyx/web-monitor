const express = require('express')
const BaseController = require('../controllers/baseController')

const router = express.Router()

// 基础路由
router.get('/', BaseController.home)
router.get('/health', BaseController.health)

module.exports = router