import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import useAuthStore from '../store/authStore'

let socket

const BidPanel = ({ auction }) => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [currentPrice, setCurrentPrice] = useState(auction.currentPrice)
  const [bids, setBids] = useState(auction.bids || [])
  const [bidAmount, setBidAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // connect to socket
    socket = io('http://localhost:5000')

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-auction', auction.id)
    })

    // listen for new bids
    socket.on('bid-updated', (data) => {
      setCurrentPrice(data.currentPrice)
      setBids(prev => [data.bid, ...prev])
      setSuccess('')
      setError('')
    })

    socket.on('bid-error', (data) => {
      setError(data.message)
    })

    socket.on('auction-ended', (data) => {
      setError(data.message)
    })

    return () => {
      socket.emit('leave-auction', auction.id)
      socket.disconnect()
    }
  }, [auction.id])

  const handleBid = () => {
    if (!user) {
      navigate('/login')
      return
    }

    const amount = parseFloat(bidAmount)

    if (!amount || amount <= currentPrice) {
      setError(`Bid must be higher than ₹${currentPrice}`)
      return
    }

    setError('')
    setSuccess('Placing bid...')

    socket.emit('place-bid', {
      auctionId: auction.id,
      bidderId: user.id,
      amount
    })

    setBidAmount('')
  }

  const isSeller = user?.id === auction.sellerId
  const isActive = auction.status === 'active'

  return (
    <div className='space-y-6'>

      {/* current price */}
      <div className='bg-card border border-surface rounded-2xl p-6'>
        <p className='text-gray-400 text-sm mb-1'>Current Price</p>
        <p className='text-4xl font-bold text-primary'>
          ₹{currentPrice.toLocaleString()}
        </p>
        <p className='text-gray-400 text-sm mt-2'>
          Started at ₹{auction.startPrice.toLocaleString()}
        </p>

        {/* socket connection indicator */}
        <div className='flex items-center gap-2 mt-3'>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className='text-gray-400 text-xs'>
            {connected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* bid input */}
      {isActive && !isSeller && (
        <div className='bg-card border border-surface rounded-2xl p-6'>
          <p className='text-white font-semibold mb-4'>Place Your Bid</p>

          {error && (
            <div className='bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm'>
              {error}
            </div>
          )}

          {success && (
            <div className='bg-green-500 bg-opacity-20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm'>
              {success}
            </div>
          )}

          <div className='flex gap-3'>
            <input
              type='number'
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              placeholder={`Min ₹${currentPrice + 1}`}
              className='flex-1 bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
            />
            <button
              onClick={handleBid}
              className='bg-primary hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors'
            >
              Bid Now
            </button>
          </div>

          {!user && (
            <p className='text-gray-400 text-sm mt-3'>
              <span
                onClick={() => navigate('/login')}
                className='text-primary cursor-pointer hover:underline'
              >
                Login
              </span> to place a bid
            </p>
          )}
        </div>
      )}

      {isSeller && (
        <div className='bg-surface border border-gray-600 rounded-2xl p-4 text-center'>
          <p className='text-gray-400 text-sm'>You are the seller of this auction</p>
        </div>
      )}

      {!isActive && auction.status === 'completed' && (
        <div className='bg-green-500 bg-opacity-10 border border-green-500 rounded-2xl p-4 text-center'>
          <p className='text-green-400 font-semibold'>Auction Completed</p>
          {auction.winner && (
            <p className='text-gray-400 text-sm mt-1'>
              Winner: <span className='text-white'>{auction.winner.name}</span>
            </p>
          )}
        </div>
      )}

      {/* bid history */}
      <div className='bg-card border border-surface rounded-2xl p-6'>
        <p className='text-white font-semibold mb-4'>
          Bid History
          <span className='text-gray-400 font-normal text-sm ml-2'>
            ({bids.length} bids)
          </span>
        </p>

        {bids.length === 0 ? (
          <p className='text-gray-400 text-sm'>No bids yet. Be the first!</p>
        ) : (
          <div className='space-y-3 max-h-64 overflow-y-auto'>
            {bids.map((bid, index) => (
              <div
                key={bid.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  index === 0 ? 'bg-primary bg-opacity-20 border border-primary' : 'bg-surface'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <div className='w-7 h-7 bg-surface rounded-full flex items-center justify-center text-xs font-bold text-white border border-gray-600'>
                    {bid.bidder?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className='text-white text-sm font-medium'>{bid.bidder?.name}</p>
                    <p className='text-gray-400 text-xs'>
                      {new Date(bid.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className={`font-bold ${index === 0 ? 'text-primary' : 'text-white'}`}>
                    ₹{bid.amount.toLocaleString()}
                  </p>
                  {index === 0 && (
                    <p className='text-primary text-xs'>Highest</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default BidPanel