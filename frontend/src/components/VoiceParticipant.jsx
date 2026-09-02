function VoiceParticipant({ user, isMuted = false, isSelf = false }) {
  const displayName = user?.name || user?.email || 'User'

  return (
    <div style={styles.row}>
      <div style={{ ...styles.statusDot, backgroundColor: isSelf ? 'var(--color-secondary)' : 'rgba(94, 234, 212, 0.9)' }} />
      <span style={styles.name}>{isSelf ? `${displayName} (You)` : displayName}</span>
      {isMuted && <span style={styles.mutedLabel}>Muted</span>}
    </div>
  )
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    color: 'var(--color-on-surface)',
    fontFamily: 'var(--font-family-base)',
    fontSize: '14px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  name: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  mutedLabel: {
    fontSize: '11px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'rgba(198, 197, 213, 0.7)',
  },
}

export default VoiceParticipant
