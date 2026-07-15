import { beforeEach, describe, expect, it } from 'vitest'
import { getReportRecords, saveReportRecord } from './reportService.js'

describe('reportService', () => {
  beforeEach(() => localStorage.clear())

  it('persists report records and updates an existing record by id', () => {
    saveReportRecord({ id: 'RPT-1', reportName: 'Manager Review', score: 70 })
    saveReportRecord({ id: 'RPT-1', reportName: 'Manager Review', score: 85 })

    expect(getReportRecords()).toMatchObject([
      { id: 'RPT-1', reportName: 'Manager Review', score: 85 },
    ])
  })

  it('returns an empty list for malformed browser storage', () => {
    localStorage.setItem('nr-audit-report-records', '{invalid')
    expect(getReportRecords()).toEqual([])
  })
})
