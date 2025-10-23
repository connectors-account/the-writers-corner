
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Toggle like on a submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { submissionId } = body

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Check if submission exists and is public
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId },
      select: { isPublic: true }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (!submission.isPublic) {
      return NextResponse.json(
        { error: 'Submission is not public' },
        { status: 403 }
      )
    }

    // Check if user already liked this submission
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike: delete the like
      await prisma.like.delete({
        where: { id: existingLike.id }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'unliked',
        message: 'Like removed successfully'
      })
    } else {
      // Like: create a new like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          submissionId: submissionId
        }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'liked',
        message: 'Like added successfully'
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

// Get like count for a submission
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const [likeCount, userLike] = await Promise.all([
      prisma.like.count({
        where: { submissionId }
      }),
      prisma.like.findUnique({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId: submissionId
          }
        }
      })
    ])

    return NextResponse.json({
      count: likeCount,
      liked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching like data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
