const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const prisma = require('../prisma/client')
const { sendOTPEmail } = require('../config/mailer')
const { saveOTP, getOTP, deleteOTP } = require('../utils/otpStore')

const cookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
}

const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000 // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

// STEP 1 — send OTP
const sendOTP = async (req, res) => {
  const { name, email, password } = req.body

  try {
    // check if email already registered
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // generate 6 digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // hash password before storing temporarily
    const hashedPassword = await bcrypt.hash(password, 10)

    // save to OTP store temporarily
    saveOTP(email, { name, email, password: hashedPassword, otp })

    // send email
    await sendOTPEmail(email, otp, name)

    res.status(200).json({ message: 'OTP sent to your email' })

  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message })
  }
}

// STEP 2 — verify OTP and create account
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body

  try {
    const stored = getOTP(email)

    if (!stored) {
      return res.status(400).json({ message: 'OTP expired or not found. Please signup again.' })
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    // OTP is valid — create user
    const user = await prisma.user.create({
      data: {
        name: stored.name,
        email: stored.email,
        password: stored.password
      }
    })

    // delete OTP from store
    deleteOTP(email)

    // generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // set cookies
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_EXPIRY
    })
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_EXPIRY,
      path: '/auth/refresh'
    })

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// RESEND OTP
const resendOTP = async (req, res) => {
  const { email } = req.body

  try {
    const stored = getOTP(email)

    if (!stored) {
      return res.status(400).json({ message: 'Session expired. Please signup again.' })
    }

    // generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    saveOTP(email, { ...stored, otp })

    await sendOTPEmail(email, otp, stored.name)

    res.status(200).json({ message: 'OTP resent successfully' })

  } catch (error) {
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message })
  }
}

// LOGIN (unchanged)
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' })
    }

    // generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // set cookies
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_EXPIRY
    })
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_EXPIRY,
      path: '/auth/refresh'
    })

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email }
    })

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}
// FORGOT PASSWORD — send OTP
const sendLoginOTP = async (req, res) => {
  const { email } = req.body

  try {
    // check if user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' })
    }

    // generate OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // save to OTP store
    saveOTP(`login_${email}`, {
      name: user.name,
      email,
      userId: user.id,
      otp
    })

    // send email
    await sendOTPEmail(email, otp, user.name)

    res.status(200).json({ message: 'OTP sent to your email' })

  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message })
  }
}

// FORGOT PASSWORD — verify OTP and login
const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body

  try {
    const stored = getOTP(`login_${email}`)

    if (!stored) {
      return res.status(400).json({ message: 'OTP expired or not found. Please try again.' })
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    // OTP valid — delete it
    deleteOTP(`login_${email}`)

    // generate tokens
    const accessToken = jwt.sign(
      { id: stored.userId, email: stored.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
      { id: stored.userId, email: stored.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // set cookies
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_EXPIRY
    })
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_EXPIRY,
      path: '/auth/refresh'
    })

    // fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, name: true, email: true }
    })

    res.status(200).json({
      message: 'Logged in successfully',
      user
    })

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// REFRESH TOKEN
const refresh = async (req, res) => {
  const refreshToken = req.cookies.refresh_token

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not found' })
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)

    // generate a new access token
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    // update the access token cookie
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_EXPIRY
    })

    res.status(200).json({ message: 'Token refreshed' })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

// LOGOUT
const logout = async (req, res) => {
  res.clearCookie('access_token', cookieOptions)
  res.clearCookie('refresh_token', { ...cookieOptions, path: '/auth/refresh' })
  res.status(200).json({ message: 'Logged out successfully' })
}

module.exports = { sendOTP, verifyOTP, resendOTP, login, sendLoginOTP, verifyLoginOTP, refresh, logout }