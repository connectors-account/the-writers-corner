
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

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
    const userId = session.user.id

    // Check if submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
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

    if (existingLike) {
      // Unlike - remove the like
      await prisma.submissionLike.delete({
        where: { id: existingLike.id }
      })

      // Get updated like count
      const likeCount = await prisma.submissionLike.count({
        where: { submissionId }
      })

      return NextResponse.json({ 
        liked: false, 
        likeCount,
        message: 'Like removed' 
      })
    } else {
      // Like - add a new like
      await prisma.submissionLike.create({
        data: {
          userId,
          submissionId
        }
      })

      // Get updated like count
      const likeCount = await prisma.submissionLike.count({
        where: { submissionId }
      })

      return NextResponse.json({ 
        liked: true, 
        likeCount,
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
