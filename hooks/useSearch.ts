'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  searchDocuments,
  initializeSearch,
  type SearchResult,
} from '@/lib/search/orama'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize search on first use (lazy load)
  const initialize = useCallback(async () => {
    if (isInitialized) return
    setIsLoading(true)
    await initializeSearch()
    setIsInitialized(true)
    setIsLoading(false)
  }, [isInitialized])

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchAsync = async () => {
      await initialize()
      const searchResults = await searchDocuments(query)
      setResults(searchResults)
    }

    // Debounce search
    const timeout = setTimeout(searchAsync, 100)
    return () => clearTimeout(timeout)
  }, [query, initialize])

  return {
    query,
    setQuery,
    results,
    isLoading,
    isInitialized,
    initialize,
  }
}
