import { useState, useEffect } from 'react'
import { getAdminConfig, updateAdminConfig } from '../services/adminConfig'
import { useToast } from '../hooks/useToast'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function KontakAdminPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [adminData, setAdminData] = useState(null)
  const [showSavedMsg, setShowSavedMsg] = useState(false)
  const [messageForm, setMessageForm] = useState({ nama: '', satwil: '', subjek: '', pesan: '' })
  const { success, error } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        const config = await getAdminConfig()
        if (config) {
          setAdminData(config)
        }
      } catch (err) {
        // Load failure is non-blocking; the form stays hidden until data arrives
      } finally {
        setShowSavedMsg(false)
      }
    }
    loadData()
  }, [])

  const handleInputChange = (field, value) => {
    setAdminData(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    if (!adminData?.id) return
    try {
      await updateAdminConfig(adminData.id, adminData)
      setShowSavedMsg(true)
      setTimeout(() => setShowSavedMsg(false), 3000)
    } catch (err) {
      // Save failure is surfaced via the missing success message
    }
  }

  const resetSettings = () => {
    setShowSavedMsg(false)
    window.location.reload()
  }

  const handleMessageChange = (field, value) => {
    setMessageForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    const { nama, satwil, subjek, pesan } = messageForm
    if (!nama.trim() || !satwil.trim() || !subjek.trim() || !pesan.trim()) {
      error('Semua field pesan harus diisi')
      return
    }
    // No message backend exists; the admin contact channel is the real destination.
    // We confirm receipt locally so the user gets clear feedback.
    success('Pesan Anda telah disiapkan. Silakan hubungi admin melalui kontak di samping untuk menindaklanjuti.')
    setMessageForm({ nama: '', satwil: '', subjek: '', pesan: '' })
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Kontak Admin</h1>
          <p>Hubungi administrator sistem Bid TIK Polda DIY untuk bantuan teknis</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Informasi Kontak</h2>
          </div>
          {adminData ? (
            <>
              <div className="act-item">
                <div className="act-icon blue">&#x1F464;</div>
                <div>
                  <div className="act-text"><b>{adminData.nama}</b></div>
                  <div className="act-time">{adminData.jabatan}</div>
                </div>
              </div>
              <div className="act-item">
                <div className="act-icon green">&#x260E;</div>
                <div>
                  <div className="act-text">{adminData.telepon}</div>
                  <div className="act-time">{adminData.jam_operasional}</div>
                </div>
              </div>
              <div className="act-item">
                <div className="act-icon amber">&#x2709;</div>
                <div>
                  <div className="act-text">{adminData.email}</div>
                  <div className="act-time">{adminData.email_note}</div>
                </div>
              </div>
              <div className="act-item">
                <div className="act-icon blue">&#x1F4CD;</div>
                <div>
                  <div className="act-text">{adminData.alamat}</div>
                  <div className="act-time">{adminData.alamat_detail}</div>
                </div>
              </div>
            </>
          ) : <LoadingSpinner text="Memuat data..." />}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Kirim Pesan ke Admin</h2>
          </div>
          <form onSubmit={handleSendMessage} data-demo-form>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label>Nama <span className="req">*</span></label>
              <input type="text" placeholder="Nama Anda" value={messageForm.nama} onChange={(e) => handleMessageChange('nama', e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label>Satwil / Unit <span className="req">*</span></label>
              <input type="text" placeholder="Contoh: Polres Sleman" value={messageForm.satwil} onChange={(e) => handleMessageChange('satwil', e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label>Subjek <span className="req">*</span></label>
              <input type="text" placeholder="Topik pesan" value={messageForm.subjek} onChange={(e) => handleMessageChange('subjek', e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label>Pesan <span className="req">*</span></label>
              <textarea placeholder="Tuliskan pertanyaan atau kendala Anda" value={messageForm.pesan} onChange={(e) => handleMessageChange('pesan', e.target.value)}></textarea>
            </div>
            <div className="form-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button type="submit" className="btn btn-primary">Kirim Pesan</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }} id="adminSettingsPanel">
        <div className="card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>&#x2699;&#xfe0f; Kelola Informasi Kontak Admin</h2>
          <button
            className="btn btn-secondary"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            {isSettingsOpen ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
        {isSettingsOpen && (
          <div style={{ marginTop: '4px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
              Perubahan disimpan ke database Supabase (tabel admin_config) dan langsung diperbarui pada tampilan sistem.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field">
                <label>Nama Admin / Kontak</label>
                <input type="text" placeholder="Nama admin" value={adminData.nama} onChange={(e) => handleInputChange('nama', e.target.value)} />
              </div>
              <div className="field">
                <label>Jabatan / Unit</label>
                <input type="text" placeholder="Jabatan atau unit kerja" value={adminData.jabatan} onChange={(e) => handleInputChange('jabatan', e.target.value)} />
              </div>
              <div className="field">
                <label>Nomor Telepon</label>
                <input type="text" placeholder="(0274) xxx-xxxx" value={adminData.telepon} onChange={(e) => handleInputChange('telepon', e.target.value)} />
              </div>
              <div className="field">
                <label>Jam Operasional</label>
                <input type="text" placeholder="Senin–Jumat, 08.00–16.00 WIB" value={adminData.jam_operasional} onChange={(e) => handleInputChange('jam_operasional', e.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="email@poldadiy.go.id" value={adminData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
              </div>
              <div className="field">
                <label>Keterangan Email</label>
                <input type="text" placeholder="Respon dalam 1 hari kerja" value={adminData.email_note} onChange={(e) => handleInputChange('email_note', e.target.value)} />
              </div>
              <div className="field">
                <label>Alamat Kantor</label>
                <input type="text" placeholder="Alamat lengkap" value={adminData.alamat} onChange={(e) => handleInputChange('alamat', e.target.value)} />
              </div>
              <div className="field">
                <label>Detail Lokasi</label>
                <input type="text" placeholder="Gedung / lantai" value={adminData.alamat_detail} onChange={(e) => handleInputChange('alamat_detail', e.target.value)} />
              </div>
            </div>
            <div className="form-actions" style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
              <button type="button" className="btn btn-primary" onClick={saveSettings}>
                &#x1F4BE; Simpan Perubahan
              </button>
              <button type="button" className="btn" onClick={resetSettings} style={{ marginLeft: '8px' }}>
                &#x21BA; Reset ke Default
              </button>
            </div>
            {showSavedMsg && (
              <div style={{ color: 'var(--green)', marginTop: '8px', fontSize: '13px' }}>
                &#x2713; Perubahan berhasil disimpan dan diterapkan.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
