import supabase from '../lib/supabase'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUserRole(user) {
  if (!user) return null

  // 1. Check user metadata (metadata role usually set manually in Supabase Dashboard)
  const metaRole = user.app_metadata?.role || user.user_metadata?.role
  if (metaRole) return metaRole

  // 2. Check profiles table (source of truth for role, see migration 00005)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!error && data) return data.role
  } catch {
    // Profile lookup is best-effort; fall through to default role
  }

  // Default role for new users if not found
  return 'User'
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return { data }
}
