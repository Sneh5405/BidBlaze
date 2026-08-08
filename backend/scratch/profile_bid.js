const prisma = require('../prisma/client')
const { deleteCache, deleteCachePattern, CACHE_KEYS } = require('../utils/cache')
const bcrypt = require('bcryptjs')

async function runProfile() {
  console.log('=== BIDBLAZE OPERATION PROFILER ===')

  let seller = null
  let bidder = null
  let auction = null

  try {
    const passwordHash = await bcrypt.hash('testpassword123', 10)
    seller = await prisma.user.create({
      data: {
        name: 'Profile Seller',
        email: `profile_seller_${Date.now()}@example.com`,
        password: passwordHash,
      },
    })
    bidder = await prisma.user.create({
      data: {
        name: 'Profile Bidder',
        email: `profile_bidder_${Date.now()}@example.com`,
        password: passwordHash,
      },
    })
    auction = await prisma.auction.create({
      data: {
        title: 'Profile Test Product',
        description: 'Profiling step latency.',
        category: 'testing',
        startPrice: 100.0,
        currentPrice: 100.0,
        startTime: new Date(),
        endTime: new Date(Date.now() + 10 * 60 * 1000),
        status: 'active',
        sellerId: seller.id,
      },
    })

    console.log('\n--- Profiling Bid Placement Operations ---')
    const auctionId = auction.id
    const bidderId = bidder.id
    const amount = 150.0

    // Step 1: findUnique
    const t1 = Date.now()
    const dbAuction = await prisma.auction.findUnique({
      where: { id: auctionId }
    })
    const d1 = Date.now() - t1
    console.log(`1. prisma.auction.findUnique took: ${d1}ms`)

    // Step 2: updateMany (atomic check & update)
    const t2 = Date.now()
    const updated = await prisma.auction.updateMany({
      where: {
        id: auctionId,
        currentPrice: { lt: amount },
        status: 'active'
      },
      data: { currentPrice: amount }
    })
    const d2 = Date.now() - t2
    console.log(`2. prisma.auction.updateMany took: ${d2}ms`)

    // Step 3: create bid
    const t3 = Date.now()
    const bid = await prisma.bid.create({
      data: { amount, bidderId, auctionId },
      include: {
        bidder: { select: { id: true, name: true } }
      }
    })
    const d3 = Date.now() - t3
    console.log(`3. prisma.bid.create took: ${d3}ms`)

    // Step 4: Cache invalidation single keys
    const t4 = Date.now()
    await Promise.all([
      deleteCache(CACHE_KEYS.singleAuction(auctionId)),
      deleteCache(CACHE_KEYS.myBids(bidderId))
    ])
    const d4 = Date.now() - t4
    console.log(`4. deleteCache (Single Keys) took: ${d4}ms`)

    // Step 5: Cache invalidation SCAN pattern
    const t5 = Date.now()
    await deleteCachePattern('auctions:all:*')
    const d5 = Date.now() - t5
    console.log(`5. deleteCachePattern (SCAN Match) took: ${d5}ms`)

    console.log(`\nTotal Backend Operation Time: ${d1 + d2 + d3 + d4 + d5}ms`)

  } catch (err) {
    console.error('Error during profiling:', err)
  } finally {
    // Teardown
    console.log('\nCleaning up database...')
    if (auction) {
      await prisma.bid.deleteMany({ where: { auctionId: auction.id } })
      await prisma.auction.delete({ where: { id: auction.id } })
    }
    if (bidder) await prisma.user.delete({ where: { id: bidder.id } })
    if (seller) await prisma.user.delete({ where: { id: seller.id } })
    console.log('Cleanup complete.')
    process.exit(0)
  }
}

runProfile()
