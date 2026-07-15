import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getDocuments: vi.fn(),
  createDocument: vi.fn(),
}))

vi.mock('../services/documentService.js', () => ({
  getDocuments: mocks.getDocuments,
  createDocument: mocks.createDocument,
}))

import DocumentLibrary from './DocumentLibrary.jsx'

describe('DocumentLibrary', () => {
  beforeEach(() => {
    mocks.getDocuments.mockReset()
    mocks.createDocument.mockReset()
  })

  it('loads and renders persisted document rows', async () => {
    mocks.getDocuments.mockResolvedValue([
      {
        id: 'doc-1',
        title: 'Emergency Response Plan',
        description: 'Approved response procedure',
        category: 'Audit Plan',
        fungsi: 'HSSE',
        status: 'Approved',
        file_path: '/controlled/erp.pdf',
      },
    ])

    render(<DocumentLibrary />)
    expect(screen.getByText('Loading documents from Supabase...')).toBeInTheDocument()
    expect(await screen.findByText('Emergency Response Plan')).toBeInTheDocument()
    expect(screen.getAllByText('HSSE').length).toBeGreaterThan(1)
    expect(screen.getByText('/controlled/erp.pdf')).toBeInTheDocument()
  })

  it('saves mapped form values and shows the inserted row immediately', async () => {
    const user = userEvent.setup()
    mocks.getDocuments.mockResolvedValue([])
    mocks.createDocument.mockResolvedValue({
      id: 'doc-2',
      title: 'Internal Audit Plan',
      description: 'FY 2026 plan',
      category: 'Audit Plan',
      fungsi: 'HSSE',
      status: 'Under Review',
      file_path: '/audit/plan.pdf',
    })

    render(<DocumentLibrary />)
    await screen.findByText('No document reference has been added.')

    await user.type(screen.getByLabelText('Document Title'), 'Internal Audit Plan')
    await user.type(screen.getByLabelText('Description / Notes'), 'FY 2026 plan')
    await user.selectOptions(screen.getByLabelText('Owner Function'), 'HSSE')
    await user.selectOptions(screen.getByLabelText('Control Status'), 'Under Review')
    await user.type(screen.getByPlaceholderText('Optional repository location'), '/audit/plan.pdf')
    await user.click(screen.getByRole('button', { name: 'Add Document Reference' }))

    await waitFor(() => {
      expect(mocks.createDocument).toHaveBeenCalledWith({
        title: 'Internal Audit Plan',
        description: 'FY 2026 plan',
        fungsi: 'HSSE',
        status: 'Under Review',
        file_path: '/audit/plan.pdf',
      })
    })
    expect(await screen.findByText('Document saved successfully.')).toBeInTheDocument()
    expect(screen.getByText('Internal Audit Plan')).toBeInTheDocument()
  })

  it('shows readable load and save failures', async () => {
    const user = userEvent.setup()
    mocks.getDocuments.mockRejectedValue(new Error('documents SELECT denied'))
    mocks.createDocument.mockRejectedValue(new Error('documents INSERT denied'))

    render(<DocumentLibrary />)
    expect(await screen.findByText('documents SELECT denied')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Document Title'), 'Blocked Plan')
    await user.click(screen.getByRole('button', { name: 'Add Document Reference' }))
    expect(await screen.findByText('documents INSERT denied')).toBeInTheDocument()
  })
})
