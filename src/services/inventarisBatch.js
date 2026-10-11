import supabase from '../lib/supabase'

export async function getAllInventarisBatch() {
  const { data, error } = await supabase.from('inventaris_batch').select('*, kategori:kategori_id(nama), satwil:lokasi_id(nama)').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(item => ({ ...item, kategori: item.kategori?.nama || '', lokasi: item.satwil?.nama || '' }))
}

export async function createInventarisBatch(item) {
  const { kategori_id, lokasi_id } = await ensureBatchRefs(item)
  if (!kategori_id) throw new Error('Kategori wajib dipilih')
  if (!lokasi_id) throw new Error('Lokasi/Satwil wajib dipilih')

  const { data, error } = await supabase.rpc('create_inventaris_batch', {
    p_nama: item.nama, p_merk: item.merk || '', p_model: item.model || '', p_kategori_id: kategori_id,
    p_lokasi_id: lokasi_id, p_kondisi: item.kondisi || 'Baik', p_jumlah: Number(item.jumlah),
    p_satuan: item.satuan || 'unit', p_nomor_batch: item.nomor_batch || '', p_tanggal_masuk: item.tanggal_masuk,
    p_sumber_pengadaan: item.sumber_pengadaan || 'Input baru', p_keterangan: item.keterangan || ''
  })
  if (error) throw error
  return data
}

export async function updateInventarisBatch(id, updates) {
  const { kategori_id, lokasi_id } = await ensureBatchRefs(updates)
  const updateData = { ...updates }
  delete updateData.kategori
  delete updateData.lokasi
  delete updateData.recordType
  delete updateData.tanggal
  delete updateData.nomor
  delete updateData.satwil

  if (kategori_id) updateData.kategori_id = kategori_id
  if (lokasi_id) updateData.lokasi_id = lokasi_id

  if (updates.jumlah !== undefined && updates.jumlah !== '') {
    const newQty = Number(updates.jumlah)
    if (!isNaN(newQty) && newQty > 0) {
      updateData.jumlah_awal = newQty
      const { data: current } = await supabase.from('inventaris_batch').select('*').eq('id', id).single()
      if (current) {
        const dipinjam = current.jumlah_dipinjam || 0
        const rusak = current.jumlah_rusak || 0
        const hilang = current.jumlah_hilang || 0
        const available = newQty - dipinjam - rusak - hilang
        if (available < 0) {
          throw new Error('Jumlah total tidak boleh lebih kecil dari unit yang sedang dipinjam/rusak/hilang')
        }
        updateData.jumlah_tersedia = available
      }
    }
    delete updateData.jumlah
  }
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('inventaris_batch')
    .update(updateData)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0]
}

export async function deleteInventarisBatch(id) {
  // 1. Try atomic RPC first (handles RLS and constraints on server side)
  const { data, error } = await supabase.rpc('delete_inventaris_batch', { p_batch_id: id })
  if (!error) return data

  // 2. If RPC fails with a business logic message (e.g. still borrowed), throw it directly
  if (error.message && !error.message.includes('function delete_inventaris_batch') && !error.message.includes('not found') && !error.message.includes('schema cache')) {
    throw error
  }

  // 3. Fallback for environments where migration 0013 has not been run yet
  const { data: activeLoans, error: loanErr } = await supabase
    .from('pinjaman')
    .select('id, is_returned, jumlah, jumlah_dikembalikan')
    .eq('batch_id', id)
  if (loanErr) throw loanErr

  const hasUnreturned = (activeLoans || []).some(l => !l.is_returned && (l.jumlah - (l.jumlah_dikembalikan || 0)) > 0)
  if (hasUnreturned) {
    throw new Error('Batch tidak dapat dihapus karena masih terdapat unit yang sedang dipinjam')
  }

  // Unlink returned pinjaman to prevent FK constraint failure
  if (activeLoans && activeLoans.length > 0) {
    const { error: unlinkErr } = await supabase
      .from('pinjaman')
      .update({ batch_id: null })
      .eq('batch_id', id)
    if (unlinkErr) throw unlinkErr
  }

  // Delete related mutasi records
  const { error: mutasiErr } = await supabase
    .from('inventaris_mutasi')
    .delete()
    .eq('batch_id', id)
  if (mutasiErr) throw mutasiErr

  // Delete batch record
  const { error: batchErr } = await supabase
    .from('inventaris_batch')
    .delete()
    .eq('id', id)
  if (batchErr) {
    if (batchErr.message?.includes('violates foreign key constraint') || batchErr.message?.includes('inventaris_mutasi')) {
      throw new Error('Gagal menghapus: relasi tabel mutasi terkunci. Silakan jalankan file migrasi 0013 di SQL Editor Supabase.')
    }
    throw batchErr
  }
}

export async function mutateInventarisBatch(batchId, jenis, jumlah, options = {}) {
  const { data, error } = await supabase.rpc('mutate_inventaris_batch', {
    p_batch_id: batchId, p_jenis: jenis, p_jumlah: Number(jumlah), p_tanggal: options.tanggal || null, p_keterangan: options.keterangan || ''
  })
  if (error) throw error
  return data
}

async function ensureBatchRefs(item) {
  let kategori_id = item.kategori_id
  let lokasi_id = item.lokasi_id

  if (item.kategori && !kategori_id) {
    const { data } = await supabase
      .from('kategori')
      .select('id')
      .eq('nama', item.kategori)
      .maybeSingle()
    if (data) kategori_id = data.id
  }

  if (item.lokasi && !lokasi_id) {
    const { data } = await supabase
      .from('satwil')
      .select('id')
      .eq('nama', item.lokasi)
      .maybeSingle()
    if (data) lokasi_id = data.id
  }

  return { kategori_id, lokasi_id }
}
