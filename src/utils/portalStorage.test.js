import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSession,
  getDisplayIdentity,
  getSession,
  getStoredProfile,
  saveSession,
  saveStoredProfile,
  deleteStoredWorkspace,
  getActiveStoredWorkspace,
  getStoredWorkspaces,
  saveStoredWorkspace,
  setActiveStoredWorkspace,
  getWorkspaceQuestionState,
  saveWorkspaceQuestionState,
  updateStoredWorkspace,
} from './portalStorage.js'

describe('portalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns safe defaults when storage is empty or malformed', () => {
    expect(getStoredProfile()).toMatchObject({ fullName: '', department: '' })
    localStorage.setItem('nr-audit-profile', '{invalid json')
    expect(getStoredProfile()).toMatchObject({ fullName: '', email: '' })
  })

  it('merges and persists profile values and announces the update', () => {
    const listener = vi.fn()
    window.addEventListener('nr-profile-updated', listener)

    saveStoredProfile({ fullName: 'Ayu', department: 'HSSE' })
    const updated = saveStoredProfile({ role: 'Function Owner' })

    expect(updated).toMatchObject({
      fullName: 'Ayu',
      department: 'HSSE',
      role: 'Function Owner',
    })
    expect(updated.updatedAt).toBeTruthy()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('stores, exposes, and clears the local session', () => {
    saveSession({ email: 'auditor@example.com' })
    expect(getSession()).toMatchObject({
      email: 'auditor@example.com',
      isSignedIn: true,
    })

    clearSession()
    expect(getSession()).toMatchObject({ email: '', isSignedIn: false })
  })

  it('builds the header identity from profile with an email fallback', () => {
    saveSession({ email: 'auditor@example.com' })
    expect(getDisplayIdentity().name).toBe('auditor')

    saveStoredProfile({ fullName: 'Ayu Auditor', department: 'SPI' })
    expect(getDisplayIdentity()).toMatchObject({
      name: 'Ayu Auditor',
      department: 'SPI',
      email: 'auditor@example.com',
    })
  })

  it('saves, reopens, updates, and deletes audit workspaces', () => {
    const first = saveStoredWorkspace({ id: 'WS-1', name: 'Manager Review' })
    saveStoredWorkspace({ id: 'WS-2', name: 'HSSE Review' })

    expect(getStoredWorkspaces()).toHaveLength(2)
    expect(getActiveStoredWorkspace().id).toBe('WS-2')
    expect(setActiveStoredWorkspace('WS-1')).toMatchObject(first)

    saveStoredWorkspace({ ...first, questionUpdates: { 'Q-1': { auditorCheck: 'OK' } } })
    expect(getActiveStoredWorkspace().questionUpdates['Q-1'].auditorCheck).toBe('OK')

    deleteStoredWorkspace('WS-1')
    expect(getStoredWorkspaces().map((item) => item.id)).toEqual(['WS-2'])
  })

  it('updates workspace metadata and persists question status', () => {
    saveStoredWorkspace({ id: 'WS-DETAIL', name: 'Initial', questionStates: {} })
    updateStoredWorkspace('WS-DETAIL', { name: 'Manager Review' })
    saveWorkspaceQuestionState('WS-DETAIL', 'A04-Q01', {
      status: 'Ready',
      auditorCheck: 'OK',
      auditorNotes: 'Evidence confirmed.',
    })

    expect(getStoredWorkspaces()[0].name).toBe('Manager Review')
    expect(getWorkspaceQuestionState('WS-DETAIL', 'A04-Q01')).toMatchObject({
      status: 'Ready',
      auditorCheck: 'OK',
      auditorNotes: 'Evidence confirmed.',
    })
  })

  it('does not replace the active workspace with an unknown id', () => {
    saveStoredWorkspace({ id: 'WS-VALID', name: 'Valid workspace' })

    expect(setActiveStoredWorkspace('WS-MISSING')).toBeNull()
    expect(getActiveStoredWorkspace().id).toBe('WS-VALID')
  })
})
