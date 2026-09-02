import { useState } from 'react'
import heroLogo from '../assets/hero.png'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { signUp, signIn } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const logoLetters = ['A', 'U', 'R', 'A']

  function toggleMode(e) {
    e.preventDefault()
    setIsSignUp(prev => !prev)
    setError('')
    setSuccess('')
  }

  function validateInputs() {
    if (isSignUp && !name.trim()) {
      setError('Please enter your full name.')
      return false
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.')
      return false
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return false
    }

    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateInputs()) return

    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email.trim(), password)

        if (error) throw error

        if (!data.session) {
          setSuccess('Account created! Please check your email to verify your account.')
        } else {
          setSuccess('Account created successfully!')
        }

        setPassword('')
      } else {
        const { error } = await signIn(email.trim(), password)
        if (error) throw error
        setSuccess('Signed in successfully!')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlow} />
      <div style={styles.backgroundGlowSecondary} />
      <div style={styles.backgroundDashes} />

      <main style={styles.layout}>
        <section style={styles.brandPanel}>
          <div style={styles.brandWrap}>
            <div style={styles.logoImageWrap}>
              <img src={heroLogo} alt="Aura cat logo" className="cat-logo-reveal" style={styles.logoImage} />
            </div>

            <div aria-label="Aura wordmark" style={styles.logoStack}>
              {logoLetters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className="aura-letter-drop"
                  style={{
                    ...styles.logoWord,
                    animationDelay: `${index * 180}ms`,
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>

            <div style={styles.brandAccent} />

            <h2 style={styles.motto}>Connect. Communicate. Together.</h2>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <p style={styles.eyebrow}>AURA</p>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.subtitle}>Sign in to continue to AURA</p>
          </div>

          {error && (
            <div style={styles.errorBanner} role="alert">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={styles.successBanner} role="status">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {isSignUp && (
              <div style={styles.inputWrapper}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>person</span>
                <input
                  id="name"
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setError('')
                  }}
                  required
                  className="input-glow"
                  style={styles.input}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            )}

            <div style={styles.inputWrapper}>
              <span className="material-symbols-outlined" style={styles.inputIcon}>mail</span>
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setError('')
                }}
                required
                className="input-glow"
                style={styles.input}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div style={styles.inputWrapper}>
              <span className="material-symbols-outlined" style={styles.inputIcon}>lock</span>
              <input
                id="password"
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setError('')
                }}
                required
                minLength={6}
                className="input-glow"
                style={styles.input}
                disabled={loading}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            {!isSignUp && (
              <div style={styles.linkRow}>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault()
                    setError('Password reset will be added next.')
                  }}
                  style={styles.forgotLink}
                >
                  Forgot password?
                </a>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span style={styles.loadingText}>
                  <span className="material-symbols-outlined" style={styles.loadingIcon}>sync</span>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Create account' : 'Login'
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>OR</span>
            <div style={styles.dividerLine} />
          </div>

          <p style={styles.switchText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a href="#" onClick={toggleMode} style={styles.switchLink}>
              {isSignUp ? 'Sign in' : 'Create an account'}
            </a>
          </p>
        </section>
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    background: 'radial-gradient(circle at top, rgba(155, 123, 255, 0.12), transparent 32%), var(--aura-bg)',
  },
  backgroundGlow: {
    position: 'absolute',
    width: '420px',
    height: '420px',
    left: '8%',
    top: '14%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(155, 123, 255, 0.24), transparent 60%)',
    filter: 'blur(22px)',
    pointerEvents: 'none',
    animation: 'float-slow 12s ease-in-out infinite',
  },
  backgroundGlowSecondary: {
    position: 'absolute',
    width: '360px',
    height: '360px',
    right: '10%',
    bottom: '12%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(74, 217, 217, 0.14), transparent 60%)',
    filter: 'blur(16px)',
    pointerEvents: 'none',
    animation: 'float-slow 15s ease-in-out infinite reverse',
  },
  backgroundDashes: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '36px 36px',
    maskImage: 'radial-gradient(circle at center, black 35%, transparent 100%)',
    pointerEvents: 'none',
  },
  layout: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '1180px',
    minHeight: '720px',
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    borderRadius: '32px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(9, 15, 24, 0.7)',
    boxShadow: '0 20px 80px rgba(7, 11, 18, 0.7)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  },
  brandPanel: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.92), rgba(9, 14, 22, 0.95))',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  brandWrap: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '18px',
    textAlign: 'center',
    padding: '32px',
  },
  logoImageWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  logoImage: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
    borderRadius: '50%',
    boxShadow: '0 0 26px rgba(155, 123, 255, 0.24)',
    display: 'block',
  },
  logoStack: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '0.12em',
    minHeight: '80px',
    flexWrap: 'nowrap',
  },
  logoWord: {
    display: 'inline-block',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'clamp(38px, 4vw, 76px)',
    lineHeight: 1,
    letterSpacing: '0.04em',
    fontWeight: '800',
    color: '#f4f7ff',
    textTransform: 'uppercase',
    textShadow: '0 0 18px rgba(155, 123, 255, 0.42)',
    position: 'relative',
  },
  brandAccent: {
    width: '120px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(155, 123, 255, 0.7), rgba(74, 217, 217, 0.7), transparent)',
    opacity: 0.8,
  },
  motto: {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'clamp(16px, 2vw, 28px)',
    fontWeight: '500',
    letterSpacing: '0.05em',
    color: 'var(--aura-muted)',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '56px 42px',
    background: 'rgba(11, 16, 27, 0.86)',
  },
  cardHeader: { marginBottom: '28px' },
  eyebrow: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '11px',
    letterSpacing: '0.16em',
    color: 'var(--aura-secondary)',
    marginBottom: '10px',
    fontWeight: '700',
  },
  title: {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'clamp(30px, 2vw, 42px)',
    fontWeight: '700',
    color: 'var(--aura-text)',
    marginBottom: '8px',
  },
  subtitle: {
    fontFamily: 'var(--font-family-base)',
    color: 'var(--aura-muted)',
    fontSize: '16px',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 123, 152, 0.12)',
    border: '1px solid rgba(255, 123, 152, 0.42)',
    color: 'var(--aura-danger)',
    borderRadius: '12px',
    padding: '10px 14px',
    marginBottom: '18px',
    fontSize: '13px',
    fontFamily: 'var(--font-family-base)',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(78, 224, 160, 0.12)',
    border: '1px solid rgba(78, 224, 160, 0.36)',
    color: 'var(--aura-success)',
    borderRadius: '12px',
    padding: '10px 14px',
    marginBottom: '18px',
    fontSize: '13px',
    fontFamily: 'var(--font-family-base)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '16px', fontSize: '20px', color: 'var(--aura-muted)', pointerEvents: 'none' },
  input: {
    width: '100%',
    backgroundColor: 'rgba(20, 29, 40, 0.94)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '15px 18px 15px 50px',
    color: 'var(--aura-text)',
    fontFamily: 'var(--font-family-base)',
    fontSize: '15px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
  },
  linkRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-2px',
  },
  forgotLink: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '13px',
    color: 'var(--aura-secondary)',
    textDecoration: 'none',
  },
  submitBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, var(--aura-primary), var(--aura-primary-strong))',
    color: '#ffffff',
    fontFamily: 'var(--font-family-base)',
    fontSize: '16px',
    fontWeight: '700',
    padding: '15px 20px',
    border: 'none',
    borderRadius: '16px',
    marginTop: '10px',
    boxShadow: '0 12px 28px rgba(124, 92, 255, 0.3)',
    cursor: 'pointer',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  loadingIcon: {
    animation: 'spin 1s linear infinite',
    fontSize: '20px',
  },
  divider: { display: 'flex', alignItems: 'center', margin: '26px 0 18px', gap: '14px' },
  dividerLine: { flex: 1, borderTop: '1px solid rgba(255,255,255,0.08)' },
  dividerText: { fontFamily: 'var(--font-family-base)', fontSize: '11px', letterSpacing: '0.14em', color: 'var(--aura-muted)' },
  switchText: {
    textAlign: 'center',
    fontFamily: 'var(--font-family-base)',
    fontSize: '15px',
    color: 'var(--aura-muted)',
  },
  switchLink: {
    color: 'var(--aura-secondary)',
    fontWeight: '600',
    textDecoration: 'none',
  },
}

export default LoginPage