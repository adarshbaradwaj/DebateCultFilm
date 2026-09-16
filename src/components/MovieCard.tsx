'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/tmdb'
import { Button } from './ui/Button'
import type { MovieData } from '@/lib/types'

interface MovieCardProps {
  movie: MovieData
  onRate: (movie: MovieData) => void
  onDebate: (movie: MovieData) => void
}

export function MovieCard({ movie, onRate, onDebate }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ''

  return (
    <div
      className="relative group flex-shrink-0 w-40 sm:w-44 md:w-48 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
        {movie.posterPath ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className={`object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`}
            sizes="(max-width: 640px) 100px, (max-width: 1024px) 120px, 140px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 002-2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {isHovered && (
          <div className="absolute inset-0 bg-black/70 flex flex-col justify-end p-3">
            <h3 className="text-sm sm:text-base font-medium text-white truncate">{movie.title}</h3>
            {releaseYear && <span className="text-xs text-gray-400">{releaseYear}</span>}
            {movie.overview && (
              <p className="text-xs text-gray-300 mt-1 line-clamp-3">{movie.overview}</p>
            )}
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="primary" onClick={e => { e.stopPropagation(); onRate(movie) }}>
                Rate
              </Button>
              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onDebate(movie) }}>
                Debate
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isHovered && (
        <div className="mt-2 text-center">
          <h3 className="text-xs font-medium text-white truncate">{movie.title}</h3>
          {releaseYear && <span className="text-xs text-gray-500">{releaseYear}</span>}
        </div>
      )}
    </div>
  )
}