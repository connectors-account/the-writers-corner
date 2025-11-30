
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
        { error: 'Post is not public' },
        { status: 403 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    let isLiked = false
    let likeCount = 0

    if (existingLike) {
      // Unlike: remove the like
      await prisma.like.delete({
        where: { id: existingLike.id }
      })
      isLiked = false
    } else {
      // Like: create a new like
      await prisma.like.create({
        data: {
          userId,
          submissionId
        }
      })
      isLiked = true
    }

    // Get updated like count
    likeCount = await prisma.like.count({
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
