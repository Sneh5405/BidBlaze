const redis = require('../config/redis')

// ─── CACHE KEYS ───────────────────────────────────────────────
// centralized key names — avoids typos across files
const CACHE_KEYS = {
    allAuctions: (query) => `auctions:all:${JSON.stringify(query)}`,
    singleAuction: (id) => `auctions:single:${id}`,
    userProfile: (id) => `user:profile:${id}`,
    myAuctions: (id) => `user:auctions:${id}`,
    myBids: (id) => `user:bids:${id}`,
    myWins: (id) => `user:wins:${id}`,
}

// ─── TTL (Time To Live) ───────────────────────────────────────
// how long each cache lives in seconds
const TTL = {
    allAuctions: 30,       // 30 seconds — auctions change often
    singleAuction: 15,     // 15 seconds — bids update frequently
    userProfile: 300,      // 5 minutes — profile rarely changes
    myAuctions: 60,        // 1 minute
    myBids: 30,            // 30 seconds — bid status changes
    myWins: 120,           // 2 minutes
}

// ─── HELPERS ──────────────────────────────────────────────────

// get from cache
const getCache = async (key) => {
    try {
        const data = await redis.get(key)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.error('Cache get error:', error.message)
        return null  // if redis fails, just fetch from DB
    }
}

// set cache with TTL
const setCache = async (key, data, ttl) => {
    try {
        await redis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
        console.error('Cache set error:', error.message)
        // don't throw — caching failure shouldn't break the app
    }
}

// delete single cache key
const deleteCache = async (key) => {
    try {
        await redis.del(key)
    } catch (error) {
        console.error('Cache delete error:', error.message)
    }
}

// delete multiple keys matching a pattern
// used when auction is updated — clear all auction list caches
const deleteCachePattern = async (pattern) => {
    try {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
            await redis.del(...keys)
            console.log(`Cleared ${keys.length} cache keys matching: ${pattern}`)
        }
    } catch (error) {
        console.error('Cache pattern delete error:', error.message)
    }
}

module.exports = { getCache, setCache, deleteCache, deleteCachePattern, CACHE_KEYS, TTL }