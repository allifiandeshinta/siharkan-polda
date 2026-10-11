import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, Topbar } from '../components/layout'

const pageTitles = {
  '/': 'Dashboard',
  '/alat-tik': 'Data Alat TIK',
  '/pinjaman-ht': 'Pinjam Pakai HT',
  '/suku-cadang': 'Suku Cadang',
  '/sppm': 'Data SPPM',
  '/tracking': 'Tracking Perbaikan',
  '/laporan': 'Laporan Bulanan',
  '/kontak-admin': 'Kontak Admin',
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Halaman'

  // Tutup sidebar otomatis saat navigasi di mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleToggle = () => {
    if (window.innerWidth <= 900) {
      setSidebarOpen(p => !p)
    } else {
      setCollapsed(p => !p)
    }
  }

  return (
    <div className="app">
      <Sidebar collapsed={collapsed} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}
      <div className={`main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar title={title} onToggle={handleToggle} collapsed={collapsed} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
