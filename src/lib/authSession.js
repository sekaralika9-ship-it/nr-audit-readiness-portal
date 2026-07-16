const storageKey = 'nr-audit-auth-session'

export function getAuthSession() {
  try {
    const value = localStorage.getItem(storageKey)
    if (!value) return null
    const session = JSON.parse(value)
    if (!session?.accessToken || !session?.user) return null
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(storageKey)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveAuthSession(session) {
  localStorage.setItem(storageKey, JSON.stringify(session))
  window.dispatchEvent(new CustomEvent('nr-auth-session-changed'))
  return session
}

export function clearAuthSession() {
  localStorage.removeItem(storageKey)
  window.dispatchEvent(new CustomEvent('nr-auth-session-changed'))
}
