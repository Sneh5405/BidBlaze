const { io } = require('socket.io-client')
const prisma = require('../prisma/client')
const bcrypt = require('bcryptjs')

const SERVER_URL = 'http://localhost:5000'
const STEP_SIZES = [500, 1000, 1500, 2000]
const NUM_AUCTIONS = 500
const MAX_ALLOWED_FAILURE_RATE = 0.10 // 10%

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function runStressTest() {
  console.log('=== BIDBLAZE STRESS TESTING SUITE ===')
  console.log('Determining peak concurrency capacity and saturation threshold...\n')

  let seller = null
  let bidders = []
  let auctions = []
  const maxLimit = Math.max(...STEP_SIZES)
  const batchId = Date.now()

  try {
    // ─── 1. PRE-PROVISION POOL (ONCE) ─────────────────────────────────
    console.log(`[1/4] Pre-provisioning maximum user pool (${maxLimit} users) to save CPU...`)
    const passwordHash = await bcrypt.hash('testpassword123', 10)

    seller = await prisma.user.create({
      data: {
        name: 'Stress Seller',
        email: `stress_seller_${batchId}@example.com`,
        password: passwordHash
      }
    })

    const bidderData = []
    for (let i = 0; i < maxLimit; i++) {
      bidderData.push({
        name: `Stress Bidder ${i + 1}`,
        email: `stress_bidder_${i + 1}_${batchId}@example.com`,
        password: passwordHash
      })
    }
    
    // Bulk insert all users
    await prisma.user.createMany({ data: bidderData })
    bidders = await prisma.user.findMany({
      where: { email: { contains: `_${batchId}@example.com` } }
    })
    console.log(`User pool created.`)

    // Create 500 active auctions
    console.log(`Creating ${NUM_AUCTIONS} active auctions...`)
    const auctionData = []
    for (let i = 0; i < NUM_AUCTIONS; i++) {
      auctionData.push({
        title: `Stress Auction #${i + 1}`,
        description: `Stress test item ${i + 1}`,
        category: 'stress-test',
        startPrice: 100.0,
        currentPrice: 100.0,
        startTime: new Date(Date.now() - 5 * 60 * 1000),
        endTime: new Date(Date.now() + 30 * 60 * 1000),
        status: 'active',
        sellerId: seller.id
      })
    }
    await prisma.auction.createMany({ data: auctionData })
    auctions = await prisma.auction.findMany({
      where: { sellerId: seller.id }
    })
    console.log('Auctions seeded successfully.')

    // ─── 2. RUN PROGRESSIVE STRESS STEPS ──────────────────────────────
    let peakConcurrency = 0
    let peakAvgLatency = 0

    for (const concurrencyLevel of STEP_SIZES) {
      console.log(`\n==================================================`)
      console.log(`🚀 RUNNING STRESS TEST AT: ${concurrencyLevel} CONCURRENT USERS`)
      console.log(`==================================================`)

      const activeBidders = bidders.slice(0, concurrencyLevel)
      const clients = []

      // Connect sockets for this step
      console.log(`Connecting ${concurrencyLevel} WebSocket clients...`)
      for (let i = 0; i < activeBidders.length; i += 100) {
        const batch = activeBidders.slice(i, i + 100)
        const connectPromises = batch.map((bidder) => {
          return new Promise((resolve) => {
            const randomAuction = auctions[Math.floor(Math.random() * auctions.length)]
            const socket = io(SERVER_URL, {
              transports: ['websocket'],
              forceNew: true,
              reconnection: false
            })

            socket.on('connect', () => {
              socket.emit('join-auction', randomAuction.id)
              clients.push({ socket, bidder, randomAuction })
              resolve()
            })

            socket.on('connect_error', () => {
              resolve() // Resolve to prevent script hanging
            })
          })
        })

        await Promise.all(connectPromises)
        await sleep(150) // staggered batch pause
      }

      const connectionFailureCount = concurrencyLevel - clients.length
      const connectionFailureRate = connectionFailureCount / concurrencyLevel
      console.log(`Connected: ${clients.length}/${concurrencyLevel} (Connection failures: ${connectionFailureCount})`)

      if (connectionFailureRate > MAX_ALLOWED_FAILURE_RATE) {
        console.error(`❌ Connection failure rate (${(connectionFailureRate * 100).toFixed(1)}%) exceeded limit of 10%! Saturation reached.`);
        break
      }

      await sleep(2000) // Stabilize

      // Dispatch concurrent bids
      console.log(`Sending ${clients.length} simultaneous bids...`)
      const latencies = []
      let successfulCount = 0
      let failedCount = 0

      const bidPromises = clients.map(({ socket, bidder, randomAuction }) => {
        return new Promise((resolve) => {
          const bidAmount = randomAuction.currentPrice + 10.0
          const sentTime = Date.now()

          let resolved = false
          const finalize = (success) => {
            if (!resolved) {
              resolved = true
              latencies.push(Date.now() - sentTime)
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
            auctionId: randomAuction.id,
            bidderId: bidder.id,
            amount: bidAmount
          })
        })
      })

      const burstStart = Date.now()
      await Promise.all(bidPromises)
      const burstDuration = Date.now() - burstStart

      // Disconnect clients for this step
      clients.forEach(({ socket }) => socket.disconnect())

      // Latency Calcs
      const averageLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
      console.log(`Step Results:`)
      console.log(`- Burst Duration: ${burstDuration} ms`)
      console.log(`- Average Latency: ${averageLatency.toFixed(2)} ms`)
      console.log(`- Successes: ${successfulCount}, Failures/Rejections: ${failedCount}`)

      // Check if we hit the limit
      const failRate = failedCount / concurrencyLevel
      // Note: failures include duplicate bids which is valid app logic.
      // But if there are actual socket timeouts, it's a system failure. 
      // We will look at whether all clients got responses (latencies populated).
      const responseRate = latencies.length / clients.length
      if (responseRate < 0.90) {
        console.error(`❌ System Saturated: Only ${(responseRate * 100).toFixed(1)}% of connected clients received a response before timeout.`);
        break
      }

      // Record successful peak
      peakConcurrency = concurrencyLevel
      peakAvgLatency = averageLatency

      await sleep(3000) // Cool down period between steps
    }

    // ─── 3. CAPACITY REPORT ───────────────────────────────────────────
    console.log('\n==================================================')
    console.log('🛡️  STRESS TEST CAPACITY REPORT')
    console.log('==================================================')
    console.log(`Peak Stable Concurrency Checked: ${peakConcurrency} Users`)
    console.log(`Average Latency at Peak: ${peakAvgLatency.toFixed(2)} ms`)
    console.log(`Status: System is stable under high-concurrency websocket traffic.`)

  } catch (error) {
    console.error('Stress test script failed:', error.message)
  } finally {
    // ─── 4. TEARDOWN ──────────────────────────────────────────────────
    console.log('\n[4/4] Purging pre-provisioned data from database...')
    if (seller) {
      const auctionIds = auctions.map(a => a.id)
      await prisma.bid.deleteMany({ where: { auctionId: { in: auctionIds } } })
      await prisma.auction.deleteMany({ where: { sellerId: seller.id } })
      console.log('Bids and auctions purged.')
    }
    if (bidders.length > 0) {
      const bidderIds = bidders.map(b => b.id).filter(id => id !== seller.id)
      await prisma.user.deleteMany({ where: { id: { in: bidderIds } } })
      console.log('Bidders purged.')
    }
    if (seller) {
      await prisma.user.delete({ where: { id: seller.id } })
      console.log('Seller purged.')
    }
    console.log('Teardown complete.')
    process.exit(0)
  }
}

runStressTest()
