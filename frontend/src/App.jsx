import { useState } from 'react'
import heroLogo from './assets/hero.png'
import LoginPage from './components/LoginPage'
import ChatLayout from './components/ChatLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

function SplashScreen({ onStart }) {
  const letters = ['A', 'U', 'R', 'A']

  return (
    <div style={splashStyles.page}>
      <div style={splashStyles.glowOne} />
      <div style={splashStyles.glowTwo} />
      <div style={splashStyles.grid} />

      <main style={splashStyles.centerWrap}>
        <div className="aura-origin-stage" style={splashStyles.originStage}>
          <div style={splashStyles.logoWrap}>
            <img
              src={heroLogo}
              alt="Aura cat logo"
              className="cat-logo-reveal"
              style={splashStyles.logoImage}
            />
          </div>

          <div style={splashStyles.originClip}>
            <div aria-label="Aura wordmark" style={splashStyles.wordmark}>
              {letters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className="aura-letter-drop"
                  style={{
                    ...splashStyles.letter,
                    animationDelay: `${index * 180}ms`,
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p style={splashStyles.tagline} className="aura-fade-in">
          Connect. Communicate. Together.
        </p>

        <button type="button" onClick={onStart} style={splashStyles.cta} className="splash-cta">
          LET&apos;S START
        </button>
      </main>
    </div>
  )
}

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleStart = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setShowSplash(false)
    }, 320)
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-background)',
          color: 'var(--color-on-surface)',
        }}
      >
        Loading Aura...
      </div>
    )
  }

  if (user) {
    return (
      <ChatLayout
        currentUser={{
          id: user.id,
          email: user.email,
          name:
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User',
        }}
        onLogout={signOut}
      />
    )
  }

  if (showSplash) {
    return (
      <div className={isTransitioning ? 'splash-screen splash-exit' : 'splash-screen'}>
        <SplashScreen onStart={handleStart} />
      </div>
    )
  }

  return <div className="login-enter"><LoginPage /></div>
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

const splashStyles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, rgba(155, 123, 255, 0.14), transparent 32%), var(--aura-bg)',
    overflow: 'hidden',
    color: 'var(--aura-text)',
  },
  glowOne: {
    position: 'absolute',
    width: '480px',
    height: '480px',
    top: '8%',
    left: '16%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(155, 123, 255, 0.2), transparent 60%)',
    filter: 'blur(30px)',
    pointerEvents: 'none',
  },
  glowTwo: {
    position: 'absolute',
    width: '420px',
    height: '420px',
    right: '12%',
    bottom: '12%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(74, 217, 217, 0.18), transparent 60%)',
    filter: 'blur(20px)',
    pointerEvents: 'none',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '36px 36px',
    maskImage: 'radial-gradient(circle at center, black 42%, transparent 100%)',
    pointerEvents: 'none',
  },
  centerWrap: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    zIndex: 1,
    padding: '32px 24px',
    maxWidth: '640px',
  },
  originStage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    width: '100%',
    maxWidth: '520px',
  },
  logoWrap: {
    marginBottom: '2px',
    position: 'relative',
    zIndex: 2,
  },
  logoImage: {
    width: '122px',
    height: '122px',
    objectFit: 'contain',
    borderRadius: '50%',
    boxShadow: '0 0 28px rgba(155, 123, 255, 0.22)',
    display: 'block',
  },
  originClip: {
    position: 'relative',
    width: '100%',
    height: '120px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: '-6px',
    zIndex: 1,
  },
  wordmark: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '0.08em',
    margin: '0',
    paddingTop: '18px',
    flexWrap: 'nowrap',
    position: 'relative',
    transform: 'translateY(0)',
  },
  letter: {
    display: 'inline-block',
    fontSize: 'clamp(42px, 6vw, 96px)',
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#f5f7ff',
    textTransform: 'uppercase',
    textShadow: '0 0 22px rgba(155, 123, 255, 0.42)',
    background: 'linear-gradient(180deg, #ffffff 0%, #dfe8ff 32%, #a7b5ff 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  tagline: {
    margin: 0,
    fontSize: 'clamp(16px, 2vw, 28px)',
    fontWeight: 500,
    letterSpacing: '0.04em',
    color: 'var(--aura-muted)',
    opacity: 0,
    transform: 'translateY(12px)',
    animation: 'subtleFadeIn 0.7s ease-out 0.9s forwards',
  },
  cta: {
    marginTop: '28px',
    padding: '16px 36px',
    border: 'none',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, var(--aura-primary), var(--aura-primary-strong))',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    boxShadow: '0 14px 30px rgba(124, 92, 255, 0.28)',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
  },
}

export default App