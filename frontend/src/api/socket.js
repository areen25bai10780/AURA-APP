import { io } from 'socket.io-client'
import { supabase } from '../lib/supabase'

/**
 * socket.js — Socket.IO Client Connection Manager
 *
 * Why a separate file?
 *   We want ONE shared socket connection across the whole app.
 *   This is called a "singleton" — we create it once and reuse it.
 *
 * How auth works:
 *   Supabase Auth manages our login. When a user logs in, Supabase gives
 *   us a session object that contains an `access_token` (like a digital ID card).
 *   We send that token to Socket.IO so the backend knows WHO is connecting.
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null

/**
 * Get the current Supabase session token (non-blocking).
 * Returns null if not logged in.
 */
async function getSupabaseToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  } catch {
    return null
  }
}

/**
 * Initialize or return the existing socket connection.
 * @param {Object} currentUser - { id, name, email } from Supabase session
 * @returns {Socket} Active Socket.IO instance
 */
export function getSocket(currentUser = null) {
  if (!socket) {
    // We create the socket WITHOUT a token first (token is async)
    // The backend is configured to accept sockets even without a valid JWT
    // (it just won't identify them as logged-in users)
    socket = io(SOCKET_URL, {
      auth: {
        token: null,
        user: currentUser,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('🟢 Socket.IO connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket.IO disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error:', error.message)
    })

    // Immediately try to attach the Supabase token + user info
    getSupabaseToken().then((token) => {
      if (socket && token) {
        socket.auth = { token, user: currentUser }
        // Reconnect so the backend receives the authenticated handshake
        if (socket.connected) {
          socket.disconnect().connect()
        }
      }
    })
  } else {
    // Socket already exists — update user info if it changed
    if (currentUser && socket.auth?.user?.id !== currentUser?.id) {
      getSupabaseToken().then((token) => {
        if (socket) {
          socket.auth = { token, user: currentUser }
          if (socket.connected) {
            socket.disconnect().connect()
          }
        }
      })
    }
  }

  return socket
}

/**
 * Call this when the user logs out.
 * Destroys the socket so a fresh one is created on next login.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
