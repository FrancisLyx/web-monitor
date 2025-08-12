const express = require('express')
const baseRoutes = require('./baseRoutes')
const userRoutes = require('./userRoutes')
const flushRoutes = require('./flushRoutes')

const router = express.Router()

// 挂载路由
router.use('/', baseRoutes)
router.use('/api', userRoutes)
router.use('/flush', flushRoutes)

module.exports = router
