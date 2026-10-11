export default function ConfirmModal({ open, title, message, confirmLabel, confirmVariant, onConfirm, onCancel, loading }) {
  if (!open) return null

  const btnBg = confirmVariant === 'danger' ? 'var(--red)' : 'var(--polri-gold)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)'
    }} onClick={onCancel}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 24, minWidth: 360, maxWidth: 440,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn" onClick={onCancel} disabled={loading}>Batal</button>
          <button
            className="btn btn-primary"
            style={{ background: btnBg, borderColor: btnBg }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmLabel || 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}
