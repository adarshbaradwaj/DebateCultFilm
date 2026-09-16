'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/tmdb'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { Comment } from '@/components/Comment'
import { CommentForm } from '@/components/CommentForm'
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
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: { id: string; name: string | null; image: string | null }
  }>
  movie: MovieData
}

export default function DebateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const debateId = params.id as string

  const [debate, setDebate] = useState<DebateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [debateLoading, setDebateLoading] = useState(false)

  const fetchDebate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debates/${debateId}`)
      if (response.ok) {
        const data = await response.json()
        setDebate(data)
      } else if (response.status === 404) {
        router.push('/404')
      }
    } catch (error) {
      console.error('Failed to fetch debate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDebate()
  }, [debateId])

  const handleVote = async (type: 'AGREE' | 'DISAGREE') => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href))
      return
    }
    if (!debate) return

    setDebateLoading(true)
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debateId: debate.id, type }),
      })
      if (response.ok) {
        const data = await response.json()
        setDebate(prev => prev ? { ...prev, ...data } : null)
      }
    } catch (error) {
      console.error('Vote error:', error)
    } finally {
      setDebateLoading(false)
    }
  }

  const handleCommentSubmit = async (content: string) => {
    if (!debate) return
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debateId: debate.id, content }),
    })
    if (!response.ok) throw new Error('Failed to post comment')
    const newComment = await response.json()
    setDebate(prev => prev ? { ...prev, comments: [...prev.comments, newComment], _count: { comments: prev._count.comments + 1 } } : null)
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="flex gap-4">
            <div className="aspect-[2/3] w-48 rounded-lg bg-gray-800" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-gray-800 rounded w-1/2" />
              <div className="h-6 bg-gray-800 rounded w-1/3" />
              <div className="h-4 bg-gray-800 rounded w-1/4" />
              <div className="h-10 bg-gray-800 rounded w-3/4" />
            </div>
          </div>
          <div className="h-32 bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  if (!debate) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-medium text-white mb-4">Debate not found</h1>
        <Button variant="secondary" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-48 flex-shrink-0 relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
          {debate.movie.poster_path ? (
            <Image src={debate.movie.posterUrl} alt={debate.movie.title} fill className="object-cover" sizes="192px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <Link href={`/movie/${debate.movie.tmdbId}`} className="text-gray-400 hover:text-white text-sm mb-2 inline-block">
            ← Back to movie
          </Link>
          <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2">{debate.movie.title}</h1>
        </div>
      </div>

      <article className="border-b border-gray-800 pb-8 mb-8">
        <div className="flex items-start gap-3 mb-4">
          {debate.user.image ? (
            <img src={debate.user.image} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
              {debate.user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-medium text-white">{debate.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
              <span>{debate.user.name || 'Anonymous'}</span>
              <span>·</span>
              <time dateTime={debate.createdAt}>{new Date(debate.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            </div>
          </div>
        </div>

        <div className="ml-13 text-gray-300 whitespace-pre-wrap mb-6">
          {debate.content}
        </div>

        <div className="ml-13 flex items-center gap-4">
          <Button
            variant={debate.userVote === 'AGREE' ? 'primary' : 'outline'}
            onClick={() => handleVote('AGREE')}
            disabled={debateLoading}
            className="gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span>Agree</span>
            <span className="bg-white/10 px-2 py-0.5 rounded text-sm">{debate.agreePercent}%</span>
          </Button>
          <Button
            variant={debate.userVote === 'DISAGREE' ? 'primary' : 'outline'}
            onClick={() => handleVote('DISAGREE')}
            disabled={debateLoading}
            className="gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11l-4-4L5 17" /></svg>
            <span>Disagree</span>
            <span className="bg-white/10 px-2 py-0.5 rounded text-sm">{debate.disagreePercent}%</span>
          </Button>
        </div>
      </article>

      <div className="border-t border-gray-800 pt-8">
        <h3 className="text-lg font-medium text-white mb-6">Comments ({debate._count.comments})</h3>
        <div className="space-y-0 mb-8">
          {debate.comments.map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>

        {session ? (
          <CommentForm debateId={debate.id} onSubmit={handleCommentSubmit} />
        ) : (
          <div className="text-center py-8 border-t border-gray-800">
            <p className="text-gray-500 mb-4">Sign in to comment.</p>
            <div className="flex gap-3 justify-center">
              <a href="/auth/signin"><Button variant="outline" size="sm">Sign in</Button></a>
              <a href="/auth/signup"><Button size="sm">Sign up</Button></a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}