export default function LoadingSpinner({ text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', flexDirection: 'column', gap: 12
    }}>
      <div style={{
        width: 28, height: 28, border: '3px solid var(--border)',
        borderTopColor: 'var(--polri-gold)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      {text && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{text}</span>}
    </div>
  )
}
