import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createDebateSchema = z.object({
  movieId: z.string().cuid(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { movieId, title, content } = createDebateSchema.parse(body)

    const movie = await prisma.movie.findUnique({ where: { id: movieId } })
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    const debate = await prisma.debate.create({
      data: {
        movieId,
        userId: session.user.id,
        title,
        content,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    return NextResponse.json(debate, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Create debate error:', error)
    return NextResponse.json({ error: 'Failed to create debate' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID required' }, { status: 400 })
    }

    const movie = await prisma.movie.findUnique({ where: { id: movieId } })
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    const where: any = { movieId }
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ]
    }

    const [debates, total] = await Promise.all([
      prisma.debate.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { votes: true, comments: true } },
          votes: { select: { type: true, userId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.debate.count({ where }),
    ])

    const session = await getServerSession(authOptions)

    const enrichedDebates = debates.map(debate => {
      const agreeVotes = debate.votes.filter(v => v.type === 'AGREE').length
      const disagreeVotes = debate.votes.filter(v => v.type === 'DISAGREE').length
      const totalVotes = agreeVotes + disagreeVotes

      let userVote = null
      if (session?.user) {
        const vote = debate.votes.find(v => v.userId === session.user.id)
        userVote = vote?.type || null
      }

      return {
        ...debate,
        agreeCount: agreeVotes,
        disagreeCount: disagreeVotes,
        agreePercent: totalVotes > 0 ? Math.round((agreeVotes / totalVotes) * 100) : 0,
        disagreePercent: totalVotes > 0 ? Math.round((disagreeVotes / totalVotes) * 100) : 0,
        userVote,
      }
    })

    return NextResponse.json({
      debates: enrichedDebates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get debates error:', error)
    return NextResponse.json({ error: 'Failed to fetch debates' }, { status: 500 })
  }
}