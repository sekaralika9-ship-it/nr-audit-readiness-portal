import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ fetchAuditQuestions: vi.fn() }))

vi.mock('../services/auditMasterService.js', () => ({
  fetchAuditQuestions: mocks.fetchAuditQuestions,
}))

import useAuditMasterQuestions from './useAuditMasterQuestions.js'

const fallback = [
  {
    id: 'fallback-1',
    standardCode: 'ISO 9001',
    auditQuestion: 'Fallback question',
    requiredEvidence: 'Fallback evidence',
    pic: 'Quality Management',
  },
]

describe('useAuditMasterQuestions', () => {
  beforeEach(() => {
    mocks.fetchAuditQuestions.mockReset()
  })

  it('uses normalized Supabase questions as the source of truth', async () => {
    mocks.fetchAuditQuestions.mockResolvedValue([
      { id: 'live-1', standardCodes: ['ISO 45001'], auditQuestion: 'Live question' },
    ])
    const { result } = renderHook(() => useAuditMasterQuestions(fallback))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.questions[0].id).toBe('live-1')
    expect(result.current.usingFallback).toBe(false)
    expect(result.current.message).toBe('')
  })

  it('uses fallback content when Supabase returns no rows', async () => {
    mocks.fetchAuditQuestions.mockResolvedValue([])
    const { result } = renderHook(() => useAuditMasterQuestions(fallback))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.questions[0]).toMatchObject({
      id: 'fallback-1',
      standardCodes: ['ISO 9001'],
      status: 'Not Started',
    })
    expect(result.current.usingFallback).toBe(true)
    expect(result.current.message).toMatch(/No audit master questions found/)
  })

  it('hides raw request errors and keeps the fallback functional', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.fetchAuditQuestions.mockRejectedValue(new Error('sensitive database detail'))
    const { result } = renderHook(() => useAuditMasterQuestions(fallback))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.questions[0].id).toBe('fallback-1')
    expect(result.current.message).toBe(
      'Unable to load audit master data. Showing fallback readiness content.',
    )
    expect(result.current.message).not.toContain('sensitive')
  })
})
