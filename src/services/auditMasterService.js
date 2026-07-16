import { supabase, supabaseConfigError } from '../lib/supabaseClient.js'
import { apiClient, isBackendApiConfigured } from '../lib/apiClient.js'

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
  if (isBackendApiConfigured) return apiClient.get('themes')
  return selectTable('audit_master_themes')
}

async function fetchAllBackendQuestions() {
  const pageSize = 100
  const rows = []

  for (let page = 1; ; page += 1) {
    const response = await apiClient.get(`questions?page=${page}&pageSize=${pageSize}`)
    const batch = Array.isArray(response) ? response : response.data || []
    rows.push(...batch)
    if (batch.length < pageSize) return rows
  }
}

export async function fetchAuditQuestions() {
  if (isBackendApiConfigured) {
    const rows = await fetchAllBackendQuestions()
    return rows.map((question) => ({
      ...question,
      id: question.questionKey,
      standardCodes: question.isoStandards || [],
      standardCode: question.isoStandards?.[0] || '',
      referenceSop: question.auditorGuideline || question.whatToVerify || '',
      pic: question.applicableFunction || 'Function Owner',
      status: 'Not Started',
      auditorCheck: 'Not Checked',
      auditorNotes: '',
      recommendation: question.riskReview || question.kpiReview || question.whatToVerify || '',
    }))
  }
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
  const themes = await fetchAuditThemes()
  if (!isBackendApiConfigured) return themes
  return themes.map((theme) => ({
    theme_id: theme.themeCode,
    audit_theme: theme.auditTheme,
    audit_objective: theme.auditObjective,
    primary_focus: theme.primaryFocus,
    applicable_function: theme.applicableFunction,
    related_iso_standards: theme.relatedIsoStandards,
  }))
}

export async function getAuditQuestions() {
  if (isBackendApiConfigured) {
    const questions = await fetchAuditQuestions()
    return questions.map((question) => ({
      question_key: question.questionKey,
      theme_code: question.themeCode,
      system_domain: question.systemDomain,
      objective: question.objective,
      applicable_function: question.applicableFunction,
      what_to_verify: question.whatToVerify,
      audit_question: question.auditQuestion,
      evidence: question.requiredEvidence,
      kpi_review: question.kpiReview,
      risk_review: question.riskReview,
      iso_9001: question.standardCodes.includes('ISO 9001') ? 'Applicable' : '',
      iso_14001: question.standardCodes.includes('ISO 14001') ? 'Applicable' : '',
      iso_45001: question.standardCodes.includes('ISO 45001') ? 'Applicable' : '',
      iso_37001: question.standardCodes.includes('ISO 37001') ? 'Applicable' : '',
      iso_22301: question.standardCodes.includes('ISO 22301') ? 'Applicable' : '',
      auditor_guideline: question.auditorGuideline,
      evidence_indicator: question.evidenceIndicator,
      question_category: question.questionCategory,
      applicable_auditee: question.applicableAuditee,
      remarks: question.remarks,
    }))
  }
  return selectTable('audit_master_questions')
}

export async function getIsoCoverage() {
  if (isBackendApiConfigured) return []
  return selectTable('audit_master_iso_coverage')
}

export async function getAuditMethodology() {
  if (isBackendApiConfigured) return []
  return selectTable('audit_master_methodology_steps')
}

export async function getAuditPrinciples() {
  if (isBackendApiConfigured) return []
  return selectTable('audit_master_principles')
}
