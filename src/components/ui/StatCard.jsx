export function StatCard({ label, value, delta, variant = 'blue', className = '' }) {
  return (
    <div className={`stat-card ${variant} ${className}`.trim()}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className={`delta ${delta?.variant || ''}`}>{delta?.text}</div>
    </div>
  )
}

export function KategoriCard({ label, value, variant, className = '' }) {
  const warnaClass = variant || 'var(--blue)'
  return (
    <div
      className={`kat-card ${className}`.trim()}
      style={{ '--kat-color': warnaClass }}
    >
      <div className="kat-label">{label}</div>
      <div className="kat-val">{value}</div>
      <div className="kat-unit">Unit</div>
    </div>
  )
}
