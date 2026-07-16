import { clearAuthSession, getAuthSession } from './authSession.js'

const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const isBackendApiConfigured = Boolean(configuredBaseUrl)

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest(path, options = {}) {
  if (!isBackendApiConfigured) throw new ApiError('Backend API is not configured.', 503)
  const token = getAuthSession()?.accessToken
  const response = await fetch(`${configuredBaseUrl}/${String(path).replace(/^\//, '')}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token) clearAuthSession()
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat().join(' ')
      : null
    throw new ApiError(validationMessage || payload?.detail || payload?.title || 'The API request failed.', response.status, payload)
  }
  return payload?.data ?? payload
}

export const apiClient = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}
