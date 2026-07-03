import { useMemo, useState } from 'react'
import { BookOpen, FileText, LibraryBig, Search, ScrollText } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import {
  knowledgeGuides,
  sopReferenceCatalog,
} from '../data/evidenceManagementData.js'

export default function KnowledgeCenter() {
  const [query, setQuery] = useState('')

  const filteredReferences = useMemo(() => {
    if (!query.trim()) return sopReferenceCatalog

    return sopReferenceCatalog.filter((item) =>
      `${item.title} ${item.description} ${item.relatedStandards.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query])

  const filteredGuides = useMemo(() => {
    if (!query.trim()) return knowledgeGuides

    return knowledgeGuides.filter((item) =>
      `${item.title} ${item.description} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  }, [query])

  return (
    <div>
      <PageHeader
        title="Knowledge Center"
        subtitle="Find SOP reference areas, work instruction mapping, templates, and audit preparation guidance."
      />

      <div className="mb-6 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <Search size={17} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search knowledge references..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#0B1F3A]">Audit Preparation Guides</h2>
          <Badge tone="green">Sprint 3</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {filteredGuides.map((guide) => (
            <Card key={guide.id} className="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
                <BookOpen size={21} />
              </div>
              <Badge tone="slate" className="mt-4">{guide.category}</Badge>
              <h3 className="mt-4 text-base font-bold text-[#0B1F3A]">{guide.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#0B1F3A]">SOP Reference Map</h2>
          <Badge tone="blue">{filteredReferences.length} Reference Areas</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredReferences.map((reference) => (
            <Card key={reference.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#00A651]">
                  <ScrollText size={21} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">{reference.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{reference.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reference.relatedStandards.map((standard) => (
                      <Badge key={standard} tone="blue">{standard}</Badge>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-500">
                    Owner hint: {reference.ownerHint}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['SOP Reference Areas', ScrollText],
          ['Work Instruction Mapping', FileText],
          ['Reference Materials', LibraryBig],
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
