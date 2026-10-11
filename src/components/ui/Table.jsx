export function Table({ columns, data, emptyMessage = 'Tidak ada data', actions, className = '' }) {
  return (
    <div className="table-wrap">
      <table className={className}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={col.style}>
                {col.label}
              </th>
            ))}
            {actions && <th className="aksi-col">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={col.cellClass} style={col.cellStyle}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="aksi-col">
                    <div className="row-actions">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
