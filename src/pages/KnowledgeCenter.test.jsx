import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuditThemes: vi.fn(),
  getAuditQuestions: vi.fn(),
  getIsoCoverage: vi.fn(),
  getAuditMethodology: vi.fn(),
  getAuditPrinciples: vi.fn(),
}))

vi.mock('../services/auditMasterService.js', async (importOriginal) => ({
  ...(await importOriginal()),
  ...mocks,
}))

import KnowledgeCenter from './KnowledgeCenter.jsx'

describe('KnowledgeCenter', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset().mockResolvedValue([])
  })

  it('loads every master dataset and safely renders theme values', async () => {
    const user = userEvent.setup()
    mocks.getAuditThemes.mockResolvedValue([
      {
        theme_id: 'TH-1',
        audit_theme: 'Leadership',
        audit_objective: 'Confirm accountability',
        primary_focus: { owner: 'Management' },
        applicable_function: ['SPI', 'Quality'],
        related_iso_standards: 'ISO 9001',
      },
    ])

    render(<KnowledgeCenter />)
    await user.click(screen.getByRole('button', { name: 'Theme Library' }))

    expect(await screen.findByText('Leadership')).toBeInTheDocument()
    expect(screen.getByText('owner: Management')).toBeInTheDocument()
    expect(screen.getByText('SPI, Quality')).toBeInTheDocument()
    expect(mocks.getAuditQuestions).toHaveBeenCalledOnce()
    expect(mocks.getIsoCoverage).toHaveBeenCalledOnce()
    expect(mocks.getAuditMethodology).toHaveBeenCalledOnce()
    expect(mocks.getAuditPrinciples).toHaveBeenCalledOnce()
  })

  it('filters audit questions by search and domain', async () => {
    const user = userEvent.setup()
    mocks.getAuditQuestions.mockResolvedValue([
      {
        question_key: 'Q-1',
        theme_code: 'T1',
        system_domain: 'HSSE',
        audit_question: 'Is emergency readiness tested?',
        what_to_verify: 'Drill evidence',
      },
      {
        question_key: 'Q-2',
        theme_code: 'T2',
        system_domain: 'Finance',
        audit_question: 'Is budget approved?',
        what_to_verify: 'Approval record',
      },
    ])

    render(<KnowledgeCenter />)
    await user.click(screen.getByRole('button', { name: 'Question Library' }))
    expect(await screen.findByText('Is emergency readiness tested?')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Domain'), 'HSSE')
    expect(screen.queryByText('Is budget approved?')).not.toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search knowledge center...'), 'missing')
    expect(screen.getByText('No audit questions found')).toBeInTheDocument()
  })

  it('derives preparation guides and SOP references from Supabase questions', async () => {
    const user = userEvent.setup()
    mocks.getAuditQuestions.mockResolvedValue([
      {
        question_key: 'Q-HSSE',
        theme_code: 'HSSE-01',
        system_domain: 'Emergency Preparedness',
        applicable_function: 'HSSE',
        audit_question: 'Has emergency response readiness been evaluated?',
        what_to_verify: 'Verify the emergency drill record',
        evidence: 'Approved drill report',
        auditor_guideline: 'Review Emergency Response TKI',
        iso_45001: true,
      },
    ])

    render(<KnowledgeCenter />)
    expect(
      await screen.findByText('Has emergency response readiness been evaluated?'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'SOP Reference Map' }))
    expect(screen.getByText('Review Emergency Response TKI')).toBeInTheDocument()
    expect(screen.getByText('Owner: HSSE')).toBeInTheDocument()
    expect(screen.getByText('ISO 45001')).toBeInTheDocument()
  })

  it('shows a master-data error without blanking local guides', async () => {
    const user = userEvent.setup()
    mocks.getAuditThemes.mockRejectedValue(new Error('themes SELECT denied'))

    render(<KnowledgeCenter />)
    expect(screen.getByText('How to Prepare Audit Evidence')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Theme Library' }))
    expect(await screen.findByText('Unable to load audit master data.')).toBeInTheDocument()
  })
})
