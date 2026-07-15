import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    from: mocks.from,
    auth: { getUser: mocks.getUser },
  },
  supabaseConfigError: null,
}))

import { getCurrentProfile, saveCurrentProfile } from './profileService.js'

describe('profileService', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.getUser.mockReset()
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'ayu@example.com' } },
      error: null,
    })
  })

  it('loads only the authenticated user profile', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'user-123', full_name: 'Ayu' },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    mocks.from.mockReturnValue({ select })

    const result = await getCurrentProfile()

    expect(mocks.from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-123')
    expect(result.profile.full_name).toBe('Ayu')
    expect(result.user.email).toBe('ayu@example.com')
  })

  it('upserts only confirmed profile columns with auth id', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'user-123', full_name: 'Ayu', fungsi: 'HSSE', role: 'Employee' },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    mocks.from.mockReturnValue({ upsert })

    await saveCurrentProfile({
      full_name: 'Ayu',
      fungsi: 'HSSE',
      role: 'Employee',
      phone: 'not-a-column',
    })

    expect(upsert).toHaveBeenCalledWith(
      {
        id: 'user-123',
        full_name: 'Ayu',
        fungsi: 'HSSE',
        role: 'Employee',
      },
      { onConflict: 'id' },
    )
  })

  it('stops before querying when authentication has no user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(getCurrentProfile()).rejects.toThrow(
      'You must be signed in to access your profile.',
    )
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
