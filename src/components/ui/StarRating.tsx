'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export function StarRating({ value, onChange, max = 5, size = 'md', interactive = true }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const displayValue = interactive && hoverValue > 0 ? hoverValue : value

  const stars = Array.from({ length: max }, (_, i) => i + 1)

  if (!interactive) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${value} out of ${max}`}>
        {stars.map(star => (
          <svg
            key={star}
            className={`${sizes[size]} ${star <= displayValue ? 'text-yellow-400' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rate this movie">
      {stars.map(star => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className={`p-0.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded ${star <= displayValue ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'}`}
        >
          <svg className={sizes[size]} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  )
}