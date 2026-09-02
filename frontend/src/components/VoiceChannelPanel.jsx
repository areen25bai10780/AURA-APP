import VoiceParticipant from './VoiceParticipant'

function VoiceChannelPanel({
  channelName,
  participants = [],
  isMuted = false,
  onToggleMute,
  onLeave,
  currentUser,
  error,
  remoteStreams = {},
}) {
  const selfId = String(currentUser?.id || currentUser?.email || 'guest')

  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.label}>VOICE CHANNEL</div>
          <div style={styles.channelName}>🔊 {channelName}</div>
        </div>
        <div style={styles.controls}>
          <button type="button" style={styles.primaryButton} onClick={onToggleMute}>
            {isMuted ? '🎙 Unmute' : '🔇 Mute'}
          </button>
          <button type="button" style={styles.leaveButton} onClick={onLeave}>
            📞 Leave
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.participantWrap}>
        <div style={styles.sectionTitle}>Connected to: {channelName}</div>
        <div style={styles.participantList}>
          {participants.map((participant) => {
            const participantId = String(participant.id || participant.userId || participant.email || participant.name || 'guest')
            const participantIsMuted = Boolean(participant.muted)
            const isSelf = participantId === selfId

            return (
              <VoiceParticipant
                key={participantId}
                user={participant}
                isMuted={participantIsMuted || (isSelf && isMuted)}
                isSelf={isSelf}
              />
            )
          })}
        </div>
      </div>

      {Object.entries(remoteStreams).map(([participantId, stream]) => (
        <audio
          key={participantId}
          autoPlay
          playsInline
          controls={false}
          ref={(audio) => {
            if (audio) {
              audio.srcObject = stream
            }
          }}
        />
      ))}
    </div>
  )
}

const styles = {
  panel: {
    backgroundColor: 'rgba(17, 25, 38, 0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '18px',
    padding: '16px',
    margin: '12px auto 0',
    width: 'min(900px, calc(100% - 32px))',
    boxShadow: '0 12px 36px rgba(15, 23, 42, 0.18)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '11px',
    letterSpacing: '0.12em',
    color: 'rgba(198, 197, 213, 0.6)',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  channelName: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--color-on-surface)',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    borderRadius: '999px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  leaveButton: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: 'var(--color-on-surface-variant)',
    borderRadius: '999px',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  error: {
    marginTop: '12px',
    color: '#f8b4b4',
    fontSize: '14px',
    fontFamily: 'var(--font-family-base)',
  },
  participantWrap: {
    marginTop: '18px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    color: 'rgba(198, 197, 213, 0.7)',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  participantList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
}

export default VoiceChannelPanel
