// temporary in-memory OTP store
// each entry: { otp, name, email, password, expiresAt }
const otpStore = new Map()

const saveOTP = (email, data) => {
  otpStore.set(email, {
    ...data,
    expiresAt: Date.now() + 10 * 60 * 1000  // 10 minutes
  })
}

const getOTP = (email) => {
  const data = otpStore.get(email)
  if (!data) return null
  if (Date.now() > data.expiresAt) {
    otpStore.delete(email)
    return null
  }
  return data
}

const deleteOTP = (email) => {
  otpStore.delete(email)
}

module.exports = { saveOTP, getOTP, deleteOTP }