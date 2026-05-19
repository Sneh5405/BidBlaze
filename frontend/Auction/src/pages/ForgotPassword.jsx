import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [step, setStep] = useState(1)  // 1 = email, 2 = otp
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  const startTimer = () => {
    setResendTimer(30)
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // step 1 — send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setStep(2)
      startTimer()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // step 2 — verify OTP and login
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/verify-login-otp', { email, otp })
      login(res.data.user, res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // resend OTP
  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      startTimer()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>

        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>
            {step === 1 ? 'Forgot Password?' : 'Check Your Email'}
          </h1>
          <p className='text-gray-400'>
            {step === 1
              ? 'Enter your email and we\'ll send you a login OTP'
              : `We sent a 6-digit OTP to ${email}`
            }
          </p>
        </div>

        {/* step indicators */}
        <div className='flex items-center gap-2 mb-8 justify-center'>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-surface text-gray-400'}`}>
            1
          </div>
          <div className={`flex-1 max-w-16 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-surface'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-surface text-gray-400'}`}>
            2
          </div>
        </div>

        <div className='bg-card border border-surface rounded-2xl p-8'>

          {error && (
            <div className='bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm'>
              {error}
            </div>
          )}

          {/* step 1 — email input */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className='space-y-5'>
              <div>
                <label className='block text-gray-400 text-sm mb-2'>Email Address</label>
                <input
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='john@example.com'
                  required
                  className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
                />
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors'
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* step 2 — OTP input */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className='space-y-5'>

              {/* email display */}
              <div className='bg-surface rounded-xl px-4 py-3 flex items-center justify-between'>
                <span className='text-gray-300 text-sm'>{email}</span>
                <button
                  type='button'
                  onClick={() => { setStep(1); setOtp(''); setError('') }}
                  className='text-primary text-xs hover:underline'
                >
                  Change
                </button>
              </div>

              <div>
                <label className='block text-gray-400 text-sm mb-2'>Enter OTP</label>
                <input
                  type='text'
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder='6 digit code'
                  maxLength={6}
                  required
                  className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors text-center text-2xl tracking-widest'
                />
              </div>

              <button
                type='submit'
                disabled={loading || otp.length !== 6}
                className='w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors'
              >
                {loading ? 'Verifying...' : 'Login with OTP'}
              </button>

              {/* resend */}
              <div className='text-center'>
                {resendTimer > 0 ? (
                  <p className='text-gray-400 text-sm'>
                    Resend OTP in <span className='text-primary'>{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type='button'
                    onClick={handleResend}
                    disabled={resendLoading}
                    className='text-primary hover:underline text-sm disabled:opacity-50'
                  >
                    {resendLoading ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </form>
          )}

          <p className='text-center text-gray-400 text-sm mt-6'>
            Remember your password?{' '}
            <Link to='/login' className='text-primary hover:underline'>Login</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default ForgotPassword