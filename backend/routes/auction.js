const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')
const {
  createAuction,
  getAllAuctions,
  getAuctionById,
  deleteAuction
} = require('../controllers/auctionController')

// public routes — anyone can view
router.get('/all', getAllAuctions)
router.get('/:id', getAuctionById)

// protected routes — must be logged in
router.post('/create', authMiddleware, upload.array('images', 5), createAuction)
router.delete('/:id', authMiddleware, deleteAuction)

module.exports = router