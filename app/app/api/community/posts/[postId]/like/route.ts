
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Check if user liked the post and get like count
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Get like count
    const likeCount = await prisma.submissionLike.count({
      where: {
        submissionId: postId
      }
    })

    // Check if current user liked this post
    const userLike = await prisma.submissionLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    return NextResponse.json({
      likeCount,
      isLiked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Toggle like (like if not liked, unlike if already liked)
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params

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
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    let isLiked: boolean

    if (existingLike) {
      // Unlike - delete the like
      await prisma.submissionLike.delete({
        where: {
          id: existingLike.id
        }
      })
      isLiked = false
    } else {
      // Like - create a new like
      await prisma.submissionLike.create({
        data: {
          userId: session.user.id,
          submissionId: postId
        }
      })
      isLiked = true
    }

    // Get updated like count
    const likeCount = await prisma.submissionLike.count({
      where: {
        submissionId: postId
      }
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
