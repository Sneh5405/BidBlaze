import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { AuctionCardSkeleton, ProfileSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

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
      <div className='py-8 space-y-6'>
        <ProfileSkeleton />
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => <AuctionCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className='py-8'>

      {/* profile header */}
      <div className='bg-card border border-surface rounded-2xl p-6 mb-8'>
        <div className='flex items-center gap-4 flex-wrap'>
          <div className='w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0'>
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
      <div className='flex gap-3 mb-6 flex-wrap'>
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
            <EmptyState
              icon='🔨'
              title="You haven't listed anything yet"
              description='Start selling your items by creating your first auction'
              action={{ href: '/create-auction', label: 'List an Item' }}
            />
          ) : (
            myAuctions.map(auction => (
              <Link key={auction.id} to={`/auction/${auction.id}`}>
                <div className='bg-card border border-surface hover:border-primary rounded-2xl p-5 flex items-center gap-5 transition-colors'>
                  {auction.images?.[0] ? (
                    <img
                      src={auction.images[0]}
                      alt={auction.title}
                      className='w-16 h-16 rounded-xl object-cover flex-shrink-0'
                    />
                  ) : (
                    <div className='w-16 h-16 rounded-xl bg-surface flex items-center justify-center text-gray-500 flex-shrink-0'>
                      🖼️
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-white font-semibold truncate'>{auction.title}</h3>
                    <p className='text-gray-400 text-sm capitalize'>{auction.category}</p>
                    <p className='text-gray-400 text-sm'>{auction._count?.bids} bids</p>
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <p className='text-primary font-bold'>
                      ₹{auction.currentPrice.toLocaleString()}
                    </p>
                    <p className={`text-sm font-medium capitalize ${statusColors[auction.status]}`}>
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
            <EmptyState
              icon='💰'
              title="You haven't placed any bids"
              description='Browse active auctions and start bidding on items you like'
              action={{ href: '/', label: 'Browse Auctions' }}
            />
          ) : (
            myBids.map(bid => (
              <Link key={bid.id} to={`/auction/${bid.auctionId}`}>
                <div className='bg-card border border-surface hover:border-primary rounded-2xl p-5 flex items-center gap-5 transition-colors'>
                  {bid.auction?.images?.[0] ? (
                    <img
                      src={bid.auction.images[0]}
                      alt={bid.auction.title}
                      className='w-16 h-16 rounded-xl object-cover flex-shrink-0'
                    />
                  ) : (
                    <div className='w-16 h-16 rounded-xl bg-surface flex items-center justify-center text-gray-500 flex-shrink-0'>
                      🖼️
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-white font-semibold truncate'>
                      {bid.auction?.title}
                    </h3>
                    <p className='text-gray-400 text-sm'>
                      Current price: ₹{bid.auction?.currentPrice.toLocaleString()}
                    </p>
                    <p className='text-gray-500 text-xs'>
                      {new Date(bid.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <p className='text-white font-bold'>
                      ₹{bid.amount.toLocaleString()}
                    </p>
                    {bid.auction?.status === 'completed' ? (
                      bid.auction?.winnerId === user?.id ? (
                        <p className='text-green-400 text-sm font-medium'>Won 🏆</p>
                      ) : (
                        <p className='text-gray-400 text-sm'>Lost</p>
                      )
                    ) : bid.isWinning ? (
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
            <EmptyState
              icon='🏆'
              title='No wins yet'
              description='Keep bidding! Your winning auctions will appear here'
              action={{ href: '/', label: 'Browse Auctions' }}
            />
          ) : (
            myWins.map(auction => (
              <Link key={auction.id} to={`/auction/${auction.id}`}>
                <div className='bg-card border border-primary rounded-2xl p-5 flex items-center gap-5 transition-colors hover:bg-primary hover:bg-opacity-5'>
                  {auction.images?.[0] ? (
                    <img
                      src={auction.images[0]}
                      alt={auction.title}
                      className='w-16 h-16 rounded-xl object-cover flex-shrink-0'
                    />
                  ) : (
                    <div className='w-16 h-16 rounded-xl bg-surface flex items-center justify-center text-gray-500 flex-shrink-0'>
                      🖼️
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-white font-semibold truncate'>{auction.title}</h3>
                    <p className='text-gray-400 text-sm'>
                      Sold by {auction.seller?.name}
                    </p>
                    <p className='text-gray-500 text-xs'>
                      {new Date(auction.endTime).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className='text-right flex-shrink-0'>
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