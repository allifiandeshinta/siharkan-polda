const variantStyles = {
  success: { background: 'var(--green-bg)', color: 'var(--green)', borderLeft: '4px solid var(--green)' },
  error: { background: 'var(--red-bg)', color: 'var(--red)', borderLeft: '4px solid var(--red)' },
  info: { background: 'var(--blue-bg)', color: 'var(--blue)', borderLeft: '4px solid var(--blue)' },
}

export default function ToastContainer({ toasts }) {
  if (!toasts?.length) return null

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', ...variantStyles[t.type] || variantStyles.info,
          animation: 'slideIn 0.25s ease-out'
        }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
