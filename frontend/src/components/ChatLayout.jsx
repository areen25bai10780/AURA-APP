import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import ChatHeader from './ChatHeader'
import MessageFeed from './MessageFeed'
import MessageComposer from './MessageComposer'
import BottomNav from './BottomNav'
import VoiceChannelPanel from './VoiceChannelPanel'
import { useChatSocket } from '../hooks/useChatSocket'
import { fetchChannels } from '../api/messages'
import { useVoiceChannel } from '../hooks/useVoiceChannel'

/**
 * ChatLayout — The main real-time workspace view for Aura.
 *
 * Coordinates:
 * 1. Channel List from PostgreSQL database.
 * 2. Real-time messages, typing indicators, and presence via useChatSocket.
 * 3. Mobile responsiveness (Sidebar on desktop / BottomNav on mobile).
 */
function ChatLayout({ currentUser, onLogout }) {
  const [activeChannel, setActiveChannel] = useState('general')
  const [channels, setChannels] = useState([
    { id: 1, name: 'general' },
    { id: 2, name: 'announcements' },
    { id: 3, name: 'random' },
  ])
  const [voiceChannels, setVoiceChannels] = useState([
    { id: 'general-voice', name: 'General Voice' },
    { id: 'study-room', name: 'Study Room' },
  ])
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null)
  const [activeTab, setActiveTab] = useState('messages')

  // Load channels on mount
  useEffect(() => {
    fetchChannels().then((loadedChannels) => {
      if (loadedChannels && loadedChannels.length > 0) {
        setChannels(loadedChannels)
      }
    })
  }, [])

  // Hook connecting this workspace to Socket.IO and PostgreSQL message history
  const {
    messages,
    loadingMessages,
    typingUsers,
    onlineUsers,
    isConnected,
    sendMessage,
    editMessage,
    deleteMessage,
    handleTyping,
  } = useChatSocket(activeChannel, currentUser)

  const {
    currentVoiceChannel,
    participants,
    isMuted,
    error,
    remoteStreams,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
  } = useVoiceChannel(currentUser)

  const handleVoiceSelect = (channelName) => {
    if (currentVoiceChannel && currentVoiceChannel !== channelName) {
      leaveVoiceChannel()
    }

    if (!currentVoiceChannel || currentVoiceChannel !== channelName) {
      setActiveVoiceChannel(channelName)
      joinVoiceChannel(channelName)
    }
  }

  useEffect(() => {
    if (!currentVoiceChannel && activeVoiceChannel) {
      setActiveVoiceChannel(null)
    }
  }, [currentVoiceChannel, activeVoiceChannel])

  return (
    <div style={styles.layout}>
      {/* Ambient background glow (Ethereal Focus) */}
      <div className="ambient-bg" />

      {/* Desktop Left Sidebar */}
      <div className="desktop-sidebar">
        <Sidebar
          channels={channels}
          activeChannel={activeChannel}
          onChannelSelect={setActiveChannel}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          onLogout={onLogout}
          voiceChannels={voiceChannels}
          activeVoiceChannel={activeVoiceChannel}
          onVoiceSelect={handleVoiceSelect}
        />
      </div>

      {/* Main Chat Timeline Area */}
      <main style={styles.main}>
        {/* Fixed Top Header */}
        <ChatHeader
          channelName={activeChannel}
          onlineCount={onlineUsers.length || 1}
          isConnected={isConnected}
          onMenuToggle={() => {}}
        />

        {/* Scrollable Message Feed */}
        <MessageFeed
          messages={messages}
          currentUser={currentUser}
          typingUsers={typingUsers}
          loading={loadingMessages}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
        />

        {currentVoiceChannel && (
          <VoiceChannelPanel
            channelName={currentVoiceChannel}
            participants={participants}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onLeave={() => {
              leaveVoiceChannel()
              setActiveVoiceChannel(null)
            }}
            currentUser={currentUser}
            error={error}
            remoteStreams={remoteStreams}
          />
        )}

        {/* Message Input Bar */}
        <MessageComposer
          channelName={activeChannel}
          onSend={sendMessage}
          onTyping={handleTyping}
        />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'var(--color-background)',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
}

export default ChatLayout
