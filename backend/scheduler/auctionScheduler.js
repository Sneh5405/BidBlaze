const cron = require('node-cron')
const prisma = require('../prisma/client')

const startAuctionScheduler = (io) => {

  // runs every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date()

    try {
      // ─── ACTIVATE UPCOMING AUCTIONS ───────────────────────────
      // find auctions where startTime has passed but still upcoming
      const auctionsToActivate = await prisma.auction.findMany({
        where: {
          status: 'upcoming',
          startTime: { lte: now }  // lte = less than or equal to
        }
      })

      for (const auction of auctionsToActivate) {
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: 'active' }
        })

        // notify everyone watching this auction
        io.to(auction.id).emit('auction-activated', {
          auctionId: auction.id,
          message: 'Auction is now active! Bidding has started.'
        })

        console.log(`Auction activated: ${auction.title}`)
      }

      // ─── CLOSE EXPIRED AUCTIONS ───────────────────────────────
      // find auctions where endTime has passed but still active
      const auctionsToClose = await prisma.auction.findMany({
        where: {
          status: 'active',
          endTime: { lte: now }  // endTime has passed
        },
        include: {
          bids: {
            orderBy: { amount: 'desc' },  // highest bid first
            take: 1,                       // only need the top bid
            include: {
              bidder: { select: { id: true, name: true } }
            }
          }
        }
      })

      for (const auction of auctionsToClose) {
        const highestBid = auction.bids[0]  // top bid (or undefined if no bids)

        // update auction status and winner
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            status: 'completed',
            winnerId: highestBid ? highestBid.bidderId : null
          }
        })

        // notify everyone in the auction room
        io.to(auction.id).emit('auction-ended', {
          auctionId: auction.id,
          winner: highestBid ? highestBid.bidder : null,
          finalPrice: highestBid ? highestBid.amount : auction.startPrice,
          message: highestBid
            ? `Auction ended! Winner is ${highestBid.bidder.name} with a bid of ${highestBid.amount}`
            : 'Auction ended with no bids.'
        })

        console.log(`Auction closed: ${auction.title} — Winner: ${highestBid ? highestBid.bidder.name : 'No bids'}`)
      }

    } catch (error) {
      console.error('Scheduler error:', error.message)
    }
  })

  console.log('Auction scheduler started ✅')
}

module.exports = startAuctionScheduler