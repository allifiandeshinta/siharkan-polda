import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rqgixezpitiqrleyetcl.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_pPNHvs5rsfpvzsetHCqFwg_3y-q2qGl'

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL atau Publishable Key belum diset.')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export default supabase
