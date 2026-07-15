import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Dashboard from './Dashboard.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import IsoLibrary from './IsoLibrary.jsx'
import NotFound from './NotFound.jsx'
import Settings from './Settings.jsx'
import Templates from './Templates.jsx'

function renderWithRouter(component) {
  return render(component, { wrapper: MemoryRouter })
}

describe('remaining page smoke coverage', () => {
  it.each([
    ['Dashboard', <Dashboard />, 'Audit Readiness Dashboard'],
    ['ISO Library', <IsoLibrary />, 'ISO Library'],
    ['Templates', <Templates />, 'Templates'],
    ['Settings', <Settings />, 'Settings'],
    ['Not Found', <NotFound />, 'Page not found'],
    ['Forgot Password', <ForgotPassword />, 'Reset your password'],
  ])('renders %s without crashing', (_name, component, heading) => {
    renderWithRouter(component)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
