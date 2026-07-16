import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../lib/apiClient.js', () => ({ apiClient: api }))

import {
  fetchAuditQuestions, fetchQuestionsByFunction, fetchQuestionsByIso, fetchQuestionsByTheme,
  fetchThemeCodes, getAuditMethodology, getAuditPrinciples, getAuditQuestions, getAuditThemes,
  getIsoCoverage, getIsoStandardsFromQuestion, normalizeAuditQuestion,
} from './auditMasterService.js'

const questions = [
  { questionKey: 'Q-1', themeCode: 'A01', auditQuestion: 'HSSE?', applicableFunction: 'HSSE', isoStandards: ['ISO 45001'], requiredEvidence: 'Report' },
  { questionKey: 'Q-2', themeCode: 'A02', auditQuestion: 'Quality?', applicableFunction: 'Quality Management', isoStandards: ['ISO 9001'] },
  { questionKey: 'Q-3', themeCode: 'A01', auditQuestion: 'No ISO?', applicableFunction: 'Finance', isoStandards: [] },
]

describe('auditMasterService', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.get.mockImplementation((path) => {
      if (path === 'themes') return Promise.resolve([{ themeCode: 'TH01', auditTheme: 'Governance' }])
      if (path === 'questions?page=1&pageSize=100') return Promise.resolve(questions)
      throw new Error(`Unexpected API path: ${path}`)
    })
  })

  it('loads themes and maps the raw Knowledge Center shape', async () => {
    await expect(getAuditThemes()).resolves.toEqual([expect.objectContaining({ theme_id: 'TH01', audit_theme: 'Governance' })])
    expect(api.get).toHaveBeenCalledWith('themes')
  })

  it('normalizes backend questions and raw Knowledge Center rows', async () => {
    await expect(fetchAuditQuestions()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'Q-1', standardCode: 'ISO 45001' })]))
    await expect(getAuditQuestions()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ question_key: 'Q-2', iso_9001: 'Applicable' })]))
  })

  it('supports ISO, theme, function, and distinct theme filters', async () => {
    await expect(fetchQuestionsByIso('all-iso')).resolves.toHaveLength(2)
    await expect(fetchQuestionsByIso('ISO 45001')).resolves.toMatchObject([{ id: 'Q-1' }])
    await expect(fetchQuestionsByTheme('A01')).resolves.toHaveLength(2)
    await expect(fetchQuestionsByFunction('quality')).resolves.toMatchObject([{ id: 'Q-2' }])
    await expect(fetchThemeCodes()).resolves.toEqual(['A01', 'A02'])
  })

  it('keeps legacy row normalization for imported CSV data', () => {
    const row = { question_key: 'Q-1', theme_code: 'TH-1', applicable_function: 'HSSE', evidence: 'Report', iso_14001: 'x', iso_45001: true }
    expect(getIsoStandardsFromQuestion(row)).toEqual(['ISO 14001', 'ISO 45001'])
    expect(normalizeAuditQuestion(row)).toMatchObject({ id: 'Q-1', pic: 'HSSE', requiredEvidence: 'Report' })
  })

  it('returns empty supplemental datasets that are not part of the backend schema', async () => {
    await expect(getIsoCoverage()).resolves.toEqual([])
    await expect(getAuditMethodology()).resolves.toEqual([])
    await expect(getAuditPrinciples()).resolves.toEqual([])
  })
})
