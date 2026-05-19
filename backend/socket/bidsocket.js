const prisma = require('../prisma/client')

module.exports = (io) => {

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // user joins an auction room
    socket.on('join-auction', (auctionId) => {
      socket.join(auctionId)
      console.log(`User ${socket.id} joined auction ${auctionId}`)
    })

    // user places a bid
    socket.on('place-bid', async (data) => {
      const { auctionId, bidderId, amount } = data

      try {
        // fetch auction (single read)
        const auction = await prisma.auction.findUnique({
          where: { id: auctionId }
        })

        // validations (in memory — no DB call)
        if (!auction) {
          return socket.emit('bid-error', { message: 'Auction not found' })
        }
        if (auction.status !== 'active') {
          return socket.emit('bid-error', { message: 'Auction is not active' })
        }
        if (auction.sellerId === bidderId) {
          return socket.emit('bid-error', { message: 'You cannot bid on your own auction' })
        }
        if (amount <= auction.currentPrice) {
          return socket.emit('bid-error', { message: `Bid must be higher than ₹${auction.currentPrice}` })
        }

        // atomic update — only updates if amount is still higher
        const updated = await prisma.auction.updateMany({
          where: {
            id: auctionId,
            currentPrice: { lt: amount },
            status: 'active'
          },
          data: { currentPrice: amount }
        })

        // someone else bid higher in between
        if (updated.count === 0) {
          return socket.emit('bid-error', {
            message: 'Someone placed a higher bid just now. Please try again.'
          })
        }

        // save the bid
        const bid = await prisma.bid.create({
          data: { amount, bidderId, auctionId },
          include: {
            bidder: { select: { id: true, name: true } }
          }
        })

        // broadcast to everyone in the auction room
        io.to(auctionId).emit('bid-updated', {
          auctionId,
          currentPrice: amount,
          bid: {
            id: bid.id,
            amount: bid.amount,
            bidder: bid.bidder,
            createdAt: bid.createdAt
          }
        })

      } catch (error) {
        socket.emit('bid-error', { message: error.message })
      }
    })

    // user leaves auction room
    socket.on('leave-auction', (auctionId) => {
      socket.leave(auctionId)
      console.log(`User ${socket.id} left auction ${auctionId}`)
    })

    // user disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })
}