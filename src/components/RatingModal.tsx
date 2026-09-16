'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { StarRating } from './ui/StarRating'
import { Button } from './ui/Button'

interface RatingModalProps {
  movie: {
    id: string
    tmdbId: number
    title: string
    posterPath: string | null
    posterUrl: string
  }
  userRating: number | null
  averageRating: number | null
  ratingCount: number
  onClose: () => void
  onSubmit: (rating: number) => Promise<void>
}

export function RatingModal({ movie, userRating, averageRating, ratingCount, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(userRating || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit(rating)
      onClose()
    } catch {
      setError('Failed to submit rating. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="rating-modal-title">
      <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 p-6" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close rating modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="rating-modal-title" className="text-lg font-medium text-white mb-2">Rate this movie</h2>
        <p className="text-gray-400 mb-6">{movie.title}</p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <StarRating value={rating} onChange={setRating} size="lg" interactive />
        </div>

        {rating > 0 && (
          <p className="text-center text-gray-400 mb-4">Your rating: <span className="text-white font-medium">{rating}/5</span></p>
        )}

        {averageRating !== null && ratingCount > 0 && (
          <div className="text-center text-sm text-gray-500 mb-6">
            <p>Community average: <span className="text-white font-medium">{averageRating}/5</span> ({ratingCount} rating{ratingCount !== 1 ? 's' : ''})</p>
          </div>
        )}

        {error && (
          <p className="text-center text-red-400 text-sm mb-4" role="alert">{error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={isSubmitting} disabled={rating === 0}>
            Submit Rating
          </Button>
        </div>
      </div>
    </div>
  )
}