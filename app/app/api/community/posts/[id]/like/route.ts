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

    // Check if submission exists and is public
    const submission = await prisma.exerciseSubmission.findFirst({
      where: {
        id: submissionId,
        isPublic: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.postLike.delete({
        where: {
          id: existingLike.id
        }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
        where: { submissionId }
      })

      return NextResponse.json({
        liked: false,
        likeCount
      })
    } else {
      // Like - create new like
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          submissionId: submissionId
        }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
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
