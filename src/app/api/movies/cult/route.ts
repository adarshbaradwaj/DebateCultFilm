import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPosterUrl } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

    const movies = await prisma.movie.findMany({
      where: {
        releaseDate: { lt: fiveYearsAgo },
        debates: { some: {} },
      },
      include: {
        _count: { select: { debates: true } },
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
    }))

    return NextResponse.json(enrichedMovies)
  } catch (error) {
    console.error('Cult movies error:', error)
    return NextResponse.json({ error: 'Failed to fetch cult movies' }, { status: 500 })
  }
}