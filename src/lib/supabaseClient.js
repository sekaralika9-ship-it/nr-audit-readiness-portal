import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigError =
  !supabaseUrl || !supabaseKey
    ? 'Supabase is not configured. Set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
    : null

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseKey)
