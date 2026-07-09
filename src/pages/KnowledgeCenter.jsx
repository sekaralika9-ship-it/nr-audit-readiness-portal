import { useMemo, useState } from 'react'
import {
  BookOpen,
  FileText,
  LibraryBig,
  Search,
  ScrollText,
} from 'lucide-react'

import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'

import {
  knowledgeGuides,
  sopReferenceCatalog,
} from '../data/evidenceManagementData.js'

const tabs = [
  {
    id: 'guides',
    label: 'Audit Preparation Guides',
    description: 'Practical guidance for audit preparation and evidence readiness.',
  },
  {
    id: 'sop',
    label: 'SOP Reference Map',
    description: 'Mapping of SOP reference areas and related audit standards.',
  },
  {
    id: 'themes',
    label: 'Theme Library',
    description: 'Master audit themes from audit_master_themes.',
  },
  {
    id: 'questions',
    label: 'Question Library',
    description: 'Master audit questions from audit_master_questions.',
  },
  {
    id: 'iso',
    label: 'ISO Coverage Matrix',
    description: 'ISO clause coverage from audit_master_iso_coverage.',
  },
  {
    id: 'methodology',
    label: 'Methodology',
    description: 'Audit methodology steps from audit_master_methodology_steps.',
  },
  {
    id: 'principles',
    label: 'Principles',
    description: 'Audit principles from audit_master_principles.',
  },
]

function EmptyPanel({ title, description }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <LibraryBig size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Supabase data connection placeholder
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              This section is ready for real audit master data integration.
              The next step is connecting it through src/services/auditMasterService.js.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function KnowledgeCenter() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('guides')

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  const filteredReferences = useMemo(() => {
    if (!query.trim()) return sopReferenceCatalog || []

    return (sopReferenceCatalog || []).filter((item) =>
      `${item.title || ''} ${item.description || ''} ${(item.relatedStandards || []).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query])

  const filteredGuides = useMemo(() => {
    if (!query.trim()) return knowledgeGuides || []

    return (knowledgeGuides || []).filter((item) =>
      `${item.title || ''} ${item.description || ''} ${item.category || ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Center"
        subtitle="Find SOP reference areas, work instruction mapping, templates, and audit preparation guidance."
      />

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1F3A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3A]">
              {activeTabMeta.label}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {activeTabMeta.description}
            </p>
          </div>

          {(activeTab === 'guides' || activeTab === 'sop') && (
            <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search size={17} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search knowledge center..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          )}
        </div>
      </Card>

      {activeTab === 'guides' && (
        <section className="grid gap-5 lg:grid-cols-3">
          {filteredGuides.map((guide) => (
            <Card key={guide.id || guide.title} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <BookOpen size={22} />
                </div>
                <Badge tone="blue">{guide.category || 'Guide'}</Badge>
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#0B1F3A]">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {guide.description}
              </p>
            </Card>
          ))}

          {filteredGuides.length === 0 && (
            <Card className="p-6 lg:col-span-3">
              <p className="text-sm font-semibold text-slate-700">
                No guides found.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another keyword.
              </p>
            </Card>
          )}
        </section>
      )}

      {activeTab === 'sop' && (
        <section className="grid gap-5 lg:grid-cols-2">
          {filteredReferences.map((reference) => (
            <Card key={reference.id || reference.title} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <ScrollText size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#0B1F3A]">
                    {reference.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {reference.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(reference.relatedStandards || []).map((standard) => (
                      <Badge key={standard} tone="green">
                        {standard}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredReferences.length === 0 && (
            <Card className="p-6 lg:col-span-2">
              <p className="text-sm font-semibold text-slate-700">
                No SOP reference found.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another keyword.
              </p>
            </Card>
          )}
        </section>
      )}

      {activeTab === 'themes' && (
        <EmptyPanel
          title="Theme Library"
          description="This section will display theme_id, audit_theme, audit_objective, primary_focus, applicable_function, and related_iso_standards from audit_master_themes."
        />
      )}

      {activeTab === 'questions' && (
        <EmptyPanel
          title="Question Library"
          description="This section will display audit questions, evidence requirements, KPI review, risk review, ISO coverage, auditor guideline, evidence indicator, category, auditee, and remarks from audit_master_questions."
        />
      )}

      {activeTab === 'iso' && (
        <EmptyPanel
          title="ISO Coverage Matrix"
          description="This section will display clause, ISO 9001, ISO 14001, ISO 45001, ISO 37001, ISO 22301, and status from audit_master_iso_coverage."
        />
      )}

      {activeTab === 'methodology' && (
        <EmptyPanel
          title="Audit Methodology"
          description="This section will display step_order, stage, activity, PIC, and output from audit_master_methodology_steps."
        />
      )}

      {activeTab === 'principles' && (
        <EmptyPanel
          title="Audit Principles"
          description="This section will display principle and description from audit_master_principles."
        />
      )}
    </div>
  )
}