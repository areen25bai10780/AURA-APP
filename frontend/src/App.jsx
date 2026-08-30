import { useEffect } from 'react'
import LoginPage from './components/LoginPage'
import ChatLayout from './components/ChatLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

function AppContent() {
  const { user, loading, signOut } = useAuth()

  // Show loading while Supabase checks the session
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

  // User is NOT logged in
  if (!user) {
    return <LoginPage />
  }

  // User IS logged in
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App