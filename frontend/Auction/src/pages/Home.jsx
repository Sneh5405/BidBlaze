import { useState, useEffect } from 'react'
import api from '../api/axios'
import AuctionCard from '../components/AuctionCard'

const Home = () => {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    try {
      const res = await api.get('/auction/all')
      setAuctions(res.data)
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = auctions.filter(a => {
    if (filter === 'all') return true
    return a.status === filter
  })

  return (
    <div>
      {/* hero */}
      <div className='text-center py-16'>
        <h1 className='text-5xl font-bold text-white mb-4'>
          Bid. Win. <span className='text-primary'>Blaze.</span>
        </h1>
        <p className='text-gray-400 text-xl max-w-2xl mx-auto'>
          Discover unique items and place real-time bids. Every second counts.
        </p>
      </div>

      {/* filter tabs */}
      <div className='flex items-center gap-3 mb-8'>
        {['all', 'active', 'upcoming', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? 'bg-primary text-white'
                : 'bg-card text-gray-400 hover:text-white border border-surface'
            }`}
          >
            {tab}
          </button>
        ))}
        <span className='ml-auto text-gray-400 text-sm'>
          {filtered.length} auctions
        </span>
      </div>

      {/* auctions grid */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='bg-card border border-surface rounded-2xl h-80 animate-pulse' />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-20'>
          <p className='text-gray-400 text-xl'>No auctions found</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filtered.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home