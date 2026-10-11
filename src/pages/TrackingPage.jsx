import { useState, useEffect, useMemo, useRef } from 'react'
import { getAllTracking, createTracking, updateTracking, deleteTracking } from '../services/tracking'
import { uploadAndValidate } from '../services/storageUpload'
import { getAllInventaris } from '../services/inventaris'
import { getAllPinjaman } from '../services/pinjaman'
import { getAllSukuCadang } from '../services/sukuCadang'
import { getSatwilList } from '../services/reference'
import { computeStats } from '../services/stats'
import { useSearch, usePagination } from '../hooks'
import { useToast } from '../hooks/useToast'
import { useExport } from '../hooks/useExport'
import { SearchBox, Select, Table, Pagination, StatCard, Badge, IconButton, ToastContainer, ConfirmModal, LoadingSpinner, Modal } from '../components/ui'

const statusOptions = ['Belum Ditindaklanjuti', 'Proses', 'Selesai']
const statusVariant = (s) => s === 'Belum Ditindaklanjuti' ? 'red' : s === 'Proses' ? 'amber' : 'green'
const emptyForm = { satwil: '', jenis: '', tgl: '', status: 'Belum Ditindaklanjuti', keterangan: '', file: null }

export default function TrackingPage() {
  const [trackingData, setTrackingData] = useState([])
  const [satwilList, setSatwilList] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error } = useToast()
  const { handleExport } = useExport()
  const fileInputRef = useRef(null)

  const [filterStatus, setFilterStatus] = useState('')
  const [filterLayanan, setFilterLayanan] = useState('')

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function loadData() {
    let cancelled = false
    try {
      setLoading(true)
      const [tracking, inventaris, pinjaman, sukuCadang, satwil] = await Promise.all([
        getAllTracking(), getAllInventaris(), getAllPinjaman(), getAllSukuCadang(), getSatwilList()
      ])
      if (cancelled) return
      setTrackingData(tracking)
      setSatwilList(satwil)
      setStats(computeStats(inventaris, pinjaman, sukuCadang, tracking))
    } catch (err) {
      if (!cancelled) error('Gagal memuat data tracking')
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredByCategory = useMemo(() => {
    let result = [...trackingData]
    if (filterStatus) result = result.filter(i => i.status === filterStatus)
    if (filterLayanan) result = result.filter(i => i.jenis === filterLayanan)
    return result
  }, [trackingData, filterStatus, filterLayanan])

  const { searchTerm, setSearchTerm, filtered } = useSearch(filteredByCategory, ['satwil', 'jenis'])
  const { currentPage, setCurrentPage, paginatedData, totalPages } = usePagination(filtered, 10)

  const uniqueLayanan = [...new Set(trackingData.map(i => i.jenis))]

  function openCreateForm() {
    setForm({ ...emptyForm, tgl: new Date().toISOString().split('T')[0] })
    setEditingId(null)
    setFormErrors({})
    setShowForm(true)
  }

  function openEditForm(item) {
    setForm({ id: item.id, satwil: item.satwil, jenis: item.jenis, tgl: item.tgl, status: item.status || 'Belum Ditindaklanjuti', keterangan: item.keterangan || '', file_url: item.file_url || '', file: null })
    setEditingId(item.id)
    setFormErrors({})
    setShowForm(true)
  }

  function validate() {
    const errs = {}
    if (!form.satwil) errs.satwil = 'Pilih Satker Mapolda'
    if (!form.jenis.trim()) errs.jenis = 'Jenis layanan harus diisi'
    if (!form.tgl) errs.tgl = 'Tanggal harus diisi'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      let fileUrl = form.file_url || ''
      if (form.file) {
        const uploadResult = await uploadAndValidate(form.file, 'tracking')
        fileUrl = uploadResult.url
      }

      const payload = { satwil: form.satwil, jenis: form.jenis, tgl: form.tgl, status: form.status, file_url: fileUrl }

      const nextId = `ADU-${String(trackingData.length + 1).padStart(3, '0')}`
      if (editingId) {
        await updateTracking(editingId, payload)
        success('Data aduan berhasil diperbarui')
      } else {
        await createTracking({ ...payload, id: nextId })
        success('Data aduan berhasil ditambahkan')
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      error('Gagal menyimpan data aduan')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTracking(deleteTarget.id)
      success('Data aduan berhasil dihapus')
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      error('Gagal menghapus data aduan')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { label: 'ID Aduan', key: 'id', cellClass: 'cell-strong' },
    { label: 'Satwil', key: 'satwil' },
    { label: 'Jenis', key: 'jenis' },
    { label: 'Tgl Aduan', key: 'tgl' },
    { label: 'Status', render: (i) => <Badge variant={statusVariant(i.status)}>{i.status}</Badge> },
  ]

  const renderActions = (item) => (
    <div className="row-actions">
      <IconButton icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>} className="btn-icon" onClick={() => openEditForm(item)} />
      <IconButton icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>} className="btn-icon" onClick={() => setDeleteTarget(item)} />
    </div>
  )

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal open={!!deleteTarget} title="Hapus Aduan" message={`Yakin ingin menghapus aduan ${deleteTarget?.id}?`} confirmLabel="Hapus" confirmVariant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <div className="page-head">
        <div><h1>Tracking Perbaikan</h1><p>Pantau dan kelola aduan perbaikan perangkat TIK dari seluruh Satwil.</p></div>
        <div className="head-actions">
          <button className="btn" onClick={() => {
            const result = handleExport(filtered, 'tracking.csv')
            if (result.success) success(result.message)
            else error(result.message)
          }}>Export</button>
          <button className="btn btn-primary" onClick={openCreateForm}>+ Tambah Aduan</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Aduan" value={stats.totalAduan || 0} delta={{ text: 'Tercatat di sistem' }} variant="blue" />
        <StatCard label="Belum Ditindaklanjuti" value={stats.aduanOpen || 0} delta={{ text: 'Butuh tindakan segera' }} variant="red" />
        <StatCard label="Sedang Diproses" value={stats.aduanProses || 0} delta={{ text: 'Dalam pengerjaan' }} variant="amber" />
        <StatCard label="Selesai" value={stats.aduanSelesai || 0} delta={{ text: 'Sepanjang 2026' }} variant="green" />
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchBox placeholder="Cari satwil atau jenis layanan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
          <Select className="filter-btn" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} placeholder="Semua Status" options={statusOptions} style={{ minWidth: 160 }} />
          <Select className="filter-btn" value={filterLayanan} onChange={e => setFilterLayanan(e.target.value)} placeholder="Semua Layanan" options={uniqueLayanan} style={{ minWidth: 160 }} />
        </div>
        {loading ? <LoadingSpinner text="Memuat data..." /> : (
          <>
            <Table columns={columns} data={paginatedData} emptyMessage="Tidak ada data yang sesuai"
              actions={renderActions} id="tabel-tracking" />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={10} totalItems={filtered.length} />
          </>
        )}
      </div>

      <Modal open={showForm} title={editingId ? 'Edit Aduan' : 'Tambah Aduan'} onClose={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Satker Mapolda <span className="req">*</span></label>
              <select value={form.satwil} onChange={e => setForm({ ...form, satwil: e.target.value })}>
                <option value="">Pilih Satker Mapolda</option>
                {satwilList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {formErrors.satwil && <div className="form-error">{formErrors.satwil}</div>}
            </div>
            <div className="field">
              <label>Jenis Layanan <span className="req">*</span></label>
              <input type="text" placeholder="Contoh: Perbaikan HT" value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })} />
              {formErrors.jenis && <div className="form-error">{formErrors.jenis}</div>}
            </div>
            <div className="field">
              <label>Tanggal Aduan <span className="req">*</span></label>
              <input type="date" value={form.tgl} onChange={e => setForm({ ...form, tgl: e.target.value })} />
              {formErrors.tgl && <div className="form-error">{formErrors.tgl}</div>}
            </div>
            <div className="field">
              <label>Status Progress <span className="req">*</span></label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>Keterangan Aduan</label>
              <textarea placeholder="Jelaskan kendala atau kerusakan yang dialami" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} />
            </div>
            <div className="field full">
              <label>Upload File Pendukung</label>
              <div className="upload-box" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" ref={fileInputRef} onChange={e => setForm({ ...form, file: e.target.files[0] })} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div className="t">
                  {form.file ? form.file.name : (
                    <>Klik untuk unggah atau <span>seret file ke sini</span></>
                  )}
                </div>
                <div className="upload-hint">Format file: PDF, JPG, JPEG, PNG | Maksimal ukuran file: 10 MB</div>
              </div>
            </div>
          </div>
          <div className="form-actions" style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
            <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : (editingId ? 'Perbarui Data' : 'Simpan Data')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
