const { rateLimit, ipKeyGenerator } = require('express-rate-limit')

// ─── GENERAL API ──────────────────────────────────────────────
// applies to all routes — generous limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                   // 200 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests, please try again after 15 minutes'
  }
})

// ─── AUTH ROUTES ──────────────────────────────────────────────
// strict — prevents brute force attacks on login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // only 10 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts, please try again after 15 minutes'
  }
})

// ─── OTP ROUTES ───────────────────────────────────────────────
// very strict — prevents OTP spam
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 3,                     // only 3 OTP requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many OTP requests, please wait a minute before trying again'
  }
})

// ─── BIDDING ──────────────────────────────────────────────────
// prevents bid spamming
const bidLimiter = rateLimit({
  windowMs: 10 * 1000,        // 10 seconds
  max: 5,                     // max 5 bids per 10 seconds per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // rate limit per user not per IP
    // user id comes from JWT via authMiddleware
    return req.user?.id || ipKeyGenerator(req.ip)
  },
  message: {
    message: 'You are bidding too fast, please slow down'
  }
})

// ─── AUCTION CREATION ─────────────────────────────────────────
// prevents spam listings
const createAuctionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,                    // max 10 auctions per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    message: 'You have created too many auctions, please try again after an hour'
  }
})

// ─── IMAGE UPLOAD ─────────────────────────────────────────────
// cloudinary has costs — prevent abuse
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 30,                    // 30 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    message: 'Too many image uploads, please try again after an hour'
  }
})

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  bidLimiter,
  createAuctionLimiter,
  uploadLimiter
}