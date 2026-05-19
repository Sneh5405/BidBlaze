const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const sendOTPEmail = async (email, otp, name) => {
  await transporter.sendMail({
    from: `"BidBlaze 🔨" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your BidBlaze OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #E85D24; margin-bottom: 8px;">🔨 BidBlaze</h1>
        <h2 style="color: #ffffff; margin-bottom: 24px;">Verify your email</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">Hi ${name}, use the OTP below to complete your signup.</p>
        <div style="background: #0f3460; border: 2px solid #E85D24; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">Your OTP Code</p>
          <h2 style="color: #E85D24; font-size: 40px; letter-spacing: 12px; margin: 0;">${otp}</h2>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">This OTP expires in <strong style="color: #ffffff;">10 minutes</strong>.</p>
        <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, ignore this email.</p>
      </div>
    `
  })
}

module.exports = { sendOTPEmail }