import supabase from '../lib/supabase'

const TABLE = 'sppm'

export async function getAllSPPM() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('tgl', { ascending: false })
  if (error) throw error
  return data
}

export async function createSPPM(item) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nomor: item.nomor,
      sumber: item.sumber || 'Mabes Polri',
      perihal: item.perihal || '',
      tgl: item.tgl,
      file_url: item.file_url || ''
    })
    .select()
  if (error) throw error
  return data?.[0]
}

export async function updateSPPM(id, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

export async function deleteSPPM(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
