/**
 * Sidebar — Channel & direct message navigation panel.
 *
 * Props:
 *   channels — array of channel objects [{ id, name }, ...]
 *   activeChannel — currently selected channel (e.g. 'general')
 *   onChannelSelect — callback when a channel is clicked
 *   currentUser — logged in user object
 *   onlineUsers — list of currently online user objects from presence
 *   onLogout — logout handler
 */
function Sidebar({
  channels = [
    { id: 1, name: 'general' },
    { id: 2, name: 'announcements' },
    { id: 3, name: 'random' },
  ],
  activeChannel = 'general',
  onChannelSelect,
  currentUser,
  onlineUsers = [],
  onLogout,
}) {
  const directMessages = [
    { name: 'design-team', label: 'Design Team', online: true },
    { name: 'support', label: 'Support', online: false },
  ]

  const displayName = currentUser?.name || currentUser?.email || 'User'
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <nav style={styles.nav}>
      {/* Workspace Header */}
      <div style={styles.workspaceHeader}>
        <div style={styles.avatarWrapper}>
          <div style={styles.avatar}>{userInitial}</div>
          <div className="status-online" style={styles.onlineDot} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.workspaceName}>Aura Workspace</div>
          <div style={styles.workspaceStatus} title={displayName}>
            {currentUser?.name ? `${currentUser.name} (Online)` : 'Online'}
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            style={styles.logoutBtn}
            aria-label="Sign out"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          </button>
        )}
      </div>

      {/* Channel & DM List */}
      <div style={styles.listContainer}>
        {/* Channels Section */}
        <div style={styles.sectionLabel}>CHANNELS</div>
        {channels.map((channel) => {
          const channelName = channel.name || channel
          const isActive = String(activeChannel).toLowerCase() === String(channelName).toLowerCase()

          return (
            <button
              key={channel.id || channelName}
              onClick={() => onChannelSelect(channelName)}
              style={{
                ...styles.channelBtn,
                ...(isActive ? styles.channelBtnActive : {}),
              }}
            >
              <span className="material-symbols-outlined" style={styles.channelIcon}>
                {channelName === 'announcements' ? 'campaign' : 'tag'}
              </span>
              <span style={styles.channelLabel}>#{channelName}</span>
              {isActive && <div style={styles.activeBar} />}
            </button>
          )
        })}

        {/* Direct Messages Section */}
        <div style={{ ...styles.sectionLabel, marginTop: '20px' }}>DIRECT MESSAGES</div>
        {directMessages.map((dm) => (
          <button key={dm.name} style={styles.channelBtn}>
            <div style={styles.dmStatusWrapper}>
              {dm.online ? (
                <>
                  <span style={styles.dmDotOnlinePing} className="ping" />
                  <span style={styles.dmDotOnline} />
                </>
              ) : (
                <span style={styles.dmDotOffline} />
              )}
            </div>
            <span style={styles.channelLabel}>{dm.label}</span>
          </button>
        ))}

        {/* Online Members Presence list */}
        {onlineUsers.length > 0 && (
          <>
            <div style={{ ...styles.sectionLabel, marginTop: '20px' }}>
              ONLINE MEMBERS ({onlineUsers.length})
            </div>
            {onlineUsers.map((user) => (
              <div key={user.id} style={styles.onlineUserRow}>
                <div style={styles.miniDot} />
                <span style={styles.onlineUserName}>
                  {user.name || user.email} {user.id === currentUser?.id ? '(You)' : ''}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    width: 'var(--sidebar-width)',
    height: '100%',
    flexShrink: 0,
    backgroundColor: 'var(--color-surface-container-low)',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--spacing-stack-md)',
    zIndex: 60,
    overflowY: 'auto',
  },
  workspaceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: 'var(--spacing-stack-lg)',
    paddingLeft: '6px',
    paddingTop: '8px',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-secondary-container))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '15px',
    border: '2px solid var(--color-surface)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-secondary)',
    border: '2px solid var(--color-surface)',
  },
  workspaceName: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  workspaceStatus: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '12px',
    color: 'var(--color-secondary)',
    lineHeight: '1.4',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-on-surface-variant)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s, background 0.2s',
    opacity: 0.6,
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingRight: '4px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-label-caps)',
    fontWeight: '600',
    letterSpacing: '0.1em',
    color: 'rgba(198, 197, 213, 0.5)',
    padding: '8px 16px 4px',
  },
  channelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-on-surface-variant)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-md)',
    transition: 'background 0.2s',
    position: 'relative',
  },
  channelBtnActive: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    color: 'var(--color-secondary)',
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: '20%',
    height: '60%',
    width: '3px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-secondary)',
  },
  channelIcon: {
    fontSize: '18px',
    opacity: 0.8,
  },
  channelLabel: {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-md)',
    fontWeight: '400',
  },
  dmStatusWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '12px',
    height: '12px',
    flexShrink: 0,
  },
  dmDotOnlinePing: {
    position: 'absolute',
    display: 'inline-flex',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'var(--color-secondary)',
    opacity: 0.2,
  },
  dmDotOnline: {
    position: 'relative',
    display: 'inline-flex',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-secondary)',
  },
  dmDotOffline: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid rgba(198, 197, 213, 0.5)',
  },
  onlineUserRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 16px',
    fontSize: '13px',
    color: 'var(--color-on-surface-variant)',
    fontFamily: 'var(--font-family-base)',
  },
  miniDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-secondary)',
    flexShrink: 0,
  },
  onlineUserName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

export default Sidebar
