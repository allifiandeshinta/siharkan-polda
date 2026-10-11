import ExcelJS from 'exceljs'

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF17365D' } // Polri Navy Blue
}

const HEADER_FONT = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' }
}

const BORDER_STYLE = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
}

function applySheetFormatting(sheet, columns, rows) {
  sheet.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width || 20 }))

  if (rows && rows.length > 0) {
    rows.forEach((row, index) => {
      const addedRow = sheet.addRow({ no: index + 1, ...row })
      addedRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = BORDER_STYLE
        cell.alignment = { vertical: 'middle' }
      })
    })
  } else {
    const emptyRow = sheet.addRow({ no: '-', [columns[1]?.key || 'info']: 'Tidak ada data pada periode ini' })
    emptyRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDER_STYLE
      cell.font = { italic: true, color: { argb: 'FF6B7280' } }
    })
  }

  // Style Header Row
  const headerRow = sheet.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = BORDER_STYLE
  })

  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  if (sheet.columnCount) {
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } }
  }

  // Adjust column widths based on content
  sheet.columns.forEach((column) => {
    let maxLength = column.header ? String(column.header).length : 10
    column.values?.forEach((val) => {
      if (val !== null && val !== undefined) {
        maxLength = Math.max(maxLength, String(val).length)
      }
    })
    column.width = Math.min(45, Math.max(column.width || 14, maxLength + 3))
  })
}

export async function exportLaporanExcel(report) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SIHARKAN TIK Polda DIY'
  workbook.created = new Date()

  const summary = report.summary || {}
  const dashboard = report.dashboard || {}
  const periodLabel = report.period === 'all' ? 'Semua Periode' : report.period

  // ==========================================
  // 1. SHEET: Ringkasan
  // ==========================================
  const summarySheet = workbook.addWorksheet('Ringkasan')
  summarySheet.columns = [
    { header: 'KATEGORI / METRIK', key: 'metrik', width: 38 },
    { header: 'JUMLAH / NILAI', key: 'nilai', width: 25 },
    { header: 'KETERANGAN', key: 'keterangan', width: 35 }
  ]

  const summaryData = [
    { metrik: 'Periode Laporan', nilai: periodLabel, keterangan: 'Bulan terpilih' },
    { metrik: 'Tanggal Export', nilai: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), keterangan: 'Waktu generate data' },
    { metrik: '', nilai: '', keterangan: '' },
    { metrik: '--- 1. DATA ALAT TIK ---', nilai: '', keterangan: '' },
    { metrik: 'Total Seluruh Alat', nilai: summary.totalAlat ?? dashboard.totalAlat ?? 0, keterangan: 'Unit & Batch terdaftar' },
    { metrik: 'Alat Tersedia', nilai: summary.tersedia ?? dashboard.tersedia ?? 0, keterangan: 'Kondisi baik & tidak dipinjam' },
    { metrik: 'Alat Dipinjam', nilai: summary.dipinjam ?? dashboard.dipinjam ?? 0, keterangan: 'Sedang digunakan satuan kerja' },
    { metrik: 'Alat Rusak', nilai: summary.rusak ?? dashboard.rusak ?? 0, keterangan: 'Rusak Ringan & Rusak Berat' },
    { metrik: 'Alat Hilang', nilai: summary.hilang ?? dashboard.hilang ?? 0, keterangan: 'Aset tidak ditemukan' },
    { metrik: '', nilai: '', keterangan: '' },
    { metrik: '--- 2. TRACKING ADUAN PERBAIKAN ---', nilai: '', keterangan: '' },
    { metrik: 'Total Aduan Masuk', nilai: summary.totalTracking ?? report.tracking?.length ?? 0, keterangan: 'Total laporan pada periode ini' },
    { metrik: 'Aduan Belum Ditindaklanjuti', nilai: summary.trackingBelum ?? 0, keterangan: 'Perlu verifikasi & penanganan' },
    { metrik: 'Aduan Sedang Diproses', nilai: summary.trackingProses ?? 0, keterangan: 'Dalam proses perbaikan teknisi' },
    { metrik: 'Aduan Selesai', nilai: summary.trackingSelesai ?? 0, keterangan: 'Perangkat selesai diperbaiki' },
    { metrik: '', nilai: '', keterangan: '' },
    { metrik: '--- 3. PEMINJAMAN HT ---', nilai: '', keterangan: '' },
    { metrik: 'Total Transaksi Pinjam', nilai: summary.totalPinjaman ?? report.pinjaman?.length ?? 0, keterangan: 'Transaksi periode ini' },
    { metrik: 'Sedang Dipinjam (Aktif)', nilai: summary.pinjamanAktif ?? 0, keterangan: 'Belum dikembalikan' },
    { metrik: 'Sudah Dikembalikan', nilai: summary.pinjamanKembali ?? 0, keterangan: 'Telah selesai digunakan' },
    { metrik: '', nilai: '', keterangan: '' },
    { metrik: '--- 4. SUKU CADANG & SPPM ---', nilai: '', keterangan: '' },
    { metrik: 'Total Jenis Suku Cadang', nilai: summary.totalSukuCadang ?? report.sukuCadang?.length ?? 0, keterangan: 'Item katalog suku cadang' },
    { metrik: 'Suku Cadang Stok Menipis', nilai: summary.scMenipis ?? 0, keterangan: 'Di bawah batas minimum stok' },
    { metrik: 'Total Surat SPPM', nilai: summary.totalSPPM ?? report.sppm?.length ?? 0, keterangan: 'Mabes Polri & Polres jajaran' }
  ]

  summaryData.forEach((row) => {
    const r = summarySheet.addRow(row)
    if (row.metrik.startsWith('---')) {
      r.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FF17365D' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      })
    } else if (row.metrik) {
      r.eachCell((cell) => { cell.border = BORDER_STYLE })
    }
  })

  const sumHeader = summarySheet.getRow(1)
  sumHeader.height = 28
  sumHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  // ==========================================
  // 2. SHEET: Data Alat TIK
  // ==========================================
  const invColumns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'TIPE', key: 'tipe_data', width: 10 },
    { header: 'NO. SERI / BATCH', key: 'nomor', width: 22 },
    { header: 'NAMA PERANGKAT', key: 'nama', width: 28 },
    { header: 'KATEGORI', key: 'kategori', width: 14 },
    { header: 'MERK', key: 'merk', width: 16 },
    { header: 'MODEL', key: 'model', width: 16 },
    { header: 'KONDISI', key: 'kondisi', width: 14 },
    { header: 'LOKASI / SATWIL', key: 'lokasi', width: 22 },
    { header: 'JUMLAH TOTAL', key: 'jumlah_awal', width: 14 },
    { header: 'TERSEDIA', key: 'jumlah_tersedia', width: 12 },
    { header: 'DIPINJAM', key: 'jumlah_dipinjam', width: 12 },
    { header: 'RUSAK', key: 'jumlah_rusak', width: 10 },
    { header: 'TANGGAL MASUK', key: 'tanggal', width: 16 }
  ]
  const invRows = (report.inventory || []).map(item => ({
    tipe_data: item.tipe_data || 'Unit',
    nomor: item.nomor || item.serial_number || item.id || '-',
    nama: item.nama || '-',
    kategori: item.kategori || '-',
    merk: item.merk || '-',
    model: item.model || '-',
    kondisi: item.kondisi || 'Baik',
    lokasi: item.lokasi || item.satwil || '-',
    jumlah_awal: item.jumlah_awal || item.jumlah || 1,
    jumlah_tersedia: item.jumlah_tersedia ?? (item.kondisi === 'Baik' ? 1 : 0),
    jumlah_dipinjam: item.jumlah_dipinjam ?? 0,
    jumlah_rusak: item.jumlah_rusak ?? (item.kondisi !== 'Baik' ? 1 : 0),
    tanggal: item.tanggal || item.tgl || '-'
  }))
  applySheetFormatting(workbook.addWorksheet('Data Alat TIK'), invColumns, invRows)

  // ==========================================
  // 3. SHEET: Mutasi Inventaris
  // ==========================================
  const mutasiColumns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'TANGGAL', key: 'tanggal_transaksi', width: 16 },
    { header: 'JENIS MUTASI', key: 'jenis_mutasi', width: 16 },
    { header: 'JUMLAH', key: 'jumlah', width: 12 },
    { header: 'LOKASI ASAL', key: 'lokasi_asal', width: 22 },
    { header: 'LOKASI TUJUAN', key: 'lokasi_tujuan', width: 22 },
    { header: 'KETERANGAN', key: 'keterangan', width: 30 }
  ]
  const mutasiRows = (report.mutasi || []).map(item => ({
    tanggal_transaksi: item.tanggal_transaksi || item.tgl || '-',
    jenis_mutasi: item.jenis_mutasi || '-',
    jumlah: item.jumlah || 0,
    lokasi_asal: item.lokasi_asal || '-',
    lokasi_tujuan: item.lokasi_tujuan || '-',
    keterangan: item.keterangan || '-'
  }))
  applySheetFormatting(workbook.addWorksheet('Mutasi Inventaris'), mutasiColumns, mutasiRows)

  // ==========================================
  // 4. SHEET: Peminjaman HT
  // ==========================================
  const pinjamColumns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'SATWIL / PEMINJAM', key: 'satwil', width: 22 },
    { header: 'JENIS HT', key: 'jenis_ht', width: 18 },
    { header: 'MERK / MODEL', key: 'merk_model', width: 20 },
    { header: 'NO. SERI / BATCH', key: 'serial_number', width: 22 },
    { header: 'JUMLAH', key: 'jumlah', width: 10 },
    { header: 'TGL PINJAM', key: 'tgl_pinjam', width: 15 },
    { header: 'TGL RENCANA KEMBALI', key: 'tgl_kembali', width: 20 },
    { header: 'STATUS', key: 'status', width: 16 },
    { header: 'KETERANGAN', key: 'keterangan', width: 30 }
  ]
  const pinjamRows = (report.pinjaman || []).map(item => ({
    satwil: item.satwil || '-',
    jenis_ht: item.jenis_ht || '-',
    merk_model: [item.merk, item.model].filter(Boolean).join(' ') || item.jenis_ht || '-',
    serial_number: item.serial_number || item.id_ht || '-',
    jumlah: item.jumlah || 1,
    tgl_pinjam: item.tgl_pinjam || '-',
    tgl_kembali: item.tgl_kembali || '-',
    status: item.is_returned ? 'Dikembalikan' : (item.status || 'Dipinjam'),
    keterangan: item.keterangan || '-'
  }))
  applySheetFormatting(workbook.addWorksheet('Peminjaman HT'), pinjamColumns, pinjamRows)

  // ==========================================
  // 5. SHEET: Suku Cadang
  // ==========================================
  const scColumns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'NAMA SUKU CADANG', key: 'nama', width: 32 },
    { header: 'KATEGORI', key: 'kategori_sc', width: 16 },
    { header: 'SATUAN', key: 'satuan', width: 10 },
    { header: 'STOK AWAL', key: 'stok_awal', width: 12 },
    { header: 'TERIMA', key: 'terima', width: 12 },
    { header: 'DIGUNAKAN', key: 'digunakan', width: 14 },
    { header: 'SISA STOK', key: 'stok', width: 12 },
    { header: 'MIN STOK', key: 'min_stok', width: 12 },
    { header: 'STATUS', key: 'status', width: 16 }
  ]
  const scRows = (report.sukuCadang || []).map(item => ({
    nama: item.nama || '-',
    kategori_sc: item.kategori_sc || '-',
    satuan: item.satuan || 'pcs',
    stok_awal: item.stok_awal ?? 0,
    terima: item.terima ?? 0,
    digunakan: item.digunakan ?? 0,
    stok: item.stok ?? 0,
    min_stok: item.min_stok ?? 0,
    status: item.stok < item.min_stok ? 'Stok Menipis' : 'Stok Aman'
  }))
  applySheetFormatting(workbook.addWorksheet('Suku Cadang'), scColumns, scRows)

  // ==========================================
  // 6. SHEET: SPPM
  // ==========================================
  const sppmColumns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'NOMOR DOKUMEN SPPM', key: 'nomor', width: 32 },
    { header: 'SUMBER', key: 'sumber', width: 16 },
    { header: 'PERIHAL / KETERANGAN', key: 'perihal', width: 36 },
    { header: 'TANGGAL SURAT', key: 'tgl', width: 16 },
    { header: 'LINK FILE', key: 'file_url', width: 35 }
  ]
  const sppmRows = (report.sppm || []).map(item => ({
    nomor: item.nomor || '-',
    sumber: item.sumber || '-',
    perihal: item.perihal || '-',
    tgl: item.tgl || '-',
    file_url: item.file_url || '-'
  }))
  applySheetFormatting(workbook.addWorksheet('SPPM'), sppmColumns, sppmRows)

  // ==========================================
  // 7. SHEET: Tracking Perbaikan (Bagian 3)
  // ==========================================
  const trackingColumns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'ID ADUAN', key: 'id', width: 16 },
    { header: 'SATKER / SATWIL', key: 'satwil', width: 24 },
    { header: 'JENIS LAYANAN / ADUAN', key: 'jenis', width: 26 },
    { header: 'TANGGAL ADUAN', key: 'tgl', width: 16 },
    { header: 'STATUS PENGERJAAN', key: 'status', width: 22 },
    { header: 'LINK FILE PENDUKUNG', key: 'file_url', width: 35 }
  ]
  const trackingRows = (report.tracking || []).map(item => ({
    id: item.id || '-',
    satwil: item.satwil || '-',
    jenis: item.jenis || '-',
    tgl: item.tgl || (item.created_at ? item.created_at.slice(0, 10) : '-'),
    status: item.status || 'Belum Ditindaklanjuti',
    file_url: item.file_url || '-'
  }))
  applySheetFormatting(workbook.addWorksheet('Tracking Perbaikan'), trackingColumns, trackingRows)

  // Generate and Download Excel
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan_siharkan_tik_${report.period || 'rekap'}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
