import { useState } from 'react'

/**
 * MessageBubble — Renders a single chat message with Aura styling.
 *
 * Props:
 *   message — message object { id, sender, text, time, userId, senderEmail, type, consecutive, showOnline }
 *   currentUser — current logged in user object { id, name, email }
 */
function MessageBubble({ message, currentUser, onEditMessage, onDeleteMessage }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(message.text || '')

  // Determine if this message was sent by the currently logged-in user
  const isOutgoing =
    message.type === 'outgoing' ||
    (currentUser?.id && message.userId === currentUser.id) ||
    (currentUser?.email && message.senderEmail === currentUser.email) ||
    (message.sender === 'You')

  const isConsecutive = message.consecutive === true
  const senderDisplayName = isOutgoing ? 'You' : (message.sender || 'User')
  const initial = (isOutgoing ? currentUser?.name || 'Y' : message.sender || 'U').charAt(0).toUpperCase()
  const hasText = Boolean((message.text || '').trim())
  const hasImage = Boolean(message.imageUrl)

  async function handleSaveEdit() {
    if (!onEditMessage) return

    const trimmed = draftText.trim()
    if (!trimmed && !message.imageUrl) {
      return
    }

    try {
      await onEditMessage(message.id, trimmed)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save edited message:', error)
      alert(error.message || 'Failed to save changes.')
    }
  }

  async function handleDelete() {
    if (!onDeleteMessage) return

    const confirmed = window.confirm('Delete this message?')
    if (!confirmed) return

    try {
      await onDeleteMessage(message.id)
    } catch (error) {
      console.error('Failed to delete message:', error)
      alert(error.message || 'Failed to delete message.')
    }
  }

  return (
    <div
      className="msg-enter"
      style={{
        ...styles.wrapper,
        flexDirection: isOutgoing ? 'row-reverse' : 'row',
        marginTop: isConsecutive ? '-8px' : '0',
        animationDelay: `${message.delay ?? 0}s`,
      }}
    >
      {/* Avatar Slot */}
      <div style={styles.avatarSlot}>
        {!isConsecutive && (
          <div style={styles.avatarWrapper}>
            <div
              style={{
                ...styles.avatar,
                background: isOutgoing
                  ? 'linear-gradient(135deg, #818cf8, #bdc2ff)'
                  : 'linear-gradient(135deg, #1c2b3c, #273647)',
                border: isOutgoing
                  ? '1px solid rgba(189,194,255,0.3)'
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {initial}
            </div>
            {message.showOnline && !isOutgoing && (
              <div className="status-online" style={styles.onlineDot} />
            )}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div
        style={{
          ...styles.content,
          alignItems: isOutgoing ? 'flex-end' : 'flex-start',
          maxWidth: '75%',
        }}
      >
        {/* Meta Header */}
        {!isConsecutive && (
          <div
            style={{
              ...styles.meta,
              flexDirection: isOutgoing ? 'row-reverse' : 'row',
            }}
          >
            <span style={styles.senderName}>{senderDisplayName}</span>
            <span style={styles.timestamp}>
              {message.time || (message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
            </span>
          </div>
        )}

        {isOutgoing && !isEditing && (onEditMessage || onDeleteMessage) && (
          <div style={styles.actionRow}>
            {onEditMessage && (
              <button type="button" style={styles.actionButton} onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
            {onDeleteMessage && (
              <button type="button" style={styles.actionButtonDanger} onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        )}

        {isEditing ? (
          <div style={isOutgoing ? styles.editorOutgoing : styles.editorIncoming}>
            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={3}
              style={styles.editorInput}
            />
            <div style={styles.editorActions}>
              <button type="button" style={styles.saveButton} onClick={handleSaveEdit}>
                Save
              </button>
              <button type="button" style={styles.cancelButton} onClick={() => { setDraftText(message.text || ''); setIsEditing(false) }}>
                Cancel
              </button>
            </div>
            {hasImage && (
              <img
                src={message.imageUrl}
                alt="Shared chat attachment"
                style={
                  isOutgoing
                    ? styles.imageOutgoing
                    : isConsecutive
                      ? styles.imageConsecutive
                      : styles.imageIncoming
                }
              />
            )}
          </div>
        ) : (
          <>
            {/* Text Bubble */}
            {hasText && (
              <div
                style={
                  isOutgoing
                    ? styles.bubbleOutgoing
                    : isConsecutive
                      ? styles.bubbleConsecutive
                      : styles.bubbleIncoming
                }
              >
                {message.text}
              </div>
            )}

            {hasImage && (
              <img
                src={message.imageUrl}
                alt="Shared chat attachment"
                style={
                  isOutgoing
                    ? styles.imageOutgoing
                    : isConsecutive
                      ? styles.imageConsecutive
                      : styles.imageIncoming
                }
              />
            )}
          </>
        )}

        {message.edited && !isEditing && (
          <span style={styles.editedBadge}>edited</span>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    gap: '16px',
    width: '100%',
  },
  avatarSlot: {
    width: '40px',
    flexShrink: 0,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-on-surface)',
    fontWeight: '600',
    fontSize: '14px',
    marginTop: '4px',
    flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-secondary)',
    border: '2px solid var(--color-surface)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  meta: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '4px',
  },
  senderName: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--color-on-surface)',
    letterSpacing: '0.01em',
  },
  timestamp: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '12px',
    color: 'rgba(198, 197, 213, 0.5)',
    lineHeight: '1',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '6px',
    justifyContent: 'flex-end',
  },
  actionButton: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: 'var(--color-on-surface-variant)',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  actionButtonDanger: {
    border: '1px solid rgba(255,120,120,0.35)',
    background: 'rgba(255,120,120,0.08)',
    color: '#ffb4b4',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  editorOutgoing: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'rgba(189, 194, 255, 0.12)',
    border: '1px solid rgba(189,194,255,0.25)',
    borderRadius: '18px',
    padding: '10px',
    maxWidth: '320px',
  },
  editorIncoming: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'rgba(28, 43, 60, 0.85)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '18px',
    padding: '10px',
    maxWidth: '320px',
  },
  editorInput: {
    width: '100%',
    minHeight: '72px',
    resize: 'vertical',
    borderRadius: '12px',
    backgroundColor: 'rgba(10, 16, 23, 0.28)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'var(--color-on-surface)',
    fontFamily: 'var(--font-family-base)',
    fontSize: '14px',
    padding: '8px 10px',
    boxSizing: 'border-box',
  },
  editorActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  saveButton: {
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    borderRadius: '999px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  cancelButton: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: 'var(--color-on-surface-variant)',
    borderRadius: '999px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  editedBadge: {
    fontSize: '10px',
    color: 'rgba(198, 197, 213, 0.5)',
    letterSpacing: '0.04em',
    textTransform: 'lowercase',
    marginTop: '2px',
  },
  bubbleIncoming: {
    backgroundColor: 'rgba(28, 43, 60, 0.85)',
    color: 'var(--color-on-surface)',
    padding: '12px 20px',
    borderRadius: '20px 20px 20px 4px',
    border: '1px solid rgba(255,255,255,0.05)',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-lg)',
    lineHeight: '1.6',
    wordBreak: 'break-word',
  },
  bubbleConsecutive: {
    backgroundColor: 'rgba(28, 43, 60, 0.85)',
    color: 'var(--color-on-surface)',
    padding: '12px 20px',
    borderRadius: '4px 20px 20px 4px',
    border: '1px solid rgba(255,255,255,0.05)',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-lg)',
    lineHeight: '1.6',
    wordBreak: 'break-word',
  },
  bubbleOutgoing: {
    backgroundColor: 'rgba(189, 194, 255, 0.85)',
    color: 'var(--color-on-primary)',
    padding: '12px 20px',
    borderRadius: '20px 4px 20px 20px',
    border: '1px solid rgba(224, 224, 255, 0.2)',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-lg)',
    lineHeight: '1.6',
    boxShadow: '0 4px 20px rgba(129, 140, 248, 0.2)',
    wordBreak: 'break-word',
  },
  imageIncoming: {
    maxWidth: '280px',
    width: '100%',
    borderRadius: '20px 20px 20px 4px',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'block',
    objectFit: 'cover',
  },
  imageConsecutive: {
    maxWidth: '280px',
    width: '100%',
    borderRadius: '4px 20px 20px 4px',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'block',
    objectFit: 'cover',
  },
  imageOutgoing: {
    maxWidth: '280px',
    width: '100%',
    borderRadius: '20px 4px 20px 20px',
    border: '1px solid rgba(224, 224, 255, 0.2)',
    display: 'block',
    objectFit: 'cover',
  },
}

export default MessageBubble
