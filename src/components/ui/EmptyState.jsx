import Button from './Button.jsx'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  actionDisabled,
  badge,
  compact = false,
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'p-8' : 'p-10 lg:p-14'}`}>
      {Icon ? (
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-blue-50 text-[#005BAC]">
          <Icon size={46} strokeWidth={1.7} />
        </div>
      ) : null}

      {badge ? (
        <div className="mb-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {badge}
        </div>
      ) : null}

      <h2 className="max-w-2xl text-xl font-bold tracking-tight text-[#0B1F3A]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>

      {actionLabel ? (
        <div className="mt-6">
          <Button to={actionTo} disabled={actionDisabled}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
