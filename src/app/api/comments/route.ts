import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCommentSchema = z.object({
  debateId: z.string().cuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { debateId, content } = createCommentSchema.parse(body)

    const debate = await prisma.debate.findUnique({ where: { id: debateId } })
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        debateId,
        content,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
} catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
      }
      console.error('Create comment error:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const debateId = searchParams.get('debateId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!debateId) {
      return NextResponse.json({ error: 'Debate ID required' }, { status: 400 })
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { debateId },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where: { debateId } }),
    ])

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}