import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

/**
 * MessageFeed — The scrollable message timeline.
 *
 * Displays:
 * 1. Date divider pill
 * 2. List of MessageBubble items
 * 3. Real-time typing indicator banner
 * 4. Auto-scroll to latest message on incoming traffic
 */
function MessageFeed({ messages = [], currentUser, typingUsers = [], loading = false }) {
  const bottomRef = useRef(null)

  // Auto scroll to bottom when new messages arrive or when someone starts typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  return (
    <div style={styles.feed} id="message-feed">
      {/* Date divider chip */}
      <div style={styles.dateDivider}>
        <div style={styles.datePill}>
          <span style={styles.dateLabel}>Today</span>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && messages.length === 0 && (
        <div style={styles.emptyNotice}>
          <span>Loading messages...</span>
        </div>
      )}

      {/* Empty channel state */}
      {!loading && messages.length === 0 && (
        <div style={styles.emptyNotice}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.5, marginBottom: '8px' }}>forum</span>
          <p style={{ fontWeight: '500' }}>This is the start of the conversation.</p>
          <p style={{ fontSize: '13px', opacity: 0.6 }}>Send a message to get things going!</p>
        </div>
      )}

      {/* Message list */}
      {messages.map((message, index) => {
        // Determine consecutive message grouping
        const prevMessage = messages[index - 1]
        const isConsecutive =
          prevMessage &&
          (prevMessage.userId === message.userId || prevMessage.sender === message.sender)

        return (
          <MessageBubble
            key={message.id || index}
            message={{ ...message, consecutive: isConsecutive }}
            currentUser={currentUser}
          />
        )
      })}

      {/* Real-time Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="msg-enter" style={styles.typingBanner}>
          <div style={styles.typingDots}>
            <span style={{ ...styles.dot, animationDelay: '0s' }} />
            <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
            <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
          </div>
          <span style={styles.typingText}>
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.join(', ')} are typing...`}
          </span>
        </div>
      )}

      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} style={{ height: '1px' }} />
    </div>
  )
}

const styles = {
  feed: {
    flex: 1,
    overflowY: 'auto',
    paddingTop: '80px',
    paddingBottom: '100px',
    paddingLeft: 'var(--spacing-container-padding)',
    paddingRight: 'var(--spacing-container-padding)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-gutter)',
    maxWidth: '900px',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  dateDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16px 0',
  },
  datePill: {
    backgroundColor: 'var(--color-surface-container-high)',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  dateLabel: {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-label-caps)',
    fontWeight: '600',
    letterSpacing: '0.1em',
    color: 'var(--color-on-surface-variant)',
  },
  emptyNotice: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: 'var(--color-on-surface-variant)',
    textAlign: 'center',
    fontFamily: 'var(--font-family-base)',
  },
  typingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    marginTop: '4px',
    alignSelf: 'flex-start',
  },
  typingDots: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-secondary)',
    animation: 'pulse-glow 1.4s infinite ease-in-out',
  },
  typingText: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '13px',
    color: 'var(--color-secondary)',
    fontStyle: 'italic',
  },
}

export default MessageFeed
