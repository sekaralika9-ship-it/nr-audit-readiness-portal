import { Link } from 'react-router-dom'
import {
  Archive,
  ArrowRight,
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

const capabilityCards = [
  {
    title: 'ISO Readiness Library',
    description: 'Access ISO clauses, practical audit questions, and preparation references.',
    sprint: 'Sprint 2',
    path: '/iso-library',
    icon: Library,
    tone: 'blue',
  },
  {
    title: 'Audit Preparation Checklist',
    description: 'Create readiness workspace and work through ISO checklist questions.',
    sprint: 'Sprint 2',
    path: '/audit-readiness',
    icon: ClipboardCheck,
    tone: 'blue',
  },
  {
    title: 'Evidence Management',
    description: 'Upload, organize, and track evidence required for audit readiness.',
    sprint: 'Sprint 3',
    path: '/evidence-library',
    icon: Archive,
    tone: 'green',
  },
  {
    title: 'SOP & Knowledge Center',
    description: 'Find SOPs, work instructions, templates, and audit references.',
    sprint: 'Sprint 3',
    path: '/knowledge-center',
    icon: FolderOpen,
    tone: 'green',
  },
  {
    title: 'Executive Reports',
    description: 'Monitor readiness score, heatmaps, trends, and export reports.',
    sprint: 'Sprint 4',
    path: '/reports',
    icon: ShieldCheck,
    tone: 'purple',
  },
  {
    title: 'System Configuration',
    description: 'Configure functions, roles, standards, and system preferences.',
    sprint: 'Sprint 4',
    path: '/settings',
    icon: Settings,
    tone: 'purple',
  },
]

function toneBadge(tone) {
  if (tone === 'green') return 'green'
  if (tone === 'purple') return 'purple'
  return 'blue'
}

function toneIcon(tone) {
  if (tone === 'green') return 'bg-emerald-50 text-[#00A651]'
  if (tone === 'purple') return 'bg-violet-50 text-violet-700'
  return 'bg-blue-50 text-[#005BAC]'
}

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
                Click an ISO standard to open the clause library.
              </p>
            </div>
            <Badge tone="green">{isoStandards.length} Standards</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {isoStandards.map((standard) => (
              <Link
                key={standard.id}
                to="/iso-library"
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-[#005BAC] hover:bg-blue-50"
              >
                <div>
                  <p className="text-sm font-bold text-[#0B1F3A]">{standard.code}</p>
                  <p className="text-xs text-slate-500">{standard.shortTitle}</p>
                </div>
                <Badge tone="blue">{standard.clauses.length} Clauses</Badge>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-[#0B1F3A]">
          What you can do with this portal
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {capabilityCards.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.title}
                to={item.path}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition nr-card-shadow hover:-translate-y-0.5 hover:border-[#005BAC] hover:shadow-xl"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneIcon(item.tone)}`}>
                  <Icon size={21} />
                </div>

                <h3 className="mt-4 text-sm font-bold leading-5 text-[#0B1F3A]">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Badge tone={toneBadge(item.tone)}>
                    Available in {item.sprint}
                  </Badge>
                  <ArrowRight
                    size={17}
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#005BAC]"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
