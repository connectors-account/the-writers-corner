import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/posts/:id/like - Get like count and status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.id

    // Get total like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    // Check if current user has liked
    let hasLiked = false
    if (session?.user?.id) {
      const userLike = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId
          }
        }
      })
      hasLiked = !!userLike
    }

    return NextResponse.json({
      likeCount,
      hasLiked
    })
  } catch (error) {
    console.error('Error fetching like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts/:id/like - Toggle like/unlike
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to like posts' },
        { status: 401 }
      )
    }

    const postId = params.id
    const userId = session.user.id

    // Check if like already exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.postLike.delete({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      })
    } else {
      // Like - create new like
      await prisma.postLike.create({
        data: {
          userId,
          postId
        }
      })
    }

    // Get updated count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({
      likeCount,
      hasLiked: !existingLike
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
