import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('../lib/apiClient.js', () => ({
  apiClient: { get: mocks.get },
  isBackendApiConfigured: true,
}))

import { getApiWorkspaceEvidence } from './workspaceApiService.js'

describe('workspaceApiService evidence loading', () => {
  beforeEach(() => mocks.get.mockReset())

  it('loads and maps evidence only for workspace questions with evidence', async () => {
    mocks.get.mockResolvedValueOnce([{
      id: 'EV-1',
      workspaceId: 'WS-1',
      questionKey: 'TH06-Q001',
      themeCode: 'TH06',
      isoStandard: 'ISO 9001',
      fileName: 'leadership-evidence.pdf',
      sourceUrl: 'https://example.com/evidence',
      evidenceDescription: 'Leadership evidence',
      createdAt: '2026-07-16T00:00:00Z',
    }])

    const result = await getApiWorkspaceEvidence('WS-1', [
      { id: 'TH06-Q001', questionKey: 'TH06-Q001', evidenceCount: 1 },
      { id: 'TH06-Q002', questionKey: 'TH06-Q002', evidenceCount: 0 },
    ])

    expect(mocks.get).toHaveBeenCalledOnce()
    expect(mocks.get).toHaveBeenCalledWith('workspaces/WS-1/questions/TH06-Q001/evidence')
    expect(result).toEqual([expect.objectContaining({
      id: 'EV-1',
      workspaceId: 'WS-1',
      questionKey: 'TH06-Q001',
      evidenceTitle: 'leadership-evidence.pdf',
      status: 'Linked',
    })])
  })
})
