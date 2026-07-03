import { useState } from 'react'
import { Database, FileCheck2, Files, Plus, ShieldCheck } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import {
  documentTypes,
  ownerFunctions,
  supportedStandardsForDocuments,
} from '../data/evidenceManagementData.js'

const controlStatuses = ['Draft', 'Under Review', 'Approved', 'Need Update']

function DocumentForm({ onCreate }) {
  const [form, setForm] = useState({
    title: '',
    type: 'SOP',
    owner: 'Quality Management',
    standardId: 'iso-9001',
    controlStatus: 'Draft',
    location: '',
  })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()

    const standard = supportedStandardsForDocuments.find((item) => item.id === form.standardId)

    onCreate({
      id: `DOC-${Date.now()}`,
      ...form,
      standardCode: standard?.code || '',
    })

    setForm((current) => ({
      ...current,
      title: '',
      location: '',
    }))
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-[#0B1F3A]">Add document reference</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Register controlled document references required for audit preparation.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Document Title</span>
          <input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            required
            placeholder="Enter document title"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Document Type</span>
          <select
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
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
            value={form.owner}
            onChange={(event) => updateField('owner', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {ownerFunctions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Related ISO</span>
          <select
            value={form.standardId}
            onChange={(event) => updateField('standardId', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {supportedStandardsForDocuments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Control Status</span>
          <select
            value={form.controlStatus}
            onChange={(event) => updateField('controlStatus', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {controlStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Document Location / Link</span>
          <input
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            placeholder="Optional repository location"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="lg:col-span-2">
          <Button type="submit">
            <Plus size={18} />
            Add Document Reference
          </Button>
        </div>
      </form>
    </Card>
  )
}

function DocumentRegister({ documents }) {
  if (documents.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Files}
          title="No document reference has been added."
          description="Controlled document references will appear here after the first SOP, Work Instruction, form, or record is added manually."
          compact
        />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Document Register</h2>
        <p className="mt-1 text-sm text-slate-600">
          Controlled documents mapped for audit readiness.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {documents.map((document) => (
          <div key={document.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-lg font-bold text-[#0B1F3A]">{document.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {document.type} · {document.owner} · {document.standardCode}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {document.location || 'No repository location provided.'}
                </p>
              </div>
              <Badge tone={document.controlStatus === 'Approved' ? 'green' : document.controlStatus === 'Need Update' ? 'orange' : 'blue'}>
                {document.controlStatus}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState([])

  return (
    <div>
      <PageHeader
        title="Document Library"
        subtitle="Maintain SOP, Work Instruction, form, record, and policy references for audit preparation."
      />

      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <DocumentForm onCreate={(document) => setDocuments((current) => [document, ...current])} />
        <DocumentRegister documents={documents} />
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['Document Control', FileCheck2],
          ['Ownership Mapping', Database],
          ['ISO Reference Linkage', ShieldCheck],
        ].map(([label, Icon]) => (
          <Card key={label} className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
              <Icon size={21} />
            </div>
            <p className="mt-4 text-sm font-semibold leading-5 text-slate-700">{label}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
