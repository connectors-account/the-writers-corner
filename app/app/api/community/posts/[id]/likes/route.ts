
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/community/posts/[id]/likes - Get likes for a post
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

    const submissionId = params.id

    const likes = await prisma.submissionLike.findMany({
      where: {
        submissionId
      },
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

    const userLiked = likes.some(like => like.userId === session.user.id)

    return NextResponse.json({
      likes,
      likeCount: likes.length,
      userLiked
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/community/posts/[id]/likes - Like/unlike a post
export async function POST(
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

    const submissionId = params.id
    const userId = session.user.id

    // Check if user already liked this post
    const existingLike = await prisma.submissionLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike - delete the like
      await prisma.submissionLike.delete({
        where: {
          id: existingLike.id
        }
      })

      const likeCount = await prisma.submissionLike.count({
        where: { submissionId }
      })

      return NextResponse.json({
        message: 'Post unliked',
        liked: false,
        likeCount
      })
    } else {
      // Like - create a new like
      await prisma.submissionLike.create({
        data: {
          userId,
          submissionId
        }
      })

      const likeCount = await prisma.submissionLike.count({
        where: { submissionId }
      })

      return NextResponse.json({
        message: 'Post liked',
        liked: true,
        likeCount
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
