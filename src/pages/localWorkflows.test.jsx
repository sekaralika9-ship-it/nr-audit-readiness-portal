import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMocks = vi.hoisted(() => ({
  fetchAuditQuestions: vi.fn(),
}))

const supabaseQuestion = {
  id: 'MASTER-Q-1',
  standardCodes: ['ISO 45001'],
  standardCode: 'ISO 45001',
  themeCode: 'HSSE-01',
  systemDomain: 'Emergency Preparedness',
  objective: 'Confirm response readiness',
  applicableFunction: 'HSSE',
  whatToVerify: 'Verify the latest emergency drill',
  auditQuestion: 'Has the emergency response drill been evaluated?',
  requiredEvidence: 'Approved emergency drill report',
  kpiReview: 'Drill completion KPI',
  riskReview: 'Emergency response risk register',
  auditorGuideline: 'Interview the emergency response PIC',
  referenceSop: 'Interview the emergency response PIC',
  pic: 'HSSE',
  status: 'Not Started',
  auditorNotes: '',
  recommendation: 'Emergency response risk register',
}

vi.mock('../services/auditMasterService.js', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchAuditQuestions: serviceMocks.fetchAuditQuestions,
}))
import AuditReadiness from './AuditReadiness.jsx'
import Dashboard from './Dashboard.jsx'
import EvidenceLibrary from './EvidenceLibrary.jsx'
import IsoLibrary from './IsoLibrary.jsx'
import Reports from './Reports.jsx'
import { getAllQuestions } from '../data/isoReadinessData.js'

describe('local interactive workflows', () => {
  beforeEach(() => {
    localStorage.clear()
    serviceMocks.fetchAuditQuestions.mockResolvedValue([])
  })

  it('creates an audit workspace and opens a checklist question', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuditReadiness />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Workspace Name'), 'ISO 9001 Preparation')
    await user.selectOptions(screen.getByLabelText('Auditee'), 'A06')
    await user.type(screen.getByLabelText('Audit Scope'), 'Operations and safety')
    await user.click(screen.getByRole('button', { name: 'Create Workspace' }))

    expect(screen.getByText('ISO 9001 Preparation')).toBeInTheDocument()
    expect(screen.getByText('Draft Preparation')).toBeInTheDocument()
    await user.click(screen.getByText('ISO 9001 Preparation').closest('[role="button"]'))

    const firstQuestion = getAllQuestions().find((question) => question.standardId === 'iso-9001')
    await user.click(await screen.findByRole('button', { name: new RegExp(firstQuestion.auditQuestion) }))
    expect(screen.getByText('Audit Question Detail')).toBeInTheDocument()
    expect(screen.getByText(firstQuestion.requiredEvidence)).toBeInTheDocument()
    expect(screen.getByText('Evidence Pocket')).toBeInTheDocument()
    expect(
      screen.getByText('No evidence has been linked to this audit question.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Add Evidence for This Question/ }))
      .toHaveAttribute('href', expect.stringContaining(`questionKey=${firstQuestion.id}`))
  })

  it('persists checklist status and auditor results when a workspace is reopened', async () => {
    const user = userEvent.setup()
    serviceMocks.fetchAuditQuestions.mockResolvedValue([supabaseQuestion])
    render(
      <MemoryRouter>
        <AuditReadiness />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByLabelText('ISO Standard'), 'iso-45001')
    await user.selectOptions(screen.getByLabelText('Auditee'), 'A06')
    await user.type(screen.getByLabelText('Workspace Name'), 'Persistent Workspace')
    await user.click(screen.getByRole('button', { name: 'Create Workspace' }))
    await user.click(screen.getByText('Persistent Workspace').closest('[role="button"]'))

    await user.selectOptions(
      await screen.findByLabelText(`Status for ${supabaseQuestion.auditQuestion}`),
      'Ready',
    )
    await user.selectOptions(
      screen.getByLabelText(`Auditor Check for ${supabaseQuestion.auditQuestion}`),
      'OK',
    )
    expect(screen.getByText('Workspace readiness summary').parentElement.parentElement)
      .toHaveTextContent('Ready1')

    await user.click(screen.getByRole('button', { name: 'New Workspace' }))
    await user.click(screen.getByText('Persistent Workspace').closest('[role="button"]'))
    expect(await screen.findByLabelText(`Status for ${supabaseQuestion.auditQuestion}`)).toHaveValue('Ready')
    expect(screen.getByLabelText(`Auditor Check for ${supabaseQuestion.auditQuestion}`)).toHaveValue('OK')
  })

  it('shows safe fallback dates for legacy saved workspaces', async () => {
    const user = userEvent.setup()
    localStorage.setItem('nr-audit-workspaces', JSON.stringify([{
      id: 'WS-LEGACY',
      name: 'Legacy Workspace',
      standardId: 'iso-9001',
      auditeeCode: 'A01',
      functionName: 'Direksi',
    }]))
    render(
      <MemoryRouter>
        <AuditReadiness />
      </MemoryRouter>,
    )

    expect(screen.getByText('Updated Not recorded')).toBeInTheDocument()
    await user.click(screen.getByText('Legacy Workspace').closest('[role="button"]'))
    expect(screen.getByText('Created').parentElement).toHaveTextContent('Not recorded')
    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument()
  })

  it('confirms workspace deletion and removes its linked evidence', async () => {
    const user = userEvent.setup()
    localStorage.setItem('nr-audit-workspaces', JSON.stringify([{
      id: 'WS-DELETE',
      name: 'Delete Me',
      standardId: 'iso-9001',
      functionName: 'Direksi',
    }]))
    localStorage.setItem('nr-audit-evidence-items', JSON.stringify([
      { id: 'EV-DELETE', workspaceId: 'WS-DELETE', questionKey: 'Q-1' },
      { id: 'EV-KEEP', workspaceId: 'WS-KEEP', questionKey: 'Q-1' },
    ]))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    render(
      <MemoryRouter>
        <AuditReadiness />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Delete Delete Me' }))
    expect(screen.getByText('Delete Me')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Delete Me' }))
    expect(screen.queryByText('Delete Me')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('nr-audit-evidence-items'))).toMatchObject([
      { id: 'EV-KEEP', workspaceId: 'WS-KEEP' },
    ])
    expect(confirm).toHaveBeenCalledTimes(2)
  })

  it('summarizes saved workspace, evidence, and open actions on the dashboard', () => {
    localStorage.setItem('nr-audit-workspaces', JSON.stringify([{
      id: 'WS-DASH',
      name: 'Manager Presentation',
      isoCode: 'ISO 45001',
      functionName: 'Manager HSSE',
      questionStates: {
        'Q-1': { status: 'In Progress' },
        'Q-2': { status: 'Needs Review' },
        'Q-3': { status: 'Ready' },
      },
    }]))
    localStorage.setItem('nr-audit-evidence-items', JSON.stringify([
      { id: 'EV-1', workspaceId: 'WS-DASH', questionKey: 'Q-1' },
    ]))

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    expect(screen.getByText('Manager Presentation')).toBeInTheDocument()
    expect(screen.getByText('Active Audits').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Readiness Workspaces').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Evidence Items').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Open Actions').parentElement).toHaveTextContent('2')
    expect(screen.queryByText('No audit readiness workspace has been created.')).not.toBeInTheDocument()
  })

  it('activates the Sprint 2 capability shortcuts', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuditReadiness />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /ISO Cards/ })).toHaveAttribute('href', '/iso-library')
    expect(screen.getByRole('link', { name: /Clause Navigation/ })).toHaveAttribute('href', '/iso-library')

    await user.click(screen.getByRole('button', { name: /Checklist/ }))
    expect(
      screen.getByText('Create a readiness workspace before opening the checklist.'),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Workspace Name'), 'Capability Workspace')
    await user.click(screen.getByRole('button', { name: 'Create Workspace' }))
    await screen.findByText(/No audit master questions found. Showing fallback/)
    await user.click(screen.getByText('Capability Workspace').closest('[role="button"]'))
    await user.click(screen.getByRole('button', { name: /PIC Structure/ }))
    expect(screen.getByText('Audit Question Detail')).toBeInTheDocument()
    expect(screen.getByText(/PIC structure opened/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Audit Creation/ }))
    expect(screen.getByLabelText('Workspace Name')).toBeInTheDocument()
    expect(screen.getByText(/Audit creation is ready/)).toBeInTheDocument()
  })

  it('uses Supabase master questions for workspace filtering and details', async () => {
    const user = userEvent.setup()
    serviceMocks.fetchAuditQuestions.mockResolvedValue([supabaseQuestion])
    render(
      <MemoryRouter>
        <AuditReadiness />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByLabelText('ISO Standard'), 'iso-45001')
    await user.selectOptions(screen.getByLabelText('Auditee'), 'A06')
    await user.type(screen.getByLabelText('Workspace Name'), 'Supabase HSSE Workspace')
    await user.click(screen.getByRole('button', { name: 'Create Workspace' }))
    await user.click(screen.getByText('Supabase HSSE Workspace').closest('[role="button"]'))
    await user.click(
      await screen.findByRole('button', {
        name: /Has the emergency response drill been evaluated/,
      }),
    )

    expect(screen.getByText('Confirm response readiness')).toBeInTheDocument()
    expect(screen.getByText('Approved emergency drill report')).toBeInTheDocument()
    expect(screen.getByText('Drill completion KPI')).toBeInTheDocument()
    expect(screen.getAllByText('Emergency response risk register').length).toBeGreaterThan(0)
  })

  it('shows Supabase questions in ISO Library and Evidence Requirement Catalog', async () => {
    serviceMocks.fetchAuditQuestions.mockResolvedValue([supabaseQuestion])
    const user = userEvent.setup()

    const { unmount } = render(
      <MemoryRouter>
        <IsoLibrary />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /ISO 45001/ }))
    expect(await screen.findByText(supabaseQuestion.auditQuestion)).toBeInTheDocument()
    expect(screen.getByText(supabaseQuestion.requiredEvidence)).toBeInTheDocument()
    unmount()

    render(<EvidenceLibrary />)
    expect(await screen.findByText(supabaseQuestion.auditQuestion)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /emergency response drill/ })).toBeInTheDocument()
  })

  it('adds an evidence item with visible owner and status values', async () => {
    const user = userEvent.setup()
    render(<EvidenceLibrary />)

    expect(screen.getByText('No evidence item has been added.')).toBeInTheDocument()
    await screen.findByText(/No audit master questions found. Showing fallback/)
    await user.type(screen.getByLabelText('Evidence Title'), 'Emergency Drill Record')
    await user.selectOptions(
      screen.getByLabelText('Mapped Audit Requirement'),
      getAllQuestions()[0].id,
    )
    await user.selectOptions(screen.getByLabelText('Owner Function'), 'HSSE')
    await user.selectOptions(screen.getByLabelText('Readiness Status'), 'Accepted')
    await user.type(screen.getByLabelText('Attachment Name'), 'drill.pdf')
    await user.click(screen.getByRole('button', { name: 'Add Evidence Item' }))

    expect(screen.getByText('Emergency Drill Record')).toBeInTheDocument()
    expect(screen.getByText(/HSSE · drill\.pdf/)).toBeInTheDocument()
    expect(screen.getAllByText('Accepted').length).toBeGreaterThan(1)
  })

  it('creates a report record with correct string option mappings and summary totals', async () => {
    const user = userEvent.setup()
    render(<Reports />)

    await user.type(screen.getByLabelText('Report Name'), 'July Readiness Review')
    await user.selectOptions(screen.getByLabelText('Auditee'), 'A06')
    await user.selectOptions(screen.getByLabelText('ISO Standard'), 'ISO 45001')
    await user.clear(screen.getByLabelText('Readiness Score'))
    await user.type(screen.getByLabelText('Readiness Score'), '80')
    await user.clear(screen.getByLabelText('Open Actions'))
    await user.type(screen.getByLabelText('Open Actions'), '2')
    await user.clear(screen.getByLabelText('Evidence Gaps'))
    await user.type(screen.getByLabelText('Evidence Gaps'), '1')
    await user.click(screen.getByRole('button', { name: 'Add Report Record' }))

    expect(screen.getByText('July Readiness Review')).toBeInTheDocument()
    expect(screen.getAllByText('Manager HSSE').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ISO 45001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled()
    expect(JSON.parse(localStorage.getItem('nr-audit-report-records'))[0]).toMatchObject({
      reportName: 'July Readiness Review',
      auditeeCode: 'A06',
      score: 80,
    })
  })
})
