import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  FolderKanban,
  ListChecks,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import { getAllQuestions, isoStandards } from '../data/isoReadinessData.js'
import { officialAuditees } from '../data/auditeeData.js'
import useAuditMasterQuestions from '../hooks/useAuditMasterQuestions.js'
import {
  deleteStoredWorkspace,
  getStoredWorkspaces,
  saveStoredWorkspace,
  setActiveStoredWorkspace,
} from '../utils/portalStorage.js'
import { deleteEvidenceByWorkspace, getEvidenceItems } from '../services/evidenceService.js'
import {
  createApiWorkspace,
  deleteApiWorkspace,
  getApiWorkspace,
  getApiWorkspaceEvidence,
  getApiWorkspaceQuestions,
  getApiWorkspaces,
  isBackendApiConfigured,
  saveApiAssessment,
  updateApiWorkspace,
} from '../services/workspaceApiService.js'

const auditees = [
  { code: 'all-auditees', name: 'All Auditees' },
  ...officialAuditees,
]

const allIsoStandard = {
  id: 'all-iso',
  code: 'All ISO',
  shortTitle: 'All ISO Standards',
}

const workspaceStandards = [allIsoStandard, ...isoStandards]
const auditorCheckOptions = ['Not Assessed', 'OK', 'OFI', 'Minor', 'Major']
const questionStatusOptions = ['Not Started', 'In Progress', 'Ready', 'Needs Review']

function auditorTone(value) {
  if (value === 'OK') return 'green'
  if (value === 'OFI') return 'blue'
  if (value === 'Minor') return 'orange'
  if (value === 'Major') return 'red'
  return 'slate'
}

function formatWorkspaceDate(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleDateString()
}

function questionsForWorkspace(allQuestions, workspace) {
  if (!workspace) return allQuestions
  const standard = workspaceStandards.find((item) => item.id === workspace.standardId)
  const isoQuestions = workspace.standardId === 'all-iso'
    ? allQuestions.filter((question) => question.standardCodes.length > 0)
    : allQuestions.filter((question) => question.standardCodes.includes(standard?.code))

  if (!workspace.auditeeCode || workspace.auditeeCode === 'all-auditees') return isoQuestions
  const themeQuestions = isoQuestions.filter((question) => question.themeCode === workspace.auditeeCode)
  if (themeQuestions.length) return themeQuestions

  const auditeeSearchKey = String(workspace.functionName || '')
    .toLowerCase()
    .replace(/^(vp|manager)\s+/, '')
  const functionQuestions = isoQuestions.filter((question) =>
    String(question.applicableFunction || '').toLowerCase().includes(auditeeSearchKey),
  )
  return functionQuestions.length ? functionQuestions : isoQuestions
}

function calculateWorkspaceMetrics(workspace, allQuestions, evidenceItems) {
  const scopedQuestions = questionsForWorkspace(allQuestions, workspace)
  const updates = workspace?.questionStates || workspace?.questionUpdates || {}
  const values = scopedQuestions.map((question) => ({ ...question, ...updates[question.id] }))
  const count = (field, value) => values.filter((item) => item[field] === value).length
  return {
    total: values.length,
    notAssessed: values.filter((item) => !item.auditorCheck || item.auditorCheck === 'Not Assessed' || item.auditorCheck === 'Not Checked').length,
    notStarted: count('status', 'Not Started'),
    inProgress: count('status', 'In Progress'),
    ready: count('status', 'Ready'),
    needsReview: count('status', 'Needs Review'),
    ok: count('auditorCheck', 'OK'),
    ofi: count('auditorCheck', 'OFI'),
    minor: count('auditorCheck', 'Minor'),
    major: count('auditorCheck', 'Major'),
    completion: values.length ? Math.round(values.filter((item) => item.auditorCheck && !['Not Assessed', 'Not Checked'].includes(item.auditorCheck)).length * 100 / values.length) : 0,
    evidence: evidenceItems.filter((item) => item.workspaceId === workspace?.id).length,
    documents: 0,
  }
}

function scheduleScroll(sectionId) {
  const scroll = () => {
    document.getElementById(sectionId)?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    })
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(scroll)
  } else {
    scroll()
  }
}

function CapabilityCard({ label, description, icon: Icon, to, onClick }) {
  const className =
    'group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition nr-card-shadow hover:-translate-y-0.5 hover:border-[#005BAC] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100'

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC] transition group-hover:bg-[#005BAC] group-hover:text-white">
          <Icon size={21} />
        </div>
        <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#005BAC]" />
      </div>
      <p className="mt-4 text-sm font-bold leading-5 text-slate-700">{label}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}

function WorkspaceForm({ onCreate, initialValue = null, onCancel = null }) {
  const [form, setForm] = useState(() => {
    const start = new Date()
    const end = new Date(start)
    end.setDate(end.getDate() + 30)
    return {
    name: initialValue?.name || '',
    standardId: initialValue?.standardId || 'iso-9001',
    auditeeCode: initialValue?.auditeeCode || auditees[1].code,
    functionName: initialValue?.functionName || auditees[1].name,
    auditFunction: initialValue?.auditFunction || initialValue?.functionName || auditees[1].name,
    auditLocation: initialValue?.auditLocation || '',
    auditPeriodStart: initialValue?.auditPeriodStart || start.toISOString().slice(0, 10),
    auditPeriodEnd: initialValue?.auditPeriodEnd || end.toISOString().slice(0, 10),
    leadAuditorName: initialValue?.leadAuditorName || '',
    status: initialValue?.status || 'Draft',
    scope: initialValue?.scope || initialValue?.description || '',
    }
  })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (initialValue && form.standardId !== initialValue.standardId) {
      const confirmed = window.confirm(
        'Changing ISO will reload the checklist for this workspace. Existing status changes may no longer match the new ISO scope.',
      )
      if (!confirmed) return
    }
    onCreate({
      ...initialValue,
      ...form,
      description: form.scope,
      isoCode: workspaceStandards.find((item) => item.id === form.standardId)?.code || '',
      auditeeName: form.functionName,
      createdAt: initialValue?.createdAt || new Date().toISOString(),
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#005BAC]">{initialValue ? 'Workspace settings' : 'Workspace setup'}</p>
          <h2 className="mt-1 text-lg font-bold text-[#0B1F3A]">{initialValue ? 'Edit workspace' : 'Create readiness workspace'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Select an ISO scope and official auditee to generate a practical readiness checklist.
          </p>
        </div>
        <Badge tone="green">Readiness Workspace</Badge>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-x-5 gap-y-5 p-6 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Workspace Name</span>
          <input
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Example: ISO preparation workspace"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">ISO Standard</span>
          <select
            value={form.standardId}
            onChange={(event) => updateField('standardId', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          >
            {workspaceStandards.map((standard) => (
              <option key={standard.id} value={standard.id}>
                {standard.code} — {standard.shortTitle}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Auditee</span>
          <select
            value={form.auditeeCode}
            onChange={(event) => {
              const auditee = auditees.find((item) => item.code === event.target.value)
              setForm((current) => ({
                ...current,
                auditeeCode: auditee?.code || '',
                functionName: auditee?.name || '',
                auditFunction: auditee?.name || '',
              }))
            }}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          >
            {auditees.map((item) => (
              <option key={item.code} value={item.code}>{item.code} — {item.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Audit Scope</span>
          <input
            value={form.scope}
            onChange={(event) => updateField('scope', event.target.value)}
            placeholder="Define scope for preparation"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Audit Function</span>
          <input required value={form.auditFunction} onChange={(event) => updateField('auditFunction', event.target.value)} placeholder="Function responsible for this audit" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Lead Auditor</span>
          <input value={form.leadAuditorName} onChange={(event) => updateField('leadAuditorName', event.target.value)} placeholder="Lead auditor name" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Audit Location (Optional)</span>
          <select value={form.auditLocation} onChange={(event) => updateField('auditLocation', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
            <option value="">No location review</option>
            <option>Tinjauan ORF Muara Karang &amp; Rumah Singgah</option>
            <option>Tinjauan Warehouse Sunter</option>
            <option>Tinjauan Kantor Pusat (Wisma Nusantara)</option>
            <option>Tinjauan Pos ISPS Green Bay Muara Karang</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Audit Period Start</span>
          <input type="date" required value={form.auditPeriodStart} onChange={(event) => updateField('auditPeriodStart', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Audit Period End</span>
          <input type="date" min={form.auditPeriodStart} required value={form.auditPeriodEnd} onChange={(event) => updateField('auditPeriodEnd', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        </label>

        {initialValue ? (
          <label className="block lg:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Workspace Status</span>
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
              {['Draft', 'Active', 'UnderReview', 'Completed', 'Archived'].map((value) => <option key={value} value={value}>{value === 'UnderReview' ? 'Under Review' : value}</option>)}
            </select>
          </label>
        ) : null}

        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
          <Button type="submit" className="min-w-44 py-3">
            <Plus size={18} />
            {initialValue ? 'Save Workspace Changes' : 'Create Workspace'}
          </Button>
          {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button> : null}
          </div>
        </div>
      </form>
    </Card>
  )
}

function SavedWorkspaces({ workspaces, onOpen, onDelete, getMetrics }) {
  if (!workspaces.length) return null

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Saved workspaces</h2>
          <p className="mt-1 text-sm text-slate-600">Reopen a prepared workspace for review or presentation.</p>
        </div>
        <Badge tone="blue">{workspaces.length} Saved</Badge>
      </div>
      </div>
      <div className="grid gap-4 bg-slate-50/60 p-5 lg:grid-cols-2">
        {workspaces.map((item) => {
          const standard = workspaceStandards.find((entry) => entry.id === item.standardId)
          const metrics = getMetrics(item)
          return (
            <div key={item.id} role="button" tabIndex={0} onClick={() => onOpen(item.id)} onKeyDown={(event) => event.key === 'Enter' && onOpen(item.id)} className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge tone="orange">{item.status || 'Draft Preparation'}</Badge>
                  <p className="mt-3 truncate text-base font-bold text-[#0B1F3A]">{item.name || 'Untitled Workspace'}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{standard?.code || 'ISO scope'} · {item.auditeeCode ? `${item.auditeeCode} — ` : ''}{item.functionName}</p>
                </div>
                <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(item.id) }} aria-label={`Delete ${item.name}`} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-4 text-center">
                <div><p className="text-lg font-bold text-[#0B1F3A]">{metrics.total}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Questions</p></div>
                <div><p className="text-lg font-bold text-emerald-700">{metrics.ready}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ready</p></div>
                <div><p className="text-lg font-bold text-[#005BAC]">{metrics.evidence}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Evidence</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">Updated {formatWorkspaceDate(item.updatedAt || item.createdAt)}</p>
                <button type="button" onClick={(event) => { event.stopPropagation(); onOpen(item.id) }} className="text-sm font-bold text-[#005BAC] group-hover:underline">Open Workspace →</button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WorkspaceSummary({ workspace, onEdit }) {
  const standard = workspaceStandards.find((item) => item.id === workspace.standardId)
  const context = new URLSearchParams({
    workspaceId: workspace.id,
    iso: standard?.code || '',
    function: workspace.functionName,
    theme: workspace.auditeeCode || '',
  }).toString()

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#0B1F3A] to-[#123B67] px-6 py-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
              <FolderKanban size={15} /> Active readiness workspace
            </div>
            <h2 className="mt-2 text-xl font-bold">{workspace.name || 'Untitled Workspace'}</h2>
            <p className="mt-1 text-sm text-slate-300">{workspace.scope || 'Audit preparation scope not specified.'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex w-fit rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200">{workspace.status || 'Draft Preparation'}</span>
            <button type="button" onClick={onEdit} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20">Edit Workspace</button>
          </div>
        </div>
      </div>
      <div className="grid divide-y divide-slate-100 md:grid-cols-3 xl:grid-cols-6 md:divide-x md:divide-y-0">
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">ISO scope</p>
          <p className="mt-2 text-sm font-bold text-[#0B1F3A]">{standard?.code}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Created</p>
          <p className="mt-2 text-sm font-bold text-[#0B1F3A]">{formatWorkspaceDate(workspace.createdAt)}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Auditee</p>
          <p className="mt-2 text-sm font-bold text-[#0B1F3A]">{workspace.auditeeCode ? `${workspace.auditeeCode} — ` : ''}{workspace.functionName}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Function / Location</p>
          <p className="mt-2 text-sm font-bold text-[#0B1F3A]">{workspace.auditFunction || workspace.functionName}</p>
          {workspace.auditLocation ? <p className="mt-1 text-xs leading-5 text-slate-500">{workspace.auditLocation}</p> : null}
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Audit Team</p>
          <p className="mt-2 text-sm font-bold text-[#0B1F3A]">{workspace.leadAuditorName || 'Lead auditor not assigned'}</p>
          <p className="mt-1 text-xs text-slate-500">{workspace.auditorTeam?.length || 0} team member(s)</p>
        </div>
        <div className="flex flex-col gap-3 px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace resources</p>
          <div className="flex flex-wrap gap-2">
            <Button to={`/evidence-library?${context}`} variant="secondary" className="px-3 py-2"><ExternalLink size={15} /> Evidence</Button>
            <Button to={`/document-library?${context}`} variant="secondary" className="px-3 py-2"><ExternalLink size={15} /> Documents</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function WorkspaceMetrics({ metrics }) {
  const items = [
    ['Total Key Questions', metrics.total, 'slate'],
    ['Not Assessed', metrics.notAssessed, 'slate'],
    ['OK', metrics.ok, 'green'],
    ['OFI', metrics.ofi, 'blue'],
    ['MINOR', metrics.minor, 'orange'],
    ['MAJOR', metrics.major, 'red'],
    ['Completion', `${metrics.completion}%`, 'blue'],
    ['Ready', metrics.ready, 'green'],
    ['Linked Evidence', metrics.evidence, 'blue'],
    ['Linked Documents', metrics.documents, 'slate'],
  ]

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-[#0B1F3A]">Workspace readiness summary</h2>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 xl:grid-cols-6">
        {items.map(([label, value, tone]) => (
          <div key={label} className="min-h-24 p-4">
            <Badge tone={tone}>{label}</Badge>
            <p className="mt-3 text-2xl font-bold text-[#0B1F3A]">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function QuestionRow({ question, isSelected, onSelect, onAuditorCheckChange, onStatusChange, evidenceCount }) {
  return (
    <div
      onClick={() => onSelect(question)}
      onKeyDown={(event) => event.key === 'Enter' && onSelect(question)}
      role="button"
      tabIndex={0}
      className={[
        'relative w-full border-b border-slate-100 px-5 py-5 text-left transition last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-200',
        isSelected ? 'bg-blue-50/80 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[#005BAC]' : 'hover:bg-slate-50/80',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#005BAC]">
            {question.themeCode || question.systemDomain || 'Audit master question'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {question.standardCodes.length
              ? question.standardCodes.map((code) => <Badge key={code} tone="green">{code}</Badge>)
              : <Badge tone="slate">ISO scope</Badge>}
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#0B1F3A]">
            {question.auditQuestion}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {question.systemDomain || question.objective || 'General audit readiness'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3" onClick={(event) => event.stopPropagation()}>
          <label className="text-xs font-bold text-slate-500">
            Status
            <select aria-label={`Status for ${question.auditQuestion}`} value={question.status || 'Not Started'} onChange={(event) => onStatusChange(question.id, event.target.value)} className="mt-1.5 block rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
              {questionStatusOptions.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500" onClick={(event) => event.stopPropagation()}>
            Result
            <select
              aria-label={`Auditor Check for ${question.auditQuestion}`}
              value={question.auditorCheck || 'Not Assessed'}
              onChange={(event) => onAuditorCheckChange(question.id, event.target.value)}
              className="mt-1.5 block rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              {auditorCheckOptions.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <span className="text-[11px] font-semibold text-slate-400">{evidenceCount} linked evidence</span>
        </div>
      </div>
    </div>
  )
}

function EvidencePocket({ question, items, workspaceId }) {
  const questionKey = question.questionKey || question.id
  const linkedEvidence = items.filter((item) =>
    item.questionKey === questionKey && item.workspaceId === workspaceId,
  )
  const params = new URLSearchParams({
    workspaceId,
    questionKey,
    iso: question.standardCode || question.standardCodes[0] || '',
    theme: question.themeCode || '',
  }).toString()

  return (
    <div className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#0B1F3A]">Evidence Pocket</p>
          <p className="mt-1 text-sm text-slate-500">Linked Evidence for {questionKey}</p>
        </div>
        <Button to={`/evidence-library?${params}`} variant="secondary">
          <Plus size={17} /> Add Evidence for This Question
        </Button>
      </div>

      {!linkedEvidence.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <p className="text-sm font-semibold text-slate-600">No evidence has been linked to this audit question.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {linkedEvidence.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#0B1F3A]">{item.evidenceTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">Owner: {item.ownerFunction}</p>
                </div>
                <Badge tone={item.status === 'Accepted' ? 'green' : item.status === 'Needs Revision' ? 'orange' : 'blue'}>{item.status}</Badge>
              </div>
              {item.notes ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.notes}</p> : null}
              {item.oneDriveLink ? (
                <a href={item.oneDriveLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#005BAC] hover:underline">
                  <ExternalLink size={15} /> Open Evidence
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentPocket({ question, workspaceId }) {
  const questionKey = question.questionKey || question.id
  const params = new URLSearchParams({
    workspaceId,
    questionKey,
    iso: question.standardCode || question.standardCodes[0] || '',
    theme: question.themeCode || '',
  }).toString()

  return (
    <div className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#0B1F3A]">Linked Documents</p>
          <p className="mt-1 text-sm text-slate-500">Controlled references for {questionKey}</p>
        </div>
        <Button to={`/document-library?${params}`} variant="secondary"><FileText size={17} /> Open Document Library</Button>
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <p className="text-sm font-semibold text-slate-600">No document has been linked to this audit question.</p>
      </div>
    </div>
  )
}

function QuestionDetail({ question, onStatusChange, onAuditorCheckChange, onAuditorNotesChange, onAssessmentFieldChange, evidenceItems, workspaceId }) {
  if (!question) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-[#005BAC]">
            <FileText size={36} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-[#0B1F3A]">No audit question selected.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Select a checklist question to view clause, required evidence, SOP reference, PIC, status, auditor notes, and recommendation.
          </p>
        </div>
      </Card>
    )
  }

  const fields = [
    ['ISO Reference', Object.entries(question.isoClauses || {}).map(([standard, clause]) => `${standard}: ${clause}`).join('; ') || question.standardCodes.join(', ') || '—'],
    ['Theme / Domain', [question.themeCode, question.systemDomain].filter(Boolean).join(' · ') || '—'],
    ['Question Section', question.section === 'CORE' ? 'Core Questions' : question.section === 'SPECIFIC' ? 'Function-Specific / Location Questions' : question.section || '—'],
    ['Audit Type', question.auditType || '—'],
    ['Objective', question.objective || '—'],
    ['What to Verify', question.whatToVerify || '—'],
    ['Required Evidence', question.requiredEvidence],
    ['KPI Review', question.kpiReview || '—'],
    ['Risk Review', question.riskReview || '—'],
    ['Auditor Guideline', question.auditorGuideline || '—'],
    ['Sampling Guide', question.samplingGuide || '—'],
    ['Applicable Function', question.applicableFunction || '—'],
    ['Reference SOP / TKO / TKI / Work Instruction', question.referenceSop || '—'],
    ['PIC', question.pic || 'Function Owner'],
    ['Recommendation', question.recommendation],
  ]

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">{question.questionKey || question.id}</Badge>
          {question.standardCodes.map((code) => <Badge key={code} tone="green">{code}</Badge>)}
        </div>
        <h2 className="mt-3 text-lg font-bold leading-7 text-[#0B1F3A]">Audit Question Detail</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{question.auditQuestion}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {fields.map(([label, value]) => (
          <div key={label} className="grid gap-2 px-5 py-4 lg:grid-cols-[160px_1fr]">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-sm leading-6 text-slate-700">{value}</p>
          </div>
        ))}
        <div className="grid gap-2 px-5 py-4 lg:grid-cols-[160px_1fr]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
          <select aria-label="Question Status" value={question.status || 'Not Started'} onChange={(event) => onStatusChange(question.id, event.target.value)} className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100">
            {questionStatusOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="grid gap-2 px-5 py-4 lg:grid-cols-[160px_1fr]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assessment Result</p>
          <div>
            <select
              aria-label="Auditor Check"
              value={question.auditorCheck || 'Not Assessed'}
              onChange={(event) => onAuditorCheckChange(question.id, event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            >
              {auditorCheckOptions.map((value) => <option key={value}>{value}</option>)}
            </select>
            <div className="ml-3 inline-block"><Badge tone={auditorTone(question.auditorCheck)}>{question.auditorCheck}</Badge></div>
          </div>
        </div>
        <div className="grid gap-2 px-5 py-4 lg:grid-cols-[160px_1fr]">
          <label htmlFor="auditor-notes" className="text-xs font-bold uppercase tracking-wide text-slate-500">Auditor Notes</label>
          <textarea
            id="auditor-notes"
            value={question.auditorNotes || ''}
            onChange={(event) => onAuditorNotesChange(question.id, event.target.value)}
            rows={3}
            placeholder="Record the auditor's notes"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <div className="grid gap-2 px-5 py-4 lg:grid-cols-[160px_1fr]">
          <label htmlFor="recommendation" className="text-xs font-bold uppercase tracking-wide text-slate-500">Recommendation / Follow-up</label>
          <textarea id="recommendation" value={question.recommendation || ''} onChange={(event) => onAssessmentFieldChange(question.id, { recommendation: event.target.value })} rows={3} placeholder="Record recommendation or corrective action" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
        </div>
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[160px_1fr]">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">PIC &amp; Due Date</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input aria-label="Assessment PIC" value={question.pic || ''} onChange={(event) => onAssessmentFieldChange(question.id, { pic: event.target.value })} placeholder="Person in charge" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
            <input aria-label="Follow-up Due Date" type="date" value={question.dueDate || ''} onChange={(event) => onAssessmentFieldChange(question.id, { dueDate: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
          </div>
        </div>
        <div className="grid gap-2 px-5 py-4 lg:grid-cols-[160px_1fr]">
          <label htmlFor="auditee-response" className="text-xs font-bold uppercase tracking-wide text-slate-500">Auditee Response</label>
          <textarea id="auditee-response" value={question.auditeeResponse || ''} onChange={(event) => onAssessmentFieldChange(question.id, { auditeeResponse: event.target.value })} rows={2} placeholder="Record response or follow-up information" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
        </div>
        {question.assessmentUpdatedAt ? <div className="px-5 py-3 text-xs text-slate-500">Last assessment update: {formatWorkspaceDate(question.assessmentUpdatedAt)}</div> : null}
        <EvidencePocket question={question} items={evidenceItems} workspaceId={workspaceId} />
        <DocumentPocket question={question} workspaceId={workspaceId} />
      </div>
    </Card>
  )
}

export default function AuditReadiness() {
  const location = useLocation()
  const initialWorkspace = useMemo(() => {
    const requestedId = location.state?.workspaceId
    return requestedId
      ? getStoredWorkspaces().find((item) => item.id === requestedId) || null
      : null
  }, [location.state?.workspaceId])
  const fallbackQuestions = useMemo(() => getAllQuestions(), [])
  const {
    questions: masterQuestions,
    loading: masterLoading,
    message: masterMessage,
    usingFallback,
  } = useAuditMasterQuestions(fallbackQuestions)
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [savedWorkspaces, setSavedWorkspaces] = useState(() => getStoredWorkspaces())
  const [query, setQuery] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [capabilityMessage, setCapabilityMessage] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('all-themes')
  const [editingWorkspace, setEditingWorkspace] = useState(false)
  const [questionUpdates, setQuestionUpdates] = useState(
    () => initialWorkspace?.questionStates || initialWorkspace?.questionUpdates || {},
  )
  const [backendWorkspaceQuestions, setBackendWorkspaceQuestions] = useState([])
  const [evidenceItems, setEvidenceItems] = useState(() => getEvidenceItems())

  useEffect(() => {
    const refreshEvidence = () => {
      if (!isBackendApiConfigured) setEvidenceItems(getEvidenceItems())
    }
    window.addEventListener('nr-evidence-updated', refreshEvidence)
    window.addEventListener('focus', refreshEvidence)
    return () => {
      window.removeEventListener('nr-evidence-updated', refreshEvidence)
      window.removeEventListener('focus', refreshEvidence)
    }
  }, [])

  useEffect(() => {
    if (!isBackendApiConfigured) return
    let active = true
    const requestedId = location.state?.workspaceId
    Promise.all([
      getApiWorkspaces(),
      requestedId ? getApiWorkspace(requestedId) : Promise.resolve(null),
      requestedId ? getApiWorkspaceQuestions(requestedId) : Promise.resolve([]),
    ])
      .then(([items, requestedWorkspace, backendQuestions]) => {
        if (!active) return
        setSavedWorkspaces(items)
        if (requestedWorkspace) {
          setWorkspace(requestedWorkspace)
          setBackendWorkspaceQuestions(backendQuestions)
          setQuestionUpdates(Object.fromEntries(backendQuestions.map((question) => [question.id, {
            status: question.status,
            auditorCheck: question.auditorCheck,
            auditorNotes: question.auditorNotes,
            recommendation: question.recommendation,
            pic: question.pic,
            dueDate: question.dueDate,
            auditeeResponse: question.auditeeResponse,
          }])))
          getApiWorkspaceEvidence(requestedWorkspace.id, backendQuestions)
            .then((backendEvidence) => { if (active) setEvidenceItems(backendEvidence) })
            .catch((error) => { if (active) setCapabilityMessage(error.message || 'Unable to load backend evidence.') })
        }
      })
      .catch((error) => { if (active) setCapabilityMessage(error.message || 'Unable to load backend workspaces.') })
    return () => { active = false }
  }, [location.state?.workspaceId])

  const hydratedQuestions = useMemo(
    () => (isBackendApiConfigured && workspace ? backendWorkspaceQuestions : masterQuestions)
      .map((question) => ({ ...question, ...questionUpdates[question.id] })),
    [backendWorkspaceQuestions, masterQuestions, questionUpdates, workspace],
  )

  const themeCodes = useMemo(
    () => Array.from(new Set(
      questionsForWorkspace(hydratedQuestions, workspace)
        .map((question) => question.themeCode)
        .filter(Boolean),
    )).sort(),
    [hydratedQuestions, workspace],
  )

  const questions = useMemo(() => {
    if (!workspace) return hydratedQuestions

    const byWorkspace = questionsForWorkspace(hydratedQuestions, workspace)
    const byTheme = selectedTheme === 'all-themes'
      ? byWorkspace
      : byWorkspace.filter((question) => question.themeCode === selectedTheme)

    if (!query.trim()) return byTheme

    return byTheme.filter((question) =>
      `${question.themeCode} ${question.standardCodes.join(' ')} ${question.auditQuestion} ${question.clause} ${question.requiredEvidence}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [hydratedQuestions, query, selectedTheme, workspace])

  function updateQuestion(id, patch) {
    const nextUpdates = {
      ...questionUpdates,
      [id]: { ...questionUpdates[id], ...patch, updatedAt: new Date().toISOString() },
    }
    setQuestionUpdates(nextUpdates)
    if (workspace && isBackendApiConfigured) {
      saveApiAssessment(workspace.id, id, nextUpdates[id]).catch((error) => {
        setCapabilityMessage(error.message || 'Unable to save the assessment to the backend.')
      })
    } else if (workspace) {
      const saved = saveStoredWorkspace({
        ...workspace,
        questionUpdates: nextUpdates,
        questionStates: nextUpdates,
      })
      setWorkspace(saved)
      setSavedWorkspaces(getStoredWorkspaces())
    }
    setSelectedQuestion((current) => current?.id === id ? { ...current, ...patch } : current)
  }

  async function handleWorkspaceCreate(nextWorkspace) {
    if (isBackendApiConfigured) {
      try {
        const saved = await createApiWorkspace(nextWorkspace)
        setWorkspace(null)
        setSavedWorkspaces((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
        setQuestionUpdates({})
        setSelectedQuestion(null)
        setQuery('')
        setSelectedTheme('all-themes')
        setCapabilityMessage('Workspace created in the audit backend. Select its card to open the detailed review.')
      } catch (error) {
        setCapabilityMessage(error.message || 'Unable to create the workspace.')
      }
      return
    }
    saveStoredWorkspace({
      ...nextWorkspace,
      id: `WS-${Date.now()}`,
      questionUpdates: {},
      questionStates: {},
      status: 'Draft Preparation',
    })
    setWorkspace(null)
    setSavedWorkspaces(getStoredWorkspaces())
    setQuestionUpdates({})
    setSelectedQuestion(null)
    setQuery('')
    setSelectedTheme('all-themes')
    setCapabilityMessage('Workspace created and saved. Select its card to open the detailed workspace review.')
  }

  async function handleWorkspaceUpdate(updates) {
    if (isBackendApiConfigured) {
      try {
        const saved = await updateApiWorkspace(workspace.id, { ...workspace, ...updates })
        const refreshedQuestions = await getApiWorkspaceQuestions(workspace.id)
        setWorkspace(saved)
        setBackendWorkspaceQuestions(refreshedQuestions)
        setQuestionUpdates(Object.fromEntries(refreshedQuestions.map((question) => [question.id, {
          status: question.status,
          auditorCheck: question.auditorCheck,
          auditorNotes: question.auditorNotes,
          recommendation: question.recommendation,
          pic: question.pic,
          dueDate: question.dueDate,
          auditeeResponse: question.auditeeResponse,
        }])))
        setSavedWorkspaces((current) => current.map((item) => item.id === saved.id ? saved : item))
        setSelectedQuestion(null)
        setSelectedTheme('all-themes')
        setEditingWorkspace(false)
        setCapabilityMessage('Workspace changes saved to the audit backend.')
      } catch (error) {
        setCapabilityMessage(error.message || 'Unable to update the workspace.')
      }
      return
    }
    const previousStandard = workspace.standardId
    const saved = saveStoredWorkspace({
      ...workspace,
      ...updates,
      questionUpdates: previousStandard === updates.standardId ? questionUpdates : {},
      questionStates: previousStandard === updates.standardId ? questionUpdates : {},
    })
    setWorkspace(saved)
    setQuestionUpdates(saved.questionStates || saved.questionUpdates || {})
    setSavedWorkspaces(getStoredWorkspaces())
    setSelectedQuestion(null)
    setSelectedTheme('all-themes')
    setEditingWorkspace(false)
    setCapabilityMessage('Workspace changes saved.')
  }

  async function openSavedWorkspace(workspaceId) {
    if (isBackendApiConfigured) {
      try {
        const [saved, backendQuestions] = await Promise.all([
          getApiWorkspace(workspaceId),
          getApiWorkspaceQuestions(workspaceId),
        ])
        const backendEvidence = await getApiWorkspaceEvidence(workspaceId, backendQuestions)
        const updates = Object.fromEntries(backendQuestions.map((question) => [question.id, {
          status: question.status,
          auditorCheck: question.auditorCheck,
          auditorNotes: question.auditorNotes,
          recommendation: question.recommendation,
          pic: question.pic,
          dueDate: question.dueDate,
          auditeeResponse: question.auditeeResponse,
        }]))
        setWorkspace(saved)
        setBackendWorkspaceQuestions(backendQuestions)
        setEvidenceItems(backendEvidence)
        setQuestionUpdates(updates)
        setSelectedQuestion(null)
        setSelectedTheme('all-themes')
        setEditingWorkspace(false)
        setQuery('')
        setCapabilityMessage('Backend workspace opened with its saved assessments.')
      } catch (error) {
        setCapabilityMessage(error.message || 'Unable to open the workspace.')
      }
      return
    }
    const saved = setActiveStoredWorkspace(workspaceId)
    if (!saved) return
    setWorkspace(saved)
    setQuestionUpdates(saved.questionStates || saved.questionUpdates || {})
    setSelectedQuestion(null)
    setSelectedTheme('all-themes')
    setEditingWorkspace(false)
    setQuery('')
    setCapabilityMessage('Saved workspace opened and ready to present.')
  }

  async function removeSavedWorkspace(workspaceId) {
    const workspaceToDelete = savedWorkspaces.find((item) => item.id === workspaceId)
    const confirmed = window.confirm(
      `Delete "${workspaceToDelete?.name || 'this workspace'}"? Its linked evidence will also be deleted. This action cannot be undone.`,
    )
    if (!confirmed) return

    if (isBackendApiConfigured) {
      try {
        await deleteApiWorkspace(workspaceId)
        setSavedWorkspaces((current) => current.filter((item) => item.id !== workspaceId))
        if (workspace?.id === workspaceId) setWorkspace(null)
        setCapabilityMessage('Workspace and its related records were deleted from the backend.')
      } catch (error) {
        setCapabilityMessage(error.message || 'Unable to delete the workspace.')
      }
      return
    }

    deleteEvidenceByWorkspace(workspaceId)
    const nextWorkspaces = deleteStoredWorkspace(workspaceId)
    setSavedWorkspaces(nextWorkspaces)
    setEvidenceItems(getEvidenceItems())
    if (workspace?.id === workspaceId) {
      setWorkspace(null)
      setQuestionUpdates({})
      setSelectedQuestion(null)
    }
    setCapabilityMessage('Saved workspace deleted.')
  }

  function openAuditCreation() {
    setWorkspace(null)
    setSelectedQuestion(null)
    setQuery('')
    setQuestionUpdates({})
    setEditingWorkspace(false)
    setCapabilityMessage('Audit creation is ready. Complete the workspace form to continue.')
    scheduleScroll('workspace-creation')
  }

  function openChecklist() {
    if (!workspace) {
      setCapabilityMessage('Create a readiness workspace before opening the checklist.')
      scheduleScroll('workspace-creation')
      return
    }

    setCapabilityMessage('Checklist opened for the active workspace.')
    scheduleScroll('readiness-checklist')
  }

  function openPicStructure() {
    if (!workspace) {
      setCapabilityMessage('Create a readiness workspace before reviewing the PIC structure.')
      scheduleScroll('workspace-creation')
      return
    }

    const question = selectedQuestion || questions[0]
    if (!question) {
      setCapabilityMessage('No checklist question is available for this workspace.')
      return
    }

    setSelectedQuestion(question)
    setCapabilityMessage('PIC structure opened from the selected audit question.')
    scheduleScroll('pic-structure')
  }

  const activeMetrics = workspace
    ? calculateWorkspaceMetrics({ ...workspace, questionStates: questionUpdates }, hydratedQuestions, evidenceItems)
    : null

  return (
    <div>
      <PageHeader
        title="Audit Readiness"
        subtitle="Create readiness workspace, navigate ISO clauses, and prepare practical audit checklist evidence."
        actions={
          workspace ? (
            <Button variant="secondary" onClick={openAuditCreation}>
              New Workspace
            </Button>
          ) : savedWorkspaces.length ? (
            <Button onClick={() => scheduleScroll('workspace-creation')}>New Workspace</Button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-500 shadow-sm">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Master data connected</span>
        <span>15 official auditees</span>
        <span>Question-specific evidence pockets</span>
        <span>Browser autosave enabled</span>
      </div>

      {masterLoading ? (
        <Card className="mb-6 p-5">
          <div className="flex items-center gap-3 text-slate-600" role="status">
            <Loader2 size={18} className="animate-spin" />
            <p className="text-sm font-semibold">Loading audit master data...</p>
          </div>
        </Card>
      ) : null}

      {masterMessage ? (
        <Card className={`mb-6 p-5 ${usingFallback ? 'border-amber-200 bg-amber-50' : ''}`}>
          <div className="flex items-start gap-3 text-amber-800" role="status">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-semibold">{masterMessage}</p>
          </div>
        </Card>
      ) : null}

      {!workspace ? (
        <div id="workspace-creation" className="scroll-mt-24 space-y-6">
          <SavedWorkspaces
            workspaces={savedWorkspaces}
            onOpen={openSavedWorkspace}
            onDelete={removeSavedWorkspace}
            getMetrics={(item) => calculateWorkspaceMetrics(item, masterQuestions, evidenceItems)}
          />
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <WorkspaceForm onCreate={handleWorkspaceCreate} />

            <Card className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
              <FolderKanban size={24} />
            </div>
            <h2 className="mt-5 text-lg font-bold text-[#0B1F3A]">
              Workspace starts empty.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No audit workspace is preloaded. The first workspace is created manually by the presenter.
            </p>
            <div className="mt-5 space-y-3">
              {[
                'Select ISO standard',
                'Select official auditee code',
                'Open clause checklist',
                'Review required evidence',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 size={17} className="text-[#00A651]" />
                  {item}
                </div>
              ))}
            </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <WorkspaceSummary workspace={workspace} onEdit={() => setEditingWorkspace(true)} />
          {editingWorkspace ? (
            <WorkspaceForm
              key={workspace.id}
              initialValue={workspace}
              onCreate={handleWorkspaceUpdate}
              onCancel={() => setEditingWorkspace(false)}
            />
          ) : null}
          <WorkspaceMetrics metrics={activeMetrics} />

          <div id="readiness-checklist" className="grid scroll-mt-24 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0B1F3A]">Readiness Checklist</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Practical internal audit questions derived from the selected ISO standard.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-inner">
                    <Search size={17} className="text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search checklist..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4" aria-label="Theme Code">
                  <button type="button" onClick={() => setSelectedTheme('all-themes')} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${selectedTheme === 'all-themes' ? 'border-[#005BAC] bg-[#005BAC] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#005BAC]'}`}>All Functions</button>
                  {themeCodes.map((code) => (
                    <button key={code} type="button" onClick={() => setSelectedTheme(code)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${selectedTheme === code ? 'border-[#005BAC] bg-[#005BAC] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#005BAC]'}`}>{code}</button>
                  ))}
                </div>
              </div>

              <div className="max-h-[680px] overflow-y-auto nr-scrollbar">
                {questions.map((question, index) => (
                  <div key={question.id}>
                    {question.section && question.section !== questions[index - 1]?.section ? (
                      <div className="border-b border-slate-200 bg-slate-100 px-5 py-3">
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0B1F3A]">
                          {question.section === 'CORE' ? 'Core Questions' : question.section === 'SPECIFIC' ? 'Function-Specific / Location Questions' : 'Legacy Questions'}
                        </p>
                      </div>
                    ) : null}
                    <QuestionRow
                      question={question}
                      isSelected={selectedQuestion?.id === question.id}
                      onSelect={setSelectedQuestion}
                      onStatusChange={(id, value) => updateQuestion(id, { status: value })}
                      onAuditorCheckChange={(id, value) => updateQuestion(id, { auditorCheck: value })}
                      evidenceCount={evidenceItems.filter((item) => item.workspaceId === workspace.id && item.questionKey === (question.questionKey || question.id)).length}
                    />
                  </div>
                ))}
                {!masterLoading && questions.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm font-bold text-[#0B1F3A]">No source key questions match this workspace.</p>
                    <p className="mt-1 text-sm text-slate-500">
                      The imported audit matrix does not contain key questions for this function and ISO scope. Edit the workspace to select a supported function or ISO standard.
                    </p>
                  </div>
                ) : null}
              </div>
            </Card>

            <div id="pic-structure" className="scroll-mt-24 xl:sticky xl:top-24">
              <QuestionDetail
                question={selectedQuestion}
                onStatusChange={(id, value) => updateQuestion(id, { status: value })}
                onAuditorCheckChange={(id, value) => updateQuestion(id, { auditorCheck: value })}
                onAuditorNotesChange={(id, value) => updateQuestion(id, { auditorNotes: value })}
                onAssessmentFieldChange={updateQuestion}
                evidenceItems={evidenceItems}
                workspaceId={workspace.id}
              />
            </div>
          </div>
        </div>
      )}

      <section className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B1F3A]">Readiness capabilities</h2>
            <p className="mt-1 text-sm text-slate-500">Select a capability to open the corresponding workflow.</p>
          </div>
          {capabilityMessage ? (
            <p className="text-sm font-semibold text-[#005BAC]" role="status" aria-live="polite">
              {capabilityMessage}
            </p>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CapabilityCard
            label="ISO Cards"
            description="Browse configured ISO standards and requirements."
            icon={ShieldCheck}
            to="/iso-library"
          />
          <CapabilityCard
            label="Audit Creation"
            description="Create or reset an audit readiness workspace."
            icon={Plus}
            onClick={openAuditCreation}
          />
          <CapabilityCard
            label="Checklist"
            description="Open questions for the active ISO workspace."
            icon={ListChecks}
            onClick={openChecklist}
          />
          <CapabilityCard
            label="Clause Navigation"
            description="Navigate clauses, evidence, and SOP references."
            icon={ArrowRight}
            to="/iso-library"
          />
          <CapabilityCard
            label="PIC Structure"
            description="Review the responsible PIC for an audit question."
            icon={UserCheck}
            onClick={openPicStructure}
          />
        </div>
      </section>
    </div>
  )
}
