'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/tmdb'
import { Button } from './ui/Button'

interface SearchResult {
  id: number
  title: string
  release_date: string
  overview: string
  poster_path: string | null
  posterUrl: string
}

export function SearchBar({ placeholder = 'Search movies...' }: { placeholder?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/movies?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data.results) {
        setResults(data.results)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateToMovie(results[selectedIndex])
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
      setShowResults(false)
    } else if (e.key === 'Escape') {
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  const navigateToMovie = (movie: SearchResult) => {
    router.push(`/movie/${movie.id}`)
    setQuery('')
    setResults([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
    setSelectedIndex(-1)
  }

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="movie-search" className="sr-only">Search movies</label>
        <input
          ref={inputRef}
          id="movie-search"
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={showResults && results.length > 0}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </form>

      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto"
        >
          {results.map((movie, index) => (
            <button
              key={movie.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => navigateToMovie(movie)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${index === selectedIndex ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              {movie.poster_path ? (
                <Image
                  src={movie.posterUrl}
                  alt=""
                  width={40}
                  height={60}
                  className="w-10 h-15 object-cover rounded flex-shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <div className="w-10 h-15 bg-gray-700 rounded flex-shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{movie.title}</p>
                <p className="text-xs text-gray-400">{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
              </div>
            </button>
          ))}
          <button
            type="button"
            role="option"
            onClick={() => router.push(`/search?q=${encodeURIComponent(query)}`)}
            className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 border-t border-gray-700"
          >
            Show all results for "{query}"
          </button>
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !isLoading && (
        <div
          ref={resultsRef}
          id="search-results"
          className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500"
        >
          No movies found for "{query}"
        </div>
      )}
    </div>
  )
}