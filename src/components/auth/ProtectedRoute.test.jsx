import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ session: null, loading: false }))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => state,
}))

import ProtectedRoute from './ProtectedRoute.jsx'

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<h1>Login Destination</h1>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<h1>Protected Dashboard</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    state.session = null
    state.loading = false
  })

  it('shows a session check while authentication is loading', () => {
    state.loading = true
    renderRoute()
    expect(screen.getByText('Checking secure session...')).toBeInTheDocument()
  })

  it('redirects anonymous users to login', () => {
    renderRoute()
    expect(screen.getByText('Login Destination')).toBeInTheDocument()
  })

  it('renders protected content for a valid session', () => {
    state.session = { user: { id: 'user-1' } }
    renderRoute()
    expect(screen.getByText('Protected Dashboard')).toBeInTheDocument()
  })
})
