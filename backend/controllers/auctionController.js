const prisma = require('../prisma/client')
const cloudinary = require('../config/cloudinary')

// CREATE AUCTION
const createAuction = async (req, res) => {
  const { title, description, startPrice, startTime, endTime, category } = req.body
  const sellerId = req.user.id

  try {
    // upload all images to cloudinary
    const imageUrls = []

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
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
        category: category || 'other',   // ← added
        images: imageUrls,
        startPrice: parseFloat(startPrice),
        currentPrice: parseFloat(startPrice),
        startTime: start,
        endTime: end,
        status: 'upcoming',
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
    const {
      page = 1,
      limit = 12,
      search = '',
      category = '',
      status = ''
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // build filter dynamically
    const where = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) where.category = category
    if (status) where.status = status

    // run both queries in parallel
    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true } },
          _count: { select: { bids: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.auction.count({ where })
    ])

    res.status(200).json({
      auctions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    })

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

    if (auction.sellerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this auction' })
    }

    if (auction.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete an active auction' })
    }

    // delete images from Cloudinary
    if (auction.images && auction.images.length > 0) {
      for (const imageUrl of auction.images) {
        // extract public_id from cloudinary URL
        // URL format: https://res.cloudinary.com/cloud/image/upload/v123/bidblaze/auctions/filename.jpg
        const parts = imageUrl.split('/')
        const filename = parts[parts.length - 1].split('.')[0]
        const publicId = `bidblaze/auctions/${filename}`

        await cloudinary.uploader.destroy(publicId)
      }
      console.log(`Deleted ${auction.images.length} images from Cloudinary`)
    }

    await prisma.auction.delete({ where: { id } })

    res.status(200).json({ message: 'Auction deleted successfully' })

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { createAuction, getAllAuctions, getAuctionById, deleteAuction }
