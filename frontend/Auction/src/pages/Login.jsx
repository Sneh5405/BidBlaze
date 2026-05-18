import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [formData, setFormData] = useState({ email: '', password: '' })
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
      const res = await api.post('/auth/login', formData)
      login(res.data.user, res.data.token)
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

        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>Welcome Back</h1>
          <p className='text-gray-400'>Login to continue bidding</p>
        </div>

        <div className='bg-card border border-surface rounded-2xl p-8'>

          {error && (
            <div className='bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>

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
                placeholder='Your password'
                required
                className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors'
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          <p className='text-center text-gray-400 text-sm mt-6'>
            Don't have an account?{' '}
            <Link to='/signup' className='text-primary hover:underline'>
              Sign Up
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login