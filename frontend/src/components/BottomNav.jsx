/**
 * BottomNav — Mobile-only bottom navigation bar.
 * On small screens (phones), users navigate via this bar
 * instead of the desktop sidebar which is hidden.
 *
 * Props:
 *   activeTab — which tab is currently selected ('messages' | 'search' | 'alerts' | 'profile')
 *   onTabChange — function called when a tab is tapped
 */
function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'messages', icon: 'chat_bubble', label: 'Messages' },
    { id: 'search',   icon: 'search',      label: 'Search'   },
    { id: 'alerts',   icon: 'notifications',label: 'Alerts'   },
    { id: 'profile',  icon: 'person',       label: 'Profile'  },
  ]

  return (
    <nav style={styles.nav} className="bottom-nav">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              ...styles.tab,
              color: isActive ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
              fontWeight: isActive ? '600' : '400',
            }}
            aria-label={tab.label}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                fontSize: '24px',
                marginBottom: '4px',
              }}
            >
              {tab.icon}
            </span>
            <span style={styles.label}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '72px',
    backgroundColor: 'rgba(5, 20, 36, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px 16px 0 0',
    padding: '0 16px',
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s',
    fontFamily: 'var(--font-family-base)',
  },
  label: {
    fontSize: 'var(--font-size-label-caps)',
    fontWeight: 'inherit',
    letterSpacing: '0.08em',
    lineHeight: '1.2',
  },
}

export default BottomNav
