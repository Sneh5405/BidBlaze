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
const sendWinnerEmail = async (winner, seller, auction, amount) => {
  await transporter.sendMail({
    from: `"BidBlaze 🔨" <${process.env.EMAIL_USER}>`,
    to: winner.email,
    subject: `🏆 You won: ${auction.title}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #E85D24;">🔨 BidBlaze</h1>
        <h2 style="color: #ffffff;">Congratulations ${winner.name}! 🏆</h2>
        <p style="color: #9ca3af;">You won the auction for <strong style="color: #fff;">${auction.title}</strong> with a bid of <strong style="color: #E85D24;">₹${amount.toLocaleString()}</strong></p>
        <div style="background: #0f3460; border: 2px solid #E85D24; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: #9ca3af; margin: 0 0 8px;">Seller Contact</p>
          <h3 style="color: #fff; margin: 0 0 4px;">${seller.name}</h3>
          <p style="color: #E85D24; margin: 0;">${seller.email}</p>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">Contact the seller to arrange payment and delivery. You can also chat with them directly on BidBlaze.</p>
      </div>
    `
  })
}

const sendSellerEmail = async (seller, winner, auction, amount) => {
  await transporter.sendMail({
    from: `"BidBlaze 🔨" <${process.env.EMAIL_USER}>`,
    to: seller.email,
    subject: `✅ Your auction ended: ${auction.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #E85D24;">🔨 BidBlaze</h1>
        <h2 style="color: #ffffff;">Your auction has ended!</h2>
        <p style="color: #9ca3af;">Your item <strong style="color: #fff;">${auction.title}</strong> sold for <strong style="color: #E85D24;">₹${amount.toLocaleString()}</strong></p>
        <div style="background: #0f3460; border: 2px solid #E85D24; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: #9ca3af; margin: 0 0 8px;">Winner Contact</p>
          <h3 style="color: #fff; margin: 0 0 4px;">${winner.name}</h3>
          <p style="color: #E85D24; margin: 0;">${winner.email}</p>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">Contact the winner to arrange payment and delivery. You can also chat with them directly on BidBlaze.</p>
      </div>
    `
  })
}

module.exports = { sendOTPEmail, sendWinnerEmail, sendSellerEmail }

