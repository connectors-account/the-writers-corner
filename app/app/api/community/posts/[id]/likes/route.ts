import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Get likes for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submissionId = params.id

    // Get all likes with user info
    const likes = await prisma.like.findMany({
      where: { submissionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Check if current user has liked
    const userLiked = likes.some(like => like.userId === session.user.id)

    return NextResponse.json({
      likes: likes.map(like => ({
        id: like.id,
        user: like.user,
        createdAt: like.createdAt.toISOString()
      })),
      likeCount: likes.length,
      userLiked
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
