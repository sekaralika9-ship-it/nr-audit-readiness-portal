import { useState } from 'react'
import {
  Building2,
  Database,
  KeyRound,
  Plus,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import {
  documentTypes,
  ownerFunctions,
  supportedStandardsForDocuments,
} from '../data/evidenceManagementData.js'

function ConfigCard({ title, description, icon: Icon, children }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
          <Icon size={23} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  )
}

function TagList({ items, tone = 'slate' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={typeof item === 'string' ? item : item.code} tone={tone}>
          {typeof item === 'string' ? item : item.code}
        </Badge>
      ))}
    </div>
  )
}

function ManualConfigForm({ onCreate }) {
  const [form, setForm] = useState({
    name: '',
    category: 'Function',
  })

  function submit(event) {
    event.preventDefault()

    onCreate({
      id: `CFG-${Date.now()}`,
      ...form,
    })

    setForm({
      name: '',
      category: 'Function',
    })
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Manual configuration entry</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Add configuration entries manually for presentation. This remains UI-only and does not connect to backend storage.
          </p>
        </div>
        <Badge tone="green">Sprint 4</Badge>
      </div>

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Configuration Name</span>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
            placeholder="Enter configuration name"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Category</span>
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Function</option>
            <option>Role</option>
            <option>Document Type</option>
            <option>Readiness Status</option>
            <option>Workflow</option>
          </select>
        </label>

        <div className="flex items-end">
          <Button type="submit">
            <Plus size={18} />
            Add
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ManualRegister({ items }) {
  if (!items.length) {
    return (
      <Card>
        <EmptyState
          icon={SettingsIcon}
          title="No manual configuration has been added."
          description="Configuration records will appear here after the presenter manually adds the first configuration entry."
          compact
        />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Configuration Register</h2>
        <p className="mt-1 text-sm text-slate-600">
          UI-only configuration records added during presentation.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="font-bold text-[#0B1F3A]">{item.name}</p>
              <p className="mt-1 text-sm text-slate-500">{item.category}</p>
            </div>
            <Badge tone="blue">Manual</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function Settings() {
  const [manualItems, setManualItems] = useState([])

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure system preferences, master data, readiness categories, and governance structure."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <ManualConfigForm
            onCreate={(item) => setManualItems((current) => [item, ...current])}
          />

          <ManualRegister items={manualItems} />
        </div>

        <div className="space-y-6">
          <ConfigCard
            title="Function Master"
            description="Supported function structure for audit readiness ownership."
            icon={Building2}
          >
            <TagList items={ownerFunctions} tone="blue" />
          </ConfigCard>

          <ConfigCard
            title="ISO Standards"
            description="Configured audit scopes available in the readiness portal."
            icon={ShieldCheck}
          >
            <TagList items={supportedStandardsForDocuments} tone="green" />
          </ConfigCard>

          <ConfigCard
            title="Document Types"
            description="Document categories used in evidence and document library."
            icon={Database}
          >
            <TagList items={documentTypes} tone="slate" />
          </ConfigCard>
        </div>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['User Roles & Access', Users],
          ['Workflow Governance', KeyRound],
          ['System Preferences', SettingsIcon],
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
