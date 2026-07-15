import { supabase, supabaseConfigError } from '../lib/supabaseClient.js'

const isoColumns = [
  ['iso_9001', 'ISO 9001'],
  ['iso_14001', 'ISO 14001'],
  ['iso_45001', 'ISO 45001'],
  ['iso_37001', 'ISO 37001'],
  ['iso_22301', 'ISO 22301'],
]

function requireSupabase() {
  if (supabaseConfigError || !supabase) {
    throw new Error(supabaseConfigError || 'Supabase is not connected.')
  }
}

function hasIsoValue(value) {
  if (value === null || value === undefined || value === false || value === 0) return false
  if (typeof value !== 'string') return true

  const normalized = value.trim().toLowerCase()
  return normalized !== '' && !['false', 'no', 'n', '0', '-', 'n/a', 'not applicable'].includes(normalized)
}

function toDisplayText(value) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(toDisplayText).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    return Object.values(value).map(toDisplayText).filter(Boolean).join(', ')
  }
  return String(value)
}

function readableError(tableName, error) {
  console.error(`Unable to query ${tableName}:`, error)
  return new Error(`Unable to load audit master data from ${tableName}.`)
}

async function selectTable(tableName) {
  requireSupabase()
  const { data, error } = await supabase.from(tableName).select('*')

  if (error) throw readableError(tableName, error)
  return data ?? []
}

export function getIsoStandardsFromQuestion(row) {
  return isoColumns
    .filter(([column]) => hasIsoValue(row?.[column]))
    .map(([, isoCode]) => isoCode)
}

export function normalizeAuditQuestion(row) {
  const standardCodes = getIsoStandardsFromQuestion(row)
  const whatToVerify = toDisplayText(row?.what_to_verify)
  const auditorGuideline = toDisplayText(row?.auditor_guideline)
  const riskReview = toDisplayText(row?.risk_review)
  const kpiReview = toDisplayText(row?.kpi_review)
  const applicableFunction = toDisplayText(row?.applicable_function)

  return {
    id: toDisplayText(row?.question_key),
    questionKey: toDisplayText(row?.question_key),
    standardCodes,
    standardCode: standardCodes[0] || '',
    themeCode: toDisplayText(row?.theme_code),
    systemDomain: toDisplayText(row?.system_domain),
    objective: toDisplayText(row?.objective),
    applicableFunction,
    whatToVerify,
    auditQuestion: toDisplayText(row?.audit_question),
    requiredEvidence: toDisplayText(row?.evidence),
    kpiReview,
    riskReview,
    auditorGuideline,
    referenceSop: auditorGuideline || whatToVerify,
    pic: applicableFunction || 'Function Owner',
    status: 'Not Started',
    auditorCheck: 'Not Checked',
    auditorNotes: '',
    recommendation: riskReview || kpiReview || whatToVerify || auditorGuideline,
  }
}

export async function fetchAuditThemes() {
  return selectTable('audit_master_themes')
}

export async function fetchAuditQuestions() {
  const rows = await selectTable('audit_master_questions')
  return rows.map(normalizeAuditQuestion)
}

export async function fetchQuestionsByIso(isoCode) {
  const normalizedIso = String(isoCode || '').trim().toUpperCase()
  const questions = await fetchAuditQuestions()
  if (normalizedIso === 'ALL-ISO') {
    return questions.filter((question) => question.standardCodes.length > 0)
  }
  return questions.filter((question) =>
    question.standardCodes.some((code) => code.toUpperCase() === normalizedIso),
  )
}

export async function fetchQuestionsByTheme(themeCode) {
  const normalizedTheme = String(themeCode || '').trim().toLowerCase()
  const questions = await fetchAuditQuestions()

  if (!normalizedTheme || normalizedTheme === 'all-themes') return questions
  return questions.filter(
    (question) => String(question.themeCode || '').trim().toLowerCase() === normalizedTheme,
  )
}

export async function fetchThemeCodes() {
  const questions = await fetchAuditQuestions()
  return Array.from(
    new Set(questions.map((question) => question.themeCode).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
}

export async function fetchQuestionsByFunction(functionName) {
  const normalizedFunction = String(functionName || '').trim().toLowerCase()
  const questions = await fetchAuditQuestions()

  if (!normalizedFunction) return questions
  return questions.filter((question) =>
    String(question.applicableFunction || '').toLowerCase().includes(normalizedFunction),
  )
}

// Backward-compatible raw master getters used by the Knowledge Center tabs.
export async function getAuditThemes() {
  return fetchAuditThemes()
}

export async function getAuditQuestions() {
  return selectTable('audit_master_questions')
}

export async function getIsoCoverage() {
  return selectTable('audit_master_iso_coverage')
}

export async function getAuditMethodology() {
  return selectTable('audit_master_methodology_steps')
}

export async function getAuditPrinciples() {
  return selectTable('audit_master_principles')
}
