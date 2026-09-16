import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const voteSchema = z.object({
  debateId: z.string().cuid(),
  type: z.enum(['AGREE', 'DISAGREE']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { debateId, type } = voteSchema.parse(body)

    const debate = await prisma.debate.findUnique({ where: { id: debateId } })
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    const existingVote = await prisma.vote.findUnique({
      where: { userId_debateId: { userId: session.user.id, debateId } },
    })

    let vote
    if (existingVote) {
      if (existingVote.type === type) {
        await prisma.vote.delete({ where: { id: existingVote.id } })
        vote = null
      } else {
        vote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        })
      }
    } else {
      vote = await prisma.vote.create({
        data: {
          userId: session.user.id,
          debateId,
          type,
        },
      })
    }

    const votes = await prisma.vote.findMany({
      where: { debateId },
      select: { type: true },
    })

    const agreeCount = votes.filter(v => v.type === 'AGREE').length
    const disagreeCount = votes.filter(v => v.type === 'DISAGREE').length
    const totalVotes = agreeCount + disagreeCount

    return NextResponse.json({
      vote,
      agreeCount,
      disagreeCount,
      agreePercent: totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 0,
      disagreePercent: totalVotes > 0 ? Math.round((disagreeCount / totalVotes) * 100) : 0,
      userVote: vote?.type || null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}