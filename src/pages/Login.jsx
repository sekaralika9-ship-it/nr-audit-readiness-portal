import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, Lock, Mail } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Logo from '../components/layout/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(form.email.trim(), form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <section className="flex w-full flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
          <div>
            <Logo compact />

            <div className="mt-14">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#005BAC]">
                Secure Access
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                Sign in to NR Audit Readiness Portal
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                Use your registered account to access audit readiness workspace, evidence library, and ISO knowledge center.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Mail size={17} className="text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Lock size={17} className="text-slate-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <Eye size={17} className="text-slate-400" />
                </div>
              </label>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-semibold text-[#005BAC]">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="font-bold text-[#005BAC]">
                  Create account
                </Link>
              </p>
            </form>
          </div>

          <p className="mt-10 text-xs leading-5 text-slate-500">
            This is an internal system for PT Nusantara Regas employees only.
          </p>
        </div>

        <div className="relative hidden overflow-hidden bg-[#0B1F3A] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(0,166,81,0.55),transparent_24%),radial-gradient(circle_at_30%_55%,rgba(0,91,172,0.55),transparent_28%),linear-gradient(145deg,#0B1F3A,#06264A_55%,#003F77)]" />
          <div className="absolute inset-0 opacity-35">
            <div className="absolute bottom-24 left-14 h-72 w-12 rounded-t-3xl bg-white/20" />
            <div className="absolute bottom-24 left-32 h-96 w-14 rounded-t-3xl bg-white/15" />
            <div className="absolute bottom-24 left-52 h-64 w-20 rounded-t-3xl bg-white/10" />
            <div className="absolute bottom-24 right-24 h-80 w-16 rounded-t-3xl bg-white/15" />
            <div className="absolute bottom-24 left-10 right-10 h-24 rounded-3xl bg-white/10" />
          </div>

          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <div className="max-w-sm">
              <p className="text-2xl font-bold leading-snug">
                Prepared Today,
                <br />
                Ready for Every Audit Tomorrow.
              </p>
              <div className="mt-5 h-1 w-16 rounded-full bg-[#00A651]" />
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  )
}
