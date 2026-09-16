'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/tmdb'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { DebateCard } from '@/components/DebateCard'
import { useSession } from 'next-auth/react'

interface MovieData {
  id: string
  tmdbId: number
  title: string
  overview: string
  poster_path: string | null
  posterUrl: string
  debateCount: number
  ratingCount: number
  averageRating: number | null
}

interface DebateData {
  id: string
  title: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
  agreeCount: number
  disagreeCount: number
  agreePercent: number
  disagreePercent: number
  userVote: 'AGREE' | 'DISAGREE' | null
  _count: { comments: number }
}

export default function MovieDebatesPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const tmdbId = params.tmdbId as string

  const [movie, setMovie] = useState<MovieData | null>(null)
  const [debates, setDebates] = useState<DebateData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  const fetchMovie = async () => {
    try {
      const response = await fetch(`/api/movies/${tmdbId}`)
      if (response.ok) {
        const data = await response.json()
        setMovie(data)
      }
    } catch (error) {
      console.error('Failed to fetch movie:', error)
    }
  }

  const fetchDebates = async (page = 1, query = '') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debates?movieId=${movie?.localId}&page=${page}&limit=20${query ? `&q=${encodeURIComponent(query)}` : ''}`)
      if (response.ok) {
        const data = await response.json()
        setDebates(data.debates)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch debates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMovie()
  }, [tmdbId])

  useEffect(() => {
    if (movie) {
      const query = searchParams.get('q') || ''
      setSearchQuery(query)
      fetchDebates(1, query)
    }
  }, [movie, searchParams.get('q')])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/movie/${tmdbId}/debates?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleVote = async (debateId: string, type: 'AGREE' | 'DISAGREE') => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href))
      return
    }

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debateId, type }),
      })
      if (response.ok) {
        const data = await response.json()
        setDebates(prev => prev.map(d => {
          if (d.id === debateId) {
            return { ...d, ...data }
          }
          return d
        }))
      }
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const handleCreateDebate = async (title: string, content: string) => {
    if (!movie) return
    setCreateError('')
    try {
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.localId, title, content }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create debate')
      }
      const newDebate = await response.json()
      setDebates(prev => [newDebate, ...prev])
      setShowCreateModal(false)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create debate')
    }
  }

  const handleOpenDebate = (debateId: string) => {
    router.push(`/debate/${debateId}`)
  }

  if (isLoading && !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
          <div className="flex gap-6">
            <div className="aspect-[2/3] w-64 rounded-lg bg-gray-800" />
            <div className="flex-1 space-y-4">
              <div className="h-10 bg-gray-800 rounded w-1/2" />
              <div className="h-6 bg-gray-800 rounded w-1/3" />
              <div className="h-32 bg-gray-800 rounded" />
            </div>
          </div>
          <div className="h-20 bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-medium text-white mb-4">Movie not found</h1>
        <Button variant="secondary" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-48 flex-shrink-0 relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
          {movie.poster_path ? (
            <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" sizes="192px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2">{movie.title}</h1>
          <p className="text-gray-400 mb-4 line-clamp-3">{movie.overview}</p>
          <div className="flex items-center gap-4 text-gray-400">
            {movie.averageRating !== null && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(movie.averageRating)} max={5} size="sm" interactive={false} />
                <span className="font-medium">{movie.averageRating.toFixed(1)}</span>
                <span>({movie.ratingCount} ratings)</span>
              </div>
            )}
            <span>·</span>
            <span>{movie.debateCount} debate{movie.debateCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <label htmlFor="debate-search" className="sr-only">Search debates</label>
          <input
            id="debate-search"
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search debates..."
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          />
        </form>
        {session && (
          <Button onClick={() => setShowCreateModal(true)} className="ml-4 gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Debate
          </Button>
        )}
      </div>

      {debates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No debates yet.</p>
          <p className="text-gray-500 mb-6">Be the first person to start one.</p>
          {session ? (
            <Button onClick={() => setShowCreateModal(true)}>Create Debate</Button>
          ) : (
            <div className="flex gap-3 justify-center">
              <a href="/auth/signin"><Button variant="outline">Sign in to debate</Button></a>
              <a href="/auth/signup"><Button>Sign up to debate</Button></a>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-0" role="list">
          {debates.map(debate => (
            <DebateCard
              key={debate.id}
              debate={debate}
              onVote={handleVote}
              onClick={() => handleOpenDebate(debate.id)}
            />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => fetchDebates(pagination.page - 1, searchQuery)} disabled={pagination.page === 1}>
            Previous
          </Button>
          <span className="text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => fetchDebates(pagination.page + 1, searchQuery)} disabled={pagination.page === pagination.totalPages}>
            Next
          </Button>
        </div>
      )}

      {showCreateModal && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} role="dialog" aria-modal="true" aria-labelledby="create-debate-modal-title">
          <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 id="create-debate-modal-title" className="text-lg font-medium text-white mb-2">Create a debate</h2>
            <p className="text-gray-400 mb-6">About: <span className="text-white">{movie.title}</span></p>
            {createError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm" role="alert">
                {createError}
              </div>
            )}
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const title = formData.get('title') as string
              const content = formData.get('content') as string
              if (title.trim().length >= 5 && content.trim().length >= 10) {
                await handleCreateDebate(title.trim(), content.trim())
              }
            }}>
              <div className="mb-4">
                <label htmlFor="debate-title" className="block text-sm font-medium text-gray-300 mb-1">Heading</label>
                <input id="debate-title" name="title" type="text" maxLength={200} required minLength={5} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" placeholder="e.g., Was the ending justified?" />
              </div>
              <div className="mb-4">
                <label htmlFor="debate-content" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <textarea id="debate-content" name="content" rows={6} maxLength={5000} required minLength={10} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" placeholder="Share your thoughts..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-white text-black rounded hover:bg-gray-200 font-medium">Create Debate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && !session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 p-6 text-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-medium text-white mb-2">Sign in to create a debate</h2>
            <p className="text-gray-400 mb-6">You need an account to start a debate.</p>
            <div className="flex gap-3 justify-center">
              <a href="/auth/signin"><Button variant="outline">Sign in</Button></a>
              <a href="/auth/signup"><Button>Sign up</Button></a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}