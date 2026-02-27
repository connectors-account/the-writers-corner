import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/posts/:id/likes - Get like count and list of users who liked
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = params.id
    const userId = session.user.id

    // Get all likes for the post
    const likes = await prisma.postLike.findMany({
      where: { postId },
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Check if current user liked the post
    const userLiked = likes.some(like => like.userId === userId)

    return NextResponse.json({
      likeCount: likes.length,
      userLiked,
      users: likes.map(like => ({
        id: like.user.id,
        name: like.user.firstName && like.user.lastName
          ? `${like.user.firstName} ${like.user.lastName}`
          : like.user.name || 'Anonymous'
      }))
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
