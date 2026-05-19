import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { ChatRoomSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const Messages = () => {
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat/rooms')
      setRooms(res.data)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='py-8 max-w-2xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>Messages</h1>
          <p className='text-gray-400'>Your conversations with buyers and sellers</p>
        </div>
        <div className='space-y-3'>
          {[...Array(4)].map((_, i) => <ChatRoomSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className='py-8 max-w-2xl mx-auto'>

      {/* header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-white mb-2'>Messages</h1>
        <p className='text-gray-400'>Your conversations with buyers and sellers</p>
      </div>

      {/* error state */}
      {error && (
        <div className='bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm'>
          {error}
        </div>
      )}

      {/* empty state */}
      {rooms.length === 0 ? (
        <EmptyState
          icon='💬'
          title='No messages yet'
          description='Chats appear here after an auction you are involved in ends'
        />
      ) : (
        <div className='space-y-3'>
          {rooms.map(room => {
            const isSeller = room.sellerId === user?.id
            const otherPerson = isSeller ? room.winner : room.seller
            const lastMessage = room.messages?.[0]
            const isToday = lastMessage
              ? new Date(lastMessage.createdAt).toDateString() === new Date().toDateString()
              : false

            return (
              <Link key={room.id} to={`/messages/${room.id}`}>
                <div className='bg-card border border-surface hover:border-primary rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:bg-opacity-80'>

                  {/* avatar */}
                  <div className='w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0'>
                    {otherPerson?.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <p className='text-white font-semibold'>{otherPerson?.name}</p>
                      {lastMessage && (
                        <p className='text-gray-500 text-xs flex-shrink-0 ml-2'>
                          {isToday
                            ? new Date(lastMessage.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : new Date(lastMessage.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })
                          }
                        </p>
                      )}
                    </div>

                    {/* last message preview */}
                    <p className='text-gray-400 text-sm truncate'>
                      {lastMessage
                        ? lastMessage.senderId === user?.id
                          ? `You: ${lastMessage.content}`
                          : lastMessage.content
                        : 'No messages yet — say hello!'
                      }
                    </p>

                    {/* auction title + role badge */}
                    <div className='flex items-center gap-2 mt-1'>
                      <p className='text-primary text-xs truncate'>
                        🔨 {room.auction?.title}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isSeller
                          ? 'bg-blue-500 bg-opacity-20 text-blue-400'
                          : 'bg-green-500 bg-opacity-20 text-green-400'
                      }`}>
                        {isSeller ? 'Seller' : 'Buyer'}
                      </span>
                    </div>
                  </div>

                  {/* auction image */}
                  {room.auction?.images?.[0] ? (
                    <img
                      src={room.auction.images[0]}
                      alt={room.auction.title}
                      className='w-12 h-12 rounded-xl object-cover border border-surface flex-shrink-0'
                    />
                  ) : (
                    <div className='w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-gray-500 flex-shrink-0'>
                      🖼️
                    </div>
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