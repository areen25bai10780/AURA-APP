import { useState } from 'react'
import { uploadChatImage } from '../api/upload'

function MessageComposer({ channelName, onSend, onTyping }) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  function handleChange(e) {
    setText(e.target.value)

    if (onTyping) {
      onTyping()
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5 MB.')
      return
    }

    setSelectedFile(file)
  }

  async function handleSend(e) {
    e.preventDefault()

    const trimmed = text.trim()

    if (!trimmed && !selectedFile) {
      return
    }

    try {
      setUploading(true)

      let imageUrl = null

      if (selectedFile) {
        imageUrl = await uploadChatImage(selectedFile)
      }

      await onSend(trimmed, imageUrl)

      setText('')
      setSelectedFile(null)

      // Clear the file input
      const fileInput = document.getElementById('chat-file-input')
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert(error.message || 'Failed to send message.')
    } finally {
      setUploading(false)
    }
  }

  const hasContent = text.trim().length > 0 || selectedFile

  return (
    <div style={styles.wrapper}>
      <div style={styles.inner}>

        {selectedFile && (
          <div style={styles.preview}>
            📷 {selectedFile.name}
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              style={styles.removeButton}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSend} style={styles.form}>

          <label
            htmlFor="chat-file-input"
            style={styles.attachButton}
            title="Attach image"
          >
            📎
          </label>

          <input
            id="chat-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <input
            id="chat-input"
            type="text"
            placeholder={`Message #${channelName || 'general'}...`}
            value={text}
            onChange={handleChange}
            className="input-glow"
            style={styles.input}
            autoComplete="off"
            disabled={uploading}
          />

          <button
            id="send-btn"
            type="submit"
            disabled={uploading || !hasContent}
            style={{
              ...styles.sendBtn,
              opacity: hasContent && !uploading ? 1 : 0.5,
            }}
            aria-label="Send message"
          >
            {uploading ? '...' : '➤'}
          </button>

        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'fixed',
    bottom: '72px',
    left: 0,
    right: 0,
    padding: '8px var(--spacing-container-padding) 16px',
    background:
      'linear-gradient(to top, var(--color-background) 60%, transparent)',
    paddingTop: '32px',
    zIndex: 60,
  },

  inner: {
    maxWidth: '900px',
    margin: '0 auto',
    position: 'relative',
  },

  preview: {
    marginBottom: '8px',
    padding: '8px 12px',
    borderRadius: '10px',
    backgroundColor: 'var(--color-surface-container)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },

  removeButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '18px',
  },

  form: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },

  attachButton: {
    position: 'absolute',
    left: '12px',
    zIndex: 2,
    cursor: 'pointer',
    fontSize: '20px',
  },

  input: {
    width: '100%',
    backgroundColor: 'var(--color-surface-container)',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: 'var(--radius-full)',
    padding: '16px 100px 16px 50px',
    color: 'var(--color-on-surface)',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-lg)',
  },

  sendBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '38px',
    height: '38px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

export default MessageComposer