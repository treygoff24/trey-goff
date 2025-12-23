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
  const [error, setError] = useState<string | null>(null)

  // Initialize search on first use (lazy load)
  const initialize = useCallback(async () => {
    if (isInitialized) return true
    setIsLoading(true)
    setError(null)
    try {
      await initializeSearch()
      setIsInitialized(true)
      return true
    } catch {
      setError('Search is unavailable right now.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchAsync = async () => {
      try {
        const initialized = await initialize()
        if (!initialized) return
        const searchResults = await searchDocuments(query)
        setResults(searchResults)
        setError(null)
      } catch {
        setResults([])
        setError('Search is unavailable right now.')
      }
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
    error,
  }
}
