import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const Dashboard = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('my-auctions')
  const [myAuctions, setMyAuctions] = useState([])
  const [myBids, setMyBids] = useState([])
  const [myWins, setMyWins] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [auctionsRes, bidsRes, winsRes, profileRes] = await Promise.all([
        api.get('/user/my-auctions'),
        api.get('/user/my-bids'),
        api.get('/user/my-wins'),
        api.get('/user/profile')
      ])
      setMyAuctions(auctionsRes.data)
      setMyBids(bidsRes.data)
      setMyWins(winsRes.data)
      setProfile(profileRes.data)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    upcoming: 'text-blue-400',
    active: 'text-green-400',
    completed: 'text-gray-400'
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-gray-400'>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className='py-8'>

      {/* profile header */}
      <div className='bg-card border border-surface rounded-2xl p-6 mb-8'>
        <div className='flex items-center gap-4'>
          <div className='w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white'>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className='text-2xl font-bold text-white'>{user?.name}</h1>
            <p className='text-gray-400'>{user?.email}</p>
          </div>
          <div className='ml-auto flex gap-6 text-center'>
            <div>
              <p className='text-2xl font-bold text-white'>{profile?._count?.auctions || 0}</p>
              <p className='text-gray-400 text-sm'>Auctions</p>
            </div>
            <div>
              <p className='text-2xl font-bold text-white'>{profile?._count?.bids || 0}</p>
              <p className='text-gray-400 text-sm'>Bids</p>
            </div>
            <div>
              <p className='text-2xl font-bold text-primary'>{myWins.length}</p>
              <p className='text-gray-400 text-sm'>Wins</p>
            </div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className='flex gap-3 mb-6'>
        {[
          { key: 'my-auctions', label: `My Auctions (${myAuctions.length})` },
          { key: 'my-bids', label: `My Bids (${myBids.length})` },
          { key: 'my-wins', label: `My Wins (${myWins.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-card text-gray-400 hover:text-white border border-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* my auctions tab */}
      {activeTab === 'my-auctions' && (
        <div className='space-y-4'>
          {myAuctions.length === 0 ? (
            <div className='text-center py-16'>
              <p className='text-gray-400 mb-4'>You haven't listed any auctions yet</p>
              <Link
                to='/create-auction'
                className='bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors'
              >
                List an Item
              </Link>
            </div>
          ) : (
            myAuctions.map(auction => (
              <Link key={auction.id} to={`/auction/${auction.id}`}>
                <div className='bg-card border border-surface hover:border-primary rounded-2xl p-5 flex items-center gap-5 transition-colors'>
                  {auction.images?.[0] && (
                    <img
                      src={auction.images[0]}
                      alt={auction.title}
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                  )}
                  <div className='flex-1'>
                    <h3 className='text-white font-semibold'>{auction.title}</h3>
                    <p className='text-gray-400 text-sm'>{auction._count?.bids} bids</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-primary font-bold'>₹{auction.currentPrice.toLocaleString()}</p>
                    <p className={`text-sm font-medium ${statusColors[auction.status]}`}>
                      {auction.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* my bids tab */}
      {activeTab === 'my-bids' && (
        <div className='space-y-4'>
          {myBids.length === 0 ? (
            <div className='text-center py-16'>
              <p className='text-gray-400 mb-4'>You haven't placed any bids yet</p>
              <Link
                to='/'
                className='bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors'
              >
                Browse Auctions
              </Link>
            </div>
          ) : (
            myBids.map(bid => (
              <Link key={bid.id} to={`/auction/${bid.auctionId}`}>
                <div className='bg-card border border-surface hover:border-primary rounded-2xl p-5 flex items-center gap-5 transition-colors'>
                  {bid.auction?.images?.[0] && (
                    <img
                      src={bid.auction.images[0]}
                      alt={bid.auction.title}
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                  )}
                  <div className='flex-1'>
                    <h3 className='text-white font-semibold'>{bid.auction?.title}</h3>
                    <p className='text-gray-400 text-sm'>
                      Current price: ₹{bid.auction?.currentPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-white font-bold'>₹{bid.amount.toLocaleString()}</p>
                    {bid.isWinning ? (
                      <p className='text-green-400 text-sm font-medium'>Winning 🏆</p>
                    ) : (
                      <p className='text-red-400 text-sm'>Outbid</p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* my wins tab */}
      {activeTab === 'my-wins' && (
        <div className='space-y-4'>
          {myWins.length === 0 ? (
            <div className='text-center py-16'>
              <p className='text-gray-400'>You haven't won any auctions yet. Keep bidding!</p>
            </div>
          ) : (
            myWins.map(auction => (
              <Link key={auction.id} to={`/auction/${auction.id}`}>
                <div className='bg-card border border-primary rounded-2xl p-5 flex items-center gap-5'>
                  {auction.images?.[0] && (
                    <img
                      src={auction.images[0]}
                      alt={auction.title}
                      className='w-16 h-16 rounded-xl object-cover'
                    />
                  )}
                  <div className='flex-1'>
                    <h3 className='text-white font-semibold'>{auction.title}</h3>
                    <p className='text-gray-400 text-sm'>
                      Sold by {auction.seller?.name}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-primary font-bold text-lg'>
                      ₹{auction.bids?.[0]?.amount.toLocaleString()}
                    </p>
                    <p className='text-green-400 text-sm'>Won 🏆</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

    </div>
  )
}

export default Dashboard