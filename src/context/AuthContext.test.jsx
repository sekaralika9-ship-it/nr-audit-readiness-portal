import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  getAuthSession: vi.fn(),
  saveAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
}))

vi.mock('../lib/apiClient.js', () => ({
  apiClient: { get: mocks.get, post: mocks.post },
  isBackendApiConfigured: true,
}))

vi.mock('../lib/authSession.js', () => ({
  getAuthSession: mocks.getAuthSession,
  saveAuthSession: mocks.saveAuthSession,
  clearAuthSession: mocks.clearAuthSession,
}))

import { AuthProvider, useAuth } from './AuthContext.jsx'

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getAuthSession.mockReturnValue(null)
  })

  it('validates and exposes a saved portal session', async () => {
    const saved = { accessToken: 'token', expiresAt: '2099-01-01', user: { id: 'old' } }
    const user = { id: 'user-1', email: 'ayu@example.com' }
    mocks.getAuthSession.mockReturnValue(saved)
    mocks.get.mockResolvedValue(user)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mocks.get).toHaveBeenCalledWith('auth/me')
    expect(result.current.user).toEqual(user)
    expect(result.current.isAuthenticated).toBe(true)
    expect(mocks.saveAuthSession).toHaveBeenCalledWith({ ...saved, user })
  })

  it('signs in through the ASP.NET API and stores its JWT', async () => {
    const response = {
      accessToken: 'jwt-token',
      expiresAt: '2099-01-01',
      user: { id: 'user-1' },
    }
    mocks.post.mockResolvedValue(response)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(() => result.current.login('ayu@example.com', 'secret123'))

    expect(mocks.post).toHaveBeenCalledWith('auth/login', {
      email: 'ayu@example.com',
      password: 'secret123',
    })
    expect(mocks.saveAuthSession).toHaveBeenCalledWith(response)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('registers a portal user and immediately stores the session', async () => {
    const response = { accessToken: 'jwt-token', user: { id: 'user-1' } }
    mocks.post.mockResolvedValue(response)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(() => result.current.signup({
      email: 'ayu@example.com', password: 'secret123', fullName: 'Ayu Auditor', fungsi: 'SPI',
    }))

    expect(mocks.post).toHaveBeenCalledWith('auth/register', {
      email: 'ayu@example.com', password: 'secret123', fullName: 'Ayu Auditor', function: 'SPI',
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('rejects incomplete credentials before calling the API', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await expect(result.current.login('', '')).rejects.toThrow('Email dan password wajib diisi.')
    expect(mocks.post).not.toHaveBeenCalled()
  })
})
