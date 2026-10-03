'use client'

import { useState, useEffect } from 'react'
import { MovieRow } from '@/components/MovieRow'
import { RatingModal } from '@/components/RatingModal'
import { useSession } from 'next-auth/react'
import type { MovieData } from '@/lib/types'

interface NewMovieData extends MovieData {
  id: string
}

export default function NewPage() {
  const { data: session } = useSession()
  const [movies, setMovies] = useState<NewMovieData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ratingMovie, setRatingMovie] = useState<NewMovieData | null>(null)

  useEffect(() => {
    async function fetchNew() {
      try {
        const response = await fetch('/api/movies/new?limit=20')
        if (response.ok) {
          const data = await response.json()
          setMovies(data.map((m: NewMovieData) => ({ ...m, id: m.tmdbId.toString() })))
        }
      } catch (error) {
        console.error('Failed to fetch new movies:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchNew()
  }, [])

  const handleRate = (movie: NewMovieData) => {
    setRatingMovie(movie)
  }

  const handleDebate = (movie: NewMovieData) => {
    window.location.href = `/movie/${movie.tmdbId}/debates`
  }

  const handleRatingSubmit = async (rating: number) => {
    if (!ratingMovie) return
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId: ratingMovie.id, value: rating }),
    })
    if (!response.ok) throw new Error('Failed to submit rating')
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-medium text-white mb-8">NEW</h1>
        <div className="animate-pulse space-y-12">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-shrink-0 w-40 sm:w-44 md:w-48">
                <div className="aspect-[2/3] rounded-lg bg-gray-800" />
                <div className="mt-2 h-4 bg-gray-800 rounded w-3/4" />
                <div className="mt-1 h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-medium text-white mb-8">NEW</h1>
      <MovieRow
        title="NEW"
        movies={movies}
        onRate={handleRate}
        onDebate={handleDebate}
        emptyMessage="No new releases this month."
      />

      {ratingMovie && (
        <RatingModal
          movie={ratingMovie}
          userRating={null}
          averageRating={null}
          ratingCount={0}
          onClose={() => setRatingMovie(null)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  )
}