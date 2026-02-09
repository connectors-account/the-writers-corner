import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get like count and user's like status for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.id

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    // Check if current user has liked
    const userLike = await prisma.postLike.findUnique({
      where: {
        submissionId_userId: {
          submissionId: postId,
          userId: session.user.id
        }
      }
    })

    return NextResponse.json({
      likeCount,
      hasLiked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Toggle like (add or remove)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.id

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        submissionId_userId: {
          submissionId: postId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.postLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        message: 'Like removed',
        hasLiked: false,
        likeCount
      })
    } else {
      // Like - add new like
      await prisma.postLike.create({
        data: {
          submissionId: postId,
          userId: session.user.id
        }
      })

      const likeCount = await prisma.postLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        message: 'Like added',
        hasLiked: true,
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
