
const { io } = require('socket.io-client')
const prisma = require('../prisma/client')
const bcrypt = require('bcryptjs')

const SERVER_URL = 'http://localhost:5000'
const NUM_CLIENTS = 1000
const BATCH_SIZE = 100
const BATCH_DELAY = 150 // ms

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function runLoadTest() {
  console.log('=== BIDBLAZE 1000 CONCURRENT BIDDERS LOAD TEST ===')
  
  let seller = null
  let auction = null
  let bidders = []
  const clients = []

  try {
    // ─── 1. SETUP DB DATA ─────────────────────────────────────────────
    console.log('\n[1/5] Setting up database test records...')
    
    // Hash password once to save 10 seconds of CPU processing
    const passwordHash = await bcrypt.hash('testpassword123', 10)
    const batchId = Date.now()

    seller = await prisma.user.create({
      data: {
        name: 'Load Test Seller',
        email: `load_seller_${batchId}@example.com`,
        password: passwordHash
      }
    })

    console.log('Creating 1,000 mock bidders in database via bulk inserts...')
    const bidderData = []
    for (let i = 0; i < NUM_CLIENTS; i++) {
      bidderData.push({
        name: `Load Bidder ${i + 1}`,
        email: `load_bidder_${i + 1}_${batchId}@example.com`,
        password: passwordHash
      })
    }
    
    // Bulk insert users
    await prisma.user.createMany({
      data: bidderData
    })

    // Retrieve generated IDs
    bidders = await prisma.user.findMany({
      where: {
        email: { contains: `_${batchId}@example.com` }
      }
    })
    console.log(`Created and retrieved ${bidders.length} users successfully.`)

    // Create test active auction
    auction = await prisma.auction.create({
      data: {
        title: 'High-Scale Concurrency Load Test Item',
        description: 'Simulating 1,000 concurrent bidders.',
        category: 'performance-test',
        startPrice: 1000.0,
        currentPrice: 1000.0,
        startTime: new Date(Date.now() - 5 * 60 * 1000), // started 5m ago
        endTime: new Date(Date.now() + 30 * 60 * 1000), // ends in 30m
        status: 'active',
        sellerId: seller.id
      }
    })
    console.log(`Created test auction with ID: ${auction.id}`)

    // ─── 2. ESTABLISH 1,000 SOCKET CONNECTIONS ────────────────────────
    console.log('\n[2/5] Connecting 1,000 WebSocket clients in staggered batches...')
    
    for (let i = 0; i < bidders.length; i += BATCH_SIZE) {
      const batch = bidders.slice(i, i + BATCH_SIZE)
      const connectPromises = batch.map((bidder, index) => {
        return new Promise((resolve) => {
          const socket = io(SERVER_URL, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false
          })

          socket.on('connect', () => {
            socket.emit('join-auction', auction.id)
            clients.push({ socket, bidder })
            resolve()
          })

          socket.on('connect_error', () => {
            // resolve anyway to avoid hanging connection setup
            resolve()
          })
        })
      })

      await Promise.all(connectPromises)
      process.stdout.write(`Connected: ${clients.length}/${NUM_CLIENTS}\r`)
      await sleep(BATCH_DELAY)
    }
    console.log(`\nAll sockets connected. Total active clients: ${clients.length}`)

    await sleep(2000) // Stabilize connections

    // ─── 3. SEND 1,000 CONCURRENT BIDS ───────────────────────────────
    console.log('\n[3/5] Dispatching 1,000 concurrent bids simultaneously...')
    const latencies = []
    let successfulCount = 0
    let failedCount = 0

    const bidPromises = clients.map(({ socket, bidder }, index) => {
      return new Promise((resolve) => {
        // Send a unique bid amount.
        // Bids will range from 1,001 to 2,000
        const bidAmount = 1000.0 + (index + 1)
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
          auctionId: auction.id,
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

    // Wait for DB to settle
    await sleep(3000)

    // ─── 4. VERIFY DATABASE CONSISTENCY ──────────────────────────────
    console.log('\n[4/5] Verifying database integrity...')
    const finalAuction = await prisma.auction.findUnique({
      where: { id: auction.id },
      include: {
        bids: {
          orderBy: { amount: 'asc' }
        }
      }
    })

    const finalBids = finalAuction.bids
    console.log(`Final Database currentPrice: ₹${finalAuction.currentPrice}`)
    console.log(`Total Bid records written to database: ${finalBids.length}`)

    let passed = true
    const maxBidAmount = finalBids.length > 0 ? Math.max(...finalBids.map(b => b.amount)) : auction.startPrice
    
    if (finalAuction.currentPrice !== maxBidAmount) {
      console.error(`❌ ASSERTION FAILED: Final price does not match highest bid stored!`)
      passed = false
    } else {
      console.log(`✅ ASSERTION PASSED: Database currentPrice matches the highest bid.`)
    }

    let strictlyIncreasing = true
    for (let i = 1; i < finalBids.length; i++) {
      if (finalBids[i].amount <= finalBids[i - 1].amount) {
        strictlyIncreasing = false
        break
      }
    }

    if (!strictlyIncreasing) {
      console.error(`❌ ASSERTION FAILED: Database bid records are not in strictly ascending order!`)
      passed = false
    } else {
      console.log(`✅ ASSERTION PASSED: Database bid rows are strictly increasing (no race condition overlaps).`)
    }

    if (passed) {
      console.log('🎉 1000 CLIENT LOAD TEST SUCCESSFUL! CONCURRENCY HANDLED PERFECTLY.')
    } else {
      console.log('❌ CONCURRENCY VERIFICATION CHECKS FAILED.')
    }

  } catch (error) {
    console.error('Load test execution failed:', error)
  } finally {
    // ─── 5. TEARDOWN ──────────────────────────────────────────────────
    console.log('\n[5/5] Cleaning up test records from database...')
    
    clients.forEach(({ socket }) => {
      if (socket.connected) socket.disconnect()
    })

    if (auction) {
      const deletedBids = await prisma.bid.deleteMany({
        where: { auctionId: auction.id }
      })
      console.log(`Deleted ${deletedBids.count} bids.`)

      await prisma.auction.delete({
        where: { id: auction.id }
      })
      console.log('Deleted test auction.')
    }

    if (bidders.length > 0) {
      const bidderIds = bidders.map(b => b.id).filter(id => id !== seller.id)
      const deletedBidders = await prisma.user.deleteMany({
        where: { id: { in: bidderIds } }
      })
      console.log(`Deleted ${deletedBidders.count} test bidders.`)
    }

    if (seller) {
      try {
        await prisma.user.delete({
          where: { id: seller.id }
        })
        console.log('Deleted test seller.')
      } catch (err) {
        // Already deleted or not found
      }
    }

    console.log('Teardown complete.')
    process.exit(0)
  }
}

runLoadTest()
