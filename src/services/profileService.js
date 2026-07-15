import { supabase, supabaseConfigError } from '../lib/supabaseClient.js'

function requireSupabase() {
  if (supabaseConfigError || !supabase) {
    throw new Error(supabaseConfigError || 'Supabase is not connected.')
  }
}

async function getCurrentUser() {
  requireSupabase()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw new Error(`Unable to verify the current user: ${error.message}`)
  if (!user) throw new Error('You must be signed in to access your profile.')
  return user
}

export async function getCurrentProfile() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Supabase profiles load failed:', error)
    throw new Error(`Unable to load profile from profiles: ${error.message}`)
  }

  return { profile: data, user }
}

export async function saveCurrentProfile(profile) {
  const user = await getCurrentUser()
  const payload = {
    id: user.id,
    full_name: profile.full_name || null,
    fungsi: profile.fungsi || null,
    role: profile.role || null,
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    console.error('Supabase profiles save failed:', error)
    throw new Error(`Unable to save profile in profiles: ${error.message}`)
  }

  return { profile: data, user }
}
