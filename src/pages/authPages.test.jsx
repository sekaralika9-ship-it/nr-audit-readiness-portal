import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  post: vi.fn(),
}))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ login: mocks.login, signup: mocks.signup }),
}))

vi.mock('../lib/apiClient.js', () => ({
  apiClient: { post: mocks.post },
}))

import Login from './Login.jsx'
import SignUp from './SignUp.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ResetPassword from './ResetPassword.jsx'

describe('authentication pages', () => {
  beforeEach(() => {
    mocks.login.mockReset()
    mocks.signup.mockReset()
    mocks.post.mockReset()
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

  it('submits signup metadata and opens the authenticated dashboard', async () => {
    const user = userEvent.setup()
    mocks.signup.mockResolvedValue({ user: { id: 'user-1' }, accessToken: 'token' })
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
    expect(mocks.signup).toHaveBeenCalledOnce()
  })

  it('requests password reset instructions from the backend', async () => {
    const user = userEvent.setup()
    mocks.post.mockResolvedValue({ message: 'Prepared', developmentResetUrl: 'http://localhost/reset-password' })
    render(<ForgotPassword />, { wrapper: MemoryRouter })

    await user.type(screen.getByLabelText('Email'), 'auditor@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Reset Instructions' }))

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('auth/forgot-password', { email: 'auditor@example.com' }))
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open local development reset link' })).toBeInTheDocument()
  })

  it('submits matching new passwords with the reset token', async () => {
    const user = userEvent.setup()
    mocks.post.mockResolvedValue({})
    render(
      <MemoryRouter initialEntries={['/reset-password?email=auditor%40example.com&token=reset-token']}>
        <ResetPassword />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('New Password'), 'NewPassword123!')
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPassword123!')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('auth/reset-password', {
      email: 'auditor@example.com',
      token: 'reset-token',
      newPassword: 'NewPassword123!',
    }))
    expect(screen.getByRole('heading', { name: 'Password reset successfully' })).toBeInTheDocument()
  })
})
