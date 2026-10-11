import { useState, useEffect, useMemo } from 'react'

export function useSearch(data, searchFields = []) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = useMemo(() => {
    if (!data || data.length === 0) return []
    if (!searchTerm.trim()) return data

    const term = searchTerm.toLowerCase()
    return data.filter(item =>
      searchFields.some(field => {
        const value = item?.[field]
        return value != null && value.toString().toLowerCase().includes(term)
      })
    )
  }, [data, searchTerm, searchFields])

  return { searchTerm, setSearchTerm, filtered }
}

export function usePagination(data, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const maxPage = Math.ceil(data.length / itemsPerPage)
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage)
    }
    if (data.length === 0) {
      setCurrentPage(1)
    }
  }, [data.length, itemsPerPage])

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const safeCurrent = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedData = data.slice(
    (safeCurrent - 1) * itemsPerPage,
    safeCurrent * itemsPerPage
  )

  return { currentPage: safeCurrent, setCurrentPage, paginatedData, totalPages }
}

export function useFilter(data, filters = {}) {
  const [activeFilters, setActiveFilters] = useState(filters)

  const filtered = useMemo(() => {
    let result = [...data]
    Object.keys(activeFilters).forEach(key => {
      if (activeFilters[key]) {
        result = result.filter(item => item[key] === activeFilters[key])
      }
    })
    return result
  }, [data, activeFilters])

  const updateFilter = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }))
  }

  return { activeFilters, updateFilter, filtered }
}

export function useTabs(initialTab) {
  const [activeTab, setActiveTab] = useState(initialTab)
  return { activeTab, setActiveTab }
}
