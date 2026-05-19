import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const Messages = () => {
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat/rooms')
      setRooms(res.data)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-400'>Loading messages...</p>
      </div>
    )
  }

  return (
    <div className='py-8 max-w-2xl mx-auto'>

      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-white mb-2'>Messages</h1>
        <p className='text-gray-400'>Your conversations with buyers and sellers</p>
      </div>

      {rooms.length === 0 ? (
        <div className='text-center py-20 bg-card border border-surface rounded-2xl'>
          <p className='text-4xl mb-4'>💬</p>
          <p className='text-gray-400 mb-2'>No messages yet</p>
          <p className='text-gray-500 text-sm'>
            Chats appear here after an auction you're involved in ends
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {rooms.map(room => {
            const isSeller = room.sellerId === user?.id
            const otherPerson = isSeller ? room.winner : room.seller
            const lastMessage = room.messages?.[0]

            return (
              <Link key={room.id} to={`/messages/${room.id}`}>
                <div className='bg-card border border-surface hover:border-primary rounded-2xl p-5 flex items-center gap-4 transition-colors'>

                  {/* avatar */}
                  <div className='w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0'>
                    {otherPerson?.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <p className='text-white font-semibold'>{otherPerson?.name}</p>
                      {lastMessage && (
                        <p className='text-gray-500 text-xs'>
                          {new Date(lastMessage.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <p className='text-gray-400 text-sm truncate'>
                      {lastMessage ? lastMessage.content : 'No messages yet'}
                    </p>
                    <p className='text-primary text-xs mt-1 truncate'>
                      🔨 {room.auction?.title}
                    </p>
                  </div>

                  {/* auction image */}
                  {room.auction?.images?.[0] && (
                    <img
                      src={room.auction.images[0]}
                      alt=''
                      className='w-12 h-12 rounded-xl object-cover border border-surface flex-shrink-0'
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Messages
