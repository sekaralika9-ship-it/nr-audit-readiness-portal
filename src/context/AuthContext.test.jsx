import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      signOut: mocks.signOut,
    },
  },
  supabaseConfigError: null,
}))

import { AuthProvider, useAuth } from './AuthContext.jsx'

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset()
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mocks.unsubscribe } },
    })
    mocks.signOut.mockResolvedValue({ error: null })
  })

  it('loads and exposes the existing Supabase session', async () => {
    const session = { user: { id: 'user-1', email: 'ayu@example.com' } }
    mocks.getSession.mockResolvedValue({ data: { session }, error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toEqual(session)
    expect(result.current.user).toEqual(session.user)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('signs in with Supabase credentials and updates context state', async () => {
    const session = { user: { id: 'user-1' } }
    mocks.signInWithPassword.mockResolvedValue({
      data: { session, user: session.user },
      error: null,
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.login('ayu@example.com', 'secret123')

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'ayu@example.com',
      password: 'secret123',
    })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
  })

  it('passes signup profile metadata to Supabase Auth', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.signup({
      email: 'ayu@example.com',
      password: 'secret123',
      fullName: 'Ayu Auditor',
      fungsi: 'SPI',
    })

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'ayu@example.com',
      password: 'secret123',
      options: { data: { full_name: 'Ayu Auditor', fungsi: 'SPI' } },
    })
  })

  it('rejects incomplete credentials before calling Supabase', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.login('', '')).rejects.toThrow(
      'Email dan password wajib diisi.',
    )
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })
})
