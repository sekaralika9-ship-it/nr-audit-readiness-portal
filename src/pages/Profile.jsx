import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Loader2,
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
import { getStoredProfile, saveStoredProfile } from '../utils/portalStorage.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getCurrentProfile, saveCurrentProfile } from '../services/profileService.js'

const roleOptions = [
  'Auditor',
  'Employee',
  'Function Owner',
  'Document Owner',
  'PIC Audit Readiness',
  'Management Representative',
  'Administrator',
]

function TextField({ label, value, onChange, placeholder, type = 'text', disabled = false }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
      >
        <option value="">Select option</option>
        {options.map((item, index) => (
          <option
            key={
              typeof item === 'string'
                ? `${item}-${index}`
                : `${item?.category ?? 'item'}-${item?.name ?? item?.id ?? item?.code ?? 'unknown'}-${index}`
            }
            value={typeof item === 'string' ? item : item?.name ?? item?.id ?? item?.code ?? ''}
          >
            {typeof item === 'string' ? item : item?.name ?? item?.label ?? item?.code ?? ''}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: '',
    department: '',
    employeeId: '',
    phone: '',
  })

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        setLoading(true)
        setError('')
        const localProfile = getStoredProfile()
        const { profile, user } = await getCurrentProfile()

        if (!active) return
        setForm({
          fullName: profile?.full_name || user.user_metadata?.full_name || '',
          email: user.email || '',
          role: profile?.role || '',
          department: profile?.fungsi || user.user_metadata?.fungsi || '',
          employeeId: profile?.employee_id || localProfile.employeeId || '',
          phone: profile?.phone || localProfile.phone || '',
        })
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load your profile.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [])

  function updateField(field, value) {
    setSaved(false)
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    try {
      setSaving(true)
      setSaved(false)
      setError('')
      const { profile, user } = await saveCurrentProfile({
        full_name: form.fullName,
        fungsi: form.department,
        role: form.role,
        department: form.department,
        employee_id: form.employeeId,
        phone: form.phone,
      })

      saveStoredProfile({
        ...form,
        fullName: profile.full_name || '',
        department: profile.fungsi || '',
        role: profile.role || '',
        email: user.email || form.email,
      })
      setSaved(true)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try {
      setError('')
      await logout()
      navigate('/login')
    } catch (logoutError) {
      setError(logoutError.message || 'Unable to sign out.')
    }
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

      {error ? (
        <Card className="mb-6 border-red-100 bg-red-50 p-4">
          <div className="flex items-start gap-3 text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6">{error}</p>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 size={18} className="animate-spin" />
            <p className="text-sm font-semibold">Loading your profile from PostgreSQL...</p>
          </div>
        </Card>
      ) : (

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
                {form.fullName ? 'Profile Available' : 'Profile Incomplete'}
              </Badge>
              <Badge tone="blue">PostgreSQL Profile</Badge>
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
                disabled
              />

              <SelectField
                label="Account Role"
                value={form.role}
                onChange={(value) => updateField('role', value)}
                options={roleOptions}
                disabled
              />

              <SelectField
                label="Department / Function"
                value={form.department}
                onChange={(value) => updateField('department', value)}
                options={ownerFunctions}
                disabled={saving}
              />

              <TextField
                label="Employee ID"
                value={form.employeeId}
                onChange={(value) => updateField('employeeId', value)}
                placeholder="Enter employee ID"
                disabled={saving}
              />

              <TextField
                label="Phone Number"
                value={form.phone}
                onChange={(value) => updateField('phone', value)}
                placeholder="Enter phone number"
                disabled={saving}
              />

              <div className="lg:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Full name, function, employee ID, and phone are stored securely in PostgreSQL. Account roles are managed by an administrator.
                </p>
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
                  Authentication is managed by the NR Audit Readiness API.
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
                <p className="mt-1 text-sm text-[#0B1F3A]">Signed in with portal JWT</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}
    </div>
  )
}
