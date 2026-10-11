export function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems, className = '' }) {
  const safeCurrent = Math.min(currentPage, Math.max(totalPages, 1))
  const startItem = totalItems === 0 ? 0 : (safeCurrent - 1) * itemsPerPage + 1
  const endItem = Math.min(safeCurrent * itemsPerPage, totalItems)

  return (
    <div className={`pagination ${className}`.trim()}>
      <span id="paginationInfo">
        {totalItems === 0 ? 'Tidak ada data' : `Menampilkan ${startItem}–${endItem} dari ${totalItems} data`}
      </span>
      <div className="pages" id="paginationPages">
        {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={page === currentPage ? 'active' : ''}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  )
}
