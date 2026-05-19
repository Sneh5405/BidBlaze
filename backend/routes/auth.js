const express = require('express')
const router = express.Router()
const {
  sendOTP,
  verifyOTP,
  resendOTP,
  login,
  sendLoginOTP,
  verifyLoginOTP
} = require('../controllers/authController')

router.post('/signup', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp', resendOTP)
router.post('/login', login)
router.post('/forgot-password', sendLoginOTP)
router.post('/verify-login-otp', verifyLoginOTP)

module.exports = router