
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get like status and count for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Count total likes for this post
    const likeCount = await prisma.postLike.count({
      where: {
        submissionId: postId
      }
    })

    // Check if current user has liked this post
    const userLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    return NextResponse.json({
      count: likeCount,
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

// POST - Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Check if post exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create or toggle like
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike if already liked
      await prisma.postLike.delete({
        where: {
          id: existingLike.id
        }
      })

      const newCount = await prisma.postLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        success: true,
        isLiked: false,
        count: newCount
      })
    } else {
      // Like the post
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          submissionId: postId
        }
      })

      const newCount = await prisma.postLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        success: true,
        isLiked: true,
        count: newCount
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
