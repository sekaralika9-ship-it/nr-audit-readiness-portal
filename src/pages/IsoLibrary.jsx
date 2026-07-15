import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  ChevronRight,
  FileText,
  Loader2,
  Search,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import { getAllQuestions, isoStandards } from '../data/isoReadinessData.js'
import useAuditMasterQuestions from '../hooks/useAuditMasterQuestions.js'

const toneMap = {
  blue: 'bg-blue-50 text-[#005BAC]',
  green: 'bg-emerald-50 text-[#00A651]',
  orange: 'bg-orange-50 text-orange-700',
  purple: 'bg-violet-50 text-violet-700',
  cyan: 'bg-cyan-50 text-cyan-700',
}

const allIsoStandard = {
  id: 'all-iso',
  code: 'All ISO',
  title: 'All ISO Standards',
  shortTitle: 'Complete ISO Scope',
  description: 'Browse every audit master question mapped to at least one supported ISO standard.',
  tone: 'blue',
}

const libraryStandards = [allIsoStandard, ...isoStandards]

function StandardCard({ standard, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(standard)}
      className={[
        'rounded-2xl border bg-white p-5 text-left transition nr-card-shadow',
        active ? 'border-[#005BAC] ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-200',
      ].join(' ')}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneMap[standard.tone]}`}>
        <BookOpenCheck size={21} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#0B1F3A]">{standard.code}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-700">{standard.shortTitle}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{standard.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Badge tone="green">Configured</Badge>
        <ChevronRight size={18} className="text-slate-400" />
      </div>
    </button>
  )
}

function QuestionPanel({ standard, query, questions, loading, selectedTheme }) {
  const filteredQuestions = useMemo(() => {
    const related = standard.id === 'all-iso'
      ? questions.filter((question) => question.standardCodes.length > 0)
      : questions.filter((question) => question.standardCodes.includes(standard.code))
    const themed = selectedTheme === 'all-themes'
      ? related
      : related.filter((question) => question.themeCode === selectedTheme)
    if (!query.trim()) return themed

    const normalizedQuery = query.toLowerCase()
    return themed.filter((question) =>
      `${question.themeCode} ${question.systemDomain} ${question.objective} ${question.auditQuestion} ${question.requiredEvidence} ${question.whatToVerify} ${question.auditorGuideline} ${question.applicableFunction}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query, questions, selectedTheme, standard.code, standard.id])

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
              {standard.code}
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#0B1F3A]">Audit Question Library</h2>
          </div>
          <Badge tone="blue">{filteredQuestions.length} Questions</Badge>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
                  {[question.themeCode, question.systemDomain].filter(Boolean).join(' · ') || standard.code}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {question.standardCodes.map((code) => <Badge key={code} tone="green">{code}</Badge>)}
                </div>
                <h3 className="mt-2 text-base font-bold leading-6 text-[#0B1F3A]">
                  {question.auditQuestion}
                </h3>
              </div>
              <Badge tone="slate">{question.applicableFunction || 'All Functions'}</Badge>
            </div>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              {[
                ['Objective', question.objective],
                ['What to Verify', question.whatToVerify],
                ['Required Evidence', question.requiredEvidence],
                ['Auditor Guideline / Reference', question.auditorGuideline || question.referenceSop],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-600">{label}</p>
                  <p className="mt-1 leading-6 text-slate-600">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-3 p-6 text-slate-600" role="status">
            <Loader2 size={18} className="animate-spin" />
            <p className="text-sm font-semibold">Loading audit master data...</p>
          </div>
        ) : null}

        {!loading && filteredQuestions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-[#0B1F3A]">No audit master questions found.</p>
            <p className="mt-1 text-sm text-slate-500">Try another ISO standard or search term.</p>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export default function IsoLibrary() {
  const fallbackQuestions = useMemo(() => getAllQuestions(), [])
  const { questions, loading, message, usingFallback } = useAuditMasterQuestions(fallbackQuestions)
  const [selected, setSelected] = useState(allIsoStandard)
  const [query, setQuery] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('all-themes')
  const themeCodes = useMemo(
    () => Array.from(new Set(questions.map((question) => question.themeCode).filter(Boolean))).sort(),
    [questions],
  )

  return (
    <div>
      <PageHeader
        title="ISO Library"
        subtitle="Browse ISO readiness cards, clause navigation, audit questions, evidence requirements, SOP references, PIC guidance, notes, and recommendations."
        actions={
          <Button to="/audit-readiness">
            Open Audit Readiness
            <ArrowRight size={18} />
          </Button>
        }
      />

      {message ? (
        <Card className={`mb-6 p-4 ${usingFallback ? 'border-amber-200 bg-amber-50' : ''}`}>
          <div className="flex items-center gap-3 text-amber-800" role="status">
            <AlertCircle size={18} />
            <p className="text-sm font-semibold">{message}</p>
          </div>
        </Card>
      ) : null}

      <div className="mb-6 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <Search size={17} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clauses or audit questions..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {libraryStandards.map((standard) => (
          <StandardCard
            key={standard.id}
            standard={standard}
            active={selected.id === standard.id}
            onSelect={setSelected}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="p-6">
          <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${toneMap[selected.tone]}`}>
            <FileText size={26} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#0B1F3A]">{selected.code}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-700">{selected.title}</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{selected.description}</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Readiness Content</p>
              <p className="mt-1 text-sm font-semibold text-[#0B1F3A]">
                Themes · Audit Questions · Evidence · Guidance · Applicable Function
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Theme Code</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedTheme('all-themes')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedTheme === 'all-themes' ? 'bg-[#005BAC] text-white' : 'bg-slate-100 text-slate-600'}`}>All Themes</button>
                {themeCodes.map((code) => <button key={code} type="button" onClick={() => setSelectedTheme(code)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedTheme === code ? 'bg-[#005BAC] text-white' : 'bg-slate-100 text-slate-600'}`}>{code}</button>)}
              </div>
            </div>
          </div>
        </Card>

        <QuestionPanel
          standard={selected}
          query={query}
          questions={questions}
          loading={loading}
          selectedTheme={selectedTheme}
        />
      </div>
    </div>
  )
}
