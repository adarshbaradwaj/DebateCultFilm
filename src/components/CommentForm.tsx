'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'

interface CommentFormProps {
  debateId: string
  onSubmit: (content: string) => Promise<void>
}

export function CommentForm({ debateId, onSubmit }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch {
      setError('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-800 pt-6">
      <h3 className="text-base font-medium text-white mb-4">Add a comment</h3>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write your comment..."
        rows={3}
        maxLength={2000}
        className="mb-3"
      />
      {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}
      <Button type="submit" loading={isSubmitting} disabled={!content.trim() || isSubmitting}>
        Post Comment
      </Button>
    </form>
  )
}