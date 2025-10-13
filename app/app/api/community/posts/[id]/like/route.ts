
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

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

    // Check if submission exists and is public
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
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
    const existingLike = await prisma.submissionLike.findUnique({
      where: {
        submissionId_userId: {
          submissionId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike: Delete the like
      await prisma.submissionLike.delete({
        where: {
          id: existingLike.id
        }
      })

      return NextResponse.json({ 
        liked: false,
        message: 'Like removed'
      })
    } else {
      // Like: Create a new like
      await prisma.submissionLike.create({
        data: {
          submissionId,
          userId: session.user.id
        }
      })

      return NextResponse.json({ 
        liked: true,
        message: 'Like added'
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
