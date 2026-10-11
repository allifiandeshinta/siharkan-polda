import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getAdminConfig } from '../../services/adminConfig'
import { signOut } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import tikLogo from '../../assets/tik-polri-logo.png'
import poldaLogo from '../../assets/polda-diy-logo.png'

const adminMenuItems = [
  { to: '/', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg> },
  { to: '/alat-tik', label: 'Data Alat TIK', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { to: '/pinjaman-ht', label: 'Pinjam Pakai HT', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M16 3l4 4-4 4"/><path d="M20 7H8a4 4 0 0 0-4 4v1"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h12a4 4 0 0 0 4-4v-1"/></svg> },
  { to: '/suku-cadang', label: 'Suku Cadang', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg> },
  { to: '/sppm', label: 'Data SPPM', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
  { to: '/laporan', label: 'Laporan Bulanan', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/><path d="M8 17v-4"/><path d="M12 17V7"/><path d="M16 17v-7"/></svg> },
  { to: '/tracking', label: 'Tracking Perbaikan', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { to: '/kontak-admin', label: 'Kontak Admin', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1 .33 1.99.6 2.95a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.13-1.27a2 2 0 0 1 2.11-.45c.96.27 1.95.47 2.95.6A2 2 0 0 1 22 16.92z"/></svg> },
]

const userMenuItems = [
  { to: '/', label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg> },
  { to: '/tracking', label: 'Tracking Perbaikan', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { to: '/kontak-admin', label: 'Kontak Admin', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1 .33 1.99.6 2.95a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.13-1.27a2 2 0 0 1 2.11-.45c.96.27 1.95.47 2.95.6A2 2 0 0 1 22 16.92z"/></svg> },
]

export default function Sidebar({ collapsed, sidebarOpen, onToggle }) {
  const [adminName, setAdminName] = useState('Admin Sistem')
  const [adminJabatan, setAdminJabatan] = useState('Bid TIK Polda DIY')
  const navigate = useNavigate()
  const { session, clearSession, userRole } = useAuth()
  
  const isUserRole = userRole === 'User'
  const displayMenuItems = isUserRole ? userMenuItems : adminMenuItems

  useEffect(() => {
    if (!isUserRole) {
      getAdminConfig().then(config => {
        if (config) {
          setAdminName(config.nama)
          setAdminJabatan(config.jabatan)
        }
      }).catch(() => {})
    } else {
      setAdminName(session?.user?.email || 'User')
      setAdminJabatan('User Role')
    }
  }, [session, isUserRole])

  const handleLogout = async (e) => {
    e.preventDefault()
    clearSession()
    await signOut().catch(() => {})
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="brand">
          <div className="brand-inner">
            <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={poldaLogo} alt="Logo POLDA" style={{ width: 36, height: 'auto', objectFit: 'contain' }} />
            </div>
            <div className="brand-text">
              <div className="sys-name">SIHARKAN-TIK</div>
              <div className="sys-sub">Bid TIK &middot; Polda DIY</div>
            </div>
          </div>
        </div>
        <div className="menu-scroll">
          <div className="menu-label">{collapsed ? '' : 'Menu Utama'}</div>
          {displayMenuItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `menu-item${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="user-box">
          <div className="avatar is-logo">
             <img src={tikLogo} alt="TIK POLRI" />
          </div>
          <div className="who">
            <b>{adminName}</b>
            <span>{adminJabatan}</span>
          </div>
          <button type="button" className="logout" title="Keluar" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>
    </>
  )
}
