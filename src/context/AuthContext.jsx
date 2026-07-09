import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState(supabaseConfigError)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError(supabaseConfigError)
      return
    }

    let mounted = true

    async function loadSession() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setError(error.message)
        setSession(null)
        setUser(null)
      } else {
        setSession(data.session)
        setUser(data.session?.user ?? null)
      }

      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function login(email, password) {
    if (!supabase) {
      throw new Error(supabaseConfigError)
    }

    if (!email || !password) {
      throw new Error('Email dan password wajib diisi.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message || 'Login gagal.')
    }

    if (!data.session || !data.user) {
      throw new Error('Login gagal. Session Supabase tidak ditemukan.')
    }

    setSession(data.session)
    setUser(data.user)

    return data
  }

  async function signup({ email, password, fullName, fungsi }) {
    if (!supabase) {
      throw new Error(supabaseConfigError)
    }

    if (!email || !password || !fullName || !fungsi) {
      throw new Error('Nama lengkap, fungsi, email, dan password wajib diisi.')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          fungsi,
        },
      },
    })

    if (error) {
      throw new Error(error.message || 'Signup gagal.')
    }

    if (!data.user) {
      throw new Error('Signup gagal. User Supabase tidak terbentuk.')
    }

    return data
  }

  async function logout() {
    if (!supabase) {
      setSession(null)
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message || 'Logout gagal.')
    }

    setSession(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      error,
      login,
      signup,
      logout,
      isAuthenticated: Boolean(session?.user),
    }),
    [session, user, loading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
