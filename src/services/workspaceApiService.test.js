import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('../lib/apiClient.js', () => ({
  apiClient: { get: mocks.get },
  isBackendApiConfigured: true,
}))

import { getApiWorkspaceEvidence, getApiWorkspaceQuestions } from './workspaceApiService.js'

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

  it('maps backend key-question metadata into the workspace checklist model', async () => {
    mocks.get.mockResolvedValueOnce([{
      question: {
        questionKey: 'KQ-HSSE-CORE-01', functionName: 'HSSE', section: 'CORE',
        auditQuestion: 'Apa tujuan utama proses ini?', isoStandards: ['ISO 9001'],
        isoClauses: { 'ISO 9001': '4.4;6.2' }, auditTrail: 'HIRADC → PTW → Operasi',
        requiredEvidence: 'HIRADC, PTW', samplingGuide: 'Telusuri 1 proses end-to-end',
      },
      assessment: { assessmentResult: 'Ofi', checklistStatus: 'In Progress', correctiveAction: 'Close gap', assignedPerson: 'HSSE Manager' },
      evidenceCount: 2,
    }])

    const result = await getApiWorkspaceQuestions('WS-1')

    expect(result).toEqual([expect.objectContaining({
      id: 'KQ-HSSE-CORE-01', section: 'CORE', themeCode: 'HSSE', standardCodes: ['ISO 9001'],
      auditorCheck: 'OFI', recommendation: 'Close gap', pic: 'HSSE Manager', evidenceCount: 2,
    })])
  })
})
