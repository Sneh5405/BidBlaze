import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

let socket

const Chat = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchRoom()

    socket = io('http://localhost:5000')
    socket.on('connect', () => {
      socket.emit('join-chat', id)
    })

    socket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    return () => {
      socket.emit('leave-chat', id)
      socket.disconnect()
    }
  }, [id])

  // auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchRoom = async () => {
    try {
      const res = await api.get(`/chat/rooms/${id}`)
      setRoom(res.data)
      setMessages(res.data.messages)
    } catch (error) {
      navigate('/messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    socket.emit('send-message', {
      roomId: id,
      senderId: user.id,
      content: message.trim()
    })

    setMessage('')
  }

  // figure out who the other person is
  const otherPerson = room?.sellerId === user?.id ? room?.winner : room?.seller
  const isSeller = room?.sellerId === user?.id

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-400'>Loading chat...</p>
      </div>
    )
  }

  return (
    <div className='py-8 max-w-3xl mx-auto'>

      {/* header */}
      <div className='bg-card border border-surface rounded-2xl p-5 mb-4 flex items-center gap-4'>
        <button
          onClick={() => navigate('/messages')}
          className='text-gray-400 hover:text-white transition-colors'
        >
          ←
        </button>

        {/* avatar */}
        <div className='w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white'>
          {otherPerson?.name?.charAt(0).toUpperCase()}
        </div>

        <div className='flex-1'>
          <p className='text-white font-semibold'>{otherPerson?.name}</p>
          <p className='text-gray-400 text-xs'>
            {isSeller ? 'Winner' : 'Seller'} •{' '}
            <Link
              to={`/auction/${room?.auction?.id}`}
              className='text-primary hover:underline'
            >
              {room?.auction?.title}
            </Link>
          </p>
        </div>

        {/* auction thumbnail */}
        {room?.auction?.images?.[0] && (
          <img
            src={room.auction.images[0]}
            alt=''
            className='w-12 h-12 rounded-xl object-cover border border-surface'
          />
        )}
      </div>

      {/* messages */}
      <div className='bg-card border border-surface rounded-2xl p-5 h-96 overflow-y-auto flex flex-col gap-3 mb-4'>
        {messages.length === 0 ? (
          <div className='flex-1 flex items-center justify-center'>
            <p className='text-gray-400 text-sm'>
              No messages yet. Say hello to {otherPerson?.name}!
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === user?.id
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && (
                    <p className='text-gray-400 text-xs px-3'>{msg.sender.name}</p>
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-surface text-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <p className='text-gray-500 text-xs px-3'>
                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <form onSubmit={handleSend} className='flex gap-3'>
        <input
          type='text'
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={`Message ${otherPerson?.name}...`}
          className='flex-1 bg-card border border-surface text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors'
        />
        <button
          type='submit'
          disabled={!message.trim()}
          className='bg-primary hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors'
        >
          Send
        </button>
      </form>

    </div>
  )
}

export default Chat