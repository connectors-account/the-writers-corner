import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get like count and whether current user has liked
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { postId } = params

    // Get like count
    const likeCount = await prisma.submissionLike.count({
      where: { submissionId: postId }
    })

    // Check if current user has liked (if authenticated)
    let hasLiked = false
    if (session?.user?.id) {
      const userLike = await prisma.submissionLike.findUnique({
        where: {
          submissionId_userId: {
            submissionId: postId,
            userId: session.user.id
          }
        }
      })
      hasLiked = !!userLike
    }

    return NextResponse.json({ likeCount, hasLiked })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Toggle like (like if not liked, unlike if liked)
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to like posts' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Verify the submission exists and is public
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
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

    // Check if user already liked
    const existingLike = await prisma.submissionLike.findUnique({
      where: {
        submissionId_userId: {
          submissionId: postId,
          userId: session.user.id
        }
      }
    })

    let hasLiked: boolean
    if (existingLike) {
      // Unlike - delete the like
      await prisma.submissionLike.delete({
        where: { id: existingLike.id }
      })
      hasLiked = false
    } else {
      // Like - create new like
      await prisma.submissionLike.create({
        data: {
          submissionId: postId,
          userId: session.user.id
        }
      })
      hasLiked = true
    }

    // Get updated count
    const likeCount = await prisma.submissionLike.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({ likeCount, hasLiked })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
