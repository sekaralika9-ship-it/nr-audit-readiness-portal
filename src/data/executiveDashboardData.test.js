import { describe, expect, it } from 'vitest'
import {
  buildCsv,
  calculateExecutiveSummary,
  getReadinessLevel,
  groupByFunction,
  groupByStandard,
} from './executiveDashboardData.js'

const records = [
  {
    reportName: 'Quarterly "Review"',
    functionName: 'HSSE',
    auditeeCode: 'A06',
    standardCode: 'ISO 45001',
    score: 80,
    openActions: 2,
    evidenceGaps: 1,
    notes: 'First line',
  },
  {
    reportName: 'Second Review',
    functionName: 'HSSE',
    auditeeCode: 'A06',
    standardCode: 'ISO 9001',
    score: 100,
    openActions: 1,
    evidenceGaps: 0,
    notes: '',
  },
]

describe('executive dashboard calculations', () => {
  it('classifies readiness boundary values', () => {
    expect(getReadinessLevel(49).label).toBe('Critical')
    expect(getReadinessLevel(50).label).toBe('Needs Review')
    expect(getReadinessLevel(75).label).toBe('Ready')
    expect(getReadinessLevel(90).label).toBe('Audit Ready')
  })

  it('returns a zero summary when no records exist', () => {
    expect(calculateExecutiveSummary([])).toEqual({
      readinessScore: 0,
      totalFunctions: 0,
      totalStandards: 0,
      totalRecords: 0,
      totalOpenActions: 0,
      totalEvidenceGaps: 0,
      averageScore: 0,
      totalOk: 0,
      totalOfi: 0,
      totalMinor: 0,
      totalMajor: 0,
    })
  })

  it('calculates totals and unique dimensions', () => {
    expect(calculateExecutiveSummary(records)).toMatchObject({
      readinessScore: 90,
      totalFunctions: 1,
      totalStandards: 2,
      totalRecords: 2,
      totalOpenActions: 3,
      totalEvidenceGaps: 1,
    })
  })

  it('groups scores and gaps by function and standard', () => {
    expect(groupByFunction(records)).toEqual([
      {
        functionName: 'HSSE',
        auditeeCode: 'A06',
        readinessScore: 90,
        openActions: 3,
        evidenceGaps: 1,
      },
    ])
    expect(groupByStandard(records)).toHaveLength(2)
    expect(groupByStandard(records)[0]).toMatchObject({
      standardCode: 'ISO 45001',
      readinessScore: 80,
    })
  })

  it('escapes quotes when building CSV output', () => {
    const csv = buildCsv(records)
    expect(csv).toContain('"Quarterly ""Review"""')
    expect(csv.startsWith('\uFEFFsep=,\r\n')).toBe(true)
    expect(csv).toContain('"Auditee Code","Auditee Name"')
    expect(csv).toContain('"A06","HSSE"')
    expect(csv).toContain(',80,2,1,0,0,0,0,')
    expect(csv.split('\r\n')).toHaveLength(4)
  })
})
