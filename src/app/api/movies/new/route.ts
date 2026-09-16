import { NextRequest, NextResponse } from 'next/server'
import { getNowPlayingMovies, getPosterUrl } from '@/lib/tmdb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const results = await getNowPlayingMovies(1)

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const filteredMovies = results.results.filter(movie => {
      if (!movie.release_date) return false
      const releaseDate = new Date(movie.release_date)
      return releaseDate >= currentMonthStart && releaseDate <= currentMonthEnd
    })

    const limitedMovies = filteredMovies.slice(0, limit)

    const enrichedMovies = limitedMovies.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      releaseDate: movie.release_date,
      posterUrl: getPosterUrl(movie.poster_path),
    }))

    return NextResponse.json(enrichedMovies)
  } catch (error) {
    console.error('New movies error:', error)
    return NextResponse.json({ error: 'Failed to fetch new movies' }, { status: 500 })
  }
}