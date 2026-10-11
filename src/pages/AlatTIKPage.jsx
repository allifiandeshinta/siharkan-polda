import { useEffect, useMemo, useState } from 'react'
import { createInventaris, deleteInventaris, getAllInventaris, updateInventaris } from '../services/inventaris'
import { createInventarisBatch, deleteInventarisBatch, getAllInventarisBatch, updateInventarisBatch } from '../services/inventarisBatch'
import { getAllPinjaman } from '../services/pinjaman'
import { getKategoriList, getSatwilList } from '../services/reference'
import { usePagination, useSearch } from '../hooks'
import { useToast } from '../hooks/useToast'
import { useExport } from '../hooks/useExport'
import { Badge, ConfirmModal, IconButton, KategoriCard, LoadingSpinner, Modal, Pagination, SearchBox, Select, Table, ToastContainer, TypeTag } from '../components/ui'
import { formatTanggal } from '../utils/format'

const kondisiOptions = ['Baik', 'Rusak Ringan', 'Rusak Berat']
const emptyUnit = { id: '', nama: '', merk: '', model: '', serial_number: '', kategori: 'HT', kondisi: 'Baik', lokasi: '', tgl: '' }
const emptyBatch = { nama: '', merk: '', model: '', kategori: 'HT', kondisi: 'Baik', lokasi: '', tanggal_masuk: '', jumlah: '', satuan: 'unit', nomor_batch: '', sumber_pengadaan: '', keterangan: '' }
const prefix = { HT: 'HT-', Tower: 'TWR-', Repeater: 'RPT-', Ransus: 'RNS-', Bodyworn: 'BWC-', 'Command Center': 'CMD-', 'Call Center': 'CCT-', Drone: 'DRN-' }
const kondisiVariant = kondisi => kondisi === 'Baik' ? 'green' : kondisi === 'Rusak Ringan' ? 'amber' : 'red'

export default function AlatTIKPage() {
  const [units, setUnits] = useState([])
  const [batches, setBatches] = useState([])
  const [pinjaman, setPinjaman] = useState([])
  const [satwil, setSatwil] = useState([])
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [mode, setMode] = useState('batch')
  const [unitForm, setUnitForm] = useState(emptyUnit)
  const [batchForm, setBatchForm] = useState(emptyBatch)
  const [idNumber, setIdNumber] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filterKategori, setFilterKategori] = useState('')
  const [filterKondisi, setFilterKondisi] = useState('')
  const [filterLokasi, setFilterLokasi] = useState('')
  const { toasts, success, error } = useToast()
  const { handleExport } = useExport()

  const load = async () => {
    try {
      setLoading(true)
      const [unitRows, batchRows, satwilRows, kategoriRows, pinjamanRows] = await Promise.all([
        getAllInventaris(),
        getAllInventarisBatch(),
        getSatwilList(),
        getKategoriList(),
        getAllPinjaman().catch(() => [])
      ])
      setUnits(unitRows || [])
      setBatches(batchRows || [])
      setSatwil(satwilRows || [])
      setKategori(kategoriRows || [])
      setPinjaman(pinjamanRows || [])
    } catch {
      error('Gagal memuat data inventaris')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!editing && mode === 'unit') {
      setUnitForm(current => ({ ...current, id: `${prefix[current.kategori] || ''}${idNumber}` }))
    }
  }, [idNumber, editing, unitForm.kategori, mode])

  const activeUnitBorrowMap = useMemo(() => {
    const map = new Set()
    pinjaman.forEach(p => {
      if (p.id_ht && !p.is_returned) map.add(p.id_ht)
    })
    return map
  }, [pinjaman])

  const data = useMemo(() => [
    ...units.map(item => {
      const isBorrowed = activeUnitBorrowMap.has(item.id)
      return {
        ...item,
        recordType: 'Unit',
        jumlah_awal: 1,
        jumlah_tersedia: (item.kondisi === 'Baik' && !isBorrowed) ? 1 : 0,
        jumlah_dipinjam: isBorrowed ? 1 : 0,
        tanggal: item.tgl,
        nomor: item.serial_number || item.id
      }
    }),
    ...batches.map(item => ({
      ...item,
      id: item.id,
      recordType: 'Batch',
      tanggal: item.tanggal_masuk,
      nomor: item.nomor_batch || '-'
    }))
  ].filter(item => (!filterKategori || item.kategori === filterKategori) && (!filterKondisi || item.kondisi === filterKondisi) && (!filterLokasi || item.lokasi === filterLokasi)), [units, batches, activeUnitBorrowMap, filterKategori, filterKondisi, filterLokasi])

  const kategoriStats = useMemo(() => kategori.map(name => ({ label: name, value: data.filter(item => item.kategori === name).reduce((total, item) => total + Number(item.jumlah_awal || 1), 0) })), [data, kategori])
  const { searchTerm, setSearchTerm, filtered } = useSearch(data, ['nama', 'merk', 'model', 'lokasi', 'nomor'])
  const { currentPage, setCurrentPage, paginatedData, totalPages } = usePagination(filtered, 10)

  const openCreate = () => {
    setEditing(null)
    setMode('batch')
    setUnitForm(emptyUnit)
    setBatchForm(emptyBatch)
    setIdNumber('')
    setShowForm(true)
  }

  const openEdit = item => {
    if (item.recordType === 'Batch') {
      setMode('batch')
      setEditing(item.id)
      setBatchForm({
        id: item.id,
        nama: item.nama || '',
        merk: item.merk || '',
        model: item.model || '',
        kategori: item.kategori || 'HT',
        kondisi: item.kondisi || 'Baik',
        lokasi: item.lokasi || '',
        tanggal_masuk: item.tanggal_masuk || item.tanggal || '',
        jumlah: item.jumlah_awal ?? item.jumlah ?? '',
        satuan: item.satuan || 'unit',
        nomor_batch: item.nomor_batch || '',
        sumber_pengadaan: item.sumber_pengadaan || '',
        keterangan: item.keterangan || ''
      })
      setShowForm(true)
      return
    }

    const currentPrefix = prefix[item.kategori] || ''
    const value = item.id && item.id.startsWith(currentPrefix) ? item.id.slice(currentPrefix.length) : item.id
    setMode('unit')
    setEditing(item.id)
    setIdNumber(value || '')
    setUnitForm({
      id: item.id,
      nama: item.nama || '',
      merk: item.merk || '',
      model: item.model || '',
      serial_number: item.serial_number || '',
      kategori: item.kategori || 'HT',
      kondisi: item.kondisi || 'Baik',
      lokasi: item.lokasi || '',
      tgl: item.tgl || item.tanggal || ''
    })
    setShowForm(true)
  }

  const submit = async event => {
    event.preventDefault()
    const current = mode === 'unit' ? unitForm : batchForm
    if (!current.lokasi || !(mode === 'unit' ? current.tgl : current.tanggal_masuk) || (mode === 'batch' && (!current.nama.trim() || Number(current.jumlah) <= 0)) || (mode === 'unit' && (!current.id.trim() || !current.nama.trim()))) {
      error('Lengkapi data wajib dan jumlah harus lebih dari nol')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'unit') {
        if (editing) await updateInventaris(editing, unitForm)
        else await createInventaris(unitForm)
      } else {
        if (editing) await updateInventarisBatch(editing, batchForm)
        else await createInventarisBatch(batchForm)
      }
      success(mode === 'batch' ? (editing ? 'Data batch berhasil diperbarui' : 'Batch inventaris berhasil ditambahkan') : (editing ? 'Data unit berhasil diperbarui' : 'Data unit berhasil disimpan'))
      setShowForm(false)
      await load()
    } catch (err) {
      error(err.message || 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.recordType === 'Batch') {
        await deleteInventarisBatch(deleteTarget.id)
        success('Data batch berhasil dihapus')
      } else {
        await deleteInventaris(deleteTarget.id)
        success('Data unit berhasil dihapus')
      }
      setDeleteTarget(null)
      await load()
    } catch (err) {
      error(err.message || 'Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { label: 'Tipe', render: item => <Badge variant={item.recordType === 'Batch' ? 'blue' : 'gray'}>{item.recordType}</Badge> },
    { label: 'Nama Barang', key: 'nama', cellClass: 'cell-strong' },
    { label: 'Merk / Model', render: item => [item.merk, item.model].filter(Boolean).join(' / ') || '-' },
    { label: 'No. Seri / Batch', key: 'nomor' },
    { label: 'Jenis', render: item => <TypeTag type={(item.kategori || '').toLowerCase()}>{item.kategori}</TypeTag> },
    { label: 'Total', render: item => item.jumlah_awal || 1 },
    { label: 'Tersedia', render: item => item.jumlah_tersedia ?? 0 },
    { label: 'Dipinjam', render: item => item.jumlah_dipinjam || 0 },
    { label: 'Kondisi', render: item => <Badge variant={kondisiVariant(item.kondisi)}>{item.kondisi}</Badge> },
    { label: 'Lokasi', key: 'lokasi' },
    { label: 'Tgl Masuk', render: item => formatTanggal(item.tanggal) }
  ]

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <ConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.recordType === 'Batch' ? 'Hapus Data Batch' : 'Hapus Data Unit'}
        message={`Yakin ingin menghapus "${deleteTarget?.nama || deleteTarget?.id || ''}"?`}
        confirmLabel="Hapus"
        confirmVariant="danger"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      <div className="page-head">
        <div>
          <h1>Data Alat TIK</h1>
          <p>Input alat berserial per unit atau stok massal langsung berdasarkan jumlah.</p>
        </div>
        <div className="head-actions">
          <button className="btn" onClick={() => {
            const result = handleExport(filtered, 'data-alat-tik.csv')
            if (result.success) success(result.message)
            else error(result.message)
          }}>Export</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Tambah Data</button>
        </div>
      </div>

      <div className="kat-grid">
        {kategoriStats.map(item => (
          <KategoriCard key={item.label} label={item.label} value={item.value} variant={item.label === 'HT' ? 'var(--polri-gold-2)' : 'var(--blue)'} />
        ))}
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchBox
            placeholder="Cari nama, merk, nomor seri, atau lokasi..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select className="filter-btn" value={filterKategori} onChange={event => setFilterKategori(event.target.value)} placeholder="Semua Jenis" options={kategori} />
          <Select className="filter-btn" value={filterKondisi} onChange={event => setFilterKondisi(event.target.value)} placeholder="Semua Kondisi" options={kondisiOptions} />
          <Select className="filter-btn" value={filterLokasi} onChange={event => setFilterLokasi(event.target.value)} placeholder="Semua Lokasi" options={satwil} />
        </div>
        {loading ? (
          <LoadingSpinner text="Memuat data..." />
        ) : (
          <>
            <Table
              columns={columns}
              data={paginatedData}
              emptyMessage="Tidak ada data"
              id="tabel-alat"
              actions={item => (
                <>
                  <IconButton
                    className="btn-icon"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>}
                    onClick={() => openEdit(item)}
                    title="Edit"
                  />
                  <IconButton
                    className="btn-icon"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>}
                    onClick={() => setDeleteTarget(item)}
                    title="Hapus"
                  />
                </>
              )}
            />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={10} totalItems={filtered.length} />
          </>
        )}
      </div>

      <Modal
        open={showForm}
        title={editing ? (mode === 'batch' ? 'Edit Batch Alat TIK' : 'Edit Unit Alat TIK') : 'Tambah Data Alat TIK'}
        onClose={() => setShowForm(false)}
        size="large"
      >
        <form onSubmit={submit}>
          <div className="form-grid">
            {!editing && (
              <div className="field full">
                <label>Mode Input</label>
                <select value={mode} onChange={event => setMode(event.target.value)}>
                  <option value="batch">Batch Jumlah</option>
                  <option value="unit">Unit Berserial</option>
                </select>
              </div>
            )}
            {mode === 'unit' ? (
              <UnitFields form={unitForm} setForm={setUnitForm} idNumber={idNumber} setIdNumber={setIdNumber} kategori={kategori} satwil={satwil} editing={editing} />
            ) : (
              <BatchFields form={batchForm} setForm={setBatchForm} kategori={kategori} satwil={satwil} editing={editing} />
            )}
          </div>
          <div className="form-actions" style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : (editing ? 'Perbarui Data' : 'Simpan Data')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function UnitFields({ form, setForm, idNumber, setIdNumber, kategori, satwil, editing }) {
  return (
    <>
      <Field label="Jenis Alat">
        <select
          value={form.kategori}
          disabled={!!editing}
          onChange={event => {
            setForm({ ...form, kategori: event.target.value })
            if (!editing) setIdNumber('')
          }}
        >
          {kategori.map(item => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="ID Alat">
        <input
          value={editing ? form.id : idNumber}
          disabled={!!editing}
          placeholder="Contoh: 016"
          onChange={event => setIdNumber(event.target.value.replace(/\D/g, ''))}
        />
      </Field>
      <Field label="Nama Barang">
        <input value={form.nama} onChange={event => setForm({ ...form, nama: event.target.value })} />
      </Field>
      <Field label="Merk">
        <input value={form.merk} onChange={event => setForm({ ...form, merk: event.target.value })} />
      </Field>
      <Field label="Model">
        <input value={form.model} onChange={event => setForm({ ...form, model: event.target.value })} />
      </Field>
      <Field label="No. Seri">
        <input value={form.serial_number} onChange={event => setForm({ ...form, serial_number: event.target.value })} />
      </Field>
      <CommonFields form={form} setForm={setForm} satwil={satwil} dateKey="tgl" />
    </>
  )
}

function BatchFields({ form, setForm, kategori, satwil, editing }) {
  return (
    <>
      <Field label="Jenis Alat">
        <select value={form.kategori} onChange={event => setForm({ ...form, kategori: event.target.value })}>
          {kategori.map(item => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="Jumlah">
        <input
          type="number"
          min="1"
          value={form.jumlah}
          onChange={event => setForm({ ...form, jumlah: event.target.value })}
        />
      </Field>
      <Field label="Nama Barang">
        <input value={form.nama} onChange={event => setForm({ ...form, nama: event.target.value })} />
      </Field>
      <Field label="Merk">
        <input value={form.merk} onChange={event => setForm({ ...form, merk: event.target.value })} />
      </Field>
      <Field label="Model">
        <input value={form.model} onChange={event => setForm({ ...form, model: event.target.value })} />
      </Field>
      <Field label="No. Batch">
        <input value={form.nomor_batch} onChange={event => setForm({ ...form, nomor_batch: event.target.value })} />
      </Field>
      <Field label="Satuan">
        <input value={form.satuan} onChange={event => setForm({ ...form, satuan: event.target.value })} />
      </Field>
      <Field label="Sumber Pengadaan">
        <input value={form.sumber_pengadaan} onChange={event => setForm({ ...form, sumber_pengadaan: event.target.value })} />
      </Field>
      <CommonFields form={form} setForm={setForm} satwil={satwil} dateKey="tanggal_masuk" />
      <div className="field full">
        <label>Keterangan</label>
        <textarea value={form.keterangan} onChange={event => setForm({ ...form, keterangan: event.target.value })} />
      </div>
    </>
  )
}

function CommonFields({ form, setForm, satwil, dateKey }) {
  return (
    <>
      <Field label="Kondisi">
        <select value={form.kondisi} onChange={event => setForm({ ...form, kondisi: event.target.value })}>
          {kondisiOptions.map(item => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="Lokasi">
        <select value={form.lokasi} onChange={event => setForm({ ...form, lokasi: event.target.value })}>
          <option value="">Pilih lokasi</option>
          {satwil.map(item => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="Tanggal Masuk">
        <input type="date" value={form[dateKey]} onChange={event => setForm({ ...form, [dateKey]: event.target.value })} />
      </Field>
    </>
  )
}

function Field({ label, children }) {
  return <div className="field"><label>{label} <span className="req">*</span></label>{children}</div>
}
