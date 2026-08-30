/**
 * ChatHeader — The top navigation bar showing channel details & live presence.
 *
 * Props:
 *   channelName — name of the active channel (e.g. 'general')
 *   onlineCount — number of currently active/online users
 *   isConnected — Socket.IO real-time connection status
 *   onMenuToggle — drawer toggle for mobile screens
 */
function ChatHeader({ channelName = 'general', onlineCount = 1, isConnected = true, onMenuToggle }) {
  return (
    <header style={styles.header}>
      {/* Left side: hamburger (mobile) + channel name + description */}
      <div style={styles.left}>
        <button
          onClick={onMenuToggle}
          style={styles.menuBtn}
          aria-label="Open menu"
          className="mobile-only"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div>
          <h1 style={styles.channelName}>
            <span className="material-symbols-outlined" style={styles.tagIcon}>tag</span>
            #{channelName}
          </h1>
          <p style={styles.channelMeta}>
            Team discussions •{' '}
            <span style={{ color: isConnected ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)' }}>
              {isConnected ? `${onlineCount} online` : 'Connecting...'}
            </span>
          </p>
        </div>
      </div>

      {/* Right side: Connection indicator & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          title={isConnected ? 'Live Socket.IO Connected' : 'Reconnecting...'}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-on-surface-variant)' }}
        >
          <div 
            className={isConnected ? 'status-online' : ''} 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--color-secondary)' : '#f59e0b',
            }} 
          />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        <button style={styles.iconBtn} aria-label="Search">
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>
    </header>
  )
}

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    right: 0,
    left: 'var(--sidebar-width)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--spacing-container-padding)',
    height: '64px',
    backgroundColor: 'rgba(5, 20, 36, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 0 40px rgba(129, 140, 248, 0.1)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  menuBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--color-on-surface-variant)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  channelName: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-headline-md)',
    fontWeight: '600',
    color: 'var(--color-primary)',
    letterSpacing: '0.02em',
  },
  tagIcon: {
    fontSize: '20px',
    opacity: 0.7,
  },
  channelMeta: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '12px',
    color: 'rgba(198, 197, 213, 0.7)',
    lineHeight: '1.4',
    marginTop: '2px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-on-surface-variant)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.2s',
  },
}

export default ChatHeader
