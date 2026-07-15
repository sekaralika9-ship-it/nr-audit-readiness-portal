import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
}))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ login: mocks.login, signup: mocks.signup }),
}))

import Login from './Login.jsx'
import SignUp from './SignUp.jsx'

describe('authentication pages', () => {
  beforeEach(() => {
    mocks.login.mockReset()
    mocks.signup.mockReset()
  })

  it('trims email and submits login credentials', async () => {
    const user = userEvent.setup()
    mocks.login.mockResolvedValue({ user: { id: 'user-1' } })
    render(<Login />, { wrapper: MemoryRouter })

    await user.type(screen.getByLabelText('Email'), '  auditor@example.com  ')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith('auditor@example.com', 'secret123')
    })
  })

  it('displays authentication errors and restores the submit button', async () => {
    const user = userEvent.setup()
    mocks.login.mockRejectedValue(new Error('Invalid login credentials'))
    render(<Login />, { wrapper: MemoryRouter })

    await user.type(screen.getByLabelText('Email'), 'auditor@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled()
  })

  it('submits signup metadata and explains email confirmation', async () => {
    const user = userEvent.setup()
    mocks.signup.mockResolvedValue({ user: { id: 'user-1' }, session: null })
    render(<SignUp />, { wrapper: MemoryRouter })

    await user.type(screen.getByLabelText('Full Name'), 'Ayu Auditor')
    await user.type(screen.getByLabelText('Fungsi'), 'SPI')
    await user.type(screen.getByLabelText('Email'), 'ayu@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(mocks.signup).toHaveBeenCalledWith({
      fullName: 'Ayu Auditor',
      fungsi: 'SPI',
      email: 'ayu@example.com',
      password: 'secret123',
    })
    expect(await screen.findByText(/Please check your email/)).toBeInTheDocument()
  })
})
