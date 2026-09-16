import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const debate = await prisma.debate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        movie: { select: { id: true, tmdbId: true, title: true, posterPath: true } },
        _count: { select: { votes: true, comments: true } },
        votes: { select: { userId: true, type: true } },
      },
    })

    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 })
    }

    const agreeVotes = debate.votes.filter(v => v.type === 'AGREE').length
    const disagreeVotes = debate.votes.filter(v => v.type === 'DISAGREE').length
    const totalVotes = agreeVotes + disagreeVotes

    let userVote = null
    if (session?.user?.id) {
      const vote = debate.votes.find(v => v.userId === session.user.id)
      userVote = vote?.type || null
    }

    return NextResponse.json({
      ...debate,
      agreeCount: agreeVotes,
      disagreeCount: disagreeVotes,
      agreePercent: totalVotes > 0 ? Math.round((agreeVotes / totalVotes) * 100) : 0,
      disagreePercent: totalVotes > 0 ? Math.round((disagreeVotes / totalVotes) * 100) : 0,
      userVote,
    })
  } catch (error) {
    console.error('Get debate error:', error)
    return NextResponse.json({ error: 'Failed to fetch debate' }, { status: 500 })
  }
}