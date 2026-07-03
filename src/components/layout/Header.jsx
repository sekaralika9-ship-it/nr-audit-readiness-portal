import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, UserCircle } from 'lucide-react'
import { routeMeta } from '../../config/navigation.js'
import { getDisplayIdentity } from '../../utils/portalStorage.js'

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const [identity, setIdentity] = useState(getDisplayIdentity())

  const meta = routeMeta[location.pathname] || {
    title: 'Audit Readiness Portal',
    subtitle: 'Internal portal',
  }

  useEffect(() => {
    function refreshIdentity() {
      setIdentity(getDisplayIdentity())
    }

    window.addEventListener('nr-profile-updated', refreshIdentity)
    window.addEventListener('nr-session-updated', refreshIdentity)

    return () => {
      window.removeEventListener('nr-profile-updated', refreshIdentity)
      window.removeEventListener('nr-session-updated', refreshIdentity)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold text-[#0B1F3A]">{meta.title}</p>
          </div>
        </div>

        <div className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
          <Search size={17} />
          <span>Search anything...</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00A651]" />
            <span className="text-xs font-semibold text-slate-700">System Ready</span>
          </div>

          <Link
            to="/profile"
            className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <UserCircle size={20} />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-32 truncate text-xs font-bold text-[#0B1F3A]">
                {identity.name}
              </span>
              <span className="block max-w-32 truncate text-[11px] font-medium text-slate-500">
                {identity.department || identity.email || 'Profile'}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
