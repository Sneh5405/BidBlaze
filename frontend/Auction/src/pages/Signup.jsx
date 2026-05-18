import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const Signup = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // signup
      await api.post('/auth/signup', formData)

      // auto login after signup
      const loginRes = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      })

      login(loginRes.data.user, loginRes.data.token)
      navigate('/')

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>

        {/* header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>Create Account</h1>
          <p className='text-gray-400'>Join BidBlaze and start bidding</p>
        </div>

        {/* form card */}
        <div className='bg-card border border-surface rounded-2xl p-8'>

          {error && (
            <div className='bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>

            <div>
              <label className='block text-gray-400 text-sm mb-2'>Full Name</label>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='John Doe'
                required
                className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
              />
            </div>

            <div>
              <label className='block text-gray-400 text-sm mb-2'>Email</label>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='john@example.com'
                required
                className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
              />
            </div>

            <div>
              <label className='block text-gray-400 text-sm mb-2'>Password</label>
              <input
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='Min 6 characters'
                required
                className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors'
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <p className='text-center text-gray-400 text-sm mt-6'>
            Already have an account?{' '}
            <Link to='/login' className='text-primary hover:underline'>
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Signup