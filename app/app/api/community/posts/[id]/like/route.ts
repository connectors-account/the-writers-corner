
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

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

    // Check if submission exists and is public
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId },
      select: { isPublic: true }
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
          userId,
          submissionId
        }
      }
    })

    let isLiked: boolean

    if (existingLike) {
      // Unlike: delete the like
      await prisma.submissionLike.delete({
        where: {
          id: existingLike.id
        }
      })
      isLiked = false
    } else {
      // Like: create a new like
      await prisma.submissionLike.create({
        data: {
          userId,
          submissionId
        }
      })
      isLiked = true
    }

    // Get updated like count
    const likeCount = await prisma.submissionLike.count({
      where: { submissionId }
    })

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
