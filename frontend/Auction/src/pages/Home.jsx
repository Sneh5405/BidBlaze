import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import AuctionCard from '../components/AuctionCard'
import { AuctionCardSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const CATEGORIES = [
  'all', 'electronics', 'fashion', 'vehicles',
  'art', 'furniture', 'sports', 'books', 'other'
]

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [auctions, setAuctions] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const fetchAuctions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category && category !== 'all') params.set('category', category)
      if (status && status !== 'all') params.set('status', status)
      params.set('page', page)
      params.set('limit', '12')

      const res = await api.get(`/auction/all?${params.toString()}`)
      setAuctions(res.data.auctions)
      setPagination(res.data.pagination)
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
    } finally {
      setLoading(false)
    }
  }, [search, category, status, page])

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')  // reset to page 1 on filter change
    setSearchParams(params)
  }

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

      {/* search bar */}
      <div className='relative mb-6'>
        <input
          type='text'
          placeholder='Search auctions...'
          defaultValue={search}
          onChange={e => updateParam('search', e.target.value)}
          className='w-full bg-card border border-surface text-white px-5 py-4 rounded-xl focus:outline-none focus:border-primary transition-colors pl-12'
        />
        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
      </div>

      {/* category tabs */}
      <div className='flex items-center gap-2 mb-4 flex-wrap'>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => updateParam('category', cat === 'all' ? '' : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              (cat === 'all' && !category) || category === cat
                ? 'bg-primary text-white'
                : 'bg-card text-gray-400 hover:text-white border border-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* status filter */}
      <div className='flex items-center gap-2 mb-8'>
        {['all', 'active', 'upcoming', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => updateParam('status', s === 'all' ? '' : s)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              (s === 'all' && !status) || status === s
                ? 'bg-surface text-white border border-primary'
                : 'bg-card text-gray-400 hover:text-white border border-surface'
            }`}
          >
            {s}
          </button>
        ))}

        {pagination && (
          <span className='ml-auto text-gray-400 text-sm'>
            {pagination.total} auctions found
          </span>
        )}
      </div>

      {/* grid */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(6)].map((_, i) => <AuctionCardSkeleton key={i} />)}
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          icon='🔍'
          title='No auctions found'
          description='Try adjusting your search or filters to find what you are looking for'
          action={{ href: '/', label: 'Clear filters' }}
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {auctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}

      {/* pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-center gap-3 mt-12'>
          <button
            onClick={() => updateParam('page', page - 1)}
            disabled={!pagination.hasPrev}
            className='px-4 py-2 bg-card border border-surface text-gray-400 rounded-lg disabled:opacity-50 hover:border-primary hover:text-white transition-colors'
          >
            ← Prev
          </button>

          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => updateParam('page', i + 1)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                page === i + 1
                  ? 'bg-primary text-white'
                  : 'bg-card border border-surface text-gray-400 hover:border-primary hover:text-white'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => updateParam('page', page + 1)}
            disabled={!pagination.hasNext}
            className='px-4 py-2 bg-card border border-surface text-gray-400 rounded-lg disabled:opacity-50 hover:border-primary hover:text-white transition-colors'
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default Home