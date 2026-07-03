import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-[#005BAC] text-white shadow-sm shadow-blue-900/10 hover:bg-[#004F95] focus-visible:ring-[#005BAC]/25',
  secondary:
    'bg-white text-[#0B1F3A] border border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
  muted:
    'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  to,
  disabled = false,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4'

  const classes = `${base} ${variants[disabled ? 'muted' : variant]} ${className}`

  if (to && !disabled) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
