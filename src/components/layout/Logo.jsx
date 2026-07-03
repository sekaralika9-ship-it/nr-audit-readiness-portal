import logoUrl from '../../assets/logo-nusantara-regas.png'
import { brand } from '../../config/brand.js'

export default function Logo({ compact = false, dark = false }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'gap-2' : ''}`}>
      <div className={dark ? 'rounded-xl bg-white p-2' : ''}>
        <img
          src={logoUrl}
          alt="PT Nusantara Regas"
          className={compact ? 'h-7 w-auto' : 'h-10 w-auto'}
        />
      </div>
      {!compact ? (
        <div className={dark ? 'text-white' : 'text-[#0B1F3A]'}>
          <p className="text-sm font-bold leading-tight">{brand.product}</p>
          <p className="text-xs font-medium text-[#00A651]">{brand.tagline}</p>
        </div>
      ) : null}
    </div>
  )
}
