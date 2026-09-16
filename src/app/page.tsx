'use client'

import { useState, useEffect } from 'react'
import { MovieRow } from '@/components/MovieRow'
import { RatingModal } from '@/components/RatingModal'
import { useSession } from 'next-auth/react'
import { getPosterUrl } from '@/lib/tmdb'
import type { MovieData } from '@/lib/types'

export default function HomePage() {
  const { data: session } = useSession()
  const [trendingMovies, setTrendingMovies] = useState<MovieData[]>([])
  const [cultMovies, setCultMovies] = useState<MovieData[]>([])
  const [newMovies, setNewMovies] = useState<MovieData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ratingMovie, setRatingMovie] = useState<MovieData | null>(null)
  const [debateMovie, setDebateMovie] = useState<MovieData | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, cultRes, newRes] = await Promise.all([
          fetch('/api/movies/trending?limit=20'),
          fetch('/api/movies/cult?limit=20'),
          fetch('/api/movies/new?limit=20'),
        ])

        const [trending, cult, newMoviesData] = await Promise.all([
          trendingRes.json(),
          cultRes.json(),
          newRes.json(),
        ])

        setTrendingMovies(trending)
        setCultMovies(cult)
        setNewMovies(newMoviesData)
      } catch (error) {
        console.error('Failed to fetch home page data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRate = (movie: MovieData) => {
    setRatingMovie(movie)
  }

  const handleDebate = (movie: MovieData) => {
    setDebateMovie(movie)
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

  const handleDebateSubmit = async (title: string, content: string) => {
    if (!debateMovie) return
    const response = await fetch('/api/debates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId: debateMovie.id, title, content }),
    })
    if (!response.ok) throw new Error('Failed to create debate')
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {['TRENDING', 'CULT', 'NEW'].map(title => (
            <section key={title} className="mb-12" aria-labelledby={`${title.toLowerCase()}-heading`}>
              <h2 id={`${title.toLowerCase()}-heading`} className="text-lg font-medium text-white mb-4">{title}</h2>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex-shrink-0 w-40 sm:w-44 md:w-48">
                    <div className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse" />
                    <div className="mt-2 h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                    <div className="mt-1 h-3 bg-gray-800 rounded animate-pulse w-1/2" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <MovieRow
        title="TRENDING"
        movies={trendingMovies}
        onRate={handleRate}
        onDebate={handleDebate}
        emptyMessage="No trending movies yet. Start a debate to get things moving."
      />

      <MovieRow
        title="CULT"
        movies={cultMovies}
        onRate={handleRate}
        onDebate={handleDebate}
        emptyMessage="No cult classics with debates yet."
      />

      <MovieRow
        title="NEW"
        movies={newMovies}
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

      {debateMovie && session && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDebateMovie(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-debate-modal-title"
        >
          <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setDebateMovie(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 id="create-debate-modal-title" className="text-lg font-medium text-white mb-2">Create a debate</h2>
            <p className="text-gray-400 mb-6">About: <span className="text-white">{debateMovie.title}</span></p>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const title = formData.get('title') as string
              const content = formData.get('content') as string
              if (title.trim().length >= 5 && content.trim().length >= 10) {
                await handleDebateSubmit(title.trim(), content.trim())
                setDebateMovie(null)
              }
            }}>
              <div className="mb-4">
                <label htmlFor="debate-title" className="block text-sm font-medium text-gray-300 mb-1">Heading</label>
                <input
                  id="debate-title"
                  name="title"
                  type="text"
                  maxLength={200}
                  required
                  minLength={5}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="e.g., Was the ending justified?"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="debate-content" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <textarea
                  id="debate-content"
                  name="content"
                  rows={6}
                  maxLength={5000}
                  required
                  minLength={10}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Share your thoughts..."
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDebateMovie(null)} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors font-medium">Create Debate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {debateMovie && !session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDebateMovie(null)} role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 p-6 text-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDebateMovie(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-medium text-white mb-2">Sign in to create a debate</h2>
            <p className="text-gray-400 mb-6">You need an account to start a debate.</p>
            <div className="flex gap-3 justify-center">
              <a href="/auth/signin"><button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">Sign in</button></a>
              <a href="/auth/signup"><button className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200">Sign up</button></a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}