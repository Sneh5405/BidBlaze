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
    const result = await prisma.$transaction(async (tx) => {
      // fetch auction INSIDE transaction
      const auction = await tx.auction.findUnique({
        where: { id: auctionId }
      })

      // validations
      if (!auction) throw new Error('Auction not found')
      if (auction.status !== 'active') throw new Error('Auction is not active')
      if (auction.sellerId === bidderId) throw new Error('You cannot bid on your own auction')
      if (amount <= auction.currentPrice) throw new Error(`Bid must be higher than current price of ${auction.currentPrice}`)

      // save bid to database
      const bid = await tx.bid.create({
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
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: amount }
      })

      return { bid, updatedAuction }
    })

    // broadcast new bid to everyone in the auction room
    io.to(auctionId).emit('bid-updated', {
      auctionId,
      currentPrice: result.updatedAuction.currentPrice,
      bid: {
        id: result.bid.id,
        amount: result.bid.amount,
        bidder: result.bid.bidder,
        createdAt: result.bid.createdAt
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