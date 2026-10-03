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

    let tmdbMovie: any = null
    try {
      tmdbMovie = await getMovieDetails(movieId)
    } catch (tmdbError) {
      console.error('TMDB API error:', tmdbError)
      return NextResponse.json(
        { error: 'Failed to fetch movie details from TMDB' },
        { status: 500 }
      )
    }

    // If TMDB returns null or invalid response
    if (!tmdbMovie || typeof tmdbMovie !== 'object') {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

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
          title: tmdbMovie.title ?? 'Unknown Title',
          overview: tmdbMovie.overview ?? '',
          posterPath: tmdbMovie.poster_path ?? null,
          releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
        },
        include: {
          _count: { select: { debates: true, ratings: true } },
          ratings: session?.user?.id ? { where: { userId: session.user.id }, select: { value: true } } : false,
        },
      })
    }

    const averageRating = localMovie.ratings?.length > 0
      ? localMovie.ratings.reduce((sum: number, r: any) => sum + (r.value ?? 0), 0) / localMovie.ratings.length
      : null

    const userRating = session?.user && localMovie.ratings?.length > 0
      ? localMovie.ratings[0].value
      : null

    // Ensure all TMDB fields have safe defaults - create a completely new object
    const safeResponse = {
      id: tmdbMovie.id ?? movieId,
      title: tmdbMovie.title ?? 'Unknown Title',
      overview: tmdbMovie.overview ?? '',
      poster_path: tmdbMovie.poster_path ?? null,
      backdrop_path: tmdbMovie.backdrop_path ?? null,
      release_date: tmdbMovie.release_date ?? '',
      vote_average: tmdbMovie.vote_average ?? 0,
      vote_count: tmdbMovie.vote_count ?? 0,
      genre_ids: Array.isArray(tmdbMovie.genre_ids) ? tmdbMovie.genre_ids : [],
      adult: tmdbMovie.adult ?? false,
      original_language: tmdbMovie.original_language ?? '',
      original_title: tmdbMovie.original_title ?? '',
      popularity: tmdbMovie.popularity ?? 0,
      video: tmdbMovie.video ?? false,
      genres: Array.isArray(tmdbMovie.genres) ? tmdbMovie.genres : [],
      runtime: tmdbMovie.runtime ?? null,
      status: tmdbMovie.status ?? '',
      tagline: tmdbMovie.tagline ?? '',
      posterUrl: getPosterUrl(tmdbMovie.poster_path ?? null),
      backdropUrl: getPosterUrl(tmdbMovie.backdrop_path ?? null, 'w780'),
      localId: localMovie.id,
      debateCount: localMovie._count?.debates ?? 0,
      ratingCount: localMovie._count?.ratings ?? 0,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      userRating,
    }

    return NextResponse.json(safeResponse)
  } catch (error) {
    console.error('Movie details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    )
  }
}