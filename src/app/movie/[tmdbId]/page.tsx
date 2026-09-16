'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { RatingModal } from '@/components/RatingModal'
import { useSession } from 'next-auth/react'

interface MovieData {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genres: Array<{ id: number; name: string }>
  runtime: number | null
  status: string
  tagline: string
  posterUrl: string
  backdropUrl: string
  localId: string
  debateCount: number
  ratingCount: number
  averageRating: number | null
  userRating: number | null
}

export default function MoviePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const tmdbId = params.tmdbId as string

  const [movie, setMovie] = useState<MovieData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [ratingMovie, setRatingMovie] = useState<MovieData | null>(null)

  useEffect(() => {
    async function fetchMovie() {
      try {
        const response = await fetch(`/api/movies/${tmdbId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Movie not found')
          } else {
            setError('Failed to load movie')
          }
          return
        }
        const data = await response.json()
        setMovie(data)
      } catch {
        setError('Failed to load movie')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovie()
  }, [tmdbId])

  const handleRate = () => {
    if (movie) setRatingMovie(movie)
  }

  const handleDebate = () => {
    if (movie) router.push(`/movie/${tmdbId}/debates`)
  }

  const handleRatingSubmit = async (rating: number) => {
    if (!movie) return
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId: movie.localId, value: rating }),
    })
    if (!response.ok) throw new Error('Failed to submit rating')
    const data = await response.json()
    setMovie(prev => prev ? { ...prev, averageRating: data.averageRating, ratingCount: data.ratingCount, userRating: rating } : null)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl bg-gray-800" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="h-10 bg-gray-800 rounded w-3/4" />
            <div className="h-6 bg-gray-800 rounded w-1/2" />
            <div className="h-6 bg-gray-800 rounded w-1/3" />
            <div className="col-span-3 h-32 bg-gray-800 rounded" />
            <div className="col-span-3 h-20 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-medium text-white mb-4">Movie not found</h1>
        <p className="text-gray-400 mb-6">{error || 'The movie you\'re looking for doesn\'t exist.'}</p>
        <Button variant="secondary" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : ''
  const runtime = movie.runtime ? `${movie.runtime} min` : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-1 relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800">
          {movie.poster_path ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <h1 className="text-3xl sm:text-4xl font-medium text-white mb-2">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
            {releaseYear && <span>{releaseYear}</span>}
            {releaseYear && runtime && <span>·</span>}
            {runtime && <span>{runtime}</span>}
            {movie.genres.length > 0 && (
              <>
                <span>·</span>
                <span>{movie.genres.slice(0, 3).map(g => g.name).join(', ')}</span>
              </>
            )}
          </div>

          {movie.tagline && <p className="text-gray-300 italic mb-4">"{movie.tagline}"</p>}

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(movie.vote_average / 2)} max={5} size="md" interactive={false} />
              <span className="text-white font-medium">{movie.vote_average.toFixed(1)}</span>
              <span className="text-gray-500">({movie.vote_count.toLocaleString()} votes)</span>
            </div>
          </div>

          {movie.averageRating !== null && movie.ratingCount > 0 && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(movie.averageRating)} max={5} size="md" interactive={false} />
                <span className="text-white font-medium text-xl">{movie.averageRating.toFixed(1)}</span>
                <span className="text-gray-500">({movie.ratingCount} rating{movie.ratingCount !== 1 ? 's' : ''} on debatecultfilm)</span>
              </div>
              {movie.userRating !== null && (
                <span className="text-gray-400 ml-auto">Your rating: <span className="text-white font-medium">{movie.userRating}/5</span></span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={handleRate} className="px-6">
              Rate
            </Button>
            <Button size="lg" variant="outline" onClick={handleDebate} className="px-6">
              Debate ({movie.debateCount})
            </Button>
          </div>
        </div>
      </div>

      {movie.overview && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-medium text-white mb-4">Synopsis</h2>
          <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
        </div>
      )}

      {ratingMovie && (
        <RatingModal
          movie={{
            id: ratingMovie.localId,
            tmdbId: ratingMovie.id,
            title: ratingMovie.title,
            posterPath: ratingMovie.poster_path,
            posterUrl: ratingMovie.posterUrl,
          }}
          userRating={ratingMovie.userRating}
          averageRating={ratingMovie.averageRating}
          ratingCount={ratingMovie.ratingCount}
          onClose={() => setRatingMovie(null)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  )
}