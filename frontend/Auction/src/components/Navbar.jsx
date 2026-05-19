import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Navbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-card border-b border-surface'>
      <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>

        {/* logo */}
        <Link to='/' className='flex items-center gap-2'>
          <span className='text-2xl font-bold text-primary'>🔨 BidBlaze</span>
        </Link>

        {/* nav links */}
        <div className='flex items-center gap-6'>
          <Link
            to='/'
            className='text-gray-300 hover:text-white transition-colors'
          >
            Auctions
          </Link>

          {user && (
            <Link
              to='/create-auction'
              className='text-gray-300 hover:text-white transition-colors'
            >
              Sell Item
            </Link>
          )}

          {user && (
            <Link
              to='/dashboard'
              className='text-gray-300 hover:text-white transition-colors'
            >
              Dashboard
            </Link>
          )}
          {user && (
            <Link to='/messages' className='text-gray-400 hover:text-white transition-colors'>
              Messages
            </Link>
          )}
        </div>

        {/* auth buttons */}
        <div className='flex items-center gap-3'>
          {user ? (
            <div className='flex items-center gap-4'>
              <span className='text-gray-400 text-sm'>
                Hey, <span className='text-white font-medium'>{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className='bg-surface hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors'
              >
                Logout
              </button>
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <Link
                to='/login'
                className='text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors'
              >
                Login
              </Link>
              <Link
                to='/signup'
                className='bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}

export default Navbar