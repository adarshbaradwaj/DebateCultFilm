import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ratingSchema = z.object({
  movieId: z.string().cuid(),
  value: z.number().int().min(1).max(5),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { movieId, value } = ratingSchema.parse(body)

    const movie = await prisma.movie.findUnique({ where: { id: movieId } })
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    const existingRating = await prisma.rating.findUnique({
      where: { userId_movieId: { userId: session.user.id, movieId } },
    })

    let rating
    if (existingRating) {
      rating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: { value },
      })
    } else {
      rating = await prisma.rating.create({
        data: {
          userId: session.user.id,
          movieId,
          value,
        },
      })
    }

    const avgResult = await prisma.rating.aggregate({
      where: { movieId },
      _avg: { value: true },
      _count: { value: true },
    })

    return NextResponse.json({
      rating,
      averageRating: avgResult._avg.value ? Math.round(avgResult._avg.value * 10) / 10 : null,
      ratingCount: avgResult._count.value,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Rating error:', error)
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    const movie = await prisma.movie.findUnique({ where: { id: movieId } })
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    const ratings = await prisma.rating.aggregate({
      where: { movieId },
      _avg: { value: true },
      _count: { value: true },
    })

    let userRating = null
    if (session?.user?.id) {
      const rating = await prisma.rating.findUnique({
        where: { userId_movieId: { userId: session.user.id, movieId } },
      })
      userRating = rating?.value || null
    }

    return NextResponse.json({
      averageRating: ratings._avg.value ? Math.round(ratings._avg.value * 10) / 10 : null,
      ratingCount: ratings._count.value,
      userRating,
    })
  } catch (error) {
    console.error('Get rating error:', error)
    return NextResponse.json({ error: 'Failed to fetch rating' }, { status: 500 })
  }
}