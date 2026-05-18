const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')

// CREATE AUCTION
const createAuction = async (req, res) => {
  const { title, description, startPrice, startTime, endTime } = req.body
  const sellerId = req.user.id  // comes from authMiddleware

  try {
    // upload all images to cloudinary
    const imageUrls = []

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // convert buffer to base64 and upload
        const base64 = file.buffer.toString('base64')
        const dataUri = `data:${file.mimetype};base64,${base64}`

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'bidblaze/auctions'
        })

        imageUrls.push(result.secure_url)
      }
    }

    // validate start and end time
    const start = new Date(startTime)
    const end = new Date(endTime)
    const now = new Date()

    if (start <= now) {
      return res.status(400).json({ message: 'Start time must be in the future' })
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' })
    }

    // create auction in database
    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        images: imageUrls,
        startPrice: parseFloat(startPrice),
        currentPrice: parseFloat(startPrice), // currentPrice starts same as startPrice
        startTime: start,
        endTime: end,
        status: 'upcoming',  // starts as upcoming, becomes active when startTime arrives
        sellerId
      }
    })

    res.status(201).json({ message: 'Auction created successfully', auction })

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET ALL AUCTIONS
const getAllAuctions = async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        seller: {
          select: { id: true, name: true }  // don't expose password
        },
        _count: {
          select: { bids: true }  // show how many bids each auction has
        }
      },
      orderBy: {
        createdAt: 'desc'  // newest first
      }
    })

    res.status(200).json(auctions)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET SINGLE AUCTION
const getAuctionById = async (req, res) => {
  const { id } = req.params

  try {
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true }
        },
        bids: {
          include: {
            bidder: {
              select: { id: true, name: true }
            }
          },
          orderBy: {
            amount: 'desc'  // highest bid first
          }
        }
      }
    })

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    res.status(200).json(auction)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// DELETE AUCTION
const deleteAuction = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const auction = await prisma.auction.findUnique({
      where: { id }
    })

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' })
    }

    // only the seller can delete their own auction
    if (auction.sellerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this auction' })
    }

    // cannot delete an active auction that has bids
    if (auction.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete an active auction' })
    }

    await prisma.auction.delete({ where: { id } })

    res.status(200).json({ message: 'Auction deleted successfully' })

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { createAuction, getAllAuctions, getAuctionById, deleteAuction }
