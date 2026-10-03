'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DebateCard } from '@/components/DebateCard'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow } from 'date-fns'

interface DebateData {
  id: string
  title: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
    role?: string
  }
  movie: {
    id: string
    tmdbId: number
    title: string
    posterPath: string | null
    posterUrl: string
  }
  agreeCount: number
  disagreeCount: number
  agreePercent: number
  disagreePercent: number
  userVote: 'AGREE' | 'DISAGREE' | null
  _count: { comments: number }
}

export default function DebatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [debates, setDebates] = useState<DebateData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchDebates = async (pageNum = 1, query = '') => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: pageNum.toString(), limit: '20' })
      if (query) params.set('q', query)
      const response = await fetch(`/api/debates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDebates(data.debates)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch debates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const query = searchParams.get('q') || ''
    setSearchQuery(query)
    fetchDebates(1, query)
  }, [searchParams.get('q')])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/debates?q=${encodeURIComponent(searchQuery)}`)
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-medium text-white mb-8">DEBATES</h1>
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-gray-800 py-6">
              <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
              <div className="flex items-center gap-4">
                <div className="h-8 bg-gray-800 rounded w-20" />
                <div className="h-8 bg-gray-800 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium text-white">DEBATES</h1>
      </div>

      <form onSubmit={handleSearch} className="mb-8 max-w-md">
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

      {debates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No debates yet.</p>
          <p className="text-gray-500 mb-6">Be the first person to start one.</p>
          {session ? (
            <p className="text-gray-500">Go to a movie page and click "Debate" to create one.</p>
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
              onClick={() => router.push(`/debate/${debate.id}`)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => fetchDebates(page - 1, searchQuery)} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-gray-400">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => fetchDebates(page + 1, searchQuery)} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}