import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Lock, Mail } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Logo from '../components/layout/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import {
  getStoredProfile,
  saveSession,
  saveStoredProfile,
} from '../utils/portalStorage.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    const profile = getStoredProfile()

    if (profile.email) {
      setForm((current) => ({
        ...current,
        email: profile.email,
      }))
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const email = form.email.trim()

    saveSession({ email })
    saveStoredProfile({ email })

    navigate('/dashboard')
  }

  return (
    <AuthLayout>
      <section className="flex w-full flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
          <div>
            <Logo compact />

            <div className="mt-14">
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
                Sign in to Audit Readiness Portal
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                One Portal for Every Audit
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 max-w-md space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-4 focus-within:ring-blue-100">
                  <Mail size={17} className="text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    required
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Enter your email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-4 focus-within:ring-blue-100">
                  <Lock size={17} className="text-slate-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    required
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Enter your password"
                  />
                  <Eye size={17} className="text-slate-400" />
                </div>
              </label>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-semibold text-[#005BAC]">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full">
                Sign In
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
