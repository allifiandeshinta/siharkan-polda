import supabase from '../lib/supabase'

const TABLE = 'suku_cadang'

export async function getAllSukuCadang() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('nama', { ascending: true })
  if (error) throw error
  return data
}

export async function createSukuCadang(item) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nama: item.nama,
      satuan: item.satuan || 'pcs',
      terima: item.terima || 0,
      digunakan: item.digunakan || 0,
      stok: item.stok || 0,
      stok_awal: (item.stok_awal ?? item.stok) || 0,
      min_stok: item.min_stok || 0,
      transaksi_bln: item.transaksi_bln || 0,
      kategori_sc: item.kategori_sc || ''
    })
    .select()
  if (error) throw error
  return data?.[0]
}

export async function updateSukuCadang(id, updates) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

export async function deleteSukuCadang(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
