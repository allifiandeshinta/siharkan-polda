import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import poldaLogo from '../assets/polda-diy-logo.png'

function translateAuthError(error) {
  if (!error) return 'Terjadi kesalahan'
  const msg = error.message || String(error)
  if (msg.includes('Invalid login credentials')) return 'Email atau password salah'
  if (msg.includes('Email not confirmed')) return 'Email belum dikonfirmasi'
  if (msg.includes('User not found')) return 'Akun tidak ditemukan'
  if (msg.includes('Rate limit')) return 'Terlalu banyak percobaan. Coba lagi nanti'
  if (msg.includes('Timed out')) return 'Koneksi timeout. Periksa jaringan Anda'
  if (msg.includes('network') || msg.includes('fetch')) return 'Koneksi gagal. Periksa jaringan Anda'
  if (msg.includes('auth') || msg.includes('invalid')) return 'Email atau password salah'
  return msg
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { session, loading, refreshSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate('/', { replace: true })
      }
    }
  }, [session, loading, navigate])

  useEffect(() => {
    refreshSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email harus diisi')
      return
    }
    if (!password) {
      setError('Password harus diisi')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email.trim(), password)
      await refreshSession()
      navigate('/', { replace: true })
    } catch (err) {
      setError(translateAuthError(err))
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memeriksa sesi...</p>
        </div>
      </div>
    )
  }

  if (session) return null

  return (
    <div className="login-wrap">
      <div style={{ width: '100%', maxWidth: 390 }}>
        <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-mark">
            <img src={poldaLogo} alt="Logo Polda DIY" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="login-logo-text">
            <div className="ln1">SIHARKAN-TIK</div>
            <div className="ln2">Bidang TIK &middot; Polda DIY</div>
          </div>
        </div>

        <h1>Masuk ke Sistem</h1>
        <p className="sub">Sistem Informasi Pemeliharaan dan Perbaikan Alat Fungsional Bid TIK Polda DIY</p>

        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} data-login-form>
          <div className="field" style={{ marginBottom: '15px' }}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field" style={{ marginBottom: '22px' }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="login-foot">&copy; 2026 Bidang Teknologi Informasi dan Komunikasi &mdash; Polda DIY</p>
      </div>
      </div>
    </div>
  )
}
