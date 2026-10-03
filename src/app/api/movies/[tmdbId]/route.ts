import { NextRequest, NextResponse } from 'next/server'
import { getMovieDetails, getPosterUrl } from '@/lib/tmdb'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  try {
    const { tmdbId } = await params
    const movieId = parseInt(tmdbId)

    if (isNaN(movieId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    const tmdbMovie = await getMovieDetails(movieId)

    let localMovie = await prisma.movie.findUnique({
      where: { tmdbId: movieId },
      include: {
        _count: { select: { debates: true, ratings: true } },
        ratings: session?.user?.id ? { where: { userId: session.user.id }, select: { value: true } } : false,
      },
    })

    if (!localMovie) {
      localMovie = await prisma.movie.create({
        data: {
          tmdbId: movieId,
          title: tmdbMovie.title,
          overview: tmdbMovie.overview,
          posterPath: tmdbMovie.poster_path,
          releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
        },
        include: {
          _count: { select: { debates: true, ratings: true } },
          ratings: session?.user?.id ? { where: { userId: session.user.id }, select: { value: true } } : false,
        },
      })
    }

    const averageRating = localMovie.ratings.length > 0
      ? localMovie.ratings.reduce((sum, r) => sum + r.value, 0) / localMovie.ratings.length
      : null

    const userRating = session?.user && localMovie.ratings.length > 0
      ? localMovie.ratings[0].value
      : null

    // Ensure all TMDB fields have safe defaults
    const safeGenres = Array.isArray(tmdbMovie.genres) ? tmdbMovie.genres : []
    const safeBackdropPath = tmdbMovie.backdrop_path ?? null
    const safePosterPath = tmdbMovie.poster_path ?? null

    return NextResponse.json({
      ...tmdbMovie,
      genres: safeGenres,
      posterUrl: getPosterUrl(safePosterPath),
      backdropUrl: getPosterUrl(safeBackdropPath, 'w780'),
      localId: localMovie.id,
      debateCount: localMovie._count.debates,
      ratingCount: localMovie._count.ratings,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      userRating,
    })
  } catch (error) {
    console.error('Movie details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    )
  }
}