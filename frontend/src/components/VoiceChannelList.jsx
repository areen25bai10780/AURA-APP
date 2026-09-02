function VoiceChannelList({ voiceChannels = [], activeVoiceChannel = null, onSelectVoice }) {
  return (
    <div>
      <div style={styles.sectionLabel}>VOICE CHANNELS</div>
      {voiceChannels.map((channel) => {
        const channelName = channel.name || channel
        const isActive = String(activeVoiceChannel || '').toLowerCase() === String(channelName).toLowerCase()

        return (
          <button
            key={channel.id || channelName}
            type="button"
            onClick={() => onSelectVoice && onSelectVoice(channelName)}
            style={{
              ...styles.channelBtn,
              ...(isActive ? styles.channelBtnActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={styles.channelIcon}>volume_up</span>
            <span style={styles.channelLabel}>{channelName}</span>
            {isActive && <div style={styles.activeBar} />}
          </button>
        )
      })}
    </div>
  )
}

const styles = {
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
    position: 'relative',
  },
  channelBtnActive: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    color: 'var(--color-secondary)',
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
  activeBar: {
    position: 'absolute',
    right: 0,
    top: '20%',
    height: '60%',
    width: '3px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-secondary)',
  },
}

export default VoiceChannelList
