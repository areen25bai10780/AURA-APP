import { supabase } from '../lib/supabase'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function getAuthToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  } catch {
    return null
  }
}

export async function fetchChannels() {
  try {
    const response = await fetch(`${API_BASE_URL}/channels`)
    const data = await response.json()

    return data.channels || defaultChannels()
  } catch (err) {
    console.warn(
      'Could not fetch channels from server, using defaults:',
      err.message
    )

    return defaultChannels()
  }
}

function defaultChannels() {
  return [
    { id: 1, name: 'general' },
    { id: 2, name: 'announcements' },
    { id: 3, name: 'random' },
  ]
}

export async function fetchChannelMessages(channelIdentifier) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/channels/${encodeURIComponent(
        channelIdentifier
      )}/messages`
    )

    const data = await response.json()

    return data.messages || []
  } catch (err) {
    console.error('Error fetching channel messages:', err)

    return []
  }
}

/**
 * Send a text message, image message, or both.
 *
 * imageUrl comes from Supabase Storage.
 */
export async function sendChannelMessage(
  channelIdentifier,
  text,
  currentUser = null,
  imageUrl = null
) {
  const token = await getAuthToken()

  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(
    `${API_BASE_URL}/channels/${encodeURIComponent(
      channelIdentifier
    )}/messages`,
    {
      method: 'POST',
      headers,

      body: JSON.stringify({
        text: text || '',
        imageUrl: imageUrl || null,

        senderName:
          currentUser?.name ||
          currentUser?.email?.split('@')[0] ||
          'User',

        senderEmail: currentUser?.email || '',

        senderId: currentUser?.id || null,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.message || 'Failed to send message.'
    )
  }

  return data.message
}

export async function editChannelMessage(messageId, text) {
  const token = await getAuthToken()

  const response = await fetch(
    `${API_BASE_URL}/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text: text ?? '' }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to edit message.')
  }

  return data.message
}

export async function deleteChannelMessage(messageId) {
  const token = await getAuthToken()

  const response = await fetch(
    `${API_BASE_URL}/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete message.')
  }

  return data
}