export default function EmptyState({ message, icon }) {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 20px', color: 'var(--muted)'
    }}>
      {icon && <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>}
      <p style={{ fontSize: 13, margin: 0 }}>{message || 'Tidak ada data'}</p>
    </div>
  )
}
