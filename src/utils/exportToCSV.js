export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export')
  }

  const headers = Object.keys(data[0])
  const headerRow = headers.join(',')
  
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      const strValue = String(value)
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    }).join(',')
  }).join('\n')

  const csvContent = `${headerRow}\n${dataRows}`
  
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return { filename, rows: data.length, columns: headers.length }
}