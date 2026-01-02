import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Toggle like on a post (submission)
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

    // Check if submission exists and is public
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (!submission.isPublic) {
      return NextResponse.json(
        { error: 'Cannot like a private post' },
        { status: 403 }
      )
    }

    // Check if user already liked this submission
    const existingLike = await prisma.submissionLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike: delete the existing like
      await prisma.submissionLike.delete({
        where: { id: existingLike.id }
      })

      // Get updated like count
      const likeCount = await prisma.submissionLike.count({
        where: { submissionId }
      })

      return NextResponse.json({
        liked: false,
        likeCount
      })
    } else {
      // Like: create a new like
      await prisma.submissionLike.create({
        data: {
          userId: session.user.id,
          submissionId
        }
      })

      // Get updated like count
      const likeCount = await prisma.submissionLike.count({
        where: { submissionId }
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

    const submissionId = params.id

    // Get like count
    const likeCount = await prisma.submissionLike.count({
      where: { submissionId }
    })

    // Check if current user has liked
    const userLike = await prisma.submissionLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
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
