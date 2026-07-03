import { useMemo, useState } from 'react'
import { ArrowRight, BookOpenCheck, ChevronRight, FileText, Search } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import { isoStandards } from '../data/isoReadinessData.js'

const toneMap = {
  blue: 'bg-blue-50 text-[#005BAC]',
  green: 'bg-emerald-50 text-[#00A651]',
  orange: 'bg-orange-50 text-orange-700',
  purple: 'bg-violet-50 text-violet-700',
  cyan: 'bg-cyan-50 text-cyan-700',
}

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

function ClausePanel({ standard, query }) {
  const clauses = useMemo(() => {
    if (!query.trim()) return standard.clauses

    return standard.clauses.filter((clause) =>
      `${clause.clause} ${clause.title} ${clause.questions.map((item) => item.auditQuestion).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query, standard])

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
              {standard.code}
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#0B1F3A]">Clause Navigation</h2>
          </div>
          <Badge tone="blue">{clauses.length} Clauses</Badge>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {clauses.map((clause) => (
          <div key={clause.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#005BAC]">Clause {clause.clause}</p>
                <h3 className="mt-1 text-base font-bold text-[#0B1F3A]">{clause.title}</h3>
              </div>
              <Badge tone="slate">{clause.questions.length} Question</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {clause.questions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold leading-6 text-[#0B1F3A]">
                    {question.auditQuestion}
                  </p>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-bold text-slate-600">Required Evidence</p>
                      <p className="mt-1 leading-6 text-slate-600">{question.requiredEvidence}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-600">Reference SOP</p>
                      <p className="mt-1 leading-6 text-slate-600">{question.referenceSop}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function IsoLibrary() {
  const [selected, setSelected] = useState(isoStandards[0])
  const [query, setQuery] = useState('')

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

      <div className="mb-6 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <Search size={17} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clauses or audit questions..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {isoStandards.map((standard) => (
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
                Audit Question · Clause · Evidence · SOP · PIC · Status · Notes · Recommendation
              </p>
            </div>
          </div>
        </Card>

        <ClausePanel standard={selected} query={query} />
      </div>
    </div>
  )
}
