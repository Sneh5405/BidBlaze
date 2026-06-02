console.log('Script started')

require('dotenv').config()

console.log('ENV loaded')
console.log('HOST:', process.env.REDIS_HOST)
console.log('PORT:', process.env.REDIS_PORT)
console.log('PASS:', process.env.REDIS_PASSWORD ? 'set' : 'NOT SET')

try {
  const Redis = require('ioredis')
  console.log('ioredis loaded')

  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 10000
  })

  redis.on('connect', () => console.log('Redis connected ✅'))
  redis.on('error', (err) => console.log('Redis error:', err.message))

  setTimeout(() => {
    console.log('Timeout reached — check above for errors')
    process.exit(0)
  }, 5000)

} catch (err) {
  console.log('Crash:', err.message)
}