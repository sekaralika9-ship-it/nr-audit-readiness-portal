import { describe, expect, it } from 'vitest'
import { getAllQuestions, isoStandards } from './isoReadinessData.js'

describe('ISO readiness catalog', () => {
  it('contains unique standards, clauses, and question ids', () => {
    expect(new Set(isoStandards.map((item) => item.id)).size).toBe(isoStandards.length)

    const questions = getAllQuestions()
    expect(questions.length).toBeGreaterThan(0)
    expect(new Set(questions.map((item) => item.id)).size).toBe(questions.length)
  })

  it('normalizes every question with its parent standard and clause metadata', () => {
    for (const question of getAllQuestions()) {
      expect(question.standardId).toBeTruthy()
      expect(question.standardCode).toMatch(/^ISO /)
      expect(question.clause).toBeTruthy()
      expect(question.auditQuestion).toBeTruthy()
      expect(question.requiredEvidence).toBeTruthy()
    }
  })
})
