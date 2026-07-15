import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteEvidenceByWorkspace,
  getEvidenceByQuestionKey,
  getEvidenceItems,
  saveEvidenceItem,
} from './evidenceService.js'

describe('evidenceService', () => {
  beforeEach(() => localStorage.clear())

  it('stores evidence in the mapped audit question pocket', () => {
    saveEvidenceItem({
      id: 'EV-1',
      questionKey: 'A01-Q01',
      evidenceTitle: 'Board direction record',
    })
    saveEvidenceItem({
      id: 'EV-2',
      questionKey: 'A02-Q01',
      evidenceTitle: 'Strategic plan',
    })

    expect(getEvidenceItems()).toHaveLength(2)
    expect(getEvidenceByQuestionKey('A01-Q01')).toMatchObject([
      { id: 'EV-1', evidenceTitle: 'Board direction record' },
    ])
  })

  it('scopes the same audit question to a specific workspace when requested', () => {
    saveEvidenceItem({ id: 'EV-1', workspaceId: 'WS-1', questionKey: 'Q-1', evidenceTitle: 'First' })
    saveEvidenceItem({ id: 'EV-2', workspaceId: 'WS-2', questionKey: 'Q-1', evidenceTitle: 'Second' })

    expect(getEvidenceByQuestionKey('Q-1')).toHaveLength(2)
    expect(getEvidenceByQuestionKey('Q-1', 'WS-2')).toMatchObject([
      { id: 'EV-2', evidenceTitle: 'Second' },
    ])
  })

  it('rejects evidence without a mapped audit question', () => {
    expect(() => saveEvidenceItem({ evidenceTitle: 'Unmapped' })).toThrow(
      'A mapped audit requirement is required.',
    )
  })

  it('deletes only evidence linked to the selected workspace', () => {
    saveEvidenceItem({ id: 'EV-1', workspaceId: 'WS-1', questionKey: 'Q-1' })
    saveEvidenceItem({ id: 'EV-2', workspaceId: 'WS-2', questionKey: 'Q-1' })

    expect(deleteEvidenceByWorkspace('WS-1')).toBe(1)
    expect(getEvidenceItems()).toMatchObject([{ id: 'EV-2', workspaceId: 'WS-2' }])
    expect(deleteEvidenceByWorkspace('')).toBe(0)
  })
})
