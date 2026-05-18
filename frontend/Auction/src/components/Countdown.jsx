import { useState, useEffect } from 'react'

const Countdown = ({ endTime, onExpire }) => {
  const calculateTimeLeft = () => {
    const difference = new Date(endTime) - new Date()
    if (difference <= 0) return null

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    }
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      const t = calculateTimeLeft()
      setTimeLeft(t)
      if (!t && onExpire) onExpire()
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  if (!timeLeft) {
    return <span className='text-red-400 font-semibold'>Auction Ended</span>
  }

  return (
    <div className='flex items-center gap-2'>
      {timeLeft.days > 0 && (
        <div className='text-center'>
          <div className='bg-surface px-3 py-1 rounded-lg text-white font-bold text-lg'>
            {timeLeft.days}
          </div>
          <div className='text-gray-400 text-xs mt-1'>days</div>
        </div>
      )}
      <div className='text-center'>
        <div className='bg-surface px-3 py-1 rounded-lg text-white font-bold text-lg'>
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <div className='text-gray-400 text-xs mt-1'>hrs</div>
      </div>
      <span className='text-gray-400 font-bold mb-4'>:</span>
      <div className='text-center'>
        <div className='bg-surface px-3 py-1 rounded-lg text-white font-bold text-lg'>
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <div className='text-gray-400 text-xs mt-1'>min</div>
      </div>
      <span className='text-gray-400 font-bold mb-4'>:</span>
      <div className='text-center'>
        <div className='bg-surface px-3 py-1 rounded-lg text-primary font-bold text-lg'>
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <div className='text-gray-400 text-xs mt-1'>sec</div>
      </div>
    </div>
  )
}

export default Countdown