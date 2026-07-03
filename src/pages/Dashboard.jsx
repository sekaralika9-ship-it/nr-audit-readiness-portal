import {
  Archive,
  ClipboardCheck,
  FileCheck2,
  FolderOpen,
  Library,
  Plus,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import MetricCard from '../components/ui/MetricCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { portalCapabilities, zeroMetrics } from '../data/portalData.js'
import { isoStandards } from '../data/isoReadinessData.js'

const metricIcons = [ClipboardCheck, FolderOpen, FileCheck2, ShieldCheck]
const capabilityIcons = [Library, ClipboardCheck, Archive, FolderOpen, ShieldCheck, Settings]

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Audit Readiness Dashboard"
        subtitle="Centralized workspace to prepare audit evidence, SOP references, ownership, and readiness status before an audit."
        actions={
          <Button to="/audit-readiness">
            <Plus size={18} />
            Create First Readiness Workspace
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {zeroMetrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            {...metric}
            icon={metricIcons[index]}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden">
          <EmptyState
            icon={ClipboardCheck}
            title="No audit readiness workspace has been created."
            description="Create the first workspace manually to start preparing audit scope, selected ISO standard, assigned function, required evidence, readiness status, and preparation progress."
            actionLabel="Create First Readiness Workspace"
            actionTo="/audit-readiness"
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3A]">Configured ISO Scope</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Sprint 2 includes ISO readiness cards and clause-based audit questions.
              </p>
            </div>
            <Badge tone="green">{isoStandards.length} Standards</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {isoStandards.map((standard) => (
              <div
                key={standard.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-[#0B1F3A]">{standard.code}</p>
                  <p className="text-xs text-slate-500">{standard.shortTitle}</p>
                </div>
                <Badge tone="blue">{standard.clauses.length} Clauses</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-[#0B1F3A]">
          What you can do with this portal
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {portalCapabilities.map((item, index) => {
            const Icon = capabilityIcons[index]

            return (
              <Card key={item.title} className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
                  <Icon size={21} />
                </div>
                <h3 className="mt-4 text-sm font-bold leading-5 text-[#0B1F3A]">
                  {item.title}
                </h3>
                <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <div className="mt-4">
                  <Badge tone={item.sprint.includes('Sprint 3') ? 'green' : item.sprint.includes('Sprint 4') ? 'purple' : 'blue'}>
                    {item.sprint}
                  </Badge>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
