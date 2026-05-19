const prisma = require('../prisma/client')

// get my chat rooms
const getMyChatRooms = async (req, res) => {
  const userId = req.user.id

  try {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { sellerId: userId },
          { winnerId: userId }
        ]
      },
      include: {
        auction: { select: { id: true, title: true, images: true } },
        seller: { select: { id: true, name: true } },
        winner: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1  // last message preview
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json(rooms)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

// get single chat room messages
const getChatRoom = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id },
      include: {
        auction: { select: { id: true, title: true, images: true, currentPrice: true } },
        seller: { select: { id: true, name: true } },
        winner: { select: { id: true, name: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' })
    }

    // only seller or winner can access
    if (room.sellerId !== userId && room.winnerId !== userId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    res.status(200).json(room)

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message })
  }
}

module.exports = { getMyChatRooms, getChatRoom }