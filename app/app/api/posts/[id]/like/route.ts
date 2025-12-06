
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Toggle like on a post
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

    const postId = params.id
    const userId = session.user.id

    // Check if like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      })

      return NextResponse.json({ 
        liked: false,
        message: 'Post unliked successfully'
      })
    } else {
      // Like - create new like
      await prisma.like.create({
        data: {
          userId,
          postId
        }
      })

      return NextResponse.json({ 
        liked: true,
        message: 'Post liked successfully'
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

// Get like count and user's like status
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

    // Get total like count
    const likeCount = await prisma.like.count({
      where: {
        postId
      }
    })

    // Check if current user has liked
    const userLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    return NextResponse.json({
      likeCount,
      isLiked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
