import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const CreateAuction = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
  title: '',
  description: '',
  category: '',  
  startPrice: '',
  startTime: '',
  endTime: ''
})
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('startPrice', formData.startPrice)
      data.append('startTime', formData.startTime)
      data.append('endTime', formData.endTime)
      images.forEach(img => data.append('images', img))

      const res = await api.post('/auction/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      navigate(`/auction/${res.data.auction.id}`)

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='max-w-2xl mx-auto py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-white mb-2'>List an Item</h1>
        <p className='text-gray-400'>Fill in the details to start your auction</p>
      </div>

      <div className='bg-card border border-surface rounded-2xl p-8'>

        {error && (
          <div className='bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>

          <div>
            <label className='block text-gray-400 text-sm mb-2'>Item Title</label>
            <input
              type='text'
              name='title'
              value={formData.title}
              onChange={handleChange}
              placeholder='e.g. iPhone 14 Pro Max'
              required
              className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
            />
          </div>

          <div>
            <label className='block text-gray-400 text-sm mb-2'>Description</label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              placeholder='Describe your item in detail...'
              required
              rows={4}
              className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none'
            />
          </div>
          <div>
            <label className='block text-gray-400 text-sm mb-2'>Category</label>
            <select
              name='category'
              value={formData.category}
              onChange={handleChange}
              className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
            >
              <option value='electronics'>Electronics</option>
              <option value='fashion'>Fashion</option>
              <option value='vehicles'>Vehicles</option>
              <option value='art'>Art</option>
              <option value='furniture'>Furniture</option>
              <option value='sports'>Sports</option>
              <option value='books'>Books</option>
              <option value='other'>Other</option>
            </select>
          </div>
          <div>
            <label className='block text-gray-400 text-sm mb-2'>Starting Price (₹)</label>
            <input
              type='number'
              name='startPrice'
              value={formData.startPrice}
              onChange={handleChange}
              placeholder='e.g. 5000'
              required
              min='1'
              className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-gray-400 text-sm mb-2'>Start Time</label>
              <input
                type='datetime-local'
                name='startTime'
                value={formData.startTime}
                onChange={handleChange}
                required
                className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
              />
            </div>
            <div>
              <label className='block text-gray-400 text-sm mb-2'>End Time</label>
              <input
                type='datetime-local'
                name='endTime'
                value={formData.endTime}
                onChange={handleChange}
                required
                className='w-full bg-surface border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary transition-colors'
              />
            </div>
          </div>

          {/* image upload */}
          <div>
            <label className='block text-gray-400 text-sm mb-2'>
              Images (max 5)
            </label>
            <label className='block border-2 border-dashed border-gray-600 hover:border-primary rounded-xl p-8 text-center cursor-pointer transition-colors'>
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={handleImages}
                className='hidden'
              />
              <p className='text-gray-400'>Click to upload images</p>
              <p className='text-gray-500 text-sm mt-1'>PNG, JPG up to 5MB each</p>
            </label>

            {/* image previews */}
            {previews.length > 0 && (
              <div className='flex gap-3 mt-4 flex-wrap'>
                {previews.map((src, i) => (
                  <div key={i} className='w-20 h-20 rounded-xl overflow-hidden border border-surface'>
                    <img src={src} alt='' className='w-full h-full object-cover' />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-lg'
          >
            {loading ? 'Creating Auction...' : '🔨 Start Auction'}
          </button>

        </form>
      </div>
    </div>
  )
}

export default CreateAuction