const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  backdrop_path: string | null
  original_language: string
  original_title: string
  popularity: number
  video: boolean
}

export interface TMDBSearchResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: Array<{ id: number; name: string }>
  runtime: number | null
  status: string
  tagline: string
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured')
  }

  const searchParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params,
  })

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${searchParams}`, {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function searchMovies(query: string, page = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
  })
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${movieId}`, {
    append_to_response: 'credits,keywords',
  })
}

export async function getTrendingMovies(page = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/trending/movie/week', {
    page: page.toString(),
  })
}

export async function getNowPlayingMovies(page = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/movie/now_playing', {
    page: page.toString(),
  })
}

export async function getUpcomingMovies(page = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/movie/upcoming', {
    page: page.toString(),
  })
}

export function getImageUrl(path: string | null, size: 'w200' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string {
  if (!path) return '/placeholder-movie.svg'
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}

export function getPosterUrl(path: string | null, size: 'w200' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string {
  return getImageUrl(path, size)
}

export function getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w780'): string {
  if (!path) return '/placeholder-movie.svg'
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}