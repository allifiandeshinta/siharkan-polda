export function computeStats(inventaris, pinjaman, suku_cadang, tracking, rekap = []) {
  const totalAlat = inventaris.length
  const alatBaik = inventaris.filter(i => i.kondisi === 'Baik').length
  const alatRR = inventaris.filter(i => i.kondisi === 'Rusak Ringan').length
  const alatRB = inventaris.filter(i => i.kondisi === 'Rusak Berat').length

  // Rekap inventaris adalah snapshot agregat (4.184 HT), bukan per-unit.
  // Gunakan ini untuk total per kategori & HT agar dashboard akurat.
  const byKategori = rekap.length
    ? rekap.reduce((acc, item) => {
        const k = item.kategori
        acc[k] = (acc[k] || 0) + (item.jumlah || 0)
        return acc
      }, {})
    : inventaris.reduce((acc, item) => {
        const k = item.kategori || item.kategori_id
        acc[k] = (acc[k] || 0) + 1
        return acc
      }, {})

  const useRekap = rekap.length > 0
  const htList = useRekap
    ? rekap.filter(r => r.kategori === 'HT')
    : inventaris.filter(i => (i.kategori === 'HT' || i.kategori_id === 'HT'))
  // Rekap: jumlah adalah agregat. Fallback (tanpa rekap): hitung per-unit (1 per baris).
  const htValue = (h) => useRekap ? (h.jumlah || 0) : 1
  const totalHT = htList.reduce((a, h) => a + htValue(h), 0)
  const htBaik = htList.filter(h => (h.kondisi || 'Baik') === 'Baik').reduce((a, h) => a + htValue(h), 0)
  const htRR = htList.filter(h => (h.kondisi || '') === 'Rusak Ringan').reduce((a, h) => a + htValue(h), 0)
  const htRB = htList.filter(h => (h.kondisi || '') === 'Rusak Berat').reduce((a, h) => a + htValue(h), 0)

  const pinjamanAktif = pinjaman.filter(p => p.status === 'Dipinjam').length
  const pinjamanKembali = pinjaman.filter(p => p.status === 'Dikembalikan').length
  const pinjamanTerlambat = pinjaman.filter(p => p.status === 'Terlambat').length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pinjamanJatuhTempo = pinjaman.filter(p => {
    if (p.status !== 'Dipinjam') return false
    const tgl = new Date(p.tgl_kembali)
    tgl.setHours(0, 0, 0, 0)
    const diff = Math.ceil((tgl - today) / 86400000)
    return diff >= 0 && diff < 3
  }).length

  const scTotal = suku_cadang.length
  const scMenipis = suku_cadang.filter(s => s.stok < s.min_stok).length
  const scAman = suku_cadang.filter(s => s.stok >= s.min_stok).length
  const scTransaksiBln = suku_cadang.reduce((a, s) => a + (s.transaksi_bln || 0), 0)
  const trkTotal = tracking.length
  const trkBelum = tracking.filter(t => t.status === 'Belum Ditindaklanjuti').length
  const trkProses = tracking.filter(t => t.status === 'Proses').length
  const trkSelesai = tracking.filter(t => t.status === 'Selesai').length
  const trkBerjalan = trkBelum + trkProses

  const pctBaik = totalHT ? Math.round(htBaik / totalHT * 100) : 0
  const pctRR = totalHT ? Math.round(htRR / totalHT * 100) : 0
  const pctRB = totalHT ? Math.round(htRB / totalHT * 100) : 0
  const pctSelesai = trkTotal ? Math.round(trkSelesai / trkTotal * 100) : 0
  const pctProses = trkTotal ? Math.round(trkProses / trkTotal * 100) : 0
  const pctBelum = trkTotal ? Math.round(trkBelum / trkTotal * 100) : 0

  return {
    satwilCount: 6,
    totalHT, htBaik, htRusakRingan: htRR, htRusakBerat: htRB, htDipinjam: pinjamanAktif,
    totalAlat, alatBaik, alatRusakRingan: alatRR, alatRusakBerat: alatRB,
    totalTikOnly: totalAlat - totalHT,
    byKategori,
    pinjamanAktif, pinjamanKembali, pinjamanTerlambat, pinjamanJatuhTempo,
    scTotal, scAman, scMenipis, scTransaksiBln,
    trkTotal, trkBelum, trkProses, trkSelesai, trkBerjalan,
    // Aliases consumed by DashboardPage and TrackingPage stat cards
    totalAduan: trkTotal,
    aduanOpen: trkBelum,
    aduanProses: trkProses,
    aduanSelesai: trkSelesai,
    pctBaik, pctRR, pctRB,
    pctSelesai, pctProses, pctBelum,
    donutHT() {
      const b = pctBaik; const rr = pctRR
      return `conic-gradient(var(--green) 0% ${b}%, var(--amber) ${b}% ${b + rr}%, var(--red) ${b + rr}% 100%)`
    },
    donutTracking() {
      const s = pctSelesai; const pr = pctProses
      return `conic-gradient(var(--green) 0% ${s}%, var(--polri-gold) ${s}% ${s + pr}%, var(--red) ${s + pr}% 100%)`
    }
  }
}
