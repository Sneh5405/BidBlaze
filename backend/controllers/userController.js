const prisma = require('../prisma/client')

// GET MY AUCTIONS (as seller)
const getMyAuctions = async (req, res) => {
  const userId = req.user.id

  try {
    const auctions = await prisma.auction.findMany({
      where: { sellerId: userId },
      include: {
        _count: { select: { bids: true } },
        winner: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json(auctions)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET MY BIDS (auctions i have bid on)
const getMyBids = async (req, res) => {
  const userId = req.user.id

  try {
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
                 bid.auction.status === 'active'
    }))

    res.status(200).json(bidsWithStatus)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET MY WINS (auctions i have won)
const getMyWins = async (req, res) => {
  const userId = req.user.id

  try {
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

    res.status(200).json(wonAuctions)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// GET MY PROFILE
const getMyProfile = async (req, res) => {
  const userId = req.user.id

  try {
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

    res.status(200).json(user)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { getMyAuctions, getMyBids, getMyWins, getMyProfile }