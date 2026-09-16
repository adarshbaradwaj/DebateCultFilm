import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPosterUrl } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const movies = await prisma.movie.findMany({
      include: {
        _count: { select: { debates: true } },
        debates: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          select: { id: true },
        },
      },
      orderBy: [
        { debates: { _count: 'desc' } },
        { updatedAt: 'desc' },
      ],
      take: limit,
    })

    const enrichedMovies = movies.map(movie => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.posterPath,
      releaseDate: movie.releaseDate,
      posterUrl: getPosterUrl(movie.posterPath),
      debateCount: movie._count.debates,
      recentDebateCount: movie.debates.length,
    }))

    return NextResponse.json(enrichedMovies)
  } catch (error) {
    console.error('Trending movies error:', error)
    return NextResponse.json({ error: 'Failed to fetch trending movies' }, { status: 500 })
  }
}