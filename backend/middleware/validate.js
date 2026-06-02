const { z } = require('zod')

const schemas = {
  placeBid: z.object({
    auctionId: z.string(),
    bidderId: z.string(),
    amount: z.number().positive()
  }),
  sendMessage: z.object({
    roomId: z.string(),
    senderId: z.string(),
    content: z.string().min(1)
  })
}

module.exports = { schemas }
