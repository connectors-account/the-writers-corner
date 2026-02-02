import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Toggle like/unlike for a post (submission)
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

    // Check if the submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.submissionLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.submissionLike.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.submissionLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        liked: false,
        likeCount
      })
    } else {
      // Like - add new like
      await prisma.submissionLike.create({
        data: {
          userId,
          submissionId: postId
        }
      })

      const likeCount = await prisma.submissionLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
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

// Get like count and whether current user has liked
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

    const likeCount = await prisma.submissionLike.count({
      where: { submissionId: postId }
    })

    const userLike = await prisma.submissionLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId: postId
        }
      }
    })

    return NextResponse.json({
      liked: !!userLike,
      likeCount
    })
  } catch (error) {
    console.error('Error getting likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
