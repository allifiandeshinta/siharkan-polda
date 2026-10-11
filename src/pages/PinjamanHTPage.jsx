import { useState, useEffect, useMemo, useRef } from 'react'
import { getAllPinjaman, createPinjaman, deletePinjaman, updatePinjaman, returnPinjaman } from '../services/pinjaman'
import { getAllInventarisBatch } from '../services/inventarisBatch'
import { getAllInventaris } from '../services/inventaris'
import { getSatwilList } from '../services/reference'
import { uploadAndValidate } from '../services/storageUpload'
import { useSearch, usePagination } from '../hooks'
import { useToast } from '../hooks/useToast'
import { useExport } from '../hooks/useExport'
import { SearchBox, Table, Pagination, StatCard, Badge, IconButton, ToastContainer, ConfirmModal, LoadingSpinner, Modal } from '../components/ui'

const statusVariant = (s) => s === 'Dipinjam' ? 'blue' : s === 'Terlambat' ? 'red' : s === 'Jatuh Tempo' ? 'amber' : 'green'
const emptyForm = { mode: 'unit', jenis_ht: '', id_ht: '', batch_id: '', serial_number: '', merk: '', model: '', jumlah: 1, satwil: '', tgl_pinjam: '', tgl_kembali: '', keterangan: '', file: null }
const jenisHTOptions = ['APX 1000', 'APX 1000i', 'Hytera', 'Tait']

// Hitung status dinamis dari is_returned + tanggal kembali
function computeActualStatus(isReturned, tglKembali, jumlah = 1, jumlahDikembalikan = 0) {
  if (isReturned || Number(jumlahDikembalikan) >= Number(jumlah)) return 'Dikembalikan'
  if (!tglKembali) return 'Dipinjam'

  const [th, bl, tg] = String(tglKembali).split('T')[0].split('-').map(Number)
  if (!th || !bl || !tg) return 'Dipinjam'
  const tgl = new Date(th, bl - 1, tg)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((tgl - today) / 86400000)

  if (diff < 0) return 'Terlambat'
  if (diff < 3) return 'Jatuh Tempo'
  return 'Dipinjam'
}

export default function PinjamanHTPage() {
  const [pinjamanData, setPinjamanData] = useState([])
  const [htList, setHtList] = useState([])
  const [batchList, setBatchList] = useState([])
  const [satwilList, setSatwilList] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error } = useToast()
  const { handleExport } = useExport()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [returnTarget, setReturnTarget] = useState(null)
  const [returnJumlah, setReturnJumlah] = useState(1)
  const [returning, setReturning] = useState(false)

  const [showPreview, setShowPreview] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)

  function openPreview(item) {
    if (!item.file_url) {
      error('Tidak ada file pendukung untuk pinjaman ini')
      return
    }
    setPreviewItem(item)
    setShowPreview(true)
  }

  async function handleReturn() {
    if (!returnTarget) return
    setReturning(true)
    try {
      await returnPinjaman(returnTarget.id, { batch_id: returnTarget.batch_id, jumlah: returnTarget.batch_id ? returnJumlah : 1 })
      success(`HT ${returnTarget.jenis_ht} berhasil ditandai dikembalikan`)
      setReturnTarget(null)
      const [pinjaman, inventaris, satwil, batches] = await Promise.all([
        getAllPinjaman(), getAllInventaris(), getSatwilList(), getAllInventarisBatch()
      ])
      setPinjamanData(pinjaman)
      setHtList(inventaris.filter(i => i.kategori === 'HT'))
      setBatchList(batches.filter(i => i.kategori === 'HT'))
      setSatwilList(satwil)
      setStats(computePinjamanStats(pinjaman))
    } catch (err) {
      error('Gagal menandai pengembalian')
    } finally {
      setReturning(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const [pinjaman, inventaris, satwil, batches] = await Promise.all([
          getAllPinjaman(), getAllInventaris(), getSatwilList(), getAllInventarisBatch()
        ])
        if (cancelled) return
        setPinjamanData(pinjaman)
        setHtList(inventaris.filter(i => i.kategori === 'HT'))
        setBatchList(batches.filter(i => i.kategori === 'HT'))
        setSatwilList(satwil)
        setStats(computePinjamanStats(pinjaman))
      } catch (err) {
        if (!cancelled) error('Gagal memuat data pinjaman')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Compute the dynamic status onto each row so search/filter can use it
  const pinjamanWithStatus = useMemo(() =>
    pinjamanData.map(p => ({
      ...p,
      statusComputed: computeActualStatus(p.is_returned, p.tgl_kembali, p.jumlah, p.jumlah_dikembalikan)
    })), [pinjamanData])

  const { searchTerm, setSearchTerm, filtered } = useSearch(pinjamanWithStatus, ['jenis_ht', 'satwil', 'statusComputed'])
  const { currentPage, setCurrentPage, paginatedData, totalPages } = usePagination(filtered, 10)

  function openCreateForm() {
    setForm({ ...emptyForm, tgl_pinjam: new Date().toISOString().split('T')[0] })
    setEditingId(null)
    setFormErrors({})
    setShowForm(true)
  }

  function openEditForm(item) {
    setForm({ jenis_ht: item.jenis_ht, id_ht: item.id_ht || '', serial_number: item.serial_number || '', merk: item.merk || '', model: item.model || '', satwil: item.satwil, tgl_pinjam: item.tgl_pinjam, tgl_kembali: item.tgl_kembali, keterangan: item.keterangan || '', file_url: item.file_url || '' })
    setEditingId(item.id)
    setFormErrors({})
    setShowForm(true)
  }

  function validate() {
    const errs = {}
    if (form.mode === 'batch' && !form.batch_id) errs.batch_id = 'Pilih batch HT'
    if (form.mode === 'batch' && (!Number.isInteger(Number(form.jumlah)) || Number(form.jumlah) <= 0)) errs.jumlah = 'Jumlah harus lebih dari nol'
    if (form.mode === 'batch' && Number(form.jumlah) > Number(batchList.find(b => b.id === form.batch_id)?.jumlah_tersedia || 0)) errs.jumlah = 'Jumlah melebihi stok tersedia'
    if (!form.jenis_ht) errs.jenis_ht = 'Pilih Jenis HT'
    if (!form.satwil) errs.satwil = 'Pilih Satwil'
    if (!form.tgl_pinjam) errs.tgl_pinjam = 'Tanggal pinjam harus diisi'
    if (!form.tgl_kembali) errs.tgl_kembali = 'Tanggal kembali harus diisi'
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
        const uploadResult = await uploadAndValidate(form.file, 'pinjam-ht')
        fileUrl = uploadResult.url
      }
      
      const payload = { ...form, file_url: fileUrl }
      delete payload.file

      if (editingId) {
        await updatePinjaman(editingId, payload)
        success('Data pinjaman berhasil diperbarui')
      } else {
        await createPinjaman(payload)
        success('Data pinjaman berhasil ditambahkan')
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      const [pinjaman, inventaris, satwil, batches] = await Promise.all([
        getAllPinjaman(), getAllInventaris(), getSatwilList(), getAllInventarisBatch()
      ])
      setPinjamanData(pinjaman)
      setHtList(inventaris.filter(i => i.kategori === 'HT'))
      setBatchList(batches.filter(i => i.kategori === 'HT'))
      setSatwilList(satwil)
      setStats(computePinjamanStats(pinjaman))
    } catch (err) {
      error(err.message || 'Gagal menyimpan data pinjaman')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePinjaman(deleteTarget.id, deleteTarget.batch_id)
      success('Data pinjaman berhasil dihapus')
      setDeleteTarget(null)
      const [pinjaman, inventaris, satwil, batches] = await Promise.all([
        getAllPinjaman(), getAllInventaris(), getSatwilList(), getAllInventarisBatch()
      ])
      setPinjamanData(pinjaman)
      setHtList(inventaris.filter(i => i.kategori === 'HT'))
      setBatchList(batches.filter(i => i.kategori === 'HT'))
      setSatwilList(satwil)
      setStats(computePinjamanStats(pinjaman))
    } catch (err) {
      error('Gagal menghapus data pinjaman')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { label: 'Jenis HT', key: 'jenis_ht', cellClass: 'cell-strong' },
    { label: 'ID HT', key: 'id_ht' },
    { label: 'No. Seri', key: 'serial_number' },
    { label: 'Merk', key: 'merk' },
    { label: 'Model', key: 'model' },
    { label: 'Jumlah', render: (i) => i.batch_id ? `${i.jumlah_dikembalikan || 0}/${i.jumlah}` : '1' },
    { label: 'Satwil Peminjam', key: 'satwil' },
    { label: 'Tgl Pinjam', key: 'tgl_pinjam' },
    { label: 'Tgl Kembali', key: 'tgl_kembali' },
    { label: 'Tgl Dikembalikan', render: (i) => {
      if (!i.tgl_dikembalikan) return ''
      try {
        return new Date(i.tgl_dikembalikan).toLocaleString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      } catch(e) { return '' }
    }},
    { label: 'Keterangan', render: (i) => i.keterangan || '', cellClass: 'cell-muted' },
    { label: 'Status', render: (i) => {
      const status = Number(i.jumlah_dikembalikan || 0) > 0 && !i.is_returned ? 'Dikembalikan Sebagian' : computeActualStatus(i.is_returned, i.tgl_kembali, i.jumlah, i.jumlah_dikembalikan)
      return <Badge variant={statusVariant(status)}>{status}</Badge>
    } },
  ]

  const renderActions = (item) => (
    <div className="row-actions">
      {!item.is_returned && (
        <IconButton 
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>} 
          className="btn-icon" 
          style={{ color: 'var(--green)' }}
           onClick={() => { setReturnTarget(item); setReturnJumlah(Math.max(1, Number(item.jumlah || 1) - Number(item.jumlah_dikembalikan || 0))) }}
          title="Tandai Dikembalikan"
        />
      )}
      <IconButton 
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} 
        className="btn-icon" 
        onClick={() => openPreview(item)} 
        title="Preview File"
      />
      <IconButton icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>} className="btn-icon" onClick={() => openEditForm(item)} title="Edit" />
      <IconButton icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>} className="btn-icon" onClick={() => setDeleteTarget(item)} title="Hapus" />
    </div>
  )

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal open={!!deleteTarget} title="Hapus Data Pinjaman" message={`Yakin ingin menghapus pinjaman ${deleteTarget?.jenis_ht}?`} confirmLabel="Hapus" confirmVariant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <ConfirmModal open={!!returnTarget && !returnTarget.batch_id} title="Tandai Dikembalikan" message={`Konfirmasi bahwa HT ${returnTarget?.jenis_ht} sudah dikembalikan oleh ${returnTarget?.satwil}?`} confirmLabel="Ya, Kembalikan" confirmVariant="primary" onConfirm={handleReturn} onCancel={() => setReturnTarget(null)} loading={returning} />
      <Modal open={!!returnTarget?.batch_id} title="Pengembalian Batch" onClose={() => setReturnTarget(null)}>
        <div className="field">
          <label>Jumlah dikembalikan (sisa: {Math.max(0, Number(returnTarget?.jumlah || 0) - Number(returnTarget?.jumlah_dikembalikan || 0))})</label>
          <input type="number" min="1" max={Math.max(0, Number(returnTarget?.jumlah || 0) - Number(returnTarget?.jumlah_dikembalikan || 0))} value={returnJumlah} onChange={e => setReturnJumlah(e.target.value)} />
        </div>
        <div className="form-actions" style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
          <button type="button" className="btn" onClick={() => setReturnTarget(null)} disabled={returning}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={handleReturn} disabled={returning || Number(returnJumlah) <= 0 || Number(returnJumlah) > Number(returnTarget?.jumlah || 0) - Number(returnTarget?.jumlah_dikembalikan || 0)}>{returning ? 'Memproses...' : 'Kembalikan'}</button>
        </div>
      </Modal>

      <div className="page-head">
        <div><h1>Pinjam Pakai HT</h1><p>Catat dan pantau peminjaman HT oleh Satwil jajaran Polda DIY</p></div>
        <div className="head-actions">
          <button className="btn" onClick={() => {
            const result = handleExport(filtered, 'pinjaman.csv')
            if (result.success) success(result.message)
            else error(result.message)
          }}>Export</button>
          <button className="btn btn-primary" onClick={openCreateForm}>+ Tambah Pinjaman</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Dipinjam" value={stats.pinjamanAktif || 0} delta={{ text: 'Aktif saat ini' }} variant="blue" />
        <StatCard label="Sudah Dikembalikan" value={stats.pinjamanKembali || 0} delta={{ text: 'Sepanjang 2026' }} variant="green" />
        <StatCard label="Jatuh Tempo < 3 Hari" value={stats.pinjamanJatuhTempo || 0} delta={{ text: 'Perlu pengingat' }} variant="amber" />
        <StatCard label="Terlambat Kembali" value={stats.pinjamanTerlambat || 0} delta={{ text: 'Tindak lanjuti', variant: 'warn' }} variant="red" />
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchBox placeholder="Cari Jenis HT atau Satwil peminjam..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: 320 }} />
        </div>
        {loading ? <LoadingSpinner text="Memuat data..." /> : (
          <>
            <Table columns={columns} data={paginatedData} emptyMessage="Tidak ada data yang sesuai"
              actions={renderActions} id="tabel-pinjam" />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={10} totalItems={filtered.length} />
          </>
        )}
      </div>

      <Modal open={showForm} title={`${editingId ? 'Edit' : 'Tambah'} Data Pinjaman`} onClose={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }} size="large">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Mode Peminjaman</label>
              <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value, batch_id: '', jumlah: 1 })} disabled={!!editingId}>
                <option value="unit">Unit legacy</option>
                <option value="batch">Batch berdasarkan jumlah</option>
              </select>
            </div>
            {form.mode === 'batch' && <div className="field full">
              <label>Batch HT <span className="req">*</span></label>
              <select value={form.batch_id} onChange={e => { const b = batchList.find(item => item.id === e.target.value); setForm({ ...form, batch_id: e.target.value, jenis_ht: b?.nama || '', merk: b?.merk || '', model: b?.model || '' }) }}>
                <option value="">Pilih batch HT</option>
                {batchList.map(b => <option key={b.id} value={b.id}>{b.nama} - tersedia {b.jumlah_tersedia} {b.satuan}</option>)}
              </select>
              {formErrors.batch_id && <div className="form-error">{formErrors.batch_id}</div>}
            </div>}
            {form.mode === 'batch' && <div className="field">
              <label>Jumlah</label>
              <input type="number" min="1" value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} />
              {formErrors.jumlah && <div className="form-error">{formErrors.jumlah}</div>}
            </div>}
            <div className="field">
              <label>Jenis HT <span className="req">*</span></label>
              <select value={form.jenis_ht} onChange={e => setForm({ ...form, jenis_ht: e.target.value })} disabled={form.mode === 'batch'}>
                <option value="">Pilih Jenis HT</option>
                {jenisHTOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {formErrors.jenis_ht && <div className="form-error">{formErrors.jenis_ht}</div>}
            </div>
            <div className="field">
              <label>Satwil Peminjam <span className="req">*</span></label>
              <select value={form.satwil} onChange={e => setForm({ ...form, satwil: e.target.value })}>
                <option value="">Pilih Satwil</option>
                {satwilList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {formErrors.satwil && <div className="form-error">{formErrors.satwil}</div>}
            </div>
            <div className="field">
              <label>ID HT</label>
              <input type="text" placeholder="Contoh: HT-REAL-002" value={form.id_ht} onChange={e => setForm({ ...form, id_ht: e.target.value })} />
            </div>
            <div className="field">
              <label>No. Seri</label>
              <input type="text" placeholder="Contoh: 837TUB5774/750901" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
            </div>
            <div className="field">
              <label>Merk</label>
              <input type="text" placeholder="Contoh: Motorola" value={form.merk} onChange={e => setForm({ ...form, merk: e.target.value })} />
            </div>
            <div className="field">
              <label>Model</label>
              <input type="text" placeholder="Contoh: APX 1000" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="field">
              <label>Tanggal Pinjam <span className="req">*</span></label>
              <input type="date" value={form.tgl_pinjam} onChange={e => setForm({ ...form, tgl_pinjam: e.target.value })} />
              {formErrors.tgl_pinjam && <div className="form-error">{formErrors.tgl_pinjam}</div>}
            </div>
            <div className="field">
              <label>Tanggal Kembali <span className="req">*</span></label>
              <input type="date" value={form.tgl_kembali} onChange={e => setForm({ ...form, tgl_kembali: e.target.value })} />
              {formErrors.tgl_kembali && <div className="form-error">{formErrors.tgl_kembali}</div>}
            </div>
            <div className="field full">
              <label>Upload File Pendukung</label>
              {editingId && form.file_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, background: '#FAFBFD' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>File: </span>
                  <IconButton 
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} 
                    className="btn-icon" 
                    type="button"
                    onClick={() => { setPreviewItem({ file_url: form.file_url, jenis_ht: 'File Pendukung' }); setShowPreview(true) }} 
                    title="Lihat File"
                  />
                  <button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, file_url: '', file: null })}>Ganti File</button>
                </div>
              ) : (
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
              )}
            </div>
            <div className="field full">
              <label>Keterangan</label>
              <textarea placeholder="Catatan peminjaman (opsional)" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} />
            </div>
          </div>
          <div className="form-actions" style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
            <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Data'}</button>
          </div>
        </form>
      </Modal>
      <Modal open={showPreview} title={previewItem?.jenis_ht || 'Preview File'} onClose={() => { setShowPreview(false); setPreviewItem(null) }} size="large">
        <div style={{ height: '70vh', width: '100%' }}>
          <iframe src={previewItem?.file_url} style={{ width: '100%', height: '100%', border: 'none' }} title="File Preview" />
        </div>
      </Modal>
    </div>
  )
}

function computePinjamanStats(pinjaman) {
  let pinjamanAktif = 0
  let pinjamanKembali = 0
  let pinjamanTerlambat = 0
  let pinjamanJatuhTempo = 0

  pinjaman.forEach(p => {
    const sts = computeActualStatus(p.is_returned, p.tgl_kembali, p.jumlah, p.jumlah_dikembalikan)
    const remaining = Math.max(0, Number(p.jumlah || 1) - Number(p.jumlah_dikembalikan || 0))
    if (sts === 'Dikembalikan') pinjamanKembali += Number(p.jumlah || 1)
    else if (sts === 'Terlambat') pinjamanTerlambat += remaining
    else if (sts === 'Jatuh Tempo') pinjamanJatuhTempo += remaining
    else if (sts === 'Dipinjam') pinjamanAktif += remaining
  })

  return { pinjamanAktif, pinjamanKembali, pinjamanTerlambat, pinjamanJatuhTempo }
}
