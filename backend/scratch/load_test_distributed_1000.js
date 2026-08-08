const { io } = require('socket.io-client')
const prisma = require('../prisma/client')
const bcrypt = require('bcryptjs')

const SERVER_URL = 'http://localhost:5000'
const NUM_CLIENTS = 1000
const NUM_AUCTIONS = 500
const BATCH_SIZE = 100
const BATCH_DELAY = 150

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function runDistributedLoadTest() {
  console.log('=== BIDBLAZE DISTRIBUTED LOAD TEST ===')
  console.log(`Config: 1,000 concurrent users bidding across 500 active items\n`)

  let seller = null
  let bidders = []
  let auctions = []
  const clients = []
  const batchId = Date.now()

  try {
    // ─── 1. SETUP DB DATA ─────────────────────────────────────────────
    console.log('[1/5] Setting up database test data (500 auctions, 1,000 bidders)...')
    const passwordHash = await bcrypt.hash('testpassword123', 10)

    seller = await prisma.user.create({
      data: {
        name: 'Distributed Seller',
        email: `dist_seller_${batchId}@example.com`,
        password: passwordHash
      }
    })

    console.log('Creating 1,000 mock bidders...')
    const bidderData = []
    for (let i = 0; i < NUM_CLIENTS; i++) {
      bidderData.push({
        name: `Dist Bidder ${i + 1}`,
        email: `dist_bidder_${i + 1}_${batchId}@example.com`,
        password: passwordHash
      })
    }
    await prisma.user.createMany({ data: bidderData })
    bidders = await prisma.user.findMany({
      where: { email: { contains: `_${batchId}@example.com` } }
    })

    console.log('Creating 500 active auctions...')
    const auctionData = []
    for (let i = 0; i < NUM_AUCTIONS; i++) {
      auctionData.push({
        title: `Dist Auction Product #${i + 1}`,
        description: `Bidding test for product ${i + 1}`,
        category: 'performance-test',
        startPrice: 100.0,
        currentPrice: 100.0,
        startTime: new Date(Date.now() - 5 * 60 * 1000), // active
        endTime: new Date(Date.now() + 30 * 60 * 1000),
        status: 'active',
        sellerId: seller.id
      })
    }
    await prisma.auction.createMany({ data: auctionData })
    auctions = await prisma.auction.findMany({
      where: { sellerId: seller.id }
    })

    console.log('Setup finished successfully.')

    // ─── 2. CONNECT SOCKETS & JOIN ROOMS ──────────────────────────────
    console.log('\n[2/5] Connecting 1,000 WebSocket clients in staggered batches...')
    
    for (let i = 0; i < bidders.length; i += BATCH_SIZE) {
      const batch = bidders.slice(i, i + BATCH_SIZE)
      const connectPromises = batch.map((bidder, index) => {
        return new Promise((resolve) => {
          // Assign to a random auction from the 500 active ones
          const randomAuctionIndex = Math.floor(Math.random() * auctions.length)
          const assignedAuction = auctions[randomAuctionIndex]

          const socket = io(SERVER_URL, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false
          })

          socket.on('connect', () => {
            socket.emit('join-auction', assignedAuction.id)
            clients.push({ socket, bidder, assignedAuction })
            resolve()
          })

          socket.on('connect_error', () => {
            resolve()
          })
        })
      })

      await Promise.all(connectPromises)
      process.stdout.write(`Connected: ${clients.length}/${NUM_CLIENTS}\r`)
      await sleep(BATCH_DELAY)
    }
    console.log(`\nAll sockets connected. Total active clients: ${clients.length}`)
    await sleep(2000) // Stabilize

    // ─── 3. EXECUTE SIMULTANEOUS BIDS ───────────────────────────────
    console.log('\n[3/5] Dispatching 1,000 concurrent bids distributed across 500 items...')
    const latencies = []
    let successfulCount = 0
    let failedCount = 0

    const bidPromises = clients.map(({ socket, bidder, assignedAuction }) => {
      return new Promise((resolve) => {
        // Place a bid slightly higher than current price
        const bidAmount = assignedAuction.currentPrice + 10.0
        const bidSentTime = Date.now()

        let resolved = false
        const finalize = (success) => {
          if (!resolved) {
            resolved = true
            latencies.push(Date.now() - bidSentTime)
            if (success) successfulCount++
            else failedCount++
            
            socket.off('bid-updated')
            socket.off('bid-error')
            resolve()
          }
        }

        socket.on('bid-updated', (data) => {
          if (data.bid.amount === bidAmount && data.bid.bidder.id === bidder.id) {
            finalize(true)
          }
        })

        socket.on('bid-error', () => {
          finalize(false)
        })

        socket.emit('place-bid', {
          auctionId: assignedAuction.id,
          bidderId: bidder.id,
          amount: bidAmount
        })
      })
    })

    const burstStartTime = Date.now()
    await Promise.all(bidPromises)
    const totalDuration = Date.now() - burstStartTime

    console.log(`\nBurst finished in ${totalDuration}ms.`)
    console.log(`Socket results - Successful: ${successfulCount}, Failed/Rejected: ${failedCount}`)

    // Calculate Latency Metrics
    const sum = latencies.reduce((a, b) => a + b, 0)
    const averageLatency = sum / latencies.length
    const maxLatency = Math.max(...latencies)
    const minLatency = Math.min(...latencies)

    console.log(`\n--- Latency Performance Metrics ---`)
    console.log(`Average Latency: ${averageLatency.toFixed(2)} ms`)
    console.log(`Minimum Latency: ${minLatency} ms`)
    console.log(`Maximum Latency: ${maxLatency} ms`)

    await sleep(2000)

  } catch (error) {
    console.error('Distributed load test failed:', error.message)
  } finally {
    // ─── 5. TEARDOWN ──────────────────────────────────────────────────
    console.log('\n[5/5] Cleaning up test data from database...')
    
    clients.forEach(({ socket }) => {
      if (socket.connected) socket.disconnect()
    })

    if (seller) {
      const auctionIds = auctions.map(a => a.id)
      
      await prisma.bid.deleteMany({
        where: { auctionId: { in: auctionIds } }
      })
      console.log('Deleted bids.')

      await prisma.auction.deleteMany({
        where: { sellerId: seller.id }
      })
      console.log('Deleted test auctions.')
    }

    if (bidders.length > 0) {
      const bidderIds = bidders.map(b => b.id).filter(id => id !== seller.id)
      await prisma.user.deleteMany({
        where: { id: { in: bidderIds } }
      })
      console.log(`Deleted ${bidders.length} test bidders.`)
    }

    if (seller) {
      await prisma.user.delete({ where: { id: seller.id } })
      console.log('Deleted test seller.')
    }

    console.log('Teardown complete.')
    process.exit(0)
  }
}

runDistributedLoadTest()
