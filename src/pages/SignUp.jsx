import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Lock, Mail, User } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Logo from '../components/layout/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function SignUp() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    fungsi: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await signup({
        fullName: form.fullName.trim(),
        fungsi: form.fungsi.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Signup gagal.')
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
                Account Registration
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                Create your portal account
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                Register with an email address approved by the portal administrator.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Full Name</span>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <User size={17} className="text-slate-400" />
                  <input
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Fungsi</span>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Building2 size={17} className="text-slate-400" />
                  <input
                    value={form.fungsi}
                    onChange={(event) => updateField('fungsi', event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Example: Human Capital, HSSE, SPI"
                    required
                  />
                </div>
              </label>

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
                    placeholder="Create your password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </label>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#005BAC]">
                  Sign in
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
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <div className="max-w-sm">
              <p className="text-2xl font-bold leading-snug">
                One secure account,
                <br />
                one portal for every audit.
              </p>
              <div className="mt-5 h-1 w-16 rounded-full bg-[#00A651]" />
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  )
}
