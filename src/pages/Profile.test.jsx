import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentProfile: vi.fn(),
  saveCurrentProfile: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../services/profileService.js', () => ({
  getCurrentProfile: mocks.getCurrentProfile,
  saveCurrentProfile: mocks.saveCurrentProfile,
}))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ logout: mocks.logout }),
}))

import Profile from './Profile.jsx'

describe('Profile', () => {
  beforeEach(() => {
    mocks.getCurrentProfile.mockReset()
    mocks.saveCurrentProfile.mockReset()
    mocks.logout.mockReset()
    mocks.getCurrentProfile.mockResolvedValue({
      profile: { full_name: 'Ayu', fungsi: 'HSSE', role: 'Employee' },
      user: { email: 'ayu@example.com', user_metadata: {} },
    })
  })

  it('loads the authenticated profile and keeps email read-only', async () => {
    render(<Profile />, { wrapper: MemoryRouter })

    expect(await screen.findByDisplayValue('Ayu')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ayu@example.com')).toBeDisabled()
    expect(screen.getByDisplayValue('HSSE')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL Profile')).toBeInTheDocument()
  })

  it('updates editable PostgreSQL profile fields and shows success', async () => {
    const user = userEvent.setup()
    mocks.saveCurrentProfile.mockResolvedValue({
      profile: { full_name: 'Ayu Updated', fungsi: 'SPI', role: 'Function Owner' },
      user: { email: 'ayu@example.com' },
    })

    render(<Profile />, { wrapper: MemoryRouter })
    const fullName = await screen.findByLabelText('Full Name')
    await user.clear(fullName)
    await user.type(fullName, 'Ayu Updated')
    await user.selectOptions(screen.getByLabelText('Department / Function'), 'SPI')
    await user.type(screen.getByLabelText('Employee ID'), 'EMP-1')
    await user.type(screen.getByLabelText('Phone Number'), '0812')
    await user.click(screen.getByRole('button', { name: 'Save Profile' }))

    await waitFor(() => {
      expect(mocks.saveCurrentProfile).toHaveBeenCalledWith({
        full_name: 'Ayu Updated',
        fungsi: 'SPI',
        role: 'Employee',
        department: 'SPI',
        employee_id: 'EMP-1',
        phone: '0812',
      })
    })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('surfaces profile load errors', async () => {
    mocks.getCurrentProfile.mockRejectedValue(new Error('profiles SELECT denied'))
    render(<Profile />, { wrapper: MemoryRouter })
    expect(await screen.findByText('profiles SELECT denied')).toBeInTheDocument()
  })
})
