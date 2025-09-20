import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      // Create socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setConnected(true)
        
        // Join user's personal room
        newSocket.emit('join-user-room', user.id)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setConnected(false)
      })

      // Listen for verse updates
      newSocket.on('verse-updated', (data) => {
        console.log('Verse updated:', data)
        toast.success(`New verse: ${data.verseRef}`, {
          duration: 3000,
        })
      })

      // Listen for playlist updates
      newSocket.on('playlist-changed', (data) => {
        console.log('Playlist changed:', data)
        toast.info('Playlist updated', {
          duration: 2000,
        })
      })

      // Listen for errors
      newSocket.on('error', (error) => {
        console.error('Socket error:', error)
        toast.error(error.message || 'Connection error')
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setConnected(false)
      }
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user, token])

  const broadcastVerse = (verseData) => {
    if (socket && connected) {
      socket.emit('broadcast-verse', {
        ...verseData,
        userId: user.id
      })
    }
  }

  const updatePlaylist = (playlistId) => {
    if (socket && connected) {
      socket.emit('playlist-updated', {
        playlistId,
        userId: user.id
      })
    }
  }

  const value = {
    socket,
    connected,
    broadcastVerse,
    updatePlaylist
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
