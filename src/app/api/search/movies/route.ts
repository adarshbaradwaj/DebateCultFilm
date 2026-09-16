import { NextRequest, NextResponse } from 'next/server'
import { searchMovies } from '@/lib/tmdb'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    const results = await searchMovies(query.trim(), page)

    const tmdbIds = results.results.map(m => m.id)
    const localMovies = await prisma.movie.findMany({
      where: { tmdbId: { in: tmdbIds } },
      select: { tmdbId: true, _count: { select: { debates: true, ratings: true } } },
    })

    const localMovieMap = new Map(localMovies.map(m => [m.tmdbId, m]))

    const enrichedResults = results.results.map(movie => {
      const local = localMovieMap.get(movie.id)
      return {
        ...movie,
        localDebateCount: local?._count.debates || 0,
        localRatingCount: local?._count.ratings || 0,
      }
    })

    return NextResponse.json({
      ...results,
      results: enrichedResults,
    })
  } catch (error) {
    console.error('Movie search error:', error)
    return NextResponse.json(
      { error: 'Failed to search movies' },
      { status: 500 }
    )
  }
}