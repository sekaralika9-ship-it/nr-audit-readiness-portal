const toneClasses = {
  blue: 'bg-blue-50 text-[#005BAC]',
  green: 'bg-emerald-50 text-[#00A651]',
  orange: 'bg-orange-50 text-orange-600',
}

export default function MetricCard({ label, value, description, icon: Icon, tone = 'blue' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 nr-card-shadow">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-[#0B1F3A]">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  )
}
