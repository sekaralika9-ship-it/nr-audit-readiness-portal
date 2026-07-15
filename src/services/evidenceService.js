const EVIDENCE_ITEMS_KEY = 'nr-audit-evidence-items'

function readItems() {
  try {
    const value = localStorage.getItem(EVIDENCE_ITEMS_KEY)
    const items = value ? JSON.parse(value) : []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

function writeItems(items) {
  localStorage.setItem(EVIDENCE_ITEMS_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('nr-evidence-updated'))
}

export function getEvidenceItems() {
  return readItems()
}

export function getEvidenceByQuestionKey(questionKey, workspaceId = '') {
  if (!questionKey) return []
  return readItems().filter((item) =>
    item.questionKey === questionKey && (!workspaceId || item.workspaceId === workspaceId),
  )
}

export function saveEvidenceItem(item) {
  if (!item.questionKey) {
    throw new Error('A mapped audit requirement is required.')
  }

  const savedItem = {
    ...item,
    id: item.id || `EV-${Date.now()}`,
    createdAt: item.createdAt || new Date().toISOString(),
  }
  const items = readItems()
  const nextItems = [savedItem, ...items.filter((entry) => entry.id !== savedItem.id)]
  writeItems(nextItems)
  return savedItem
}

export function deleteEvidenceByWorkspace(workspaceId) {
  if (!workspaceId) return 0
  const items = readItems()
  const nextItems = items.filter((item) => item.workspaceId !== workspaceId)
  const deletedCount = items.length - nextItems.length
  if (deletedCount) writeItems(nextItems)
  return deletedCount
}
