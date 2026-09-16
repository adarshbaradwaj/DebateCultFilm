'use client'

import { formatDistanceToNow } from 'date-fns'

interface CommentProps {
  comment: {
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string | null
      image: string | null
    }
  }
}

export function Comment({ comment }: CommentProps) {
  return (
    <article className="border-b border-gray-800 py-4 last:border-0">
      <div className="flex items-start gap-3">
        {comment.user.image ? (
          <img src={comment.user.image} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {comment.user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{comment.user.name || 'Anonymous'}</span>
            <time className="text-xs text-gray-500" dateTime={comment.createdAt}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </article>
  )
}