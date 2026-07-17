import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Logo from '../components/layout/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { apiClient } from '../lib/apiClient.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [developmentResetUrl, setDevelopmentResetUrl] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiClient.post('auth/forgot-password', { email: email.trim() })
      setDevelopmentResetUrl(result.developmentResetUrl || '')
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError.message || 'Unable to prepare password reset instructions.')
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
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
                Reset your password
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Enter your registered email address and we will send you a secure password reset link.
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-10 max-w-md space-y-5">
                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-4 focus-within:ring-blue-100">
                    <Mail size={17} className="text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Enter your email"
                    />
                  </div>
                </label>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Preparing reset link...' : 'Send Reset Instructions'}
                </Button>

                <p className="text-center text-sm text-slate-600">
                  Remember your password?{' '}
                  <Link to="/login" className="font-bold text-[#005BAC]">
                    Back to sign in
                  </Link>
                </p>
              </form>
            ) : (
              <div className="mt-10 max-w-md rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
                <CheckCircle2 className="text-[#00A651]" size={34} />
                <h2 className="mt-4 text-lg font-bold text-[#0B1F3A]">
                  Check your email
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If an account exists for this address, password reset instructions were sent to{' '}
                  <span className="font-bold">{email}</span>.
                </p>

                {developmentResetUrl ? (
                  <a
                    href={developmentResetUrl}
                    className="mt-5 inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-[#005BAC]"
                  >
                    Open local development reset link
                  </a>
                ) : null}

                <Link
                  to="/login"
                  className="mt-6 inline-flex rounded-xl bg-[#005BAC] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>

          <p className="mt-10 text-xs leading-5 text-slate-500">
            Reset links are time-limited and can only be used once.
          </p>
        </div>

        <div className="relative hidden overflow-hidden bg-[#0B1F3A] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(0,166,81,0.55),transparent_24%),radial-gradient(circle_at_30%_55%,rgba(0,91,172,0.55),transparent_28%),linear-gradient(145deg,#0B1F3A,#06264A_55%,#003F77)]" />
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <div className="max-w-sm">
              <p className="text-2xl font-bold leading-snug">
                Secure Access,
                <br />
                Controlled Readiness.
              </p>
              <div className="mt-5 h-1 w-16 rounded-full bg-[#00A651]" />
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  )
}
