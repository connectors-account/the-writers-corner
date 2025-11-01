
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Toggle like on a post (ExerciseSubmission)
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
      // Unlike: delete the like
      await prisma.submissionLike.delete({
        where: { id: existingLike.id }
      })

      // Get updated like count
      const likeCount = await prisma.submissionLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        liked: false,
        likeCount
      })
    } else {
      // Like: create a new like
      await prisma.submissionLike.create({
        data: {
          userId,
          submissionId: postId
        }
      })

      // Get updated like count
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

// Get like status and count for a post
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

    // Get like count
    const likeCount = await prisma.submissionLike.count({
      where: { submissionId: postId }
    })

    // Check if current user liked this post
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
    console.error('Error fetching like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
