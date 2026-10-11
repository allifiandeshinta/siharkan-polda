import { getAllInventaris } from './inventaris'
import { getAllInventarisBatch } from './inventarisBatch'
import { getAllPinjaman } from './pinjaman'
import supabase from '../lib/supabase'

const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0)

export async function getDashboardData() {
  const [units, batches, loans, mutationsResult] = await Promise.all([
    getAllInventaris(), getAllInventarisBatch(), getAllPinjaman(),
    supabase.from('inventaris_mutasi').select('jenis_mutasi,jumlah,tanggal_transaksi')
  ])
  if (mutationsResult.error) throw mutationsResult.error
  const mutations = mutationsResult.data || []
  const byKategori = {}
  const byKondisi = {}
  const byLokasi = {}
  units.forEach(item => add(item, 1))
  batches.forEach(item => add(item, Number(item.jumlah_awal || 0)))
  function add(item, quantity) {
    byKategori[item.kategori || 'Tanpa kategori'] = (byKategori[item.kategori || 'Tanpa kategori'] || 0) + quantity
    byKondisi[item.kondisi || 'Tanpa kondisi'] = (byKondisi[item.kondisi || 'Tanpa kondisi'] || 0) + quantity
    byLokasi[item.lokasi || 'Tanpa lokasi'] = (byLokasi[item.lokasi || 'Tanpa lokasi'] || 0) + quantity
  }
  const month = new Date().toISOString().slice(0, 7)
  const currentMutations = mutations.filter(row => String(row.tanggal_transaksi).startsWith(month))
  const activeUnitIds = new Set(loans.filter(item => !item.batch_id && !item.is_returned && item.id_ht).map(item => item.id_ht))
  const unitAvailable = units.filter(item => item.kondisi === 'Baik' && !activeUnitIds.has(item.id)).length
  const unitBorrowed = activeUnitIds.size
  const unitDamaged = units.filter(item => item.kondisi !== 'Baik').length
  return {
    units, batches, loans, mutations,
    totalUnit: units.length,
    totalBatch: sum(batches, 'jumlah_awal'),
    totalAlat: units.length + sum(batches, 'jumlah_awal'),
    tersedia: unitAvailable + sum(batches, 'jumlah_tersedia'),
    dipinjam: unitBorrowed + sum(batches, 'jumlah_dipinjam'),
    rusak: unitDamaged + sum(batches, 'jumlah_rusak'),
    hilang: sum(batches, 'jumlah_hilang'),
    byKategori, byKondisi, byLokasi,
    aktivitas: ['MASUK', 'PINJAM', 'KEMBALI', 'RUSAK'].reduce((acc, type) => ({ ...acc, [type]: sum(currentMutations.filter(row => row.jenis_mutasi === type), 'jumlah') }), {}),
    pinjamanAktif: loans.filter(item => !item.is_returned).reduce((total, item) => total + Math.max(0, Number(item.jumlah || 1) - Number(item.jumlah_dikembalikan || 0)), 0)
  }
}
