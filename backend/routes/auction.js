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
const {
  createAuctionLimiter,
  uploadLimiter
} = require('../middleware/rateLimiter')
const { validate, schemas } = require('../middleware/validate')

router.get('/all', getAllAuctions)
router.get('/:id', getAuctionById)
router.post(
  '/create',
  authMiddleware,
  createAuctionLimiter,
  uploadLimiter,
  upload.array('images', 5),
  validate(schemas.createAuction),  // ← validates all auction fields
  createAuction
)
router.delete('/:id', authMiddleware, deleteAuction)

module.exports = router 