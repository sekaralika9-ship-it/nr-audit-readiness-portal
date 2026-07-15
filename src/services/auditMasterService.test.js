import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: { from: mocks.from },
  supabaseConfigError: null,
}))

import {
  fetchAuditQuestions,
  fetchQuestionsByFunction,
  fetchQuestionsByIso,
  fetchQuestionsByTheme,
  fetchThemeCodes,
  getAuditMethodology,
  getAuditPrinciples,
  getAuditQuestions,
  getAuditThemes,
  getIsoCoverage,
  getIsoStandardsFromQuestion,
  normalizeAuditQuestion,
} from './auditMasterService.js'

describe('auditMasterService', () => {
  beforeEach(() => {
    mocks.from.mockReset()
  })

  it.each([
    ['audit_master_themes', getAuditThemes],
    ['audit_master_questions', getAuditQuestions],
    ['audit_master_iso_coverage', getIsoCoverage],
    ['audit_master_methodology_steps', getAuditMethodology],
    ['audit_master_principles', getAuditPrinciples],
  ])('selects all rows from %s', async (table, getter) => {
    const select = vi.fn().mockResolvedValue({ data: [{ created_at: 'now' }], error: null })
    mocks.from.mockReturnValue({ select })

    await expect(getter()).resolves.toEqual([{ created_at: 'now' }])
    expect(mocks.from).toHaveBeenCalledWith(table)
    expect(select).toHaveBeenCalledWith('*')
  })

  it('returns an empty array for a null response', async () => {
    mocks.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    await expect(getAuditThemes()).resolves.toEqual([])
  })

  it('raises a readable table-specific error', async () => {
    mocks.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } }),
    })
    await expect(getAuditQuestions()).rejects.toThrow(
      'Unable to load audit master data from audit_master_questions.',
    )
  })

  it('maps populated ISO columns and normalizes database fields for the UI', () => {
    const row = {
      question_key: 'Q-1',
      theme_code: 'TH-1',
      system_domain: 'HSSE',
      objective: 'Confirm readiness',
      applicable_function: 'HSSE',
      what_to_verify: 'Verify approved drill records',
      audit_question: 'Are emergency drills tested?',
      evidence: 'Drill report',
      kpi_review: 'Completion KPI',
      risk_review: 'Emergency response risk',
      iso_9001: false,
      iso_14001: 'x',
      iso_45001: true,
      iso_37001: '',
      iso_22301: 'not applicable',
      auditor_guideline: 'Review the emergency procedure',
    }

    expect(getIsoStandardsFromQuestion(row)).toEqual(['ISO 14001', 'ISO 45001'])
    expect(normalizeAuditQuestion(row)).toMatchObject({
      id: 'Q-1',
      standardCodes: ['ISO 14001', 'ISO 45001'],
      standardCode: 'ISO 14001',
      themeCode: 'TH-1',
      systemDomain: 'HSSE',
      applicableFunction: 'HSSE',
      requiredEvidence: 'Drill report',
      referenceSop: 'Review the emergency procedure',
      pic: 'HSSE',
      status: 'Not Started',
      auditorCheck: 'Not Checked',
      recommendation: 'Emergency response risk',
    })
  })

  it('supports all ISO, theme filtering, and distinct theme codes', async () => {
    const rows = [
      { question_key: 'Q-1', theme_code: 'A01', iso_9001: true },
      { question_key: 'Q-2', theme_code: 'A02', iso_45001: 'x' },
      { question_key: 'Q-3', theme_code: 'A01' },
    ]
    mocks.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: rows, error: null }),
    })

    await expect(fetchQuestionsByIso('all-iso')).resolves.toHaveLength(2)
    await expect(fetchQuestionsByTheme('A01')).resolves.toHaveLength(2)
    await expect(fetchThemeCodes()).resolves.toEqual(['A01', 'A02'])
  })

  it('returns normalized questions and filters them by ISO and function', async () => {
    const rows = [
      {
        question_key: 'Q-1',
        audit_question: 'HSSE question',
        applicable_function: 'HSSE',
        iso_45001: true,
      },
      {
        question_key: 'Q-2',
        audit_question: 'Quality question',
        applicable_function: 'Quality Management',
        iso_9001: true,
      },
    ]
    mocks.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: rows, error: null }),
    })

    await expect(fetchAuditQuestions()).resolves.toHaveLength(2)
    await expect(fetchQuestionsByIso('iso 45001')).resolves.toMatchObject([
      { id: 'Q-1' },
    ])
    await expect(fetchQuestionsByFunction('quality')).resolves.toMatchObject([
      { id: 'Q-2' },
    ])
  })
})
