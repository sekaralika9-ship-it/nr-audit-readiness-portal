import { useEffect, useMemo, useState } from 'react'
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
import { isoStandards } from '../data/isoReadinessData.js'
import { getEvidenceItems } from '../services/evidenceService.js'
import { getStoredWorkspaces, setActiveStoredWorkspace } from '../utils/portalStorage.js'
import { getApiEvidenceLibrary, getApiWorkspaces, isBackendApiConfigured } from '../services/workspaceApiService.js'

const metricIcons = [ClipboardCheck, FolderOpen, FileCheck2, ShieldCheck]

const capabilityCards = [
  {
    title: 'ISO Readiness Library',
    description: 'Access ISO clauses, practical audit questions, and preparation references.',
    path: '/iso-library',
    icon: Library,
    tone: 'blue',
  },
  {
    title: 'Audit Preparation Checklist',
    description: 'Create readiness workspace and work through ISO checklist questions.',
    path: '/audit-readiness',
    icon: ClipboardCheck,
    tone: 'blue',
  },
  {
    title: 'Evidence Management',
    description: 'Upload, organize, and track evidence required for audit readiness.',
    path: '/evidence-library',
    icon: Archive,
    tone: 'green',
  },
  {
    title: 'SOP & Knowledge Center',
    description: 'Find SOPs, work instructions, templates, and audit references.',
    path: '/knowledge-center',
    icon: FolderOpen,
    tone: 'green',
  },
  {
    title: 'Executive Reports',
    description: 'Monitor readiness score, heatmaps, trends, and export reports.',
    path: '/reports',
    icon: ShieldCheck,
    tone: 'purple',
  },
  {
    title: 'System Configuration',
    description: 'Configure functions, roles, standards, and system preferences.',
    path: '/settings',
    icon: Settings,
    tone: 'purple',
  },
]

function toneIcon(tone) {
  if (tone === 'green') return 'bg-emerald-50 text-[#00A651]'
  if (tone === 'purple') return 'bg-violet-50 text-violet-700'
  return 'bg-blue-50 text-[#005BAC]'
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState(() => isBackendApiConfigured ? [] : getStoredWorkspaces())
  const [evidenceItems, setEvidenceItems] = useState(() => isBackendApiConfigured ? [] : getEvidenceItems())

  useEffect(() => {
    if (isBackendApiConfigured) {
      Promise.all([getApiWorkspaces(), getApiEvidenceLibrary()])
        .then(([savedWorkspaces, savedEvidence]) => {
          setWorkspaces(savedWorkspaces)
          setEvidenceItems(savedEvidence)
        })
        .catch(() => {
          setWorkspaces([])
          setEvidenceItems([])
        })
      return undefined
    }
    const refreshWorkspaces = () => setWorkspaces(getStoredWorkspaces())
    const refreshEvidence = () => setEvidenceItems(getEvidenceItems())
    window.addEventListener('nr-workspaces-updated', refreshWorkspaces)
    window.addEventListener('nr-evidence-updated', refreshEvidence)
    window.addEventListener('focus', refreshWorkspaces)
    window.addEventListener('focus', refreshEvidence)
    return () => {
      window.removeEventListener('nr-workspaces-updated', refreshWorkspaces)
      window.removeEventListener('nr-evidence-updated', refreshEvidence)
      window.removeEventListener('focus', refreshWorkspaces)
      window.removeEventListener('focus', refreshEvidence)
    }
  }, [])

  const metrics = useMemo(() => {
    const openActions = workspaces.reduce((total, workspace) => {
      const states = workspace.questionStates || workspace.questionUpdates || {}
      return total + Object.values(states).filter((item) =>
        item.status === 'In Progress' || item.status === 'Needs Review',
      ).length
    }, 0)
    return [
      { label: 'Active Audits', value: workspaces.length, description: workspaces.length ? 'Saved audit preparation workspaces.' : 'No audit has been created.', tone: 'blue' },
      { label: 'Readiness Workspaces', value: workspaces.length, description: workspaces.length ? 'Available for review and presentation.' : 'No workspace has been configured.', tone: 'green' },
      { label: 'Evidence Items', value: evidenceItems.length, description: evidenceItems.length ? 'Evidence records linked to audit questions.' : 'No evidence has been uploaded.', tone: 'blue' },
      { label: 'Open Actions', value: openActions, description: openActions ? 'Questions in progress or needing review.' : 'No readiness action has been assigned.', tone: 'orange' },
    ]
  }, [evidenceItems.length, workspaces])

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
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            {...metric}
            icon={metricIcons[index]}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden">
          {workspaces.length ? (
            <div>
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-bold text-[#0B1F3A]">Saved readiness workspaces</h2>
                <p className="mt-1 text-sm text-slate-600">Open a workspace to continue preparation or present its current status.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {workspaces.slice(0, 5).map((workspace) => (
                  <Link
                    key={workspace.id}
                    to="/audit-readiness"
                    state={{ workspaceId: workspace.id }}
                    onClick={() => { if (!isBackendApiConfigured) setActiveStoredWorkspace(workspace.id) }}
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0B1F3A]">{workspace.name || 'Untitled Workspace'}</p>
                      <p className="mt-1 text-xs text-slate-500">{workspace.isoCode || 'ISO scope'} · {workspace.functionName || 'Auditee not selected'}</p>
                    </div>
                    <Badge tone="orange">{workspace.status || 'Draft Preparation'}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="No audit readiness workspace has been created."
              description="Create the first workspace manually to start preparing audit scope, selected ISO standard, assigned function, required evidence, readiness status, and preparation progress."
              actionLabel="Create First Readiness Workspace"
              actionTo="/audit-readiness"
            />
          )}
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

                <div className="mt-4 flex items-center justify-end">
                  <ArrowRight
                    size={18}
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
