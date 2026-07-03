import { useMemo, useState } from 'react'
import {
  Archive,
  CheckCircle2,
  FileArchive,
  FileCheck2,
  Link2,
  Plus,
  Search,
  UploadCloud,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import {
  documentTypes,
  evidenceRequirementCatalog,
  evidenceStatuses,
  ownerFunctions,
} from '../data/evidenceManagementData.js'

function EvidenceForm({ onCreate }) {
  const [form, setForm] = useState({
    title: '',
    requirementId: evidenceRequirementCatalog[0]?.id || '',
    documentType: 'Record',
    ownerFunction: 'Quality Management',
    status: 'Draft Prepared',
    notes: '',
    fileName: '',
  })

  const selectedRequirement = evidenceRequirementCatalog.find(
    (item) => item.id === form.requirementId,
  )

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()

    onCreate({
      id: `EV-${Date.now()}`,
      ...form,
      standardCode: selectedRequirement?.standardCode || '',
      clause: selectedRequirement?.clause || '',
      auditQuestion: selectedRequirement?.auditQuestion || '',
      requiredEvidence: selectedRequirement?.requiredEvidence || '',
      referenceSop: selectedRequirement?.referenceSop || '',
    })

    setForm((current) => ({
      ...current,
      title: '',
      notes: '',
      fileName: '',
    }))
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Add evidence item</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Evidence starts empty. Add the first item manually and map it to an ISO audit requirement.
          </p>
        </div>
        <Badge tone="green">Sprint 3</Badge>
      </div>

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Evidence Title</span>
          <input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Enter evidence title"
            required
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Mapped Audit Requirement</span>
          <select
            value={form.requirementId}
            onChange={(event) => updateField('requirementId', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {evidenceRequirementCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.standardCode} Clause {item.clause} — {item.auditQuestion}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Document Type</span>
          <select
            value={form.documentType}
            onChange={(event) => updateField('documentType', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {documentTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Owner Function</span>
          <select
            value={form.ownerFunction}
            onChange={(event) => updateField('ownerFunction', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {ownerFunctions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Readiness Status</span>
          <select
            value={form.status}
            onChange={(event) => updateField('status', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {evidenceStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Attachment Name</span>
          <input
            value={form.fileName}
            onChange={(event) => updateField('fileName', event.target.value)}
            placeholder="Optional file name"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Preparation Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Write evidence preparation notes"
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="lg:col-span-2">
          <Button type="submit">
            <Plus size={18} />
            Add Evidence Item
          </Button>
        </div>
      </form>
    </Card>
  )
}

function EvidenceRegister({ items }) {
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileArchive}
          title="No evidence item has been added."
          description="Evidence records will appear here after the presenter manually adds the first evidence item and maps it to an audit requirement."
          compact
        />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Evidence Register</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manually added evidence items for audit readiness preparation.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Evidence</th>
              <th className="px-5 py-3">ISO / Clause</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-4">
                  <p className="font-bold text-[#0B1F3A]">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.fileName || 'No attachment name provided'}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-700">{item.standardCode}</p>
                  <p className="text-xs text-slate-500">Clause {item.clause}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{item.ownerFunction}</td>
                <td className="px-5 py-4 text-slate-600">{item.documentType}</td>
                <td className="px-5 py-4">
                  <Badge tone={item.status === 'Accepted' ? 'green' : item.status === 'Needs Revision' ? 'orange' : 'blue'}>
                    {item.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function RequirementCatalog() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return evidenceRequirementCatalog

    return evidenceRequirementCatalog.filter((item) =>
      `${item.standardCode} ${item.clause} ${item.auditQuestion} ${item.requiredEvidence} ${item.referenceSop}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query])

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3A]">Evidence Requirement Catalog</h2>
            <p className="mt-1 text-sm text-slate-600">
              Reference requirements derived from ISO audit questions.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={17} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search evidence..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[620px] overflow-y-auto nr-scrollbar">
        {filtered.map((item) => (
          <div key={item.id} className="border-b border-slate-100 p-5 last:border-b-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
                  {item.standardCode} · Clause {item.clause}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#0B1F3A]">
                  {item.auditQuestion}
                </p>
              </div>
              <Badge tone="slate">{item.standardCode}</Badge>
            </div>

            <div className="mt-4 grid gap-4 text-sm lg:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-bold text-slate-600">Required Evidence</p>
                <p className="mt-1 leading-6 text-slate-600">{item.requiredEvidence}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-bold text-slate-600">Reference SOP</p>
                <p className="mt-1 leading-6 text-slate-600">{item.referenceSop}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function EvidenceLibrary() {
  const [items, setItems] = useState([])

  return (
    <div>
      <PageHeader
        title="Evidence Library"
        subtitle="Create, map, organize, and monitor audit evidence readiness against ISO requirements."
      />

      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <EvidenceForm onCreate={(item) => setItems((current) => [item, ...current])} />
        <EvidenceRegister items={items} />
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Evidence Mapping', Link2],
          ['Document Readiness', FileCheck2],
          ['Evidence Upload Preparation', UploadCloud],
          ['Controlled Archive', Archive],
        ].map(([label, Icon]) => (
          <Card key={label} className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#00A651]">
              <Icon size={21} />
            </div>
            <p className="mt-4 text-sm font-semibold leading-5 text-slate-700">{label}</p>
          </Card>
        ))}
      </section>

      <div className="mt-6">
        <RequirementCatalog />
      </div>
    </div>
  )
}
