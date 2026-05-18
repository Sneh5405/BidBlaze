const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getMyAuctions,
  getMyBids,
  getMyWins,
  getMyProfile
} = require('../controllers/userController')

// all routes protected — must be logged in
router.get('/profile', authMiddleware, getMyProfile)
router.get('/my-auctions', authMiddleware, getMyAuctions)
router.get('/my-bids', authMiddleware, getMyBids)
router.get('/my-wins', authMiddleware, getMyWins)

module.exports = router