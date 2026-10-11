import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminConfig } from '../../services/adminConfig'
import { getAllSukuCadang } from '../../services/sukuCadang'
import { getAllPinjaman } from '../../services/pinjaman'
import { getAllTracking } from '../../services/tracking'
import { signOut } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import poldaLogo from '../../assets/polda-diy-logo.png'
import tikLogo from '../../assets/tik-polri-logo.png'

export default function Topbar({ title, onToggle, collapsed }) {
  const [adminNama, setAdminNama] = useState('Admin Sistem')
  const [adminRole, setAdminRole] = useState('Administrator')
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const notifRef = useRef(null)
  const navigate = useNavigate()
  const { clearSession } = useAuth()

  useEffect(() => {
    getAdminConfig().then(config => {
      if (config) {
        setAdminNama(config.nama)
        setAdminRole(config.role)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    async function loadNotifs() {
      try {
        const [suku, pinjaman, tracking] = await Promise.all([
          getAllSukuCadang(),
          getAllPinjaman(),
          getAllTracking()
        ])

        const items = []

        // Stok menipis
        suku.filter(s => s.stok < s.min_stok).forEach(s => {
          items.push({
            id: `stok-${s.id}`,
            type: 'warning',
            text: `Stok ${s.nama} menipis (${s.stok} unit)`,
            link: '/suku-cadang',
            time: 'Sekarang'
          })
        })

        // Pinjaman terlambat
        pinjaman.forEach(p => {
          if (p.is_returned) return
          const tgl = new Date(p.tgl_kembali)
          const today = new Date(); today.setHours(0,0,0,0)
          if (tgl < today) {
            items.push({
              id: `terlambat-${p.id}`,
              type: 'danger',
              text: `HT ${p.jenis_ht || ''} terlambat dikembalikan oleh ${p.satwil}`,
              link: '/pinjaman-ht',
              time: `${Math.ceil((today - tgl)/86400000)} hari lewat`
            })
          }
        })

        // Aduan baru belum ditindaklanjuti
        tracking.filter(t => t.status === 'Belum Ditindaklanjuti').forEach(t => {
          items.push({
            id: `aduan-${t.id}`,
            type: 'info',
            text: `Aduan ${t.jenis} dari ${t.satwil} belum ditindaklanjuti`,
            link: '/tracking',
            time: t.tgl
          })
        })

        items.sort((a, b) => (a.time > b.time ? -1 : 1))
        setNotifications(items.slice(0, 10))
        setNotifCount(items.length)
      } catch (err) {
        // silent fail
      }
    }
    loadNotifs()
    const interval = setInterval(loadNotifs, 60000)
    return () => clearInterval(interval)
  }, [])

  // Click outside to close notif panel
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false)
      }
    }
    if (showNotif) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotif])

  const handleLogout = async (e) => {
    e.preventDefault()
    clearSession()
    await signOut().catch(() => {})
    navigate('/login', { replace: true })
  }

  const goTo = (link) => {
    setShowNotif(false)
    navigate(link)
  }

  const notifTypeIcon = (type) => {
    if (type === 'danger') return <span style={{color:'var(--red)'}}>&#x26A0;</span>
    if (type === 'warning') return <span style={{color:'var(--amber)'}}>&#x26A0;</span>
    return <span style={{color:'var(--blue)'}}>&#x2139;</span>
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggle} aria-label={collapsed ? 'Buka menu' : 'Tutup menu'}>
          {collapsed ? (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          ) : (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          )}
        </button>
        <div className="topbar-brand">
          <div className="tb-logo"><img src={poldaLogo} alt="Logo Polda DIY" style={{ width: 28, height: 'auto', verticalAlign: 'middle' }} /></div>
          SIHARKAN-TIK
        </div>
        <div className="crumb"><span>Beranda</span><span className="sep">/</span><b>{title}</b></div>
      </div>
      <div className="topbar-actions" ref={notifRef}>
        <div style={{ position: 'relative' }}>
          <div className="icon-btn" title="Notifikasi" onClick={() => setShowNotif(!showNotif)} style={{ cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {notifCount > 0 && <span className="notif-badge">{notifCount > 99 ? '99+' : notifCount}</span>}
          </div>
          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-head">Notifikasi</div>
              {notifications.length === 0 ? (
                <div className="notif-dropdown-empty">Tidak ada notifikasi</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="notif-dropdown-item" onClick={() => goTo(n.link)}>
                    <div className="notif-dropdown-icon">{notifTypeIcon(n.type)}</div>
                    <div className="notif-dropdown-body">
                      <div className="notif-dropdown-text">{n.text}</div>
                      <div className="notif-dropdown-time">{n.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button className="icon-btn logout-topbar" title="Keluar" onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
        <div className="user-chip">
          <div className="avatar is-logo">
             <img src={tikLogo} alt="TIK POLRI" />
          </div>
          <div className="meta"><b>{adminNama}</b><span>{adminRole}</span></div>
        </div>
      </div>
    </header>
  )
}
