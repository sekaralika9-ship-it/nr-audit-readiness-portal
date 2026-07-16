import { supabase } from './supabaseClient.js'

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

async function accessToken() {
  if (!supabase) throw new ApiError('Supabase authentication is not configured.', 401)
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new ApiError(error.message || 'Unable to read the current session.', 401)
  if (!data.session?.access_token) throw new ApiError('Your session has expired. Please sign in again.', 401)
  return data.session.access_token
}

export async function apiRequest(path, options = {}) {
  if (!isBackendApiConfigured) throw new ApiError('Backend API is not configured.', 503)
  const token = await accessToken()
  const response = await fetch(`${configuredBaseUrl}/${String(path).replace(/^\//, '')}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
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
