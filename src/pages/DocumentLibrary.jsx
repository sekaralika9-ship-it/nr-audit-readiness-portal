import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Database,
  FileCheck2,
  Files,
  Loader2,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import { ownerFunctions } from '../data/evidenceManagementData.js'
import { createDocument, getDocuments } from '../services/documentService.js'

const controlStatuses = ['Draft', 'Under Review', 'Approved', 'Need Update']

function optionValue(item) {
  if (typeof item === 'string') return item
  return item?.name ?? item?.label ?? item?.code ?? item?.id ?? ''
}

function optionKey(item, index) {
  if (typeof item === 'string') return `${item}-${index}`
  return `${item?.category ?? 'item'}-${optionValue(item) || 'unknown'}-${index}`
}

function DocumentForm({ onCreate, saving, feedback }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    owner: optionValue(ownerFunctions[0]),
    controlStatus: 'Draft',
    location: '',
  })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return

    const created = await onCreate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      fungsi: form.owner || null,
      status: form.controlStatus || 'Draft',
      file_path: form.location.trim() || null,
    })

    if (created) {
      setForm((current) => ({
        ...current,
        title: '',
        description: '',
        location: '',
      }))
    }
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
            disabled={saving}
            placeholder="Enter document title"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Description / Notes</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            disabled={saving}
            rows={3}
            placeholder="Optional document notes"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Owner Function</span>
          <select
            value={form.owner}
            onChange={(event) => updateField('owner', event.target.value)}
            disabled={saving}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          >
            {ownerFunctions.map((item, index) => (
              <option key={optionKey(item, index)} value={optionValue(item)}>
                {optionValue(item)}
              </option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Control Status</span>
          <select
            value={form.controlStatus}
            onChange={(event) => updateField('controlStatus', event.target.value)}
            disabled={saving}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          >
            {controlStatuses.map((item, index) => (
              <option key={optionKey(item, index)} value={optionValue(item)}>
                {optionValue(item)}
              </option>
            ))}
          </select>
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Document Location / Link</span>
          <input
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            disabled={saving}
            placeholder="Optional repository location"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          />
          <span className="mt-2 block text-xs leading-5 text-slate-500">
            File upload is not configured. This field saves a repository path or link as document metadata.
          </span>
        </label>

        {feedback.message ? (
          <div
            className={`lg:col-span-2 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
            role="status"
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="lg:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {saving ? 'Saving...' : 'Add Document Reference'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function DocumentRegister({ documents, loading, error }) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={18} className="animate-spin" />
          <p className="text-sm font-semibold">Loading documents from PostgreSQL...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-100 bg-red-50 p-6">
        <div className="flex items-start gap-3 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Unable to load Document Library</p>
            <p className="mt-1 text-sm leading-6">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Files}
          title="No document reference has been added."
          description="Controlled document references will appear here after the first SOP, Work Instruction, form, or record is saved."
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
                <p className="text-lg font-bold text-[#0B1F3A]">{document.title || 'Untitled document'}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {document.fungsi || 'Owner function not provided'}
                </p>
                {document.description ? (
                  <p className="mt-2 text-sm text-slate-600">{document.description}</p>
                ) : null}
                <p className="mt-2 text-sm text-slate-600">
                  {document.file_path || 'No repository location provided.'}
                </p>
              </div>
              <Badge tone={document.status === 'Approved' ? 'green' : document.status === 'Need Update' ? 'orange' : 'blue'}>
                {document.status || 'Draft'}
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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  useEffect(() => {
    let active = true

    async function loadDocuments() {
      try {
        setLoading(true)
        setLoadError('')
        const rows = await getDocuments()
        if (active) setDocuments(rows)
      } catch (error) {
        if (active) setLoadError(error.message || 'Unable to load documents.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDocuments()
    return () => {
      active = false
    }
  }, [])

  async function handleCreate(document) {
    if (saving) return null

    try {
      setSaving(true)
      setFeedback({ type: '', message: '' })
      const created = await createDocument(document)
      setDocuments((current) => [created, ...current.filter((item) => item.id !== created.id)])
      setFeedback({ type: 'success', message: 'Document saved successfully.' })
      return created
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save the document.' })
      return null
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Document Library"
        subtitle="Maintain SOP, Work Instruction, form, record, and policy references for audit preparation."
      />

      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <DocumentForm onCreate={handleCreate} saving={saving} feedback={feedback} />
        <DocumentRegister documents={documents} loading={loading} error={loadError} />
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
