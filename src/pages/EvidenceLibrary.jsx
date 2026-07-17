import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ChevronDown,
  FileArchive,
  FileCheck2,
  Link2,
  Loader2,
  Plus,
  Search,
  UploadCloud,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import { evidenceStatuses, ownerFunctions } from '../data/evidenceManagementData.js'
import { getAllQuestions } from '../data/isoReadinessData.js'
import useAuditMasterQuestions from '../hooks/useAuditMasterQuestions.js'
import { getEvidenceItems, saveEvidenceItem } from '../services/evidenceService.js'
import { addApiEvidence, getApiEvidence, getApiEvidenceLibrary, isBackendApiConfigured } from '../services/workspaceApiService.js'

const isoStandards = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 37001', 'ISO 22301']

function optionValue(item) {
  return typeof item === 'string' ? item : item?.name || ''
}

function EvidenceForm({ onCreate, requirements, context }) {
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({
    evidenceTitle: '',
    requirementId: '',
    ownerFunction: 'Quality Management',
    status: 'Draft Prepared',
    notes: '',
    attachmentName: '',
    oneDriveLink: '',
  })

  const contextRequirementExists = requirements.some(
    (item) => (item.questionKey || item.id) === context.questionKey,
  )
  const effectiveRequirementId = form.requirementId || (
    contextRequirementExists ? context.questionKey : ''
  )
  const selectedRequirement = requirements.find(
    (item) => (item.questionKey || item.id) === effectiveRequirementId,
  )

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!selectedRequirement) return
    setSubmitError('')

    const standardCode = selectedRequirement.standardCodes.includes(context.iso)
      ? context.iso
      : selectedRequirement.standardCode || selectedRequirement.standardCodes[0] || ''

    const evidenceRecord = {
      id: `EV-${Date.now()}`,
      workspaceId: context.workspaceId,
      questionKey: selectedRequirement.questionKey || selectedRequirement.id,
      themeCode: selectedRequirement.themeCode || context.theme || '',
      standardCode,
      auditQuestion: selectedRequirement.auditQuestion,
      evidenceTitle: form.evidenceTitle,
      ownerFunction: form.ownerFunction,
      status: form.status,
      attachmentName: form.attachmentName,
      oneDriveLink: form.oneDriveLink,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    }
    let saved
    try {
      saved = isBackendApiConfigured
        ? await addApiEvidence(context.workspaceId, selectedRequirement, form)
        : saveEvidenceItem(evidenceRecord)
    } catch (error) {
      setSubmitError(error.message || 'Unable to save evidence.')
      return
    }
    onCreate(saved)
    setForm((current) => ({
      ...current,
      evidenceTitle: '',
      notes: '',
      attachmentName: '',
      oneDriveLink: '',
    }))
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#005BAC]">Question evidence</p>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Add evidence item</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {context.questionKey
              ? 'Adding evidence for selected audit question.'
              : 'Select a mapped audit requirement before adding question-specific evidence.'}
          </p>
        </div>
        <Badge tone="green">Evidence Preparation</Badge>
      </div>

      {context.questionKey ? (
        <div className="mx-6 mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
            {context.iso || 'ISO scope'} · {context.theme || 'Theme'} · {context.questionKey}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#0B1F3A]">
            {selectedRequirement?.auditQuestion || 'Loading selected audit question...'}
          </p>
        </div>
      ) : null}

      <form onSubmit={submit} className="grid gap-x-4 gap-y-5 p-6 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Evidence Title</span>
          <input
            value={form.evidenceTitle}
            onChange={(event) => updateField('evidenceTitle', event.target.value)}
            placeholder="Enter evidence title"
            required
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Mapped Audit Requirement</span>
          <select
            value={effectiveRequirementId}
            onChange={(event) => updateField('requirementId', event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Select audit requirement</option>
            {requirements.map((item) => (
              <option key={item.id} value={item.questionKey || item.id}>
                {item.standardCodes.join(', ') || 'ISO'} · {item.themeCode || 'Theme'} · {item.questionKey || item.id} — {item.auditQuestion}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Owner Function</span>
          <select value={form.ownerFunction} onChange={(event) => updateField('ownerFunction', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100">
            {ownerFunctions.map((item) => <option key={optionValue(item)} value={optionValue(item)}>{optionValue(item)}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Readiness Status</span>
          <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100">
            {evidenceStatuses.map((item) => <option key={optionValue(item)} value={optionValue(item)}>{optionValue(item)}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Attachment Name</span>
          <input value={form.attachmentName} onChange={(event) => updateField('attachmentName', event.target.value)} placeholder="Optional file name" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">OneDrive Evidence Link</span>
          <input type="url" pattern="https://.*" required={isBackendApiConfigured} title="Enter a secure URL starting with https://" value={form.oneDriveLink} onChange={(event) => updateField('oneDriveLink', event.target.value)} placeholder="Paste OneDrive evidence link" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
          {form.oneDriveLink && !form.oneDriveLink.startsWith('https://') ? <span className="mt-1 block text-xs font-semibold text-amber-700">Use a valid URL starting with https://</span> : null}
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Preparation Notes</span>
          <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Write evidence preparation notes" rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
        </label>

        <div className="lg:col-span-2">
          {submitError ? <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{submitError}</p> : null}
          <Button type="submit" className="w-full py-3"><Plus size={18} /> Add Evidence Item</Button>
        </div>
      </form>
    </Card>
  )
}

function groupEvidence(items) {
  return items.reduce((groups, item) => {
    const iso = item.standardCode || 'Unmapped ISO'
    const theme = item.themeCode || 'Unmapped Theme'
    const question = item.questionKey || 'Unmapped Question'
    groups[iso] ||= {}
    groups[iso][theme] ||= {}
    groups[iso][theme][question] ||= { auditQuestion: item.auditQuestion, items: [] }
    groups[iso][theme][question].items.push(item)
    return groups
  }, {})
}

function EvidenceRegister({ items, contextQuestionKey, contextWorkspaceId }) {
  const visibleItems = contextQuestionKey
    ? items.filter((item) =>
      item.questionKey === contextQuestionKey &&
      (!contextWorkspaceId || item.workspaceId === contextWorkspaceId),
    )
    : items
  const groups = useMemo(() => groupEvidence(visibleItems), [visibleItems])

  if (!visibleItems.length) {
    return (
      <Card>
        <EmptyState
          icon={FileArchive}
          title={contextQuestionKey ? 'No evidence has been linked to this audit question.' : 'No evidence item has been added.'}
          description="Evidence records appear here after they are mapped to a specific audit question."
          compact
        />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/70 p-5">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Evidence Register</h2>
        <p className="mt-1 text-sm text-slate-600">Grouped by ISO standard, theme code, and audit question.</p>
      </div>
      <div className="space-y-4 p-5">
        {Object.entries(groups).map(([iso, themes]) => (
          <details key={iso} open className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-[#0B1F3A] transition hover:bg-slate-100/70">
              <span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs text-[#005BAC]">ISO</span>{iso}</span><ChevronDown size={18} className="transition group-open:rotate-180" />
            </summary>
            <div className="space-y-4 border-t border-slate-200 p-4">
              {Object.entries(themes).map(([theme, questions]) => (
                <div key={theme}>
                  <Badge tone="blue">{theme}</Badge>
                  <div className="mt-3 space-y-3">
                    {Object.entries(questions).map(([questionKey, group]) => (
                      <div key={questionKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">{questionKey}</p>
                        <p className="mt-1 text-sm font-bold text-[#0B1F3A]">{group.auditQuestion}</p>
                        <div className="mt-4 space-y-3">
                          {group.items.map((item) => (
                            <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-bold text-[#0B1F3A]">{item.evidenceTitle}</p>
                                  <p className="mt-1 text-xs text-slate-500">{item.ownerFunction} · {item.attachmentName || 'No attachment name'}</p>
                                </div>
                                <Badge tone={item.status === 'Accepted' ? 'green' : item.status === 'Needs Revision' ? 'orange' : 'blue'}>{item.status}</Badge>
                              </div>
                              {item.notes ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.notes}</p> : null}
                              {item.oneDriveLink ? <a href={item.oneDriveLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#005BAC] hover:underline"><Link2 size={15} /> Open Evidence</a> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Card>
  )
}

function RequirementCatalog({ requirements, loading }) {
  const [query, setQuery] = useState('')
  const [isoFilter, setIsoFilter] = useState('all-iso')
  const filtered = useMemo(() => {
    const byIso = isoFilter === 'all-iso' ? requirements.filter((item) => item.standardCodes.length) : requirements.filter((item) => item.standardCodes.includes(isoFilter))
    if (!query.trim()) return byIso
    return byIso.filter((item) => `${item.questionKey} ${item.standardCodes.join(' ')} ${item.themeCode} ${item.systemDomain} ${item.auditQuestion} ${item.requiredEvidence} ${item.whatToVerify} ${item.referenceSop} ${item.applicableFunction}`.toLowerCase().includes(query.toLowerCase()))
  }, [isoFilter, query, requirements])

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-lg font-bold text-[#0B1F3A]">Evidence Requirement Catalog</h2><p className="mt-1 text-sm text-slate-600">Question-specific requirements derived from audit master data.</p></div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><Search size={17} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></div>
          <label><span className="sr-only">ISO Standard Filter</span><select value={isoFilter} onChange={(event) => setIsoFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><option value="all-iso">All ISO</option>{isoStandards.map((code) => <option key={code}>{code}</option>)}</select></label>
        </div>
      </div>
      <div className="max-h-[620px] overflow-y-auto nr-scrollbar">
        {loading ? <div className="flex items-center gap-3 p-6 text-slate-600" role="status"><Loader2 size={18} className="animate-spin" /><p className="text-sm font-semibold">Loading audit master data...</p></div> : null}
        {filtered.map((item) => <div key={item.id} className="border-b border-slate-100 p-5 last:border-b-0"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">{item.standardCodes.join(', ') || 'ISO scope'} · {item.themeCode || 'Theme'} · {item.questionKey}</p><p className="mt-1 text-sm font-semibold leading-6 text-[#0B1F3A]">{item.auditQuestion}</p></div><Badge tone="slate">{item.applicableFunction || 'All Functions'}</Badge></div><div className="mt-4 grid gap-4 text-sm lg:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-600">Required Evidence</p><p className="mt-1 leading-6 text-slate-600">{item.requiredEvidence}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-600">Reference / What to Verify</p><p className="mt-1 leading-6 text-slate-600">{item.referenceSop}</p></div></div></div>)}
        {!loading && !filtered.length ? <div className="p-8 text-center"><p className="text-sm font-bold text-[#0B1F3A]">No audit master questions found.</p></div> : null}
      </div>
    </Card>
  )
}

export default function EvidenceLibrary() {
  const searchParams = new URLSearchParams(window.location.search)
  const context = {
    workspaceId: searchParams.get('workspaceId') || '',
    questionKey: searchParams.get('questionKey') || '',
    iso: searchParams.get('iso') || '',
    theme: searchParams.get('theme') || '',
  }
  const fallbackQuestions = useMemo(() => getAllQuestions(), [])
  const { questions: requirements, loading, message, usingFallback } = useAuditMasterQuestions(fallbackQuestions)
  const [items, setItems] = useState(() => isBackendApiConfigured ? [] : getEvidenceItems())

  useEffect(() => {
    if (!isBackendApiConfigured) return
    const request = context.workspaceId && context.questionKey
      ? getApiEvidence(context.workspaceId, context.questionKey)
      : getApiEvidenceLibrary()
    request.then(setItems).catch(() => setItems([]))
  }, [context.questionKey, context.workspaceId])

  return (
    <div>
      <PageHeader title="Evidence Library" subtitle="Create and organize question-specific audit evidence pockets against ISO requirements." />
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-500 shadow-sm">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Evidence autosave enabled</span>
        <span>Question-specific mapping required</span>
        <span>OneDrive links supported</span>
      </div>
      {message ? <Card className={`mb-6 p-4 ${usingFallback ? 'border-amber-200 bg-amber-50' : ''}`}><div className="flex items-center gap-3 text-amber-800" role="status"><AlertCircle size={18} /><p className="text-sm font-semibold">{message}</p></div></Card> : null}
      <div className="grid items-start gap-6 xl:grid-cols-[500px_1fr]">
        <div className="xl:sticky xl:top-24"><EvidenceForm requirements={requirements} context={context} onCreate={(item) => setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)])} /></div>
        <EvidenceRegister items={items} contextQuestionKey={context.questionKey} contextWorkspaceId={context.workspaceId} />
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["Evidence Mapping", Link2], ["Document Readiness", FileCheck2], ["Evidence Upload Preparation", UploadCloud], ["Controlled Archive", Archive]].map(([label, Icon]) => <Card key={label} className="p-5"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#00A651]"><Icon size={21} /></div><p className="mt-4 text-sm font-semibold leading-5 text-slate-700">{label}</p></Card>)}
      </section>
      <div className="mt-6"><RequirementCatalog requirements={requirements} loading={loading} /></div>
    </div>
  )
}
