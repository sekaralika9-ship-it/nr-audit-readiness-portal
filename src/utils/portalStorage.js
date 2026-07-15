const PROFILE_KEY = 'nr-audit-profile'
const SESSION_KEY = 'nr-audit-session'
const WORKSPACES_KEY = 'nr-audit-workspaces'
const ACTIVE_WORKSPACE_KEY = 'nr-audit-active-workspace'

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getStoredProfile() {
  return readJson(PROFILE_KEY, {
    fullName: '',
    email: '',
    role: '',
    department: '',
    employeeId: '',
    phone: '',
  })
}

export function saveStoredProfile(profile) {
  const current = getStoredProfile()
  const next = {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  }

  writeJson(PROFILE_KEY, next)
  window.dispatchEvent(new Event('nr-profile-updated'))

  return next
}

export function getSession() {
  return readJson(SESSION_KEY, {
    email: '',
    isSignedIn: false,
  })
}

export function saveSession(session) {
  const next = {
    ...session,
    isSignedIn: true,
    signedInAt: new Date().toISOString(),
  }

  writeJson(SESSION_KEY, next)
  window.dispatchEvent(new Event('nr-session-updated'))

  return next
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('nr-session-updated'))
}

export function getDisplayIdentity() {
  const profile = getStoredProfile()
  const session = getSession()

  const email = profile.email || session.email || ''
  const fallbackName = email ? email.split('@')[0] : 'Profile'

  return {
    name: profile.fullName || fallbackName,
    email,
    role: profile.role || '',
    department: profile.department || '',
  }
}

export function getStoredWorkspaces() {
  const workspaces = readJson(WORKSPACES_KEY, [])
  return Array.isArray(workspaces) ? workspaces : []
}

export function saveStoredWorkspace(workspace) {
  const nextWorkspace = {
    ...workspace,
    id: workspace.id || `WS-${Date.now()}`,
    updatedAt: new Date().toISOString(),
  }
  const workspaces = getStoredWorkspaces()
  const existingIndex = workspaces.findIndex((item) => item.id === nextWorkspace.id)
  const nextWorkspaces = existingIndex >= 0
    ? workspaces.map((item) => item.id === nextWorkspace.id ? nextWorkspace : item)
    : [nextWorkspace, ...workspaces]

  writeJson(WORKSPACES_KEY, nextWorkspaces)
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, nextWorkspace.id)
  window.dispatchEvent(new Event('nr-workspaces-updated'))
  return nextWorkspace
}

export function getActiveStoredWorkspace() {
  const workspaces = getStoredWorkspaces()
  const activeId = localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  return workspaces.find((workspace) => workspace.id === activeId) || workspaces[0] || null
}

export function setActiveStoredWorkspace(workspaceId) {
  const workspace = getStoredWorkspaces().find((item) => item.id === workspaceId) || null
  if (workspace) localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId)
  return workspace
}

export function updateStoredWorkspace(workspaceId, updates) {
  const workspace = getStoredWorkspaces().find((item) => item.id === workspaceId)
  if (!workspace) return null
  return saveStoredWorkspace({ ...workspace, ...updates, id: workspaceId })
}

export function saveWorkspaceQuestionState(workspaceId, questionKey, state) {
  const workspace = getStoredWorkspaces().find((item) => item.id === workspaceId)
  if (!workspace || !questionKey) return null
  const currentStates = workspace.questionStates || workspace.questionUpdates || {}
  const questionStates = {
    ...currentStates,
    [questionKey]: {
      ...currentStates[questionKey],
      ...state,
      updatedAt: new Date().toISOString(),
    },
  }
  return saveStoredWorkspace({
    ...workspace,
    questionStates,
    questionUpdates: questionStates,
  })
}

export function getWorkspaceQuestionState(workspaceId, questionKey) {
  const workspace = getStoredWorkspaces().find((item) => item.id === workspaceId)
  const states = workspace?.questionStates || workspace?.questionUpdates || {}
  return states[questionKey] || null
}

export function deleteStoredWorkspace(workspaceId) {
  const nextWorkspaces = getStoredWorkspaces().filter((workspace) => workspace.id !== workspaceId)
  writeJson(WORKSPACES_KEY, nextWorkspaces)

  const activeId = localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  if (activeId === workspaceId) {
    if (nextWorkspaces[0]) localStorage.setItem(ACTIVE_WORKSPACE_KEY, nextWorkspaces[0].id)
    else localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
  }

  window.dispatchEvent(new Event('nr-workspaces-updated'))
  return nextWorkspaces
}
