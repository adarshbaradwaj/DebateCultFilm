'use client'

import { MovieCard } from './MovieCard'
import type { MovieData } from '@/lib/types'

interface MovieRowProps {
  title: string
  movies: MovieData[]
  onRate: (movie: MovieData) => void
  onDebate: (movie: MovieData) => void
  emptyMessage?: string
}

export function MovieRow({ title, movies, onRate, onDebate, emptyMessage }: MovieRowProps) {
  if (movies.length === 0) {
    return (
      <section className="mb-12" aria-labelledby={`${title.toLowerCase()}-heading`}>
        <h2 id={`${title.toLowerCase()}-heading`} className="text-lg font-medium text-white mb-4">{title}</h2>
        <div className="text-center py-12 text-gray-500">
          <p>{emptyMessage || `No ${title.toLowerCase()} movies yet.`}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-12" aria-labelledby={`${title.toLowerCase()}-heading`}>
      <h2 id={`${title.toLowerCase()}-heading`} className="text-lg font-medium text-white mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" role="list">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} onRate={onRate} onDebate={onDebate} />
        ))}
      </div>
    </section>
  )
}