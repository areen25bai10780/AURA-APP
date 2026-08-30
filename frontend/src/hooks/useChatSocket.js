import { useState, useEffect, useCallback, useRef } from 'react'
import { getSocket } from '../api/socket'
import { fetchChannelMessages, sendChannelMessage } from '../api/messages'

/**
 * useChatSocket
 *
 * Handles:
 * - Loading old messages
 * - Joining/leaving channels
 * - Real-time messages
 * - Image messages
 * - Typing indicators
 * - Online presence
 */

export function useChatSocket(activeChannel, currentUser) {
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  const typingTimeoutRef = useRef(null)
  const activeChannelRef = useRef(activeChannel)

  // Keep active channel reference updated
  useEffect(() => {
    activeChannelRef.current = activeChannel
  }, [activeChannel])

  // ============================================================
  // 1. LOAD MESSAGE HISTORY + JOIN CHANNEL
  // ============================================================

  useEffect(() => {
    if (!activeChannel) return

    let isMounted = true

    setLoadingMessages(true)

    fetchChannelMessages(activeChannel)
      .then((initialMessages) => {
        if (isMounted) {
          setMessages(initialMessages)
          setLoadingMessages(false)
        }
      })
      .catch((error) => {
        console.error('Error loading messages:', error)

        if (isMounted) {
          setMessages([])
          setLoadingMessages(false)
        }
      })

    const socket = getSocket(currentUser)

    // Join selected channel
    socket.emit('join-channel', activeChannel)

    // Clear typing users when changing channels
    setTypingUsers([])

    return () => {
      isMounted = false

      // Leave old channel
      socket.emit('leave-channel', activeChannel)
    }
  }, [activeChannel, currentUser])

  // ============================================================
  // 2. SOCKET.IO EVENT LISTENERS
  // ============================================================

  useEffect(() => {
    const socket = getSocket(currentUser)

    function handleConnect() {
      console.log('🟢 Chat socket connected')

      setIsConnected(true)

      if (activeChannelRef.current) {
        socket.emit('join-channel', activeChannelRef.current)
      }
    }

    function handleDisconnect() {
      console.log('🔴 Chat socket disconnected')

      setIsConnected(false)
    }

    // ----------------------------------------------------------
    // NEW MESSAGE
    // ----------------------------------------------------------

    function handleNewMessage(message) {
      const currentChannel = String(
        activeChannelRef.current || ''
      ).toLowerCase()

      const messageChannelName = message.channelName
        ? String(message.channelName).toLowerCase()
        : null

      const messageChannelId = String(message.channelId || '')

      // Only show messages from the currently selected channel
      if (
        messageChannelName === currentChannel ||
        messageChannelId === currentChannel
      ) {
        setMessages((previousMessages) => {
          // Prevent duplicates
          if (
            previousMessages.some(
              (existingMessage) =>
                existingMessage.id === message.id
            )
          ) {
            return previousMessages
          }

          return [...previousMessages, message]
        })
      }
    }

    // ----------------------------------------------------------
    // TYPING START
    // ----------------------------------------------------------

    function handleUserTyping(data) {
      const currentChannel = String(
        activeChannelRef.current || ''
      ).toLowerCase()

      const typingChannel = data.channelIdentifier
        ? String(data.channelIdentifier).toLowerCase()
        : ''

      if (typingChannel !== currentChannel) {
        return
      }

      // Don't show yourself as typing
      if (
        data.userId &&
        currentUser?.id &&
        data.userId === currentUser.id
      ) {
        return
      }

      setTypingUsers((previousUsers) => {
        if (previousUsers.includes(data.userName)) {
          return previousUsers
        }

        return [...previousUsers, data.userName]
      })
    }

    // ----------------------------------------------------------
    // TYPING STOP
    // ----------------------------------------------------------

    function handleUserStopTyping(data) {
      const currentChannel = String(
        activeChannelRef.current || ''
      ).toLowerCase()

      const typingChannel = data.channelIdentifier
        ? String(data.channelIdentifier).toLowerCase()
        : ''

      if (typingChannel !== currentChannel) {
        return
      }

      setTypingUsers((previousUsers) =>
        previousUsers.filter(
          (name) => name !== data.userName
        )
      )
    }

    // ----------------------------------------------------------
    // ONLINE PRESENCE
    // ----------------------------------------------------------

    function handlePresenceUpdate(usersList) {
      setOnlineUsers(usersList || [])
    }

    setIsConnected(socket.connected)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleUserTyping)
    socket.on('user-stop-typing', handleUserStopTyping)
    socket.on('presence:update', handlePresenceUpdate)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleUserTyping)
      socket.off('user-stop-typing', handleUserStopTyping)
      socket.off('presence:update', handlePresenceUpdate)
    }
  }, [currentUser])

  // ============================================================
  // 3. SEND MESSAGE
  // ============================================================

  const sendMessage = useCallback(
    async (text, imageUrl = null) => {
      // Allow:
      // - text only
      // - image only
      // - text + image

      const cleanText = text?.trim() || ''

      if (!cleanText && !imageUrl) {
        return
      }

      const socket = getSocket(currentUser)

      // Stop typing immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      socket.emit('typing:stop', {
        channelIdentifier: activeChannel,
        userName: currentUser?.name || 'User',
        userId: currentUser?.id || null,
      })

      try {
        // Save message through REST API
        // Backend will save it to PostgreSQL
        // Backend will then broadcast it through Socket.IO

        await sendChannelMessage(
          activeChannel,
          cleanText,
          currentUser,
          imageUrl
        )
      } catch (error) {
        console.error(
          'Error sending message through REST API:',
          error
        )

        // Socket fallback
        socket.emit('send-message', {
          channelIdentifier: activeChannel,
          text: cleanText,
          imageUrl,
          senderName: currentUser?.name || 'User',
          senderId: currentUser?.id || null,
        })
      }
    },
    [activeChannel, currentUser]
  )

  // ============================================================
  // 4. TYPING INDICATOR
  // ============================================================

  const handleTyping = useCallback(() => {
    const socket = getSocket(currentUser)

    socket.emit('typing:start', {
      channelIdentifier: activeChannel,
      userName: currentUser?.name || 'User',
      userId: currentUser?.id || null,
    })

    // Reset existing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 2.5 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        channelIdentifier: activeChannel,
        userName: currentUser?.name || 'User',
        userId: currentUser?.id || null,
      })

      typingTimeoutRef.current = null
    }, 2500)
  }, [activeChannel, currentUser])

  // ============================================================
  // 5. CLEANUP TYPING TIMER
  // ============================================================

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // ============================================================
  // RETURN
  // ============================================================

  return {
    messages,
    loadingMessages,
    typingUsers,
    onlineUsers,
    isConnected,
    sendMessage,
    handleTyping,
  }
}