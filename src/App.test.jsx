import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  session: { user: { id: 'user-1' } },
  user: { id: 'user-1' },
  loading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('./context/AuthContext.jsx', () => ({
  useAuth: () => auth,
}))

import App from './App.jsx'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('application routes', () => {
  beforeEach(() => {
    auth.session = { user: { id: 'user-1' } }
    auth.loading = false
  })

  it('redirects the root route to the authenticated dashboard', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Audit Readiness Dashboard' })).toBeInTheDocument()
    const profileLinks = screen.getAllByRole('link', { name: /Profile/ })
    expect(profileLinks.length).toBeGreaterThan(0)
    expect(profileLinks.every((link) => link.getAttribute('href') === '/profile')).toBe(true)
  })

  it('redirects protected routes to login when there is no session', async () => {
    auth.session = null
    renderAt('/document-library')
    expect(await screen.findByRole('heading', { name: 'Sign in to NR Audit Readiness Portal' })).toBeInTheDocument()
  })

  it('renders the not-found page for unknown routes', () => {
    renderAt('/does-not-exist')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
