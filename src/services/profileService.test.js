import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('../lib/apiClient.js', () => ({ apiClient: api }))

import { getCurrentProfile, saveCurrentProfile } from './profileService.js'

describe('profileService', () => {
  beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()))

  it('loads and adapts the authenticated API user', async () => {
    api.get.mockResolvedValue({
      id: 'user-123', email: 'ayu@example.com', fullName: 'Ayu', function: 'HSSE',
      roles: ['Auditor'], department: 'Operations', employeeId: 'EMP-1', phone: '0812',
    })

    const result = await getCurrentProfile()

    expect(api.get).toHaveBeenCalledWith('auth/me')
    expect(result.profile).toMatchObject({
      full_name: 'Ayu', fungsi: 'HSSE', role: 'Auditor', employee_id: 'EMP-1', phone: '0812',
    })
    expect(result.user.email).toBe('ayu@example.com')
  })

  it('updates only supported portal profile fields', async () => {
    api.put.mockResolvedValue({ id: 'user-123', email: 'ayu@example.com', roles: ['Auditor'] })

    await saveCurrentProfile({
      full_name: 'Ayu', fungsi: 'HSSE', department: 'Operations', employee_id: 'EMP-1', phone: '0812',
    })

    expect(api.put).toHaveBeenCalledWith('auth/me', {
      fullName: 'Ayu', function: 'HSSE', department: 'Operations', employeeId: 'EMP-1', phone: '0812',
    })
  })
})
