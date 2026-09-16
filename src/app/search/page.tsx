'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/tmdb'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { RatingModal } from '@/components/RatingModal'
import { useSession } from 'next-auth/react'

interface SearchResult {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  posterUrl: string
  localDebateCount: number
  localRatingCount: number
}

interface SearchResponse {
  results: SearchResult[]
  page: number
  total_pages: number
  total_results: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalResults: 0 })
  const [ratingMovie, setRatingMovie] = useState<SearchResult | null>(null)

  useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery, 1)
    }
  }, [initialQuery])

  const fetchResults = async (searchQuery: string, page: number) => {
    if (searchQuery.length < 2) {
      setResults([])
      setPagination({ page: 1, totalPages: 1, totalResults: 0 })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/movies?q=${encodeURIComponent(searchQuery)}&page=${page}`)
      const data: SearchResponse = await response.json()
      setResults(data.results)
      setPagination({ page: data.page, totalPages: data.total_pages, totalResults: data.total_results })
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleRate = (movie: SearchResult) => {
    setRatingMovie(movie)
  }

  const handleDebate = (movie: SearchResult) => {
    router.push(`/movie/${movie.id}/debates`)
  }

  const handleRatingSubmit = async (rating: number) => {
    if (!ratingMovie) return
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId: ratingMovie.id.toString(), value: rating }),
    })
    if (!response.ok) throw new Error('Failed to submit rating')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <form onSubmit={handleSearch} className="mb-8 max-w-2xl">
        <label htmlFor="search-input" className="sr-only">Search movies</label>
        <div className="relative">
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-lg"
            autoFocus
          />
        </div>
      </form>

      {query && (
        <div className="mb-4 text-gray-400">
          {pagination.totalResults > 0 ? (
            <>Showing <span className="text-white">{results.length}</span> of <span className="text-white">{pagination.totalResults}</span> results for &ldquo;<span className="text-white">{query}</span>&rdquo;</>
          ) : (
            <>No results found for &ldquo;<span className="text-white">{query}</span>&rdquo;</>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40 sm:w-44 md:w-48">
              <div className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse" />
              <div className="mt-2 h-4 bg-gray-800 rounded animate-pulse w-3/4" />
              <div className="mt-1 h-3 bg-gray-800 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map(movie => (
            <div key={movie.id} className="flex-shrink-0 w-40 sm:w-44 md:w-48 group cursor-pointer">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                {movie.poster_path ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100px, (max-width: 1024px) 120px, 140px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium text-white truncate group-hover:underline">{movie.title}</h3>
                <p className="text-xs text-gray-500">{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={Math.round(movie.vote_average / 2)} max={5} size="sm" interactive={false} />
                  <span className="text-xs text-gray-400">{movie.vote_average.toFixed(1)}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="primary" onClick={e => { e.stopPropagation(); handleRate(movie) }} className="px-2 py-1 text-xs">Rate</Button>
                  <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleDebate(movie) }} className="px-2 py-1 text-xs">Debate</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-12 text-gray-500">
          <p>No movies found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Enter a movie title to search</p>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => fetchResults(query, pagination.page - 1)} disabled={pagination.page === 1 || isLoading}>
            Previous
          </Button>
          <span className="text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => fetchResults(query, pagination.page + 1)} disabled={pagination.page === pagination.totalPages || isLoading}>
            Next
          </Button>
        </div>
      )}

      {ratingMovie && (
        <RatingModal
          movie={{
            id: ratingMovie.id.toString(),
            tmdbId: ratingMovie.id,
            title: ratingMovie.title,
            posterPath: ratingMovie.poster_path,
            posterUrl: ratingMovie.posterUrl,
          }}
          userRating={null}
          averageRating={ratingMovie.vote_average / 2}
          ratingCount={ratingMovie.vote_count}
          onClose={() => setRatingMovie(null)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  )
}