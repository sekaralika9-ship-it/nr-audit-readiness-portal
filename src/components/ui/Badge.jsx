const tones = {
  blue: 'bg-blue-50 text-[#005BAC] border-blue-100',
  green: 'bg-emerald-50 text-[#007A3D] border-emerald-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  red: 'bg-red-50 text-red-700 border-red-100',
}

export default function Badge({ children, tone = 'slate', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
