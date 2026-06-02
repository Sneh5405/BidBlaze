const prisma = require('../prisma/client')
const { imagePresets } = require('../utils/cloudinaryHelper')
const { getCache, setCache, CACHE_KEYS, TTL } = require('../utils/cache')

// GET MY AUCTIONS (as seller)
const getMyAuctions = async (req, res) => {
  const userId = req.user.id

  try {
    const cacheKey = CACHE_KEYS.myAuctions(userId)
    const cached = await getCache(cacheKey)
    if (cached) return res.status(200).json(cached)

    const auctions = await prisma.auction.findMany({
      where: { sellerId: userId },
      include: {
        _count: { select: { bids: true } },
        winner: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // use preview size for dashboard
    const optimized = auctions.map(auction => ({
      ...auction,
      images: auction.images.map(img => imagePresets.preview(img))
    }))

    await setCache(cacheKey, optimized, TTL.myAuctions)
    res.status(200).json(optimized)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET MY BIDS (auctions i have bid on)
const getMyBids = async (req, res) => {
  const userId = req.user.id

  try {
    const cacheKey = CACHE_KEYS.myBids(userId)
    const cached = await getCache(cacheKey)
    if (cached) return res.status(200).json(cached)

    const bids = await prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            currentPrice: true,
            status: true,
            endTime: true,
            images: true,
            winnerId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // add a flag to each bid showing if user is currently winning
    const bidsWithStatus = bids.map(bid => ({
      ...bid,
      isWinning: bid.auction.currentPrice === bid.amount &&
        bid.auction.status === 'active',
      auction: {
        ...bid.auction,
        images: bid.auction.images.map(img => imagePresets.preview(img))
      }
    }))

    await setCache(cacheKey, bidsWithStatus, TTL.myBids)
    res.status(200).json(bidsWithStatus)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET MY WINS (auctions i have won)
const getMyWins = async (req, res) => {
  const userId = req.user.id

  try {
    const cacheKey = CACHE_KEYS.myWins(userId)
    const cached = await getCache(cacheKey)
    if (cached) return res.status(200).json(cached)

    const wonAuctions = await prisma.auction.findMany({
      where: {
        winnerId: userId,
        status: 'completed'
      },
      include: {
        seller: { select: { id: true, name: true } },
        bids: {
          where: { bidderId: userId },
          orderBy: { amount: 'desc' },
          take: 1  // just the winning bid amount
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const optimized = wonAuctions.map(auction => ({
      ...auction,
      images: auction.images.map(img => imagePresets.preview(img))
    }))
    await setCache(cacheKey, optimized, TTL.myWins)
    res.status(200).json(optimized)
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET MY PROFILE
const getMyProfile = async (req, res) => {
  const userId = req.user.id

  try {
    const cacheKey = CACHE_KEYS.userProfile(userId)
    const cached = await getCache(cacheKey)
    if (cached) return res.status(200).json(cached)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            auctions: true,  // how many auctions they created
            bids: true       // how many bids they placed
          }
        }
      }
    })

    await setCache(cacheKey, user, TTL.userProfile)
    res.status(200).json(user)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { getMyAuctions, getMyBids, getMyWins, getMyProfile }