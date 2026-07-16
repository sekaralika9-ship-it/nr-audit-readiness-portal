import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, isBackendApiConfigured } from '../lib/apiClient.js'
import { clearAuthSession, getAuthSession, saveAuthSession } from '../lib/authSession.js'

const AuthContext = createContext(null)

function normalizeSession(data) {
  return {
    accessToken: data.accessToken,
    expiresAt: data.expiresAt,
    user: data.user,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getAuthSession())
  const [loading, setLoading] = useState(Boolean(getAuthSession()))
  const [error, setError] = useState(isBackendApiConfigured ? '' : 'Backend API is not configured.')

  useEffect(() => {
    let active = true
    const current = getAuthSession()
    if (!current) return undefined
    apiClient.get('auth/me')
      .then((user) => {
        if (!active) return
        const next = { ...current, user }
        saveAuthSession(next)
        setSession(next)
      })
      .catch(() => {
        if (!active) return
        clearAuthSession()
        setSession(null)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function login(email, password) {
    if (!email || !password) throw new Error('Email dan password wajib diisi.')
    const data = await apiClient.post('auth/login', { email, password })
    const next = normalizeSession(data)
    saveAuthSession(next)
    setSession(next)
    setError('')
    return next
  }

  async function signup({ email, password, fullName, fungsi }) {
    if (!email || !password || !fullName || !fungsi)
      throw new Error('Nama lengkap, fungsi, email, dan password wajib diisi.')
    const data = await apiClient.post('auth/register', { email, password, fullName, function: fungsi })
    const next = normalizeSession(data)
    saveAuthSession(next)
    setSession(next)
    setError('')
    return next
  }

  async function logout() {
    clearAuthSession()
    setSession(null)
  }

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: Boolean(session?.accessToken && session?.user),
  }), [session, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
