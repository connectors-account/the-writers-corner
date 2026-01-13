import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to like posts' },
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
        { error: 'Cannot like a private post' },
        { status: 403 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike: remove the like
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.postLike.count({
        where: { submissionId }
      })

      return NextResponse.json({
        liked: false,
        likeCount,
        message: 'Post unliked successfully'
      })
    } else {
      // Like: create a new like
      await prisma.postLike.create({
        data: {
          userId,
          submissionId
        }
      })

      const likeCount = await prisma.postLike.count({
        where: { submissionId }
      })

      return NextResponse.json({
        liked: true,
        likeCount,
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

// Get like status for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const submissionId = params.id

    const likeCount = await prisma.postLike.count({
      where: { submissionId }
    })

    let liked = false
    if (session?.user?.id) {
      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId
          }
        }
      })
      liked = !!existingLike
    }

    return NextResponse.json({
      liked,
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
