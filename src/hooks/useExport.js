import { useCallback } from 'react'
import { exportToCSV } from '../utils/exportToCSV'

export function useExport() {
  const handleExport = useCallback((data, filename) => {
    try {
      const result = exportToCSV(data, filename)
      return {
        success: true,
        message: `Exported ${result.rows} rows`,
        filename: result.filename
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  }, [])

  return { handleExport }
}