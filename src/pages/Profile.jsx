import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserCircle,
} from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import { ownerFunctions } from '../data/evidenceManagementData.js'
import {
  clearSession,
  getSession,
  getStoredProfile,
  saveStoredProfile,
} from '../utils/portalStorage.js'

const roleOptions = [
  'Employee',
  'Function Owner',
  'Document Owner',
  'PIC Audit Readiness',
  'Management Representative',
  'Administrator',
]

function TextField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Select option</option>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: '',
    department: '',
    employeeId: '',
    phone: '',
  })

  useEffect(() => {
    const profile = getStoredProfile()
    const session = getSession()

    setForm({
      fullName: profile.fullName || '',
      email: profile.email || session.email || '',
      role: profile.role || '',
      department: profile.department || '',
      employeeId: profile.employeeId || '',
      phone: profile.phone || '',
    })
  }, [])

  function updateField(field, value) {
    setSaved(false)
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    saveStoredProfile(form)
    setSaved(true)
  }

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  const displayName = form.fullName || form.email?.split('@')[0] || 'Profile'

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage personal information, function ownership, and account identity used across the portal."
        actions={
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 text-[#005BAC]">
              <UserCircle size={68} strokeWidth={1.5} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-[#0B1F3A]">{displayName}</h2>

            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
              {form.role || 'Role not set'}
              {form.department ? ` · ${form.department}` : ''}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Badge tone={form.fullName ? 'green' : 'orange'}>
                {form.fullName ? 'Profile Saved' : 'Profile Incomplete'}
              </Badge>
              <Badge tone="blue">Local Demo Profile</Badge>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#005BAC]">
                  <Mail size={19} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0B1F3A]">
                    Profile Information
                  </h2>
                  <p className="text-sm text-slate-500">
                    This information appears in the portal header after login.
                  </p>
                </div>
              </div>

              {saved ? <Badge tone="green">Saved</Badge> : null}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Full Name"
                value={form.fullName}
                onChange={(value) => updateField('fullName', value)}
                placeholder="Enter full name"
              />

              <TextField
                label="Email"
                value={form.email}
                onChange={(value) => updateField('email', value)}
                placeholder="Enter email"
                type="email"
              />

              <SelectField
                label="Role / Position"
                value={form.role}
                onChange={(value) => updateField('role', value)}
                options={roleOptions}
              />

              <SelectField
                label="Department / Function"
                value={form.department}
                onChange={(value) => updateField('department', value)}
                options={ownerFunctions}
              />

              <TextField
                label="Employee ID"
                value={form.employeeId}
                onChange={(value) => updateField('employeeId', value)}
                placeholder="Enter employee ID"
              />

              <TextField
                label="Phone Number"
                value={form.phone}
                onChange={(value) => updateField('phone', value)}
                placeholder="Enter phone number"
              />

              <div className="lg:col-span-2">
                <Button type="submit">
                  <Save size={18} />
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#00A651]">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0B1F3A]">Security</h2>
                <p className="text-sm text-slate-500">
                  Authentication is UI-only for this prototype.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-600">Login Email</p>
                <p className="mt-1 text-sm text-[#0B1F3A]">{form.email || '—'}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-600">Session Status</p>
                <p className="mt-1 text-sm text-[#0B1F3A]">Signed in locally</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
