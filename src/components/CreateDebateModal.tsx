'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'

interface CreateDebateModalProps {
  movie: {
    id: string
    title: string
  }
  onClose: () => void
  onSubmit: (title: string, content: string) => Promise<void>
}

export function CreateDebateModal({ movie, onClose, onSubmit }: CreateDebateModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleError, setTitleError] = useState('')
  const [contentError, setContentError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const validate = () => {
    let valid = true
    if (title.trim().length < 5) {
      setTitleError('Title must be at least 5 characters')
      valid = false
    } else {
      setTitleError('')
    }
    if (content.trim().length < 10) {
      setContentError('Content must be at least 10 characters')
      valid = false
    } else {
      setContentError('')
    }
    return valid
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setGeneralError('')
    setIsSubmitting(true)
    try {
      await onSubmit(title.trim(), content.trim())
      onClose()
    } catch {
      setGeneralError('Failed to create debate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-debate-modal-title">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close create debate modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="create-debate-modal-title" className="text-lg font-medium text-white mb-2">Create a debate</h2>
        <p className="text-gray-400 mb-6">About: <span className="text-white">{movie.title}</span></p>

        <Input
          label="Heading"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={titleError}
          placeholder="e.g., Was the ending justified?"
          maxLength={200}
        />

        <Textarea
          label="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
          error={contentError}
          placeholder="Share your thoughts..."
          rows={6}
          maxLength={5000}
          className="mt-4"
        />

        {generalError && (
          <p className="mt-4 text-center text-red-400 text-sm" role="alert">{generalError}</p>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={isSubmitting} disabled={title.trim().length < 5 || content.trim().length < 10}>
            Create Debate
          </Button>
        </div>
      </div>
    </div>
  )
}