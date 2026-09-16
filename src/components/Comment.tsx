'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from './ui/Button'
import { useSession } from 'next-auth/react'

interface CommentProps {
  comment: {
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string | null
      image: string | null
      role?: string
    }
  }
  debateId: string
}

export function Comment({ comment, debateId }: CommentProps) {
  const { data: session } = useSession()
  const [deleting, setDeleting] = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN'
  const isAuthor = session?.user?.id === comment.user.id

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/comments/${comment.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) alert('Failed to delete comment')
    } catch {
      alert('Failed to delete comment')
    } finally {
      setDeleting(false)
    }
  }

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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-white">{comment.user.name || 'Anonymous'}</span>
            {comment.user.role === 'ADMIN' && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded uppercase">
                MOD
              </span>
            )}
            <time className="text-xs text-gray-500" dateTime={comment.createdAt}>
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
          {(isAdmin || isAuthor) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="mt-2 text-red-400 hover:text-red-300 h-auto px-2"
            >
              {deleting ? '...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}