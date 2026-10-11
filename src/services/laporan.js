import { getDashboardData } from './dashboard'
import { getAllSukuCadang } from './sukuCadang'
import { getAllSPPM } from './sppm'
import { getAllTracking } from './tracking'

export function inPeriod(value, period) {
  if (!period || period === 'all') return true
  if (!value) return false
  const str = String(value).trim()
  return str.startsWith(period) || str.slice(0, 7) === period
}

export async function getLaporanData(filters = {}) {
  const period = filters.period || new Date().toISOString().slice(0, 7)
  const [dashboard, sukuCadang, sppm, tracking] = await Promise.all([
    getDashboardData(),
    getAllSukuCadang(),
    getAllSPPM(),
    getAllTracking()
  ])

  const filter = row => (
    (!filters.kategori || row.kategori === filters.kategori) &&
    (!filters.lokasi || row.lokasi === filters.lokasi || row.satwil === filters.lokasi) &&
    (!filters.kondisi || row.kondisi === filters.kondisi)
  )

  const inventory = [
    ...dashboard.units.map(row => ({
      ...row,
      tipe_data: 'Unit',
      nomor: row.serial_number || row.id,
      jumlah_awal: 1,
      jumlah_tersedia: row.kondisi === 'Baik' ? 1 : 0,
      jumlah_dipinjam: 0,
      jumlah_rusak: row.kondisi === 'Baik' ? 0 : 1,
      jumlah_hilang: 0,
      tanggal: row.tgl || (row.created_at ? row.created_at.slice(0, 10) : '')
    })),
    ...dashboard.batches.map(row => ({
      ...row,
      tipe_data: 'Batch',
      nomor: row.nomor_batch || '-',
      tanggal: row.tanggal_masuk || (row.created_at ? row.created_at.slice(0, 10) : '')
    }))
  ].filter(row => inPeriod(row.tanggal, period) && filter(row))

  const pinjaman = (dashboard.loans || []).filter(row =>
    inPeriod(row.tgl_pinjam || (row.created_at ? row.created_at.slice(0, 10) : ''), period) &&
    (!filters.lokasi || row.satwil === filters.lokasi)
  )

  const mutasi = (dashboard.mutations || []).filter(row =>
    inPeriod(row.tanggal_transaksi || (row.created_at ? row.created_at.slice(0, 10) : ''), period)
  )

  const sppmFiltered = (sppm || []).filter(row =>
    inPeriod(row.tgl || (row.created_at ? row.created_at.slice(0, 10) : ''), period)
  )

  const trackingFiltered = (tracking || []).filter(row => {
    const rowDate = row.tgl || (row.created_at ? row.created_at.slice(0, 10) : '')
    const matchPeriod = inPeriod(rowDate, period)
    const matchSatwil = !filters.lokasi || row.satwil === filters.lokasi
    const matchStatus = !filters.status || row.status === filters.status
    return matchPeriod && matchSatwil && matchStatus
  })

  const summary = {
    totalAlat: dashboard.totalAlat,
    tersedia: dashboard.tersedia,
    dipinjam: dashboard.dipinjam,
    rusak: dashboard.rusak,
    hilang: dashboard.hilang,
    totalMutasi: mutasi.length,
    totalPinjaman: pinjaman.length,
    pinjamanAktif: pinjaman.filter(p => p.status === 'Dipinjam' || !p.is_returned).length,
    pinjamanKembali: pinjaman.filter(p => p.status === 'Dikembalikan' || p.is_returned).length,
    totalSukuCadang: sukuCadang.length,
    scMenipis: sukuCadang.filter(s => s.stok < s.min_stok).length,
    totalSPPM: sppmFiltered.length,
    totalTracking: trackingFiltered.length,
    trackingBelum: trackingFiltered.filter(t => t.status === 'Belum Ditindaklanjuti').length,
    trackingProses: trackingFiltered.filter(t => t.status === 'Proses').length,
    trackingSelesai: trackingFiltered.filter(t => t.status === 'Selesai').length
  }

  return {
    period,
    dashboard,
    summary,
    inventory,
    mutasi,
    pinjaman,
    sukuCadang,
    sppm: sppmFiltered,
    tracking: trackingFiltered
  }
}

