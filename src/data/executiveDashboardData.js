import { getAuditThemes } from '../services/auditMasterService';
import { auditeeOptions } from './auditeeData.js'

export async function fetchReportIsoStandards() {
  try {
    const themes = await getAuditThemes();
    return themes.map((theme) => ({
      id: theme.theme_id,
      code: theme.audit_theme,
      title: theme.audit_objective,
    }));
  } catch (error) {
    console.error('Error fetching ISO standards:', error.message);
    return [];
  }
}

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
      totalOk: 0,
      totalOfi: 0,
      totalMinor: 0,
      totalMajor: 0,
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
  const sumResult = (field) => records.reduce(
    (sum, record) => sum + Number(record[field] || 0),
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
    totalOk: sumResult('okCount'),
    totalOfi: sumResult('ofiCount'),
    totalMinor: sumResult('minorCount'),
    totalMajor: sumResult('majorCount'),
  }
}

export function groupByFunction(records) {
  const grouped = records.reduce((result, record) => {
    if (!result[record.functionName]) {
      result[record.functionName] = {
        functionName: record.functionName,
        auditeeCode: record.auditeeCode || record.functionName,
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
    auditeeCode: item.auditeeCode,
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
    'Auditee Code',
    'Auditee Name',
    'ISO Standard',
    'Readiness Score (%)',
    'Open Actions',
    'Evidence Gaps',
    'OK',
    'OFI',
    'Minor',
    'Major',
    'Executive Notes',
    'Created Date (UTC)',
  ]

  const rows = records.map((record) => [
    record.reportName,
    record.auditeeCode,
    record.auditeeName || record.functionName,
    record.standardCode,
    Number(record.score || 0),
    Number(record.openActions || 0),
    Number(record.evidenceGaps || 0),
    Number(record.okCount || 0),
    Number(record.ofiCount || 0),
    Number(record.minorCount || 0),
    Number(record.majorCount || 0),
    record.notes,
    record.createdAt
      ? `${new Date(record.createdAt).toISOString().slice(0, 19).replace('T', ' ')} UTC`
      : '',
  ])

  function formatCell(cell) {
    if (typeof cell === 'number' && Number.isFinite(cell)) return String(cell)

    let value = String(cell ?? '')
    if (/^[=+\-@]/.test(value)) value = `'${value}`
    return `"${value.replaceAll('"', '""')}"`
  }

  const content = [headers, ...rows]
    .map((row) =>
      row.map(formatCell).join(','),
    )
    .join('\r\n')

  return `\uFEFFsep=,\r\n${content}`
}
export const reportIsoStandards = [
  { id: 'all-iso', name: 'All ISO', code: 'All ISO' },
  'ISO 9001',
  'ISO 14001',
  'ISO 45001',
  'ISO 37001',
  'ISO 22301',
]
export const reportAuditees = auditeeOptions
