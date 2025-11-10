import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Get like status and count for a post
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

    // Get total like count
    const likeCount = await prisma.like.count({
      where: { postId }
    })

    // Check if current user has liked the post
    const userLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId
        }
      }
    })

    return NextResponse.json({
      likeCount,
      isLiked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Toggle like on a post
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

    // Check if post exists
    const post = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user has already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId
        }
      }
    })

    if (existingLike) {
      // Unlike - delete the like
      await prisma.like.delete({
        where: { id: existingLike.id }
      })

      // Get updated count
      const likeCount = await prisma.like.count({
        where: { postId }
      })

      return NextResponse.json({
        likeCount,
        isLiked: false,
        message: 'Post unliked'
      })
    } else {
      // Like - create new like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          postId
        }
      })

      // Get updated count
      const likeCount = await prisma.like.count({
        where: { postId }
      })

      return NextResponse.json({
        likeCount,
        isLiked: true,
        message: 'Post liked'
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
