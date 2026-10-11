import supabase from '../lib/supabase'

export async function getSatwilList() {
  const { data, error } = await supabase
    .from('satwil')
    .select('id, nama')
    .order('nama', { ascending: true })
  if (error) throw error
  return data.map(s => s.nama)
}

export async function getKategoriList() {
  const { data, error } = await supabase
    .from('kategori')
    .select('id, nama')
    .order('nama', { ascending: true })
  if (error) throw error
  return data.map(k => k.nama)
}
