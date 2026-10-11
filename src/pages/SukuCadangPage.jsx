import { useState, useEffect } from 'react'
import { getAllSukuCadang, createSukuCadang, updateSukuCadang, deleteSukuCadang } from '../services/sukuCadang'
import { useSearch, usePagination } from '../hooks'
import { useToast } from '../hooks/useToast'
import { useExport } from '../hooks/useExport'
import { SearchBox, Table, Pagination, StatCard, Badge, IconButton, ToastContainer, ConfirmModal, LoadingSpinner, Modal } from '../components/ui'
import { formatSatuan } from '../utils/format'

const emptyForm = { nama: '', satuan: 'pcs', terima: 0, digunakan: 0, stok: 0, stok_awal: 0, min_stok: 0, transaksi_bln: 0, kategori_sc: '', tgl_transaksi: '' }

export default function SukuCadangPage() {
  const [sukuCadangData, setSukuCadangData] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error } = useToast()
  const { handleExport } = useExport()

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await getAllSukuCadang()
        if (!cancelled) setSukuCadangData(data)
      } catch (err) {
        if (!cancelled) error('Gagal memuat data suku cadang')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const scTotal = sukuCadangData.length
  const scMenipis = sukuCadangData.filter(s => s.stok < s.min_stok).length
  const scAman = sukuCadangData.filter(s => s.stok >= s.min_stok).length
  const scTransaksiBln = sukuCadangData.reduce((a, s) => a + (s.transaksi_bln || 0), 0)

  const { searchTerm, setSearchTerm, filtered } = useSearch(sukuCadangData, ['nama', 'kategori_sc'])
  const { currentPage, setCurrentPage, paginatedData, totalPages } = usePagination(filtered, 10)

  function openCreateForm() {
    setForm(emptyForm)
    setEditingId(null)
    setFormErrors({})
    setShowForm(true)
  }

  function openEditForm(item) {
    setForm({ nama: item.nama, satuan: item.satuan, terima: item.terima || 0, digunakan: item.digunakan || 0, stok: item.stok, stok_awal: item.stok_awal || 0, min_stok: item.min_stok, transaksi_bln: item.transaksi_bln, kategori_sc: item.kategori_sc, tgl_transaksi: item.tgl_transaksi || '' })
    setEditingId(item.id)
    setFormErrors({})
    setShowForm(true)
  }

  function validate() {
    const errs = {}
    if (!form.nama.trim()) errs.nama = 'Nama barang harus diisi'
    if (Number(form.stok) < 0) errs.stok = 'Stok tidak boleh negatif'
    if (Number(form.min_stok) < 0) errs.min_stok = 'Stok minimum tidak boleh negatif'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      // Only send database-known fields, convert strings to numbers where needed
      const payload = {
        nama: form.nama,
        stok: Number(form.stok) || 0,
        stok_awal: Number(form.stok_awal) || 0,
        min_stok: Number(form.min_stok) || 0,
        satuan: form.satuan,
        terima: Number(form.terima) || 0,
        digunakan: Number(form.digunakan) || 0,
        transaksi_bln: Number(form.transaksi_bln) || 0,
        kategori_sc: form.kategori_sc
      }
      if (editingId) {
        await updateSukuCadang(editingId, payload)
        success('Data suku cadang berhasil diperbarui')
      } else {
        await createSukuCadang(payload)
        success('Data suku cadang berhasil ditambahkan')
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      const newData = await getAllSukuCadang()
      setSukuCadangData(newData)
    } catch (err) {
      error('Gagal menyimpan data suku cadang')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSukuCadang(deleteTarget.id)
      success('Data suku cadang berhasil dihapus')
      setDeleteTarget(null)
      const newData = await getAllSukuCadang()
      setSukuCadangData(newData)
    } catch (err) {
      error('Gagal menghapus data suku cadang')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { label: 'Nama Barang', key: 'nama', cellClass: 'cell-strong' },
    { label: 'Jumlah Unit', render: (i) => formatSatuan(i) },
    { label: 'Terima', render: (i) => (i.terima || 0).toLocaleString('id-ID') },
    { label: 'Digunakan', render: (i) => (i.digunakan || 0).toLocaleString('id-ID') },
    { label: 'Stok Minimum', key: 'min_stok' },
    { label: 'Tanggal Transaksi', render: (i) => i.transaksi_bln > 0 ? `${i.transaksi_bln} transaksi` : 'Belum ada' },
    { label: 'Status', render: (i) => <Badge variant={i.stok < i.min_stok ? 'red' : 'green'}>{i.stok < i.min_stok ? 'Stok Menipis' : 'Stok Aman'}</Badge> },
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
      <ConfirmModal open={!!deleteTarget} title="Hapus Suku Cadang" message={`Yakin ingin menghapus "${deleteTarget?.nama}"?`} confirmLabel="Hapus" confirmVariant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <div className="page-head">
        <div><h1>Data Suku Cadang</h1><p>Monitoring persediaan suku cadang HT dan perangkat TIK</p></div>
        <div className="head-actions">
          <button className="btn" onClick={() => {
            const result = handleExport(filtered, 'suku_cadang.csv')
            if (result.success) success(result.message)
            else error(result.message)
          }}>Export</button>
          <button className="btn btn-primary" onClick={openCreateForm}>+ Tambah Suku Cadang</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Jenis Barang" value={scTotal} delta={{ text: 'Tercatat di sistem' }} variant="blue" />
        <StatCard label="Stok Aman" value={scAman} delta={{ text: 'Di atas batas minimum', variant: 'up' }} variant="green" />
        <StatCard label="Stok Menipis" value={scMenipis} delta={{ text: 'Perlu pengadaan ulang', variant: 'warn' }} variant="red" />
        <StatCard label="Transaksi Bulan Ini" value={scTransaksiBln} delta={{ text: 'Penggunaan suku cadang' }} variant="amber" />
      </div>

      {scMenipis > 0 && (
        <div className="notif-item red" style={{ marginBottom: 18 }}>
          <div>
            <div className="t">&#x26a0; Peringatan stok minimum</div>
            <div className="d">{scMenipis} jenis suku cadang berada di bawah batas stok minimum: {sukuCadangData.filter(i => i.stok < i.min_stok).map(i => i.nama).join(', ')}. Segera lakukan pengadaan ulang.</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="toolbar">
          <SearchBox placeholder="Cari nama barang..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
        </div>
        {loading ? <LoadingSpinner text="Memuat data..." /> : (
          <>
            <Table columns={columns} data={paginatedData} emptyMessage="Tidak ada data yang sesuai"
              actions={renderActions} id="tabel-suku" />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={10} totalItems={filtered.length} />
          </>
        )}
      </div>

      <Modal open={showForm} title={`${editingId ? 'Edit' : 'Tambah'} Suku Cadang`} onClose={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label>Nama Barang <span className="req">*</span></label>
              <input type="text" placeholder="Contoh: Baterai HT Motorola GP328" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} />
              {formErrors.nama && <div className="form-error">{formErrors.nama}</div>}
            </div>
            <div className="field">
              <label>Stok Awal</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={form.stok_awal} onChange={e => setForm({ ...form, stok_awal: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div className="field">
              <label>Jumlah Unit Saat Ini <span className="req">*</span></label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.stok} onChange={e => setForm({ ...form, stok: e.target.value.replace(/\D/g, '') })} />
              {formErrors.stok && <div className="form-error">{formErrors.stok}</div>}
            </div>
            <div className="field">
              <label>Terima (Masuk)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={form.terima} onChange={e => setForm({ ...form, terima: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div className="field">
              <label>Digunakan (Keluar)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={form.digunakan} onChange={e => setForm({ ...form, digunakan: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div className="field">
              <label>Stok Minimum <span className="req">*</span></label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Batas minimum untuk peringatan otomatis" value={form.min_stok} onChange={e => setForm({ ...form, min_stok: e.target.value.replace(/\D/g, '') })} />
              {formErrors.min_stok && <div className="form-error">{formErrors.min_stok}</div>}
            </div>
            <div className="field">
              <label>Tanggal Transaksi</label>
              <input type="date" value={form.tgl_transaksi} onChange={e => setForm({ ...form, tgl_transaksi: e.target.value })} />
            </div>
          </div>
          <div className="upload-hint" style={{ margin: '10px 0 0' }}>Sistem akan mengurangi stok secara otomatis saat suku cadang digunakan, dan menampilkan peringatan ketika stok mencapai batas minimum.</div>
          <div className="form-actions" style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
            <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
