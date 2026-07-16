import { apiClient } from '../lib/apiClient.js'

function toLegacyShape(user) {
  return {
    profile: {
      full_name: user.fullName || '',
      fungsi: user.function || '',
      role: user.roles?.[0] || '',
      department: user.department || '',
      employee_id: user.employeeId || '',
      phone: user.phone || '',
    },
    user: {
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.fullName, fungsi: user.function },
    },
  }
}

export async function getCurrentProfile() {
  return toLegacyShape(await apiClient.get('auth/me'))
}

export async function saveCurrentProfile(profile) {
  const user = await apiClient.put('auth/me', {
    fullName: profile.full_name,
    function: profile.fungsi,
    department: profile.department || profile.fungsi,
    employeeId: profile.employee_id || null,
    phone: profile.phone || null,
  })
  return toLegacyShape(user)
}
