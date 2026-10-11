import supabase from '../lib/supabase'

const TABLE = 'pinjaman'

export async function getAllPinjaman() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      satwil:satwil_id(nama)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapPinjaman)
}

export async function createPinjaman(item) {
  if (item.mode === 'batch') {
    const { data, error } = await supabase.rpc('create_pinjaman_batch', {
      p_batch_id: item.batch_id,
      p_jumlah: Number(item.jumlah),
      p_satwil_id: await resolveSatwilId(item.satwil),
      p_tgl_pinjam: item.tgl_pinjam,
      p_tgl_kembali: item.tgl_kembali,
      p_keterangan: item.keterangan || '',
      p_jenis_ht: item.jenis_ht || '',
      p_merk: item.merk || '',
      p_model: item.model || '',
      p_nomor_transaksi: item.nomor_transaksi || null
    })
    if (error) throw error
    return data
  }

  const satwil_id = await resolveSatwilId(item.satwil)
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      jenis_ht: item.jenis_ht,
      id_ht: item.id_ht || null,
      serial_number: item.serial_number || null,
      merk: item.merk || '',
      model: item.model || '',
      satwil_id,
      tgl_pinjam: item.tgl_pinjam,
      tgl_kembali: item.tgl_kembali,
      keterangan: item.keterangan || '',
      status: item.status || 'Dipinjam',
      file_url: item.file_url || ''
    })
    .select()
  if (error) throw error
  return data?.[0]
}

export async function returnPinjaman(id, item) {
  if (item.batch_id) {
    const { data, error } = await supabase.rpc('return_pinjaman_batch', {
      p_pinjaman_id: id,
      p_jumlah: Number(item.jumlah)
    })
    if (error) throw error
    return data
  }
  return updatePinjaman(id, {
    is_returned: true,
    tgl_dikembalikan: new Date().toISOString(),
    status: 'Dikembalikan'
  })
}

export async function updatePinjaman(id, updates) {
  const updateData = { ...updates }
  if (updates.id_ht !== undefined) updateData.id_ht = updates.id_ht || null
  if (updates.serial_number !== undefined) updateData.serial_number = updates.serial_number || null
  if (updates.merk !== undefined) updateData.merk = updates.merk || ''
  if (updates.model !== undefined) updateData.model = updates.model || ''
  if (updates.satwil) {
    updateData.satwil_id = await resolveSatwilId(updates.satwil)
    delete updateData.satwil
  }
  
  const { data, error } = await supabase
    .from(TABLE)
    .update(updateData)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

export async function deletePinjaman(id, batchId = null) {
  if (batchId) {
    const { data, error } = await supabase.rpc('delete_pinjaman_batch', { p_pinjaman_id: id })
    if (error) throw error
    return data
  }
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

function mapPinjaman(item) {
  const { satwil_id, created_at, updated_at, ...clean } = item
  return {
    ...clean,
    satwil: item.satwil?.nama || item.satwil
  }
}
