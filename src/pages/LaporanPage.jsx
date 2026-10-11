import { useEffect, useState, useMemo } from 'react'
import { getLaporanData } from '../services/laporan'
import { getSatwilList, getKategoriList } from '../services/reference'
import { exportLaporanExcel } from '../utils/exportToExcel'
import { useSearch, usePagination } from '../hooks'
import { useToast } from '../hooks/useToast'
import {
  LoadingSpinner,
  Table,
  Badge,
  TypeTag,
  StatCard,
  Tabs,
  TabPanel,
  Pagination,
  SearchBox,
  Select,
  ToastContainer
} from '../components/ui'
import { formatTanggal } from '../utils/format'

const tabs = [
  { id: 'tracking', label: 'Tracking Perbaikan' },
  { id: 'inventory', label: 'Data Alat TIK' },
  { id: 'pinjaman', label: 'Peminjaman HT' },
  { id: 'sukuCadang', label: 'Suku Cadang' },
  { id: 'sppm', label: 'Data SPPM' },
  { id: 'mutasi', label: 'Mutasi Inventaris' }
]

const statusVariant = (s) =>
  s === 'Belum Ditindaklanjuti' || s === 'Terlambat'
    ? 'red'
    : s === 'Proses' || s === 'Jatuh Tempo' || s === 'Rusak Ringan'
    ? 'amber'
    : s === 'Dipinjam'
    ? 'blue'
    : 'green'

export default function LaporanPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [isAllPeriod, setIsAllPeriod] = useState(false)
  const [activeTab, setActiveTab] = useState('tracking')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [satwilList, setSatwilList] = useState([])
  const [kategoriList, setKategoriList] = useState([])

  const { toasts, success, error } = useToast()

  // Local filter states
  const [filterSatwil, setFilterSatwil] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKategori, setFilterKategori] = useState('')

  useEffect(() => {
    getSatwilList().then(setSatwilList).catch(() => {})
    getKategoriList().then(setKategoriList).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    const targetPeriod = isAllPeriod ? 'all' : period
    getLaporanData({ period: targetPeriod })
      .then((data) => {
        if (active) setReport(data)
      })
      .catch((err) => {
        if (active) error(err.message || 'Gagal memuat data laporan')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [period, isAllPeriod])

  const handleExport = async () => {
    if (!report) return
    try {
      setExporting(true)
      await exportLaporanExcel(report)
      success('Laporan Excel berhasil diunduh (7 Sheet Lengkap)')
    } catch (err) {
      error(err.message || 'Gagal mengekspor laporan ke Excel')
    } finally {
      setExporting(false)
    }
  }

  // Active Tab Data & Filtering
  const activeData = useMemo(() => {
    if (!report) return []
    switch (activeTab) {
      case 'tracking': {
        let list = report.tracking || []
        if (filterSatwil) list = list.filter((i) => i.satwil === filterSatwil)
        if (filterStatus) list = list.filter((i) => i.status === filterStatus)
        return list
      }
      case 'inventory': {
        let list = report.inventory || []
        if (filterSatwil) list = list.filter((i) => i.lokasi === filterSatwil)
        if (filterKategori) list = list.filter((i) => i.kategori === filterKategori)
        return list
      }
      case 'pinjaman': {
        let list = report.pinjaman || []
        if (filterSatwil) list = list.filter((i) => i.satwil === filterSatwil)
        if (filterStatus) list = list.filter((i) => i.status === filterStatus)
        return list
      }
      case 'sukuCadang': {
        let list = report.sukuCadang || []
        if (filterKategori) list = list.filter((i) => i.kategori_sc === filterKategori)
        return list
      }
      case 'sppm': {
        return report.sppm || []
      }
      case 'mutasi': {
        return report.mutasi || []
      }
      default:
        return []
    }
  }, [report, activeTab, filterSatwil, filterStatus, filterKategori])

  const searchKeys = useMemo(() => {
    switch (activeTab) {
      case 'tracking':
        return ['id', 'satwil', 'jenis', 'status']
      case 'inventory':
        return ['nama', 'merk', 'model', 'nomor', 'lokasi', 'kategori']
      case 'pinjaman':
        return ['satwil', 'jenis_ht', 'merk', 'model', 'serial_number', 'status']
      case 'sukuCadang':
        return ['nama', 'kategori_sc']
      case 'sppm':
        return ['nomor', 'sumber', 'perihal']
      case 'mutasi':
        return ['jenis_mutasi', 'lokasi_asal', 'lokasi_tujuan', 'keterangan']
      default:
        return []
    }
  }, [activeTab])

  const { searchTerm, setSearchTerm, filtered } = useSearch(activeData, searchKeys)
  const { currentPage, setCurrentPage, paginatedData, totalPages } = usePagination(filtered, 10)

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1)
    setSearchTerm('')
  }, [activeTab, filterSatwil, filterStatus, filterKategori])

  // Column definitions
  const trackingColumns = [
    { label: 'ID Aduan', key: 'id', cellClass: 'cell-strong' },
    { label: 'Satker / Satwil', key: 'satwil' },
    { label: 'Jenis Layanan / Aduan', key: 'jenis' },
    { label: 'Tanggal Aduan', render: (i) => formatTanggal(i.tgl) },
    {
      label: 'Status Pengerjaan',
      render: (i) => <Badge variant={statusVariant(i.status)}>{i.status}</Badge>
    },
    {
      label: 'File Pendukung',
      render: (i) =>
        i.file_url ? (
          <a
            href={i.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Lihat File
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
        )
    }
  ]

  const inventoryColumns = [
    {
      label: 'Tipe',
      render: (i) => (
        <Badge variant={i.tipe_data === 'Batch' ? 'blue' : 'gray'}>
          {i.tipe_data || 'Unit'}
        </Badge>
      )
    },
    { label: 'No. Seri / Batch', key: 'nomor', cellClass: 'cell-strong' },
    { label: 'Nama Perangkat', key: 'nama' },
    {
      label: 'Kategori',
      render: (i) => <TypeTag type={String(i.kategori || '').toLowerCase()}>{i.kategori}</TypeTag>
    },
    { label: 'Merk / Model', render: (i) => [i.merk, i.model].filter(Boolean).join(' / ') || '-' },
    { label: 'Kondisi', render: (i) => <Badge variant={statusVariant(i.kondisi)}>{i.kondisi}</Badge> },
    { label: 'Lokasi Satwil', key: 'lokasi' },
    { label: 'Jumlah', render: (i) => i.jumlah_awal || i.jumlah || 1 },
    { label: 'Tanggal', render: (i) => formatTanggal(i.tanggal) }
  ]

  const pinjamanColumns = [
    { label: 'Peminjam / Satwil', key: 'satwil', cellClass: 'cell-strong' },
    { label: 'Jenis HT', key: 'jenis_ht' },
    { label: 'Merk / Model', render: (i) => [i.merk, i.model].filter(Boolean).join(' ') || '-' },
    { label: 'No. Seri / Batch', render: (i) => i.serial_number || i.id_ht || '-' },
    { label: 'Jumlah', render: (i) => i.jumlah || 1 },
    { label: 'Tgl Pinjam', render: (i) => formatTanggal(i.tgl_pinjam) },
    { label: 'Tgl Kembali', render: (i) => formatTanggal(i.tgl_kembali) },
    {
      label: 'Status',
      render: (i) => (
        <Badge variant={statusVariant(i.is_returned ? 'Dikembalikan' : i.status)}>
          {i.is_returned ? 'Dikembalikan' : i.status || 'Dipinjam'}
        </Badge>
      )
    }
  ]

  const sukuCadangColumns = [
    { label: 'Nama Suku Cadang', key: 'nama', cellClass: 'cell-strong' },
    { label: 'Kategori', key: 'kategori_sc' },
    { label: 'Satuan', key: 'satuan' },
    { label: 'Stok Awal', render: (i) => (i.stok_awal ?? 0).toLocaleString('id-ID') },
    { label: 'Terima', render: (i) => (i.terima ?? 0).toLocaleString('id-ID') },
    { label: 'Digunakan', render: (i) => (i.digunakan ?? 0).toLocaleString('id-ID') },
    { label: 'Sisa Stok', render: (i) => (i.stok ?? 0).toLocaleString('id-ID') },
    {
      label: 'Status Persediaan',
      render: (i) => (
        <Badge variant={i.stok < i.min_stok ? 'red' : 'green'}>
          {i.stok < i.min_stok ? 'Stok Menipis' : 'Stok Aman'}
        </Badge>
      )
    }
  ]

  const sppmColumns = [
    { label: 'Nomor Surat', key: 'nomor', cellClass: 'cell-strong' },
    { label: 'Sumber Surat', key: 'sumber' },
    { label: 'Perihal / Keterangan', key: 'perihal' },
    { label: 'Tanggal Surat', render: (i) => formatTanggal(i.tgl) },
    {
      label: 'File Dokumen',
      render: (i) =>
        i.file_url ? (
          <a
            href={i.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Buka PDF
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
        )
    }
  ]

  const mutasiColumns = [
    { label: 'Tanggal Transaksi', render: (i) => formatTanggal(i.tanggal_transaksi) },
    { label: 'Jenis Mutasi', render: (i) => <Badge variant="blue">{i.jenis_mutasi}</Badge> },
    { label: 'Jumlah', key: 'jumlah' },
    { label: 'Lokasi Asal', key: 'lokasi_asal' },
    { label: 'Lokasi Tujuan', key: 'lokasi_tujuan' },
    { label: 'Keterangan', key: 'keterangan' }
  ]

  const summary = report?.summary || {}

  return (
    <div>
      <ToastContainer toasts={toasts} />

      <div className="page-head">
        <div>
          <h1>Laporan Bulanan</h1>
          <p>
            Rekapitulasi terpadu seluruh modul operasional SIHARKAN TIK berdasarkan periode.
          </p>
        </div>
        <div className="head-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Periode:</label>
            <input
              type="month"
              value={period}
              disabled={isAllPeriod}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ minWidth: 150 }}
            />
          </div>
          <button
            type="button"
            className={`btn ${isAllPeriod ? 'btn-primary' : ''}`}
            onClick={() => setIsAllPeriod((prev) => !prev)}
            style={{ fontSize: '13px' }}
          >
            {isAllPeriod ? '✓ Semua Periode' : 'Semua Periode'}
          </button>
          <button
            className="btn btn-primary"
            disabled={loading || !report || exporting}
            onClick={handleExport}
          >
            {exporting ? (
              'Mengekspor Excel...'
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Excel (7 Sheet)
              </>
            )}
          </button>
        </div>
      </div>

      {loading || !report ? (
        <LoadingSpinner text="Memuat rekapitulasi data laporan..." />
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="stat-grid">
            <StatCard
              label="Total Aduan Tracking"
              value={summary.totalTracking || 0}
              delta={{
                text: `${summary.trackingBelum || 0} Open • ${summary.trackingProses || 0} Proses • ${summary.trackingSelesai || 0} Selesai`
              }}
              variant="blue"
            />
            <StatCard
              label="Total Alat TIK"
              value={summary.totalAlat || 0}
              delta={{
                text: `${summary.tersedia || 0} Tersedia • ${summary.dipinjam || 0} Dipinjam`
              }}
              variant="green"
            />
            <StatCard
              label="Peminjaman HT"
              value={summary.totalPinjaman || 0}
              delta={{
                text: `${summary.pinjamanAktif || 0} Aktif Dipinjam`
              }}
              variant="amber"
            />
            <StatCard
              label="Surat SPPM"
              value={summary.totalSPPM || 0}
              delta={{
                text: `${summary.totalSukuCadang || 0} Suku Cadang`
              }}
              variant="gray"
            />
          </div>

          <div className="card">
            {/* Tabs for each Report Section */}
            <Tabs
              tabs={tabs.map((t) => {
                let count = 0
                if (t.id === 'tracking') count = report.tracking?.length || 0
                else if (t.id === 'inventory') count = report.inventory?.length || 0
                else if (t.id === 'pinjaman') count = report.pinjaman?.length || 0
                else if (t.id === 'sukuCadang') count = report.sukuCadang?.length || 0
                else if (t.id === 'sppm') count = report.sppm?.length || 0
                else if (t.id === 'mutasi') count = report.mutasi?.length || 0
                return { ...t, label: `${t.label} (${count})` }
              })}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Filter & Search Toolbar */}
            <div className="toolbar" style={{ marginTop: 16 }}>
              <SearchBox
                placeholder={`Cari dalam ${tabs.find((t) => t.id === activeTab)?.label || 'data'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: 220 }}
              />

              {(activeTab === 'tracking' || activeTab === 'inventory' || activeTab === 'pinjaman') && (
                <Select
                  className="filter-btn"
                  value={filterSatwil}
                  onChange={(e) => setFilterSatwil(e.target.value)}
                  placeholder="Semua Satker / Satwil"
                  options={satwilList}
                  style={{ minWidth: 170 }}
                />
              )}

              {(activeTab === 'tracking' || activeTab === 'pinjaman') && (
                <Select
                  className="filter-btn"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  placeholder="Semua Status"
                  options={
                    activeTab === 'tracking'
                      ? ['Belum Ditindaklanjuti', 'Proses', 'Selesai']
                      : ['Dipinjam', 'Dikembalikan', 'Terlambat', 'Jatuh Tempo']
                  }
                  style={{ minWidth: 150 }}
                />
              )}

              {(activeTab === 'inventory' || activeTab === 'sukuCadang') && (
                <Select
                  className="filter-btn"
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  placeholder="Semua Kategori"
                  options={kategoriList}
                  style={{ minWidth: 150 }}
                />
              )}
            </div>

            {/* Tab Panels */}
            <TabPanel isActive={activeTab === 'tracking'}>
              <Table
                columns={trackingColumns}
                data={paginatedData}
                emptyMessage="Tidak ada data aduan tracking pada periode ini"
                id="tabel-laporan-tracking"
              />
            </TabPanel>

            <TabPanel isActive={activeTab === 'inventory'}>
              <Table
                columns={inventoryColumns}
                data={paginatedData}
                emptyMessage="Tidak ada data inventaris pada periode ini"
                id="tabel-laporan-inventory"
              />
            </TabPanel>

            <TabPanel isActive={activeTab === 'pinjaman'}>
              <Table
                columns={pinjamanColumns}
                data={paginatedData}
                emptyMessage="Tidak ada data peminjaman pada periode ini"
                id="tabel-laporan-pinjaman"
              />
            </TabPanel>

            <TabPanel isActive={activeTab === 'sukuCadang'}>
              <Table
                columns={sukuCadangColumns}
                data={paginatedData}
                emptyMessage="Tidak ada data suku cadang pada periode ini"
                id="tabel-laporan-sukucadang"
              />
            </TabPanel>

            <TabPanel isActive={activeTab === 'sppm'}>
              <Table
                columns={sppmColumns}
                data={paginatedData}
                emptyMessage="Tidak ada data SPPM pada periode ini"
                id="tabel-laporan-sppm"
              />
            </TabPanel>

            <TabPanel isActive={activeTab === 'mutasi'}>
              <Table
                columns={mutasiColumns}
                data={paginatedData}
                emptyMessage="Tidak ada data mutasi pada periode ini"
                id="tabel-laporan-mutasi"
              />
            </TabPanel>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={10}
              totalItems={filtered.length}
            />
          </div>
        </>
      )}
    </div>
  )
}
