import { useState, useEffect, useRef } from 'react'
import { getAllSPPM, createSPPM, updateSPPM, deleteSPPM } from '../services/sppm'
import { uploadAndValidate } from '../services/storageUpload'
import { useToast } from '../hooks/useToast'
import { useExport } from '../hooks/useExport'
import { Tabs, TabPanel, SearchBox, Table, Pagination, Badge, IconButton, Button, ToastContainer, ConfirmModal, LoadingSpinner, Modal } from '../components/ui'

const ITEMS_PER_PAGE = 10

const tabs = [{ id: 'mabes', label: 'SPPM Mabes' }, { id: 'polres', label: 'SPPM Polres' }]

const emptyForm = { nomor: '', sumber: 'Mabes Polri', perihal: '', tgl: '', file: null }

export default function SPPMPage() {
  const [sppmData, setSppmData] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error } = useToast()
  const { handleExport } = useExport()

  const [activeTab, setActiveTab] = useState('mabes')
  const [searchTermMabes, setSearchTermMabes] = useState('')
  const [searchTermPolres, setSearchTermPolres] = useState('')
  const [pageMabes, setPageMabes] = useState(1)
  const [pagePolres, setPagePolres] = useState(1)

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const fileInputRef = useRef(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [showPreview, setShowPreview] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)

  async function loadData() {
    try {
      setLoading(true)
      const data = await getAllSPPM()
      setSppmData(data)
    } catch (err) {
      error('Gagal memuat data SPPM')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const sppmMabes = sppmData.filter(i => i.sumber === 'Mabes Polri').map(mapSPPM)
  const sppmPolres = sppmData.filter(i => i.sumber === 'Polres').map(mapSPPM)

  const filteredMabes = sppmMabes.filter(i =>
    i.nomorSurat.toLowerCase().includes(searchTermMabes.toLowerCase()) ||
    i.keterangan.toLowerCase().includes(searchTermMabes.toLowerCase()))
  const filteredPolres = sppmPolres.filter(i =>
    i.nomorSurat.toLowerCase().includes(searchTermPolres.toLowerCase()) ||
    i.keterangan.toLowerCase().includes(searchTermPolres.toLowerCase()))

  const totalPagesMabes = Math.ceil(filteredMabes.length / ITEMS_PER_PAGE)
  const totalPagesPolres = Math.ceil(filteredPolres.length / ITEMS_PER_PAGE)
  const paginatedMabes = filteredMabes.slice((pageMabes - 1) * ITEMS_PER_PAGE, pageMabes * ITEMS_PER_PAGE)
  const paginatedPolres = filteredPolres.slice((pagePolres - 1) * ITEMS_PER_PAGE, pagePolres * ITEMS_PER_PAGE)

  function openUploadForm() {
    setFormData({ ...emptyForm, sumber: activeTab === 'mabes' ? 'Mabes Polri' : 'Polres' })
    setEditingId(null)
    setFormErrors({})
    setShowFormModal(true)
  }

  function openEditForm(item) {
    setFormData({ nomor: item.nomorSurat, sumber: item.sumber, perihal: item.keterangan, tgl: item.tgl?.split('/').reverse().map(s => s.padStart(2, '0')).join('-'), file_url: item.file_url || '', file: null })
    setEditingId(item.id)
    setFormErrors({})
    setShowFormModal(true)
  }

  function validate() {
    const errs = {}
    if (!formData.nomor.trim()) errs.nomor = 'Nomor surat harus diisi'
    if (!formData.perihal.trim()) errs.perihal = 'Keterangan harus diisi'
    if (!formData.tgl) errs.tgl = 'Tanggal harus diisi'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      let fileUrl = formData.file_url || ''
      if (formData.file) {
        const uploadResult = await uploadAndValidate(formData.file, 'sppm')
        fileUrl = uploadResult.url
      }
      
      const payload = { nomor: formData.nomor, sumber: formData.sumber, perihal: formData.perihal, tgl: formData.tgl, file_url: fileUrl }

      if (editingId) {
        await updateSPPM(editingId, payload)
        success('SPPM berhasil diperbarui')
      } else {
        await createSPPM(payload)
        success('SPPM berhasil ditambahkan')
      }
      setShowFormModal(false)
      setEditingId(null)
      setFormData(emptyForm)
      await loadData()
    } catch (err) {
      error(err.message || 'Gagal menyimpan SPPM')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSPPM(deleteTarget.id)
      success('SPPM berhasil dihapus')
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      error('Gagal menghapus SPPM')
    } finally {
      setDeleting(false)
    }
  }

  function handleDownload(item) {
    if (!item.file_url) return
    const filename = `${item.nomorSurat || 'sppm'}.pdf`
    fetch(item.file_url)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
      .catch(() => error('Gagal mengunduh file'))
  }

  function openPreview(item) {
    setPreviewItem(item)
    setShowPreview(true)
  }

  const columns = [
    { label: 'Nomor Surat', key: 'nomorSurat', cellClass: 'cell-strong' },
    { label: 'Tanggal Surat', key: 'tgl' },
    { label: 'Keterangan', key: 'keterangan', cellClass: 'cell-muted' },
    { label: 'File', render: () => <Badge variant="blue">PDF</Badge> },
  ]

  const renderActions = (item) => (
    <div className="row-actions">
      <IconButton 
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} 
        className="btn-icon" 
        onClick={() => openPreview(item)} 
        title="Lihat File"
      />
      <IconButton 
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} 
        className="btn-icon" 
        onClick={() => handleDownload(item)} 
        title="Download File"
      />
      <IconButton icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>} className="btn-icon" onClick={() => openEditForm(item)} title="Edit" />
      <IconButton icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>} className="btn-icon" onClick={() => setDeleteTarget(item)} title="Hapus" />
    </div>
  )

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal open={!!deleteTarget} title="Hapus SPPM" message={`Yakin ingin menghapus "${deleteTarget?.nomorSurat}"?`} confirmLabel="Hapus" confirmVariant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      <div className="page-head">
        <div><h1>Data SPPM</h1><p>Surat Perintah Pelaksanaan Pekerjaan / Pemeliharaan — Mabes Polri dan Polres jajaran</p></div>
        <div className="head-actions">
          <Button onClick={() => {
            const data = activeTab === 'mabes' ? filteredMabes : filteredPolres
            const result = handleExport(data, `sppm_${activeTab}.csv`)
            if (result.success) success(result.message)
            else error(result.message)
          }}>Export</Button>
          <Button className="btn btn-primary" onClick={openUploadForm}>+ Upload SPPM</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => { setActiveTab(id); setPageMabes(1); setPagePolres(1) }} />

      <TabPanel isActive={activeTab === 'mabes'}>
        <div className="card">
          <div className="toolbar">
            <SearchBox placeholder="Cari nomor surat..." value={searchTermMabes} onChange={e => { setSearchTermMabes(e.target.value); setPageMabes(1) }} style={{ flex: 1, minWidth: 220 }} />
            <button className="filter-btn">Tahun <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></button>
          </div>
          {loading ? <LoadingSpinner text="Memuat data..." /> : (
            <>
              <Table columns={columns} data={paginatedMabes} emptyMessage="Tidak ada data yang sesuai"
                actions={renderActions} id="tabel-sppm-mabes" />
              <Pagination currentPage={pageMabes} totalPages={totalPagesMabes} onPageChange={setPageMabes} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredMabes.length} />
            </>
          )}
        </div>
      </TabPanel>

      <TabPanel isActive={activeTab === 'polres'}>
        <div className="card">
          <div className="toolbar">
            <SearchBox placeholder="Cari nomor surat..." value={searchTermPolres} onChange={e => { setSearchTermPolres(e.target.value); setPagePolres(1) }} style={{ flex: 1, minWidth: 220 }} />
            <button className="filter-btn">Tahun <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></button>
          </div>
          {loading ? <LoadingSpinner text="Memuat data..." /> : (
            <>
              <Table columns={columns} data={paginatedPolres} emptyMessage="Tidak ada data yang sesuai"
                actions={renderActions} id="tabel-sppm-polres" />
              <Pagination currentPage={pagePolres} totalPages={totalPagesPolres} onPageChange={setPagePolres} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredPolres.length} />
            </>
          )}
        </div>
      </TabPanel>

      <Modal open={showFormModal} title={editingId ? 'Edit SPPM' : 'Tambah SPPM'} onClose={() => { setShowFormModal(false); setEditingId(null); setFormData(emptyForm) }}>
        <form onSubmit={handleSubmit} data-sppm-form>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sppm_sumber">Sumber <span className="req">*</span></label>
              <select id="sppm_sumber" name="sppm_sumber" value={formData.sumber} onChange={e => setFormData({ ...formData, sumber: e.target.value })}>
                <option value="Mabes Polri">Mabes Polri</option>
                <option value="Polres">Polres</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="sppm_nomor">Nomor Surat <span className="req">*</span></label>
              <input id="sppm_nomor" name="sppm_nomor" type="text" placeholder="Contoh: 112/SPPM/VI/2026" autoComplete="off" value={formData.nomor} onChange={e => setFormData({ ...formData, nomor: e.target.value })} />
              {formErrors.nomor && <div className="form-error">{formErrors.nomor}</div>}
            </div>
            <div className="field">
              <label htmlFor="sppm_tgl">Tanggal Surat <span className="req">*</span></label>
              <input id="sppm_tgl" name="sppm_tgl" type="date" autoComplete="off" value={formData.tgl} onChange={e => setFormData({ ...formData, tgl: e.target.value })} />
              {formErrors.tgl && <div className="form-error">{formErrors.tgl}</div>}
            </div>
            <div className="field full">
              <label htmlFor="sppm_perihal">Keterangan <span className="req">*</span></label>
              <textarea id="sppm_perihal" name="sppm_perihal" placeholder="Jelaskan tujuan SPPM" autoComplete="off" value={formData.perihal} onChange={e => setFormData({ ...formData, perihal: e.target.value })} />
              {formErrors.perihal && <div className="form-error">{formErrors.perihal}</div>}
            </div>
            <div className="field full">
              <label htmlFor="sppm_file">Upload File <span className="req">*</span></label>
              <div className="upload-box" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                <input id="sppm_file" type="file" hidden accept=".pdf,.jpg,.jpeg,.png" ref={fileInputRef} onChange={e => setFormData({ ...formData, file: e.target.files[0] })} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div className="t">
                  {formData.file ? formData.file.name : (
                    <>Klik untuk unggah atau <span>seret file ke sini</span></>
                  )}
                </div>
                <div className="upload-hint">Format file: PDF, JPG, JPEG, PNG | Maksimal ukuran file: 10 MB</div>
              </div>
            </div>
          </div>
          <div className="form-actions" style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
            <button type="button" className="btn" onClick={() => { setShowFormModal(false); setEditingId(null); setFormData(emptyForm) }}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : (editingId ? 'Perbarui Data' : 'Simpan Data')}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showPreview} title={previewItem?.nomorSurat || 'Preview File'} onClose={() => { setShowPreview(false); setPreviewItem(null) }} size="large">
        <div style={{ height: '70vh', width: '100%' }}>
          <iframe src={previewItem?.file_url} style={{ width: '100%', height: '100%', border: 'none' }} title="File Preview" />
        </div>
      </Modal>
    </div>
  )
}

function mapSPPM(item) {
  return {
    id: item.id,
    nomorSurat: item.nomor,
    sumber: item.sumber,
    tgl: new Date(item.tgl).toLocaleDateString('id-ID'),
    keterangan: item.perihal,
    file_url: item.file_url,
    status: 'PDF'
  }
}
