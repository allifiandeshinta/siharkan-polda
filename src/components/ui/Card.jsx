export function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`.trim()}>
      {children}
    </div>
  )
}

export function CardHead({ children, actions }) {
  return (
    <div className="card-head">
      {children}
      {actions && <div className="head-actions">{actions}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`card-body ${className}`.trim()}>
      {children}
    </div>
  )
}
