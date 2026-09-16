'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Button } from './ui/Button'

interface DebateCardProps {
  debate: {
    id: string
    title: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string | null
      image: string | null
    }
    agreeCount: number
    disagreeCount: number
    agreePercent: number
    disagreePercent: number
    userVote: 'AGREE' | 'DISAGREE' | null
    _count: {
      comments: number
    }
  }
  onVote: (debateId: string, type: 'AGREE' | 'DISAGREE') => void
  onClick?: () => void
}

export function DebateCard({ debate, onVote }: DebateCardProps) {
  const totalVotes = debate.agreeCount + debate.disagreeCount

  return (
    <article className="border-b border-gray-800 py-6 last:border-0">
      <Link href={`/movie/debate/${debate.id}`} className="block">
        <h3 className="text-lg font-medium text-white mb-2 hover:underline">{debate.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{debate.content}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-400">
            {debate.user.image ? (
              <img src={debate.user.image} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
                {debate.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span>{debate.user.name || 'Anonymous'}</span>
            <span>·</span>
            <time dateTime={debate.createdAt}>{formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}</time>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={debate.userVote === 'AGREE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onVote(debate.id, 'AGREE')}
            className="gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Agree</span>
            {totalVotes > 0 && <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{debate.agreePercent}%</span>}
          </Button>

          <Button
            variant={debate.userVote === 'DISAGREE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onVote(debate.id, 'DISAGREE')}
            className="gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11l-4-4L5 17" />
            </svg>
            <span>Disagree</span>
            {totalVotes > 0 && <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{debate.disagreePercent}%</span>}
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{debate._count.comments}</span>
        </div>
      </div>
    </article>
  )
}