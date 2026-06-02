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
  }),
  createAuction: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().optional(),
    startPrice: z.coerce.number().positive('Starting price must be a positive number'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required')
  })
}

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body)
    next()
  } catch (error) {
    return res.status(400).json({
      message: error.errors[0]?.message || 'Validation failed',
      errors: error.errors
    })
  }
}

module.exports = { validate, schemas }
