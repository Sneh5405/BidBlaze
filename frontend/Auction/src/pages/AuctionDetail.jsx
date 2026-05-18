import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BidPanel from '../components/BidPanel'
import Countdown from '../components/Countdown'

const AuctionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [auction, setAuction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    fetchAuction()
  }, [id])

  const fetchAuction = async () => {
    try {
      const res = await api.get(`/auction/${id}`)
      setAuction(res.data)
    } catch (error) {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-gray-400'>Loading auction...</div>
      </div>
    )
  }

  if (!auction) return null

  return (
    <div className='py-8'>

      {/* back button */}
      <button
        onClick={() => navigate('/')}
        className='text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors'
      >
        ← Back to auctions
      </button>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>

        {/* left — images */}
        <div>
          {/* main image */}
          <div className='bg-card border border-surface rounded-2xl overflow-hidden h-96 mb-4'>
            {auction.images && auction.images.length > 0 ? (
              <img
                src={auction.images[activeImage]}
                alt={auction.title}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-gray-500'>
                No Image
              </div>
            )}
          </div>

          {/* thumbnail strip */}
          {auction.images && auction.images.length > 1 && (
            <div className='flex gap-3'>
              {auction.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImage === index ? 'border-primary' : 'border-surface'
                  }`}
                >
                  <img src={img} alt='' className='w-full h-full object-cover' />
                </button>
              ))}
            </div>
          )}

          {/* auction info */}
          <div className='bg-card border border-surface rounded-2xl p-6 mt-6'>
            <div className='flex items-start justify-between mb-4'>
              <div>
                <h1 className='text-2xl font-bold text-white mb-2'>{auction.title}</h1>
                <div className='flex items-center gap-2'>
                  <div className='w-7 h-7 bg-primary rounded-full flex items-center justify-center text-xs font-bold'>
                    {auction.seller?.name?.charAt(0).toUpperCase()}
                  </div>
                  <p className='text-gray-400 text-sm'>
                    by <span className='text-white'>{auction.seller?.name}</span>
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                auction.status === 'active' ? 'bg-green-500' :
                auction.status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-500'
              } text-white`}>
                {auction.status.toUpperCase()}
              </span>
            </div>

            <p className='text-gray-300 leading-relaxed mb-6'>{auction.description}</p>

            {/* countdown */}
            {auction.status === 'active' && (
              <div>
                <p className='text-gray-400 text-sm mb-2'>Auction ends in</p>
                <Countdown endTime={auction.endTime} />
              </div>
            )}

            {auction.status === 'upcoming' && (
              <div>
                <p className='text-gray-400 text-sm mb-1'>Auction starts</p>
                <p className='text-blue-400 font-medium'>
                  {new Date(auction.startTime).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* right — bid panel */}
        <div>
          <BidPanel auction={auction} />
        </div>

      </div>
    </div>
  )
}

export default AuctionDetail