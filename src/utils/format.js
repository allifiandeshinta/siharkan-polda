export const formatTanggal = (tanggal) => {
  const date = new Date(tanggal)
  return date.toLocaleDateString('id-ID')
}

export const formatSatuan = (item) => {
  const unit = item.satuan === 'pcs' ? 'unit' : 'm'
  return `${item.stok} ${unit}`
}

export const getConditionVariant = (kondisi) => {
  if (kondisi === 'Baik') return 'green'
  if (kondisi === 'Rusak Ringan') return 'amber'
  if (kondisi === 'Rusak Berat') return 'red'
  return 'default'
}

export const scrollToElement = (elementId) => {
  document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' })
}
