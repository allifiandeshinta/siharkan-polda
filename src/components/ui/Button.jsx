export function Button({ children, variant = 'default', className = '', ...props }) {
  const baseClass = 'btn'
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'icon' ? 'btn-icon' : ''
  return (
    <button className={`${baseClass} ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

export function IconButton({ icon, className = '', ...props }) {
  return (
    <button className={`btn btn-icon ${className}`.trim()} {...props}>
      {icon}
    </button>
  )
}
