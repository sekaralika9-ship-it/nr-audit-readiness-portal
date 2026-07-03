import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center nr-card-shadow">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you are trying to access is not available.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-[#005BAC] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  )
}
