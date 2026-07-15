import { useMemo, useState } from 'react'
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Gauge,
  Map,
  Plus,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import { getReportRecords, saveReportRecord } from '../services/reportService.js'
import {
  buildCsv,
  calculateExecutiveSummary,
  getReadinessLevel,
  groupByFunction,
  groupByStandard,
  reportAuditees,
  reportIsoStandards,
} from '../data/executiveDashboardData.js'
function getOptionLabel(option) {
  if (typeof option === 'string') return option
  if (!option) return 'Unknown'
  return option.label || option.name || option.title || option.category || 'Unknown'
}

function getOptionValue(option) {
  if (typeof option === 'string') return option
  if (!option) return ''
  return option.id || option.name || option.title || option.label || option.category || ''
}

  function ReportForm({ onCreate }) {
  const [form, setForm] = useState({
    reportName: '',
    auditeeCode: getOptionValue(reportAuditees[0]) || 'A01',
    standardId: getOptionValue(reportIsoStandards[0]) || 'ISO 9001',
    score: 0,
    openActions: 0,
    evidenceGaps: 0,
    okCount: 0,
    ofiCount: 0,
    minorCount: 0,
    majorCount: 0,
    notes: '',
  })

  const selectedStandard = reportIsoStandards.find(
    (standard) => getOptionValue(standard) === form.standardId,
  )
  const selectedAuditee = reportAuditees.find(
    (auditee) => getOptionValue(auditee) === form.auditeeCode,
  )

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()

    onCreate({
      id: `RPT-${Date.now()}`,
      ...form,
      auditeeCode: selectedAuditee?.code || form.auditeeCode,
      auditeeName: selectedAuditee?.name || '',
      functionName: selectedAuditee?.name || '',
      standardCode:
        typeof selectedStandard === 'string'
          ? selectedStandard
          : selectedStandard?.code || selectedStandard?.name || '',
      score: Number(form.score),
      openActions: Number(form.openActions),
      evidenceGaps: Number(form.evidenceGaps),
      okCount: Number(form.okCount),
      ofiCount: Number(form.ofiCount),
      minorCount: Number(form.minorCount),
      majorCount: Number(form.majorCount),
      createdAt: new Date().toISOString(),
    })

    setForm((current) => ({
      ...current,
      reportName: '',
      score: 0,
      openActions: 0,
      evidenceGaps: 0,
      okCount: 0,
      ofiCount: 0,
      minorCount: 0,
      majorCount: 0,
      notes: '',
    }))
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">
            Add readiness report record
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Add real presentation data manually. Executive charts will only appear after records are entered.
          </p>
        </div>
        <Badge tone="green">Executive Readiness</Badge>
      </div>

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Report Name</span>
          <input
            value={form.reportName}
            onChange={(event) => updateField('reportName', event.target.value)}
            required
            placeholder="Enter report name"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
  <span className="text-sm font-semibold text-slate-700">
    Auditee
  </span>

  <select
    value={form.auditeeCode}
    onChange={(event) =>
      updateField("auditeeCode", event.target.value)
    }
    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
  >
    <option value="">Select Auditee</option>

    {reportAuditees.map((item, index) => (
      <option
        key={`${getOptionValue(item)}-${index}`}
        value={getOptionValue(item)}
      >
        {getOptionLabel(item)}
      </option>
    ))}
  </select>
</label>


        <label className="block">
          <span className="text-sm font-semibold text-slate-700">ISO Standard</span>
          <select
            value={form.standardId}
            onChange={(event) => updateField('standardId', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          >
            {reportIsoStandards.map((item) => (
  <option
    key={getOptionValue(item)}
    value={getOptionValue(item)}
  >
    {getOptionLabel(item)}
  </option>
))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Readiness Score
          </span>
          <input
            type="number"
            min="0"
            max="100"
            value={form.score}
            onChange={(event) => updateField('score', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Open Actions</span>
          <input
            type="number"
            min="0"
            value={form.openActions}
            onChange={(event) => updateField('openActions', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Evidence Gaps</span>
          <input
            type="number"
            min="0"
            value={form.evidenceGaps}
            onChange={(event) => updateField('evidenceGaps', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        {[
          ['OK Count', 'okCount'],
          ['OFI Count', 'ofiCount'],
          ['Minor Count', 'minorCount'],
          ['Major Count', 'majorCount'],
        ].map(([label, field]) => (
          <label key={field} className="block">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <input
              type="number"
              min="0"
              value={form[field]}
              onChange={(event) => updateField(field, event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
        ))}

        <label className="block lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Executive Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={3}
            placeholder="Write executive summary notes"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="lg:col-span-2">
          <Button type="submit">
            <Plus size={18} />
            Add Report Record
          </Button>
        </div>
      </form>
    </Card>
  )
}

function SummaryCard({ label, value, description, icon: Icon, tone = 'blue' }) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-50 text-[#00A651]'
      : tone === 'red'
        ? 'bg-red-50 text-red-700'
      : tone === 'orange'
        ? 'bg-orange-50 text-orange-700'
        : 'bg-blue-50 text-[#005BAC]'

  return (
    <Card className="min-w-0 p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold leading-5 text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#0B1F3A]">{value}</p>
          <p className="mt-1 break-words text-sm leading-5 text-slate-500">{description}</p>
        </div>
      </div>
    </Card>
  )
}

function ExecutiveSummary({ records }) {
  const summary = calculateExecutiveSummary(records)
  const level = getReadinessLevel(summary.readinessScore)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Readiness Score"
        value={`${summary.readinessScore}%`}
        description={records.length ? level.label : 'No report data yet.'}
        icon={Gauge}
        tone={summary.readinessScore >= 75 ? 'green' : 'orange'}
      />
      <SummaryCard
        label="Auditees Reviewed"
        value={summary.totalFunctions}
        description="Unique auditees in report records."
        icon={Map}
      />
      <SummaryCard
        label="Open Actions"
        value={summary.totalOpenActions}
        description="Total open readiness actions."
        icon={TrendingUp}
        tone="orange"
      />
      <SummaryCard
        label="Evidence Gaps"
        value={summary.totalEvidenceGaps}
        description="Total evidence gaps recorded."
        icon={FileSpreadsheet}
      />
      <SummaryCard label="Total OK" value={summary.totalOk} description="Compliant checklist results." icon={FileSpreadsheet} tone="green" />
      <SummaryCard label="Total OFI" value={summary.totalOfi} description="Opportunities for improvement." icon={TrendingUp} />
      <SummaryCard label="Total Minor" value={summary.totalMinor} description="Minor nonconformities." icon={TrendingUp} tone="orange" />
      <SummaryCard label="Total Major" value={summary.totalMajor} description="Major nonconformities." icon={TrendingUp} tone="red" />
    </div>
  )
}

function EmptyAnalytics() {
  return (
    <Card>
      <EmptyState
        icon={BarChart3}
        title="No executive dashboard data is available."
        description="Charts, readiness score, heatmap, trends, and export will appear only after report records are added manually."
        compact
      />
    </Card>
  )
}

function ReadinessCharts({ records }) {
  const functionData = groupByFunction(records)
  const standardData = groupByStandard(records)
  const summary = calculateExecutiveSummary(records)
  const resultData = [
    { result: 'OK', count: summary.totalOk, fill: '#00A651' },
    { result: 'OFI', count: summary.totalOfi, fill: '#005BAC' },
    { result: 'MINOR', count: summary.totalMinor, fill: '#F59E0B' },
    { result: 'MAJOR', count: summary.totalMajor, fill: '#DC2626' },
  ]

  if (!records.length) return <EmptyAnalytics />

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="p-6">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Readiness by Auditee</h2>
        <p className="mt-1 text-sm text-slate-600">
          Average readiness score based on manually entered records.
        </p>

        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={functionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="auditeeCode" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="readinessScore" radius={[8, 8, 0, 0]}>
                {functionData.map((entry) => (
                  <Cell
                    key={entry.functionName}
                    fill={entry.readinessScore >= 75 ? '#00A651' : '#005BAC'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 xl:col-span-2">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Checklist Result Distribution</h2>
        <p className="mt-1 text-sm text-slate-600">OK, OFI, minor, and major results from manually entered reports.</p>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resultData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="result" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {resultData.map((entry) => <Cell key={entry.result} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Readiness by ISO Standard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Distribution of readiness score across ISO scope.
        </p>

        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={standardData}
                dataKey="readinessScore"
                nameKey="standardCode"
                innerRadius={72}
                outerRadius={120}
                paddingAngle={4}
              >
                {standardData.map((entry, index) => (
                  <Cell
                    key={entry.standardCode}
                    fill={['#005BAC', '#00A651', '#F59E0B', '#7C3AED', '#0891B2'][index % 5]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {standardData.map((item) => (
            <Badge key={item.standardCode} tone="slate">
              {item.standardCode}: {item.readinessScore}%
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Heatmap({ records }) {
  if (!records.length) return null

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Readiness Heatmap</h2>
        <p className="mt-1 text-sm text-slate-600">
          Heatmap based only on manually entered report records.
        </p>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
        {records.map((record) => {
          const level = getReadinessLevel(record.score)
          const color =
            record.score >= 90
              ? 'border-emerald-200 bg-emerald-50'
              : record.score >= 75
                ? 'border-blue-200 bg-blue-50'
                : record.score >= 50
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-red-200 bg-red-50'

          return (
            <div key={record.id} className={`rounded-2xl border p-4 ${color}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {record.standardCode}
              </p>
              <h3 className="mt-1 text-sm font-bold text-[#0B1F3A]">
                {record.auditeeCode ? `${record.auditeeCode} — ` : ''}{record.functionName}
              </h3>
              <p className="mt-3 text-3xl font-bold text-[#0B1F3A]">{record.score}%</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{level.label}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ReportRegister({ records }) {
  if (!records.length) return null

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-bold text-[#0B1F3A]">Executive Report Register</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manual readiness records used to generate dashboard visuals.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Report</th>
              <th className="px-5 py-3">Auditee</th>
              <th className="px-5 py-3">ISO</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Open Actions</th>
              <th className="px-5 py-3">Evidence Gaps</th>
              <th className="px-5 py-3">OK</th>
              <th className="px-5 py-3">OFI</th>
              <th className="px-5 py-3">MINOR</th>
              <th className="px-5 py-3">MAJOR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-5 py-4">
                  <p className="font-bold text-[#0B1F3A]">{record.reportName}</p>
                  <p className="mt-1 text-xs text-slate-500">{record.notes || 'No executive notes.'}</p>
                </td>
                <td className="px-5 py-4 text-slate-600"><span className="font-bold text-[#0B1F3A]">{record.auditeeCode}</span><span className="mt-1 block text-xs">{record.functionName}</span></td>
                <td className="px-5 py-4 text-slate-600">{record.standardCode}</td>
                <td className="px-5 py-4">
                  <Badge tone={record.score >= 75 ? 'green' : 'orange'}>
                    {record.score}%
                  </Badge>
                </td>
                <td className="px-5 py-4 text-slate-600">{record.openActions}</td>
                <td className="px-5 py-4 text-slate-600">{record.evidenceGaps}</td>
                <td className="px-5 py-4 font-semibold text-emerald-700">{record.okCount}</td>
                <td className="px-5 py-4 font-semibold text-[#005BAC]">{record.ofiCount}</td>
                <td className="px-5 py-4 font-semibold text-orange-700">{record.minorCount}</td>
                <td className="px-5 py-4 font-semibold text-red-700">{record.majorCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default function Reports() {
  const [records, setRecords] = useState(() => getReportRecords())

  const csv = useMemo(() => buildCsv(records), [records])

  function exportCsv() {
    if (!records.length) return

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    const exportDate = new Date().toISOString().slice(0, 10)
    link.setAttribute('download', `audit-readiness-report-${exportDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate executive readiness score, heatmap, analytics, and export based on manually entered readiness records."
        actions={
          <Button
            variant={records.length ? 'primary' : 'secondary'}
            disabled={!records.length}
            onClick={exportCsv}
          >
            <Download size={18} />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <ReportForm onCreate={(record) => {
          const saved = saveReportRecord(record)
          setRecords((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
        }} />
        <div className="space-y-6">
          <ExecutiveSummary records={records} />
          <ReadinessCharts records={records} />
        </div>
      </div>

      <div className="mt-6">
        <Heatmap records={records} />
      </div>

      <div className="mt-6">
        <ReportRegister records={records} />
      </div>
    </div>
  )
}
