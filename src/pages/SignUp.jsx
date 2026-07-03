import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Eye, Lock, Mail, UserCircle } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout.jsx'
import Logo from '../components/layout/Logo.jsx'
import Button from '../components/ui/Button.jsx'
import { ownerFunctions } from '../data/evidenceManagementData.js'
import { saveSession, saveStoredProfile } from '../utils/portalStorage.js'

const roleOptions = [
  'Employee',
  'Function Owner',
  'Document Owner',
  'PIC Audit Readiness',
  'Management Representative',
  'Administrator',
]

export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Employee',
    department: 'Quality Management',
  })

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const profile = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
      department: form.department,
      employeeId: '',
      phone: '',
    }

    saveStoredProfile(profile)
    saveSession({ email: profile.email })

    navigate('/dashboard')
  }

  return (
    <AuthLayout>
      <section className="flex w-full flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-1 flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
          <div>
            <Logo compact />

            <div className="mt-12">
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
                Create your account
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Register your local demo profile for the Audit Readiness Portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Full Name</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-4 focus-within:ring-blue-100">
                  <UserCircle size={17} className="text-slate-400" />
                  <input
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    required
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Enter full name"
                  />
                </div>
              </label>

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
                    placeholder="Enter email"
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
                    placeholder="Create password"
                  />
                  <Eye size={17} className="text-slate-400" />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Role</span>
                <select
                  value={form.role}
                  onChange={(event) => updateField('role', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {roleOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Department / Function</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-4 focus-within:ring-blue-100">
                  <Building2 size={17} className="text-slate-400" />
                  <select
                    value={form.department}
                    onChange={(event) => updateField('department', event.target.value)}
                    className="w-full border-0 bg-transparent text-sm outline-none"
                  >
                    {ownerFunctions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </label>

              <Button type="submit" className="w-full">
                Create Account
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
            Account registration is simulated for prototype presentation.
          </p>
        </div>

        <div className="relative hidden overflow-hidden bg-[#0B1F3A] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(0,166,81,0.55),transparent_24%),radial-gradient(circle_at_30%_55%,rgba(0,91,172,0.55),transparent_28%),linear-gradient(145deg,#0B1F3A,#06264A_55%,#003F77)]" />
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <div className="max-w-sm">
              <p className="text-2xl font-bold leading-snug">
                Start Prepared,
                <br />
                Stay Audit Ready.
              </p>
              <div className="mt-5 h-1 w-16 rounded-full bg-[#00A651]" />
            </div>
          </div>
        </div>
      </section>
    </AuthLayout>
  )
}
