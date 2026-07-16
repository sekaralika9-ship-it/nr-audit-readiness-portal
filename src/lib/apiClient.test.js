import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ getAuthSession: vi.fn(), clearAuthSession: vi.fn() }))

vi.mock('./authSession.js', () => auth)

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api/v1')
    auth.getAuthSession.mockReturnValue({ accessToken: 'portal-token' })
    auth.clearAuthSession.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('sends the portal JWT and unwraps successful data', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { id: 'WS-1' }, errors: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    const { apiClient } = await import('./apiClient.js')

    await expect(apiClient.get('workspaces/WS-1')).resolves.toEqual({ id: 'WS-1' })
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/v1/workspaces/WS-1', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ Authorization: 'Bearer portal-token' }),
    }))
  })

  it('allows anonymous authentication requests when no token exists', async () => {
    auth.getAuthSession.mockReturnValue(null)
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { accessToken: 'new' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    const { apiClient } = await import('./apiClient.js')

    await apiClient.post('auth/login', { email: 'a@example.com', password: 'secret' })
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it('surfaces API ProblemDetails and validation errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'Request validation failed', errors: { workspaceName: ['Workspace name is required.'] } }), { status: 400, headers: { 'Content-Type': 'application/problem+json' } })))
    const { apiClient, ApiError } = await import('./apiClient.js')

    await expect(apiClient.post('workspaces', {})).rejects.toMatchObject({
      constructor: ApiError, status: 400, message: 'Workspace name is required.',
    })
  })
})
