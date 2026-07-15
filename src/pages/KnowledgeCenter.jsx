import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Database,
  LibraryBig,
  Loader2,
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

import {
  getAuditThemes,
  getAuditQuestions,
  getIsoCoverage,
  getAuditMethodology,
  getAuditPrinciples,
  normalizeAuditQuestion,
} from '../services/auditMasterService.js'

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

const isoFields = [
  { key: 'iso_9001', label: 'ISO 9001' },
  { key: 'iso_14001', label: 'ISO 14001' },
  { key: 'iso_45001', label: 'ISO 45001' },
  { key: 'iso_37001', label: 'ISO 37001' },
  { key: 'iso_22301', label: 'ISO 22301' },
]

function valueText(value) {
  if (Array.isArray(value)) return value.map(valueText).join(', ')
  if (value === true) return 'Yes'
  if (value === false || value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${valueText(item)}`)
      .join(', ')
  }
  return String(value)
}

function isCovered(value) {
  if (value === true) return true
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['yes', 'y', 'true', 'covered', 'applicable', 'x', '1', '✓'].includes(normalized)
  }
  return false
}

function LoadingState({ label = 'Loading data...' }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 size={18} className="animate-spin" />
        <p className="text-sm font-semibold">{label}</p>
      </div>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="border-red-100 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="mt-0.5 text-red-600" />
        <div>
          <p className="text-sm font-bold text-red-700">Audit master data unavailable</p>
          <p className="mt-1 text-sm leading-6 text-red-600">{message}</p>
        </div>
      </div>
    </Card>
  )
}

function EmptyStateCard({ title, description }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <LibraryBig size={22} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#0B1F3A]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </Card>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{valueText(value)}</p>
    </div>
  )
}

function SelectFilter({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'all-iso'
              ? 'All ISO'
              : isoFields.find((iso) => iso.key === option)?.label || option}
          </option>
        ))}
      </select>
    </label>
  )
}

function uniqueOptions(items, key) {
  return Array.from(
    new Set(
      (items || [])
        .map((item) => item?.[key])
        .filter(Boolean)
        .map((item) => String(item)),
    ),
  ).sort()
}

export default function KnowledgeCenter() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('guides')

  const [themes, setThemes] = useState([])
  const [questions, setQuestions] = useState([])
  const [isoCoverage, setIsoCoverage] = useState([])
  const [methodology, setMethodology] = useState([])
  const [principles, setPrinciples] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [questionFilters, setQuestionFilters] = useState({
    theme_code: '',
    system_domain: '',
    question_category: '',
    applicable_function: '',
    applicable_auditee: '',
    iso: '',
  })

  useEffect(() => {
    async function loadAuditMasterData() {
      try {
        setLoading(true)
        setError('')

        const [
          themeRows,
          questionRows,
          isoRows,
          methodologyRows,
          principleRows,
        ] = await Promise.all([
          getAuditThemes(),
          getAuditQuestions(),
          getIsoCoverage(),
          getAuditMethodology(),
          getAuditPrinciples(),
        ])

        setThemes(themeRows)
        setQuestions(questionRows)
        setIsoCoverage(isoRows)
        setMethodology(methodologyRows)
        setPrinciples(principleRows)
      } catch (loadError) {
        console.error('Unable to load Knowledge Center master data:', loadError)
        setError('Unable to load audit master data.')
      } finally {
        setLoading(false)
      }
    }

    loadAuditMasterData()
  }, [])

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  const normalizedQuestions = useMemo(
    () => questions.map(normalizeAuditQuestion),
    [questions],
  )

  const supabaseReferences = useMemo(
    () =>
      normalizedQuestions
        .filter((question) => question.referenceSop || question.whatToVerify)
        .map((question) => ({
          id: question.id,
          title:
            question.referenceSop ||
            `${question.systemDomain || question.themeCode || 'Audit'} reference guidance`,
          description:
            question.whatToVerify || question.requiredEvidence || question.auditorGuideline,
          relatedStandards: question.standardCodes,
          ownerHint: question.applicableFunction || question.pic,
          searchText: `${question.auditQuestion} ${question.objective} ${question.riskReview} ${question.kpiReview}`,
        })),
    [normalizedQuestions],
  )

  const supabaseGuides = useMemo(
    () =>
      normalizedQuestions.map((question) => ({
        id: question.id,
        title: question.auditQuestion,
        description: [
          question.whatToVerify,
          question.requiredEvidence
            ? `Prepare evidence: ${question.requiredEvidence}`
            : '',
          question.auditorGuideline,
        ]
          .filter(Boolean)
          .join(' '),
        category: question.systemDomain || question.themeCode || 'Audit Preparation',
        searchText: `${question.standardCodes.join(' ')} ${question.applicableFunction} ${question.riskReview} ${question.kpiReview}`,
      })),
    [normalizedQuestions],
  )

  const guideSource = useMemo(
    () => (supabaseGuides.length ? supabaseGuides : knowledgeGuides || []),
    [supabaseGuides],
  )
  const referenceSource = useMemo(
    () => (supabaseReferences.length ? supabaseReferences : sopReferenceCatalog || []),
    [supabaseReferences],
  )

  const filteredReferences = useMemo(() => {
    if (!query.trim()) return referenceSource

    return referenceSource.filter((item) =>
      `${item.title || ''} ${item.description || ''} ${(item.relatedStandards || []).join(' ')} ${item.ownerHint || ''} ${item.searchText || ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query, referenceSource])

  const filteredGuides = useMemo(() => {
    if (!query.trim()) return guideSource

    return guideSource.filter((item) =>
      `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.searchText || ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [guideSource, query])

  const filteredQuestions = useMemo(() => {
    return (questions || []).filter((question) => {
      const matchesTheme =
        !questionFilters.theme_code || question.theme_code === questionFilters.theme_code

      const matchesDomain =
        !questionFilters.system_domain || question.system_domain === questionFilters.system_domain

      const matchesCategory =
        !questionFilters.question_category ||
        question.question_category === questionFilters.question_category

      const matchesFunction =
        !questionFilters.applicable_function ||
        question.applicable_function === questionFilters.applicable_function

      const matchesAuditee =
        !questionFilters.applicable_auditee ||
        question.applicable_auditee === questionFilters.applicable_auditee

      const matchesIso =
        !questionFilters.iso ||
        (questionFilters.iso === 'all-iso'
          ? isoFields.some((iso) => isCovered(question[iso.key]))
          : isCovered(question[questionFilters.iso]))

      const matchesSearch =
        !query.trim() ||
        `${question.question_key || ''} ${question.theme_code || ''} ${question.system_domain || ''} ${question.objective || ''} ${question.applicable_function || ''} ${question.audit_question || ''} ${question.what_to_verify || ''} ${question.evidence || ''} ${question.auditor_guideline || ''} ${isoFields.filter((iso) => isCovered(question[iso.key])).map((iso) => iso.label).join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase())

      return (
        matchesTheme &&
        matchesDomain &&
        matchesCategory &&
        matchesFunction &&
        matchesAuditee &&
        matchesIso &&
        matchesSearch
      )
    })
  }, [questions, questionFilters, query])

  function setFilter(key, value) {
    setQuestionFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function openThemeQuestions(themeCode) {
    setQuestionFilters((current) => ({ ...current, theme_code: themeCode }))
    setQuery('')
    setActiveTab('questions')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Center"
        subtitle="Find SOP reference areas, work instruction mapping, templates, audit preparation guidance, and audit master database."
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

          {(activeTab === 'guides' ||
            activeTab === 'sop' ||
            activeTab === 'questions') && (
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

      {loading && !['guides', 'sop'].includes(activeTab) && (
        <LoadingState label="Loading audit master data from Supabase..." />
      )}

      {error && !['guides', 'sop'].includes(activeTab) && (
        <ErrorState message={error} />
      )}

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
          {filteredGuides.length === 0 ? (
            <EmptyStateCard
              title="No preparation guides found"
              description="No audit master guidance matched the current search."
            />
          ) : null}
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
                    {reference.ownerHint ? (
                      <Badge tone="blue">Owner: {reference.ownerHint}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filteredReferences.length === 0 ? (
            <EmptyStateCard
              title="No SOP references found"
              description="No audit master reference matched the current search."
            />
          ) : null}
        </section>
      )}

      {activeTab === 'themes' && !loading && !error && (
        <section className="grid gap-5 lg:grid-cols-2">
          {themes.map((theme) => (
            <Card key={theme.theme_id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <button type="button" onClick={() => openThemeQuestions(theme.theme_id)} aria-label={`Show questions for ${theme.theme_id}`}>
                    <Badge tone="blue">{theme.theme_id}</Badge>
                  </button>
                  <h2 className="mt-3 text-lg font-bold text-[#0B1F3A]">
                    {theme.audit_theme}
                  </h2>
                </div>
                <Database size={22} className="text-slate-400" />
              </div>

              <div className="mt-5 grid gap-4">
                <Field label="Audit Objective" value={theme.audit_objective} />
                <Field label="Primary Focus" value={theme.primary_focus} />
                <Field label="Applicable Function" value={theme.applicable_function} />
                <Field label="Related ISO Standards" value={theme.related_iso_standards} />
              </div>
            </Card>
          ))}

          {themes.length === 0 && (
            <EmptyStateCard
              title="No audit themes found"
              description="No rows were returned from audit_master_themes."
            />
          )}
        </section>
      )}

      {activeTab === 'questions' && !loading && !error && (
        <section className="space-y-5">
          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <SelectFilter
                label="Theme"
                value={questionFilters.theme_code}
                onChange={(value) => setFilter('theme_code', value)}
                options={uniqueOptions(questions, 'theme_code')}
              />
              <SelectFilter
                label="Domain"
                value={questionFilters.system_domain}
                onChange={(value) => setFilter('system_domain', value)}
                options={uniqueOptions(questions, 'system_domain')}
              />
              <SelectFilter
                label="Category"
                value={questionFilters.question_category}
                onChange={(value) => setFilter('question_category', value)}
                options={uniqueOptions(questions, 'question_category')}
              />
              <SelectFilter
                label="Function"
                value={questionFilters.applicable_function}
                onChange={(value) => setFilter('applicable_function', value)}
                options={uniqueOptions(questions, 'applicable_function')}
              />
              <SelectFilter
                label="Auditee"
                value={questionFilters.applicable_auditee}
                onChange={(value) => setFilter('applicable_auditee', value)}
                options={uniqueOptions(questions, 'applicable_auditee')}
              />
              <SelectFilter
                label="ISO Coverage"
                value={questionFilters.iso}
                onChange={(value) => setFilter('iso', value)}
                options={['all-iso', ...isoFields.map((iso) => iso.key)]}
              />
            </div>
          </Card>

          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card key={question.question_key} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{question.question_key}</Badge>
                      <Badge tone="slate">{question.theme_code}</Badge>
                      <Badge tone="green">{question.question_category || 'Uncategorized'}</Badge>
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-[#0B1F3A]">
                      {question.audit_question}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {question.what_to_verify}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isoFields.map((iso) =>
                      isCovered(question[iso.key]) ? (
                        <Badge key={iso.key} tone="green">
                          {iso.label}
                        </Badge>
                      ) : null,
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="System Domain" value={question.system_domain} />
                  <Field label="Objective" value={question.objective} />
                  <Field label="Applicable Function" value={question.applicable_function} />
                  <Field label="Applicable Auditee" value={question.applicable_auditee} />
                  <Field label="Evidence" value={question.evidence} />
                  <Field label="KPI Review" value={question.kpi_review} />
                  <Field label="Risk Review" value={question.risk_review} />
                  <Field label="Auditor Guideline" value={question.auditor_guideline} />
                  <Field label="Evidence Indicator" value={question.evidence_indicator} />
                  <Field label="Remarks" value={question.remarks} />
                </div>
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-[#005BAC]">
                  Evidence for this requirement should be added inside the audit question&apos;s Evidence Pocket.
                </div>
              </Card>
            ))}

            {filteredQuestions.length === 0 && (
              <EmptyStateCard
                title="No audit questions found"
                description="No rows matched the selected filters from audit_master_questions."
              />
            )}
          </div>
        </section>
      )}

      {activeTab === 'iso' && !loading && !error && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Clause', 'ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 37001', 'ISO 22301', 'Status'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isoCoverage.map((row) => (
                  <tr key={`${row.clause}-${row.status}`}>
                    <td className="px-4 py-3 font-semibold text-[#0B1F3A]">{valueText(row.clause)}</td>
                    <td className="px-4 py-3">{valueText(row.iso_9001)}</td>
                    <td className="px-4 py-3">{valueText(row.iso_14001)}</td>
                    <td className="px-4 py-3">{valueText(row.iso_45001)}</td>
                    <td className="px-4 py-3">{valueText(row.iso_37001)}</td>
                    <td className="px-4 py-3">{valueText(row.iso_22301)}</td>
                    <td className="px-4 py-3"><Badge tone="blue">{valueText(row.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isoCoverage.length === 0 && (
            <div className="p-6">
              <EmptyStateCard
                title="No ISO coverage found"
                description="No rows were returned from audit_master_iso_coverage."
              />
            </div>
          )}
        </Card>
      )}

      {activeTab === 'methodology' && !loading && !error && (
        <section className="space-y-4">
          {methodology.map((step) => (
            <Card key={`${step.step_order}-${step.stage}`} className="p-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-bold text-white">
                  {step.step_order}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0B1F3A]">{step.stage}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.activity}</p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="PIC" value={step.pic} />
                    <Field label="Output" value={step.output} />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {methodology.length === 0 && (
            <EmptyStateCard
              title="No methodology steps found"
              description="No rows were returned from audit_master_methodology_steps."
            />
          )}
        </section>
      )}

      {activeTab === 'principles' && !loading && !error && (
        <section className="grid gap-5 lg:grid-cols-2">
          {principles.map((principle) => (
            <Card key={principle.principle} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0B1F3A]">
                    {principle.principle}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {principle.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {principles.length === 0 && (
            <EmptyStateCard
              title="No audit principles found"
              description="No rows were returned from audit_master_principles."
            />
          )}
        </section>
      )}
    </div>
  )
}
