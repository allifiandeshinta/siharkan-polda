import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBoundary from '../components/ui/ErrorBoundary'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const AlatTIKPage = lazy(() => import('../pages/AlatTIKPage'))
const PinjamanHTPage = lazy(() => import('../pages/PinjamanHTPage'))
const SukuCadangPage = lazy(() => import('../pages/SukuCadangPage'))
const SPPMPage = lazy(() => import('../pages/SPPMPage'))
const TrackingPage = lazy(() => import('../pages/TrackingPage'))
const KontakAdminPage = lazy(() => import('../pages/KontakAdminPage'))
const LaporanPage = lazy(() => import('../pages/LaporanPage'))

function LazyLoad({ children }) {
  return <Suspense fallback={<LoadingSpinner text="Memuat halaman..." />}>{children}</Suspense>
}

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LazyLoad><LoginPage /></LazyLoad>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<LazyLoad><DashboardPage /></LazyLoad>} />
            <Route path="/alat-tik" element={<LazyLoad><AlatTIKPage /></LazyLoad>} />
            <Route path="/pinjaman-ht" element={<LazyLoad><PinjamanHTPage /></LazyLoad>} />
            <Route path="/suku-cadang" element={<LazyLoad><SukuCadangPage /></LazyLoad>} />
            <Route path="/sppm" element={<LazyLoad><SPPMPage /></LazyLoad>} />
            <Route path="/tracking" element={<LazyLoad><TrackingPage /></LazyLoad>} />
            <Route path="/laporan" element={<LazyLoad><LaporanPage /></LazyLoad>} />
            <Route path="/kontak-admin" element={<LazyLoad><KontakAdminPage /></LazyLoad>} />
          </Route>
        </Route>

        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">404 - Halaman Tidak Ditemukan</h1>
              <p className="text-gray-600 mb-6">Halaman yang Anda minta tidak ditemukan.</p>
              <a href="/" className="btn btn-primary">Kembali ke Dashboard</a>
            </div>
          </div>
        } />
      </Routes>
    </ErrorBoundary>
  )
}
