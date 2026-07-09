import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Checking secure session...</p>
          <p className="mt-1 text-xs text-slate-500">Please wait while we validate your access.</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
