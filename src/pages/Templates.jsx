import { useState } from 'react'
import { CheckCircle2, ClipboardList, FileText, Layers } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import { templateCatalog } from '../data/evidenceManagementData.js'

export default function Templates() {
  const [selected, setSelected] = useState(templateCatalog[0])

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Use structured template shells for evidence indexing, SOP mapping, interview preparation, and document readiness."
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          {templateCatalog.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelected(template)}
              className={[
                'w-full rounded-2xl border bg-white p-5 text-left transition nr-card-shadow',
                selected.id === template.id
                  ? 'border-[#005BAC] ring-4 ring-blue-100'
                  : 'border-slate-200 hover:border-blue-200',
              ].join(' ')}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
                  <FileText size={21} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0B1F3A]">{template.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{template.purpose}</p>
                  <div className="mt-3">
                    <Badge tone="green">{template.type}</Badge>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#005BAC]">
                  Template Detail
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#0B1F3A]">{selected.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {selected.purpose}
                </p>
              </div>
              <Badge tone="blue">Template Shell</Badge>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
            <div>
              <h3 className="text-base font-bold text-[#0B1F3A]">Template Sections</h3>
              <div className="mt-4 grid gap-3">
                {selected.sections.map((section) => (
                  <div
                    key={section}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <CheckCircle2 size={18} className="text-[#00A651]" />
                    <p className="text-sm font-semibold text-slate-700">{section}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#005BAC]">
                <ClipboardList size={23} />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#0B1F3A]">Recommended For</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.recommendedFor}</p>

              <div className="mt-6">
                <Button disabled className="w-full">
                  Use Template
                </Button>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Export, duplication, and document generation will be connected in later development.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['Evidence Template', FileText],
          ['SOP Mapping Template', Layers],
          ['Checklist Template', ClipboardList],
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
