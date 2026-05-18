import { Link } from 'react-router-dom'
import Countdown from './Countdown'

const AuctionCard = ({ auction }) => {
  const statusColors = {
    upcoming: 'bg-blue-500',
    active: 'bg-green-500',
    completed: 'bg-gray-500'
  }

  return (
    <Link to={`/auction/${auction.id}`}>
      <div className='bg-card border border-surface rounded-2xl overflow-hidden hover:border-primary transition-all duration-300 hover:transform hover:scale-105'>

        {/* image */}
        <div className='relative h-48 bg-surface'>
          {auction.images && auction.images.length > 0 ? (
            <img
              src={auction.images[0]}
              alt={auction.title}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-gray-500'>
              No Image
            </div>
          )}

          {/* status badge */}
          <div className={`absolute top-3 right-3 ${statusColors[auction.status]} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
            {auction.status.toUpperCase()}
          </div>
        </div>

        {/* content */}
        <div className='p-5'>
          <h3 className='text-white font-semibold text-lg mb-1 truncate'>
            {auction.title}
          </h3>
          <p className='text-gray-400 text-sm mb-4 line-clamp-2'>
            {auction.description}
          </p>

          {/* price */}
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-gray-400 text-xs'>Current Price</p>
              <p className='text-primary font-bold text-xl'>
                ₹{auction.currentPrice.toLocaleString()}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-gray-400 text-xs'>Total Bids</p>
              <p className='text-white font-semibold'>
                {auction._count?.bids || 0}
              </p>
            </div>
          </div>

          {/* countdown */}
          {auction.status === 'active' && (
            <div>
              <p className='text-gray-400 text-xs mb-2'>Ends in</p>
              <Countdown endTime={auction.endTime} />
            </div>
          )}

          {auction.status === 'upcoming' && (
            <div>
              <p className='text-gray-400 text-xs mb-2'>Starts</p>
              <p className='text-blue-400 text-sm font-medium'>
                {new Date(auction.startTime).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {auction.status === 'completed' && (
            <p className='text-gray-500 text-sm'>Auction completed</p>
          )}

          {/* seller */}
          <div className='mt-4 pt-4 border-t border-surface flex items-center gap-2'>
            <div className='w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-white'>
              {auction.seller?.name?.charAt(0).toUpperCase()}
            </div>
            <p className='text-gray-400 text-xs'>
              by <span className='text-gray-300'>{auction.seller?.name}</span>
            </p>
          </div>
        </div>

      </div>
    </Link>
  )
}

export default AuctionCard