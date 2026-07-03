import { NavLink } from 'react-router-dom'
import { CircleHelp } from 'lucide-react'
import { navigationItems, secondaryNavigation } from '../../config/navigation.js'
import Logo from './Logo.jsx'

function NavigationLink({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
          isActive
            ? 'bg-[#005BAC] text-white shadow-sm'
            : 'text-slate-300 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon size={18} strokeWidth={2.1} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="flex h-full w-72 flex-col bg-[#0B1F3A] px-4 py-5">
      <div className="mb-8 px-2">
        <Logo dark />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigationItems.map((item) => (
          <NavigationLink key={item.path} item={item} onNavigate={onNavigate} />
        ))}

        <div className="mt-4 border-t border-white/10 pt-4">
          {secondaryNavigation.map((item) => (
            <NavigationLink key={item.path} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">
        <div className="flex items-center gap-3">
          <CircleHelp size={20} />
          <div>
            <p className="text-sm font-semibold text-white">Need Help?</p>
            <p className="mt-1 text-xs text-slate-300">Contact internal support.</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
