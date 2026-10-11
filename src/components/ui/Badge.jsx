export function Badge({ children, variant = 'default', className = '' }) {
  const variantClass = `badge ${variant}`
  return (
    <span className={`${variantClass} ${className}`.trim()}>
      {children}
    </span>
  )
}

export function TypeTag({ children, type, className = '' }) {
  return (
    <span className={`type-tag ${type.toLowerCase()} ${className}`.trim()}>
      {children}
    </span>
  )
}
