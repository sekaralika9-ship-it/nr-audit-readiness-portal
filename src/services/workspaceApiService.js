import { apiClient, isBackendApiConfigured } from '../lib/apiClient.js'
import { isoStandards } from '../data/isoReadinessData.js'

export { isBackendApiConfigured }

const isoIdByCode = new Map(isoStandards.map((item) => [item.code, item.id]))
const resultToUi = {
  NotAssessed: 'Not Assessed',
  Ok: 'OK',
  Ofi: 'OFI',
  Minor: 'Minor',
  Major: 'Major',
  NotApplicable: 'Not Applicable',
}
const resultToApi = {
  'Not Checked': 'NotAssessed',
  'Not Assessed': 'NotAssessed',
  OK: 'Ok',
  OFI: 'Ofi',
  Minor: 'Minor',
  Major: 'Major',
  'Not Applicable': 'NotApplicable',
}

export function fromApiWorkspace(item) {
  const selected = item.selectedIsoStandards || []
  const isAll = isoStandards.every((standard) => selected.includes(standard.code))
  return {
    id: item.id,
    name: item.workspaceName,
    standardId: isAll ? 'all-iso' : isoIdByCode.get(selected[0]) || 'iso-9001',
    isoCode: isAll ? 'All ISO' : selected[0] || '',
    selectedIsoStandards: selected,
    auditeeCode: item.auditeeId,
    auditeeName: item.auditeeName,
    functionName: item.auditeeName,
    auditFunction: item.auditFunction,
    auditLocation: item.auditLocation || '',
    auditPeriodStart: item.auditPeriodStart,
    auditPeriodEnd: item.auditPeriodEnd,
    leadAuditorId: item.leadAuditorId,
    leadAuditorName: item.leadAuditorName || '',
    auditorTeam: item.auditorTeam || [],
    status: item.workspaceStatus,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function toApiWorkspace(item) {
  const selectedIsoStandards = item.standardId === 'all-iso'
    ? isoStandards.map((standard) => standard.code)
    : [isoStandards.find((standard) => standard.id === item.standardId)?.code].filter(Boolean)
  return {
    workspaceName: item.name,
    auditPeriodStart: item.auditPeriodStart,
    auditPeriodEnd: item.auditPeriodEnd,
    auditFunction: item.auditFunction || item.functionName,
    auditLocation: item.auditLocation || null,
    auditeeId: item.auditeeCode,
    auditeeName: item.functionName,
    leadAuditorId: item.leadAuditorId || null,
    leadAuditorName: item.leadAuditorName || null,
    selectedIsoStandards,
    workspaceStatus: item.status || 'Draft',
    auditorTeam: item.auditorTeam || [],
    ...(item.updatedAt ? { expectedUpdatedAt: item.updatedAt } : {}),
  }
}

export async function getApiWorkspaces() {
  return (await apiClient.get('workspaces')).map(fromApiWorkspace)
}

export async function getApiWorkspace(id) {
  return fromApiWorkspace(await apiClient.get(`workspaces/${id}`))
}

export async function createApiWorkspace(item) {
  return fromApiWorkspace(await apiClient.post('workspaces', toApiWorkspace(item)))
}

export async function updateApiWorkspace(id, item) {
  return fromApiWorkspace(await apiClient.put(`workspaces/${id}`, toApiWorkspace(item)))
}

export async function deleteApiWorkspace(id) {
  return apiClient.delete(`workspaces/${id}`)
}

export async function getApiWorkspaceQuestions(id) {
  const items = await apiClient.get(`workspaces/${id}/questions`)
  return items.map((item) => ({
    ...item.question,
    id: item.question.questionKey,
    standardCodes: item.question.isoStandards || [],
    standardCode: item.question.isoStandards?.[0] || '',
    themeCode: item.question.functionName || item.question.locationName || item.question.section,
    systemDomain: item.question.section === 'CORE' ? 'Core Questions' : item.question.section === 'SPECIFIC' ? 'Function-Specific / Location Questions' : 'Legacy Questions',
    objective: item.question.auditType || item.question.reference || '',
    whatToVerify: item.question.auditTrail || '',
    requiredEvidence: item.question.requiredEvidence,
    auditorGuideline: item.question.samplingGuide || '',
    referenceSop: item.question.reference || '',
    applicableFunction: item.question.functionName || item.question.locationName || '',
    status: item.assessment?.checklistStatus || 'Not Started',
    auditorCheck: resultToUi[item.assessment?.assessmentResult] || 'Not Assessed',
    auditorNotes: item.assessment?.auditorNotes || '',
    auditeeResponse: item.assessment?.auditeeResponse || '',
    recommendation: item.assessment?.correctiveAction || '',
    pic: item.assessment?.assignedPerson || '',
    dueDate: item.assessment?.dueDate || '',
    assessmentUpdatedAt: item.assessment?.updatedAt || null,
    evidenceCount: item.evidenceCount,
  }))
}

export async function saveApiAssessment(workspaceId, questionKey, state) {
  return apiClient.put(`workspaces/${workspaceId}/questions/${encodeURIComponent(questionKey)}/assessment`, {
    assessmentResult: resultToApi[state.auditorCheck] || 'NotAssessed',
    checklistStatus: state.status || 'Not Started',
    checklistCompleted: state.status === 'Ready',
    auditorNotes: state.auditorNotes || null,
    auditeeResponse: state.auditeeResponse || null,
    correctiveAction: state.recommendation || state.correctiveAction || null,
    assignedPerson: state.pic || state.assignedPerson || null,
    dueDate: state.dueDate || null,
  })
}

function fromApiEvidence(item) {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    questionKey: item.questionKey,
    themeCode: item.themeCode,
    standardCode: item.isoStandard,
    evidenceTitle: item.fileName || item.evidenceDescription || 'Evidence link',
    ownerFunction: 'Workspace auditor',
    status: 'Linked',
    attachmentName: item.fileName || '',
    oneDriveLink: item.sourceUrl,
    notes: item.evidenceDescription || '',
    createdAt: item.createdAt,
  }
}

export async function getApiEvidence(workspaceId, questionKey) {
  return (await apiClient.get(`workspaces/${workspaceId}/questions/${encodeURIComponent(questionKey)}/evidence`)).map(fromApiEvidence)
}

export async function getApiWorkspaceEvidence(workspaceId, questions) {
  const questionsWithEvidence = questions.filter((question) => question.evidenceCount > 0)
  const evidenceGroups = await Promise.all(
    questionsWithEvidence.map((question) =>
      getApiEvidence(workspaceId, question.questionKey || question.id)),
  )
  return evidenceGroups.flat()
}

export async function getApiEvidenceLibrary() {
  const workspaces = await getApiWorkspaces()
  const workspaceEvidence = await Promise.all(workspaces.map(async (workspace) => {
    const questions = await getApiWorkspaceQuestions(workspace.id)
    return getApiWorkspaceEvidence(workspace.id, questions)
  }))
  return workspaceEvidence.flat()
}

export async function addApiEvidence(workspaceId, question, form) {
  return fromApiEvidence(await apiClient.post(`workspaces/${workspaceId}/questions/${encodeURIComponent(question.questionKey || question.id)}/evidence`, {
    themeCode: question.themeCode,
    isoStandard: question.standardCode || question.standardCodes?.[0],
    evidenceDescription: form.notes || form.evidenceTitle,
    evidenceCategory: form.status,
    sourceProvider: 'OneDrive',
    sourceUrl: form.oneDriveLink,
    fileName: form.attachmentName || form.evidenceTitle,
    version: '1.0',
  }))
}

export const workspaceResultToUi = resultToUi
