import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/posts/:id/like - Get like count and current user's like status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.id

    // Get like count
    const likeCount = await prisma.submissionLike.count({
      where: { submissionId: postId }
    })

    // Check if current user has liked (if logged in)
    let userLiked = false
    if (session?.user?.id) {
      const existingLike = await prisma.submissionLike.findUnique({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId: postId
          }
        }
      })
      userLiked = !!existingLike
    }

    return NextResponse.json({ likeCount, userLiked })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts/:id/like - Toggle like on a post
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

    const postId = params.id
    const userId = session.user.id

    // Check if the submission exists
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
          userId,
          submissionId: postId
        }
      }
    })

    let userLiked: boolean
    if (existingLike) {
      // Unlike: Remove the like
      await prisma.submissionLike.delete({
        where: { id: existingLike.id }
      })
      userLiked = false
    } else {
      // Like: Add a new like
      await prisma.submissionLike.create({
        data: {
          userId,
          submissionId: postId
        }
      })
      userLiked = true
    }

    // Get updated like count
    const likeCount = await prisma.submissionLike.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({ likeCount, userLiked })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
