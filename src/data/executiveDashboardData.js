import { isoStandards } from './isoReadinessData.js'
import { ownerFunctions } from './evidenceManagementData.js'

export const reportFunctions = ownerFunctions

export const reportIsoStandards = isoStandards.map((standard) => ({
  id: standard.id,
  code: standard.code,
  title: standard.title,
}))

export const readinessLevels = [
  {
    label: 'Critical',
    min: 0,
    max: 49,
    description: 'Preparation is not sufficient for audit readiness.',
  },
  {
    label: 'Needs Review',
    min: 50,
    max: 74,
    description: 'Preparation exists but requires review and completion.',
  },
  {
    label: 'Ready',
    min: 75,
    max: 89,
    description: 'Preparation is mostly complete and ready for internal review.',
  },
  {
    label: 'Audit Ready',
    min: 90,
    max: 100,
    description: 'Preparation is complete and ready to support audit discussion.',
  },
]

export function getReadinessLevel(score) {
  const numericScore = Number(score)

  return (
    readinessLevels.find(
      (level) => numericScore >= level.min && numericScore <= level.max,
    ) || readinessLevels[0]
  )
}

export function calculateExecutiveSummary(records) {
  if (!records.length) {
    return {
      readinessScore: 0,
      totalFunctions: 0,
      totalStandards: 0,
      totalRecords: 0,
      totalOpenActions: 0,
      totalEvidenceGaps: 0,
      averageScore: 0,
    }
  }

  const totalScore = records.reduce((sum, record) => sum + Number(record.score), 0)
  const totalOpenActions = records.reduce(
    (sum, record) => sum + Number(record.openActions || 0),
    0,
  )
  const totalEvidenceGaps = records.reduce(
    (sum, record) => sum + Number(record.evidenceGaps || 0),
    0,
  )

  return {
    readinessScore: Math.round(totalScore / records.length),
    totalFunctions: new Set(records.map((record) => record.functionName)).size,
    totalStandards: new Set(records.map((record) => record.standardCode)).size,
    totalRecords: records.length,
    totalOpenActions,
    totalEvidenceGaps,
    averageScore: Math.round(totalScore / records.length),
  }
}

export function groupByFunction(records) {
  const grouped = records.reduce((result, record) => {
    if (!result[record.functionName]) {
      result[record.functionName] = {
        functionName: record.functionName,
        scoreTotal: 0,
        count: 0,
        openActions: 0,
        evidenceGaps: 0,
      }
    }

    result[record.functionName].scoreTotal += Number(record.score)
    result[record.functionName].count += 1
    result[record.functionName].openActions += Number(record.openActions || 0)
    result[record.functionName].evidenceGaps += Number(record.evidenceGaps || 0)

    return result
  }, {})

  return Object.values(grouped).map((item) => ({
    functionName: item.functionName,
    readinessScore: Math.round(item.scoreTotal / item.count),
    openActions: item.openActions,
    evidenceGaps: item.evidenceGaps,
  }))
}

export function groupByStandard(records) {
  const grouped = records.reduce((result, record) => {
    if (!result[record.standardCode]) {
      result[record.standardCode] = {
        standardCode: record.standardCode,
        scoreTotal: 0,
        count: 0,
        openActions: 0,
        evidenceGaps: 0,
      }
    }

    result[record.standardCode].scoreTotal += Number(record.score)
    result[record.standardCode].count += 1
    result[record.standardCode].openActions += Number(record.openActions || 0)
    result[record.standardCode].evidenceGaps += Number(record.evidenceGaps || 0)

    return result
  }, {})

  return Object.values(grouped).map((item) => ({
    standardCode: item.standardCode,
    readinessScore: Math.round(item.scoreTotal / item.count),
    openActions: item.openActions,
    evidenceGaps: item.evidenceGaps,
  }))
}

export function buildCsv(records) {
  const headers = [
    'Report Name',
    'Function',
    'ISO Standard',
    'Readiness Score',
    'Open Actions',
    'Evidence Gaps',
    'Executive Notes',
  ]

  const rows = records.map((record) => [
    record.reportName,
    record.functionName,
    record.standardCode,
    record.score,
    record.openActions,
    record.evidenceGaps,
    record.notes,
  ])

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n')
}
