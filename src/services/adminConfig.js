import supabase from '../lib/supabase'

const TABLE = 'admin_config'

export async function getAdminConfig() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateAdminConfig(id, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}
