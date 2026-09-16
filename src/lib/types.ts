export interface MovieData {
  id: string
  tmdbId: number
  title: string
  overview: string | null
  posterPath: string | null
  releaseDate: string | null
  posterUrl: string
  debateCount?: number
  ratingCount?: number
  recentDebateCount?: number
  commentCount?: number
}