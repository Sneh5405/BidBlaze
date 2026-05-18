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
        // fetch current auction
        const auction = await prisma.auction.findUnique({
          where: { id: auctionId }
        })

        // validations
        if (!auction) {
          socket.emit('bid-error', { message: 'Auction not found' })
          return
        }

        if (auction.status !== 'active') {
          socket.emit('bid-error', { message: 'Auction is not active' })
          return
        }

        if (auction.sellerId === bidderId) {
          socket.emit('bid-error', { message: 'You cannot bid on your own auction' })
          return
        }

        if (amount <= auction.currentPrice) {
          socket.emit('bid-error', {
            message: `Bid must be higher than current price of ${auction.currentPrice}`
          })
          return
        }

        // save bid to database
        const bid = await prisma.bid.create({
          data: {
            amount,
            bidderId,
            auctionId
          },
          include: {
            bidder: {
              select: { id: true, name: true }
            }
          }
        })

        // update auction current price
        await prisma.auction.update({
          where: { id: auctionId },
          data: { currentPrice: amount }
        })

        // broadcast new bid to everyone in the auction room
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
        socket.emit('bid-error', { message: 'Something went wrong', error: error.message })
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