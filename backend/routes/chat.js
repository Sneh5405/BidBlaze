const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const { getMyChatRooms, getChatRoom } = require('../controllers/chatController')

router.get('/rooms', authMiddleware, getMyChatRooms)
router.get('/rooms/:id', authMiddleware, getChatRoom)

module.exports = router
