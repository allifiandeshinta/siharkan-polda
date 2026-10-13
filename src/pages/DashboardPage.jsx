import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardData } from '../services/dashboard'
import { getAllInventaris } from '../services/inventaris'
import { getAllPinjaman } from '../services/pinjaman'
import { getAllSukuCadang } from '../services/sukuCadang'
import { getAllTracking } from '../services/tracking'
import { getAllRekap, countHT } from '../services/rekap'
import { computeStats } from '../services/stats'
import { StatCard } from '../components/ui'

// ── Donut SVG helper ──────────────────────────────────────────────────────────
function DonutChart({ data, size = 110 }) {
  const r = 38
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const total = data.reduce((s, d) => s + d.value, 0)

  let cumulative = 0
  const segments = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0
    const dash = pct * circumference
    const offset = circumference - cumulative * circumference / total
    cumulative += d.value
    return { ...d, dash, offset }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={14} />
      ) : (
        segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={14}
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))
      )}
      <circle cx={cx} cy={cy} r={26} fill="var(--surface)" />
    </svg>
  )
}

// ── Quick access card ─────────────────────────────────────────────────────────
function QuickCard({ to, label, icon, count, color }) {
  return (
    <Link to={to} className="quick-access-card" style={{ '--qa-color': color }}>
      <div className="qa-icon">{icon}</div>
      <div className="qa-label">{label}</div>
      {count != null && <div className="qa-count">{count.toLocaleString('id-ID')}</div>}
    </Link>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { userRole, session } = useAuth()
  const isUserRole = userRole === 'User'
  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email ||
    'User'

  const [currentDate, setCurrentDate] = useState('')
  const [stats, setStats] = useState(null)
  const [dashData, setDashData] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [stokMenipis, setStokMenipis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      setCurrentDate(now.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }))

      const [inventaris, pinjaman, sukuCadang, tracking, rekap, dash] = await Promise.all([
        getAllInventaris().catch(() => []),
        getAllPinjaman().catch(() => []),
        getAllSukuCadang().catch(() => []),
        getAllTracking().catch(() => []),
        getAllRekap().catch(() => []),
        getDashboardData().catch(() => null),
      ])

      const computed = computeStats(inventaris, pinjaman, sukuCadang, tracking, rekap)
      setStats(computed)
      setDashData(dash)

      // Recent activity: last 5 pinjaman + tracking combined
      const recentPinjaman = pinjaman.slice(0, 3).map(p => ({
        type: 'pinjaman',
        label: `Pinjam HT – ${p.satwil || '-'}`,
        sub: p.tgl_pinjam || '',
        status: p.is_returned ? 'Dikembalikan' : 'Aktif',
        variant: p.is_returned ? 'success' : 'warning',
      }))
      const recentTracking = tracking.slice(0, 3).map(t => ({
        type: 'tracking',
        label: `Aduan – ${t.satwil || '-'}`,
        sub: t.tgl || '',
        status: t.status,
        variant: t.status === 'Selesai' ? 'success' : t.status === 'Proses' ? 'warning' : 'danger',
      }))
      const combined = [...recentPinjaman, ...recentTracking]
        .sort((a, b) => b.sub.localeCompare(a.sub))
        .slice(0, 6)
      setRecentActivity(combined)

      // Stok menipis
      setStokMenipis(sukuCadang.filter(s => s.stok < s.min_stok).slice(0, 5))
    } catch (e) {
      setError(e.message || 'Gagal memuat data dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── User welcome ──────────────────────────────────────────────────────────
  if (isUserRole) {
    return (
      <div>
        <div className="welcome-hero user-hero">
          <div className="wh-top">
            <div className="wh-text">
              <h1>Selamat Datang, {userName}</h1>
              <p>Gunakan menu di samping untuk memantau aduan perbaikan perangkat HT Anda.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 30, height: 30, border: '3px solid var(--border)', borderTopColor: 'var(--polri-gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data dashboard…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--red)' }}>{error}</p>
        <button className="btn btn-primary" onClick={load} style={{ marginTop: 12 }}>Coba Lagi</button>
      </div>
    )
  }

  const s = stats || {}
  const d = dashData || {}

  const donutHTData = [
    { value: s.htBaik || 0, color: 'var(--green)' },
    { value: s.htRusakRingan || 0, color: 'var(--amber)' },
    { value: s.htRusakBerat || 0, color: 'var(--red)' },
  ]
  const donutTrackingData = [
    { value: s.trkSelesai || 0, color: 'var(--green)' },
    { value: s.trkProses || 0, color: 'var(--polri-gold)' },
    { value: s.trkBelum || 0, color: 'var(--red)' },
  ]

  const totalHT = (s.htBaik || 0) + (s.htRusakRingan || 0) + (s.htRusakBerat || 0)

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="welcome-hero">
        <div className="wh-eyebrow">Bidang Teknologi Informasi &amp; Komunikasi — Polda DIY</div>
        <div className="wh-top">
          <div className="wh-text">
            <h1>Dashboard SIHARKAN TIK</h1>
            <p>Pantau status inventaris, peminjaman HT, suku cadang, dan aduan perbaikan secara real-time.</p>
          </div>
        </div>
        <div className="wh-meta">
          <div className="wh-meta-item">
            <span className="wm-label">Tanggal</span>
            <span className="wm-value">{currentDate}</span>
          </div>
          <div className="wh-meta-item">
            <span className="wm-label">Pengguna Aktif</span>
            <span className="wm-value">Admin Sistem</span>
          </div>
          <div className="wh-meta-item">
            <span className="wm-label">Total Alat</span>
            <span className="wm-value">{(d.totalAlat ?? s.totalAlat ?? 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="wh-meta-item">
            <span className="wm-label">Status Sistem</span>
            <span className="wm-value">&#x2713; Normal</span>
          </div>
        </div>
      </div>

      {/* ── Summary Stat Cards ───────────────────────────────────────────── */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total HT" value={(totalHT).toLocaleString('id-ID')} variant="navy"
          delta={{ text: `${s.htBaik || 0} Baik`, variant: 'success' }} />
        <StatCard label="Dipinjam Aktif" value={(s.pinjamanAktif || 0).toLocaleString('id-ID')} variant="amber"
          delta={{ text: `${s.pinjamanJatuhTempo || 0} jatuh tempo`, variant: s.pinjamanJatuhTempo > 0 ? 'danger' : '' }} />
        <StatCard label="Suku Cadang" value={(s.scTotal || 0).toLocaleString('id-ID')} variant="blue"
          delta={{ text: `${s.scMenipis || 0} menipis`, variant: s.scMenipis > 0 ? 'danger' : 'success' }} />
        <StatCard label="Aduan Masuk" value={(s.trkTotal || 0).toLocaleString('id-ID')} variant="green"
          delta={{ text: `${s.trkBerjalan || 0} berjalan`, variant: s.trkBerjalan > 0 ? 'warning' : '' }} />
      </div>

      {/* ── Donut Charts ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* HT Donut */}
        <div className="card">
          <div className="card-head"><span>Kondisi HT</span></div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 20px' }}>
            <DonutChart data={donutHTData} size={110} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                <span>Baik: <b>{s.htBaik || 0}</b> ({s.pctBaik || 0}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />
                <span>Rusak Ringan: <b>{s.htRusakRingan || 0}</b> ({s.pctRR || 0}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
                <span>Rusak Berat: <b>{s.htRusakBerat || 0}</b> ({s.pctRB || 0}%)</span>
              </div>
              <div style={{ marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 6, fontWeight: 700 }}>
                Total: {totalHT.toLocaleString('id-ID')} unit
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Donut */}
        <div className="card">
          <div className="card-head"><span>Status Aduan Perbaikan</span></div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 20px' }}>
            <DonutChart data={donutTrackingData} size={110} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                <span>Selesai: <b>{s.trkSelesai || 0}</b> ({s.pctSelesai || 0}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--polri-gold)', display: 'inline-block' }} />
                <span>Proses: <b>{s.trkProses || 0}</b> ({s.pctProses || 0}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
                <span>Belum: <b>{s.trkBelum || 0}</b> ({s.pctBelum || 0}%)</span>
              </div>
              <div style={{ marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 6, fontWeight: 700 }}>
                Total: {(s.trkTotal || 0).toLocaleString('id-ID')} aduan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Access ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><span>Akses Cepat</span></div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            <QuickCard to="/alat-tik" label="Data Alat TIK" color="var(--polri-navy)" count={s.totalAlat}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={28} height={28}><rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>} />
            <QuickCard to="/pinjaman-ht" label="Pinjam HT" color="var(--amber)" count={s.pinjamanAktif}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={28} height={28}><path d="M16 3l4 4-4 4"/><path d="M20 7H8a4 4 0 0 0-4 4v1"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h12a4 4 0 0 0 4-4v-1"/></svg>} />
            <QuickCard to="/suku-cadang" label="Suku Cadang" color="var(--blue)" count={s.scTotal}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={28} height={28}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>} />
            <QuickCard to="/sppm" label="Data SPPM" color="var(--indigo, #6366f1)"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={28} height={28}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>} />
            <QuickCard to="/tracking" label="Tracking" color="var(--green)" count={s.trkBerjalan}
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={28} height={28}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
            <QuickCard to="/laporan" label="Laporan" color="var(--polri-gold)"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={28} height={28}><path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/><path d="M8 17v-4"/><path d="M12 17V7"/><path d="M16 17v-7"/></svg>} />
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Aktivitas + Stok Menipis ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Aktivitas Terbaru */}
        <div className="card">
          <div className="card-head">
            <span>Aktivitas Terbaru</span>
            <Link to="/pinjaman-ht" style={{ fontSize: 12, color: 'var(--polri-gold)' }}>Lihat semua</Link>
          </div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {recentActivity.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>Belum ada aktivitas</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {recentActivity.map((act, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{act.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{act.sub}</div>
                    </div>
                    <span className={`badge badge-${act.variant}`} style={{ fontSize: 11 }}>{act.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="card">
          <div className="card-head">
            <span>⚠ Stok Menipis</span>
            <Link to="/suku-cadang" style={{ fontSize: 12, color: 'var(--polri-gold)' }}>Lihat semua</Link>
          </div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {stokMenipis.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>
                ✓ Semua stok dalam batas aman
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {stokMenipis.map((sc, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: i < stokMenipis.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{sc.nama}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Min: {sc.min_stok} {sc.satuan}</div>
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: 11 }}>Sisa: {sc.stok}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}