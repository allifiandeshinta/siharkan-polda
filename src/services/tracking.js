import supabase from '../lib/supabase'

const TABLE = 'tracking'

export async function getAllTracking() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      satwil:satwil_id(nama)
    `)
    .order('tgl', { ascending: false })
  if (error) throw error
  return data.map(mapTracking)
}

export async function createTracking(item) {
  const satwil_id = await resolveSatwilId(item.satwil)
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id: item.id,
      satwil_id,
      jenis: item.jenis,
      tgl: item.tgl,
      status: item.status || 'Belum Ditindaklanjuti',
      file_url: item.file_url || ''
    })
    .select()
  if (error) throw error
  return data?.[0]
}

export async function updateTracking(id, updates) {
  const updateData = { ...updates }
  if (updates.satwil) {
    updateData.satwil_id = await resolveSatwilId(updates.satwil)
    delete updateData.satwil
  }
  delete updateData.satwil
  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

export async function deleteTracking(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

async function resolveSatwilId(satwil) {
  if (!satwil) return null
  const { data } = await supabase
    .from('satwil')
    .select('id')
    .eq('nama', satwil)
    .maybeSingle()
  return data?.id || null
}

function mapTracking(item) {
  const satwilName = (typeof item.satwil === 'object' ? item.satwil?.nama : item.satwil) || '-'
  return {
    id: item.id,
    satwil: satwilName,
    jenis: item.jenis || '',
    tgl: item.tgl || (item.created_at ? item.created_at.slice(0, 10) : ''),
    status: item.status || 'Belum Ditindaklanjuti',
    file_url: item.file_url || '',
    created_at: item.created_at
  }
}
