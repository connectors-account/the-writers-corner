
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/posts/:id/like - Toggle like/unlike
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

    // Check if submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
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
      // Unlike: delete the like
      await prisma.submissionLike.delete({
        where: { id: existingLike.id }
      })

      return NextResponse.json({
        liked: false,
        message: 'Post unliked successfully'
      })
    } else {
      // Like: create a new like
      await prisma.submissionLike.create({
        data: {
          userId: session.user.id,
          submissionId
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
