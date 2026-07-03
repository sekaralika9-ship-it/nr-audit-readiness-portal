import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderKanban,
  ListChecks,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import { getAllQuestions, isoStandards } from '../data/isoReadinessData.js'

const functions = [
  'Human Capital',
  'HSSE',
  'SPI',
  'Quality Management',
  'Operation',
  'Engineering',
  'Legal',
  'Corporate Secretary',
]

function WorkspaceForm({ onCreate }) {
  const [form, setForm] = useState({
    name: '',
    standardId: 'iso-9001',
    functionName: 'Quality Management',
    scope: '',
  })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    onCreate({
      ...form,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Create readiness workspace</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Use this UI-only form to start the first audit preparation workspace for presentation.
          </p>
        </div>
        <Badge tone="green">Sprint 2</Badge>
      </div>

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Workspace Name</span>
          <input
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Example: ISO preparation workspace"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">ISO Standard</span>
          <select
            value={form.standardId}
            onChange={(event) => updateField('standardId', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {isoStandards.map((standard) => (
              <option key={standard.id} value={standard.id}>
                {standard.code} — {standard.shortTitle}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Function</span>
          <select
            value={form.functionName}
            onChange={(event) => updateField('functionName', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {functions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Audit Scope</span>
          <input
            value={form.scope}
            onChange={(event) => updateField('scope', event.target.value)}
            placeholder="Define scope for preparation"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="lg:col-span-2">
          <Button type="submit">
            <Plus size={18} />
            Create Workspace
          </Button>
        </div>
      </form>
    </Card>
  )
}

function WorkspaceSummary({ workspace }) {
  const standard = isoStandards.find((item) => item.id === workspace.standardId)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-500">Workspace</p>
        <p className="mt-2 text-lg font-bold text-[#0B1F3A]">
          {workspace.name || 'Untitled Workspace'}
        </p>
      </Card>
      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-500">ISO Standard</p>
        <p className="mt-2 text-lg font-bold text-[#0B1F3A]">{standard?.code}</p>
      </Card>
      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-500">Function</p>
        <p className="mt-2 text-lg font-bold text-[#0B1F3A]">{workspace.functionName}</p>
      </Card>
      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-500">Status</p>
        <div className="mt-2">
          <Badge tone="orange">Draft Preparation</Badge>
        </div>
      </Card>
    </div>
  )
}

function QuestionRow({ question, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(question)}
      className={[
        'w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0',
        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
            {question.standardCode} · {question.clause}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#0B1F3A]">
            {question.auditQuestion}
          </p>
          <p className="mt-1 text-xs text-slate-500">{question.clauseTitle}</p>
        </div>
        <Badge tone="slate">{question.status}</Badge>
      </div>
    </button>
  )
}

function QuestionDetail({ question }) {
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
    ['Audit Question', question.auditQuestion],
    ['Clause', question.clause],
    ['Required Evidence', question.requiredEvidence],
    ['Reference SOP', question.referenceSop],
    ['PIC', question.pic],
    ['Status', question.status],
    ['Auditor Notes', question.auditorNotes || '—'],
    ['Recommendation', question.recommendation],
  ]

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
          {question.standardCode} · {question.clause}
        </p>
        <h2 className="mt-2 text-lg font-bold leading-7 text-[#0B1F3A]">
          Audit Question Detail
        </h2>
      </div>
      <div className="divide-y divide-slate-100">
        {fields.map(([label, value]) => (
          <div key={label} className="grid gap-2 p-5 lg:grid-cols-[180px_1fr]">
            <p className="text-sm font-bold text-slate-600">{label}</p>
            <p className="text-sm leading-6 text-slate-700">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function AuditReadiness() {
  const [workspace, setWorkspace] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  const questions = useMemo(() => {
    const allQuestions = getAllQuestions()
    const byWorkspace = workspace
      ? allQuestions.filter((question) => question.standardId === workspace.standardId)
      : allQuestions

    if (!query.trim()) return byWorkspace

    return byWorkspace.filter((question) =>
      `${question.auditQuestion} ${question.clause} ${question.requiredEvidence}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query, workspace])

  return (
    <div>
      <PageHeader
        title="Audit Readiness"
        subtitle="Create readiness workspace, navigate ISO clauses, and prepare practical audit checklist evidence."
        actions={
          workspace ? (
            <Button variant="secondary" onClick={() => setWorkspace(null)}>
              Reset Workspace
            </Button>
          ) : null
        }
      />

      {!workspace ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <WorkspaceForm onCreate={setWorkspace} />

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
                'Define function scope',
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
      ) : (
        <div className="space-y-6">
          <WorkspaceSummary workspace={workspace} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0B1F3A]">Readiness Checklist</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Practical internal audit questions derived from the selected ISO standard.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Search size={17} className="text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search checklist..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="max-h-[680px] overflow-y-auto nr-scrollbar">
                {questions.map((question) => (
                  <QuestionRow
                    key={question.id}
                    question={question}
                    isSelected={selectedQuestion?.id === question.id}
                    onSelect={setSelectedQuestion}
                  />
                ))}
              </div>
            </Card>

            <QuestionDetail question={selectedQuestion} />
          </div>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-base font-bold text-[#0B1F3A]">Sprint 2 capability</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['ISO Cards', ShieldCheck],
            ['Audit Creation', Plus],
            ['Checklist', ListChecks],
            ['Clause Navigation', ArrowRight],
            ['PIC Structure', UserCheck],
          ].map(([label, Icon]) => (
            <Card key={label} className="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
                <Icon size={21} />
              </div>
              <p className="mt-4 text-sm font-semibold leading-5 text-slate-700">{label}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
