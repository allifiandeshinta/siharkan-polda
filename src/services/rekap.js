import supabase from '../lib/supabase'

const TABLE = 'rekap_inventaris'

// Ambil seluruh snapshot rekap inventaris (agregat per satwil/kategori)
export async function getAllRekap() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('satwil', { ascending: true })
    .order('kategori', { ascending: true })
  if (error) throw error
  return data
}

// Total HT (Baik + Rusak) dari rekap_inventaris
export function countHT(rekap) {
  return rekap
    .filter(r => r.kategori === 'HT')
    .reduce((a, r) => a + (r.jumlah || 0), 0)
}

// Total per kategori dari rekap_inventaris
export function countByKategori(rekap) {
  return rekap.reduce((acc, r) => {
    acc[r.kategori] = (acc[r.kategori] || 0) + (r.jumlah || 0)
    return acc
  }, {})
}
