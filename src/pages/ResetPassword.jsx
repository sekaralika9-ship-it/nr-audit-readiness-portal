import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Lock } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Logo from '../components/layout/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { apiClient } from '../lib/apiClient.js'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const linkIsValid = Boolean(email && token)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmation) {
      setError('The password confirmation does not match.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('auth/reset-password', { email, token, newPassword })
      setComplete(true)
    } catch (requestError) {
      setError(requestError.message || 'Unable to reset the password.')
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
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#005BAC]">Secure recovery</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Create a new password</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                Choose a strong password with at least 10 characters for <span className="font-semibold">{email || 'your account'}</span>.
              </p>
            </div>

            {complete ? (
              <div className="mt-10 max-w-md rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
                <CheckCircle2 className="text-[#00A651]" size={34} />
                <h2 className="mt-4 text-lg font-bold text-[#0B1F3A]">Password reset successfully</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Your new password is ready to use.</p>
                <Link to="/login" className="mt-6 inline-flex rounded-xl bg-[#005BAC] px-4 py-2.5 text-sm font-semibold text-white">
                  Continue to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
                {!linkIsValid ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    This password reset link is incomplete. Request a new link from the Forgot password page.
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">New Password</span>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <Lock size={17} className="text-slate-400" />
                    <input
                      aria-label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={10}
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Confirm New Password</span>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <Lock size={17} className="text-slate-400" />
                    <input
                      aria-label="Confirm New Password"
                      type="password"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      minLength={10}
                      autoComplete="new-password"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none"
                      required
                    />
                  </div>
                </label>

                <Button type="submit" className="w-full" disabled={!linkIsValid || loading}>
                  {loading ? 'Resetting password...' : 'Reset Password'}
                </Button>
                <p className="text-center text-sm text-slate-600">
                  <Link to="/forgot-password" className="font-bold text-[#005BAC]">Request a new reset link</Link>
                </p>
              </form>
            )}
          </div>
          <p className="mt-10 text-xs leading-5 text-slate-500">Reset links are time-limited and can only be used once.</p>
        </div>

        <div className="relative hidden overflow-hidden bg-[#0B1F3A] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(0,166,81,0.55),transparent_24%),radial-gradient(circle_at_30%_55%,rgba(0,91,172,0.55),transparent_28%),linear-gradient(145deg,#0B1F3A,#06264A_55%,#003F77)]" />
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <p className="max-w-sm text-2xl font-bold leading-snug">Secure access,<br />ready for every audit.</p>
            <div className="mt-5 h-1 w-16 rounded-full bg-[#00A651]" />
          </div>
        </div>
      </section>
    </AuthLayout>
  )
}
