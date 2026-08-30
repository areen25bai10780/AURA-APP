import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { signUp, signIn } = useAuth()

  // Mode: false = Sign In, true = Sign Up
  const [isSignUp, setIsSignUp] = useState(false)

  // Form inputs
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Switch between Sign In and Sign Up
  function toggleMode(e) {
    e.preventDefault()
    setIsSignUp(prev => !prev)
    setError('')
    setSuccess('')
  }

  // Validate form
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

  // Submit login/signup form
  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!validateInputs()) {
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        // SUPABASE SIGN UP
        const { data, error } = await signUp(
          email.trim(),
          password
        )

        if (error) {
          throw error
        }

        // Supabase may require email verification
        if (!data.session) {
          setSuccess(
            'Account created! Please check your email to verify your account.'
          )
        } else {
          setSuccess('Account created successfully!')
        }

        // Clear password after signup
        setPassword('')
      } else {
        // SUPABASE SIGN IN
        const { error } = await signIn(
          email.trim(),
          password
        )

        if (error) {
          throw error
        }

        setSuccess('Signed in successfully!')
      }
    } catch (err) {
      setError(
        err.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>

      {/* Background glow */}
      <div style={styles.orbPrimary} />
      <div style={styles.orbSecondary} />

      {/* Auth Card */}
      <main style={styles.card}>

        {/* Logo */}
        <div style={styles.header}>
          <h1 style={styles.logo}>Aura</h1>

          <p style={styles.tagline}>
            {isSignUp
              ? 'Create your workspace account.'
              : 'Your space to connect and focus.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBanner} role="alert">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px' }}
            >
              error
            </span>

            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={styles.successBanner} role="status">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px' }}
            >
              check_circle
            </span>

            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Name - Signup only */}
          {isSignUp && (
            <div style={styles.inputWrapper}>

              <span
                className="material-symbols-outlined"
                style={styles.inputIcon}
              >
                person
              </span>

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

          {/* Email */}
          <div style={styles.inputWrapper}>

            <span
              className="material-symbols-outlined"
              style={styles.inputIcon}
            >
              mail
            </span>

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

          {/* Password */}
          <div style={styles.inputWrapper}>

            <span
              className="material-symbols-outlined"
              style={styles.inputIcon}
            >
              lock
            </span>

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
              autoComplete={
                isSignUp
                  ? 'new-password'
                  : 'current-password'
              }
            />

          </div>

          {/* Forgot password */}
          {!isSignUp && (
            <div
              style={{
                textAlign: 'right',
                marginTop: '-4px'
              }}
            >
              <a
                href="#"
                onClick={e => {
                  e.preventDefault()
                  setError(
                    'Password reset will be added next.'
                  )
                }}
                style={styles.forgotLink}
              >
                Forgot password?
              </a>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? 'not-allowed'
                : 'pointer'
            }}
          >

            {loading ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    animation:
                      'spin 1s linear infinite',
                    fontSize: '20px'
                  }}
                >
                  sync
                </span>

                {isSignUp
                  ? 'Creating Account...'
                  : 'Signing In...'}
              </span>
            ) : (
              isSignUp
                ? 'Create Account'
                : 'Sign In'
            )}

          </button>

        </form>

        {/* Divider */}
        <div style={styles.divider}>

          <div style={styles.dividerLine} />

          <span style={styles.dividerText}>
            Or
          </span>

          <div style={styles.dividerLine} />

        </div>

        {/* Mode switch */}
        <p style={styles.createAccount}>

          {isSignUp
            ? 'Already have an account?'
            : "Don't have an account?"}{' '}

          <a
            href="#"
            onClick={toggleMode}
            style={styles.createLink}
          >
            {isSignUp
              ? 'Sign In'
              : 'Create Account'}
          </a>

        </p>

      </main>
    </div>
  )
}

/* =========================
   STYLES
========================= */

const styles = {

  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--color-background)',
  },

  orbPrimary: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '384px',
    height: '384px',
    background: 'var(--color-primary-container)',
    borderRadius: '50%',
    filter: 'blur(120px)',
    opacity: 0.15,
    pointerEvents: 'none',
  },

  orbSecondary: {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    width: '480px',
    height: '480px',
    background: 'var(--color-secondary-container)',
    borderRadius: '50%',
    filter: 'blur(150px)',
    opacity: 0.08,
    pointerEvents: 'none',
  },

  card: {
    width: '100%',
    maxWidth: '440px',
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'rgba(28, 43, 60, 0.6)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 'var(--radius-xl)',
    padding: '48px',
    boxShadow:
      '0 0 40px rgba(129, 140, 248, 0.1)',
  },

  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },

  logo: {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-display-lg)',
    fontWeight: '600',
    letterSpacing: '0.04em',
    color: 'var(--color-primary)',
    marginBottom: '8px',
    lineHeight: '1.2',
  },

  tagline: {
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-md)',
    color: 'var(--color-on-surface-variant)',
    lineHeight: '1.6',
  },

  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(147, 0, 10, 0.25)',
    border: '1px solid var(--color-error)',
    color: 'var(--color-error)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    marginBottom: '20px',
    fontSize: '13px',
    fontFamily: 'var(--font-family-base)',
  },

  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(0, 189, 133, 0.15)',
    border: '1px solid var(--color-secondary)',
    color: 'var(--color-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    marginBottom: '20px',
    fontSize: '13px',
    fontFamily: 'var(--font-family-base)',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  inputIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '20px',
    color: 'var(--color-on-surface-variant)',
    opacity: 0.7,
    pointerEvents: 'none',
  },

  input: {
    width: '100%',
    backgroundColor: 'var(--color-surface-container)',
    border: '1px solid rgba(69, 70, 83, 0.5)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px 12px 48px',
    color: 'var(--color-on-surface)',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-md)',
    transition:
      'border-color 0.3s, box-shadow 0.3s',
  },

  forgotLink: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '13px',
    color: 'rgba(189, 194, 255, 0.8)',
    textDecoration: 'none',
  },

  submitBtn: {
    width: '100%',
    backgroundColor: 'var(--color-primary-container)',
    color: 'white',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-headline-sm)',
    fontWeight: '500',
    padding: '12px',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    marginTop: '8px',
    transition:
      'background-color 0.3s, box-shadow 0.3s, transform 0.2s',
    boxShadow:
      '0 4px 15px rgba(129, 140, 248, 0.2)',
  },

  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '28px 0',
    gap: '16px',
  },

  dividerLine: {
    flex: 1,
    borderTop:
      '1px solid rgba(255,255,255,0.05)',
  },

  dividerText: {
    fontFamily: 'var(--font-family-base)',
    fontSize: '11px',
    color: 'rgba(198, 197, 213, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },

  createAccount: {
    textAlign: 'center',
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--font-size-body-md)',
    color: 'var(--color-on-surface-variant)',
  },

  createLink: {
    color: 'var(--color-secondary)',
    fontWeight: '500',
    textDecoration: 'none',
    marginLeft: '4px',
    cursor: 'pointer',
  },
}

export default LoginPage