const PROFILE_KEY = 'nr-audit-profile'
const SESSION_KEY = 'nr-audit-session'

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
