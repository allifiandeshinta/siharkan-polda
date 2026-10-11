import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute() {
  const { session, loading, userRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 12
      }}>
        <div style={{
          width: 28, height: 28, border: '3px solid #e0e0e0',
          borderTopColor: '#d4a017', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <span style={{ fontSize: 13, color: '#888' }}>Memuat sesi...</span>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role protection: User restriction
  if (userRole === 'User') {
    const restrictedPaths = ['/alat-tik', '/pinjaman-ht', '/sppm', '/suku-cadang']
    if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
