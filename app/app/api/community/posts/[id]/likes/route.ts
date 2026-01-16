import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get like count and user's like status for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.id

    // Get total like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    // Check if current user has liked (if authenticated)
    let userHasLiked = false
    if (session?.user?.id) {
      const userLike = await prisma.postLike.findUnique({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId: postId
          }
        }
      })
      userHasLiked = !!userLike
    }

    return NextResponse.json({
      likeCount,
      userHasLiked
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to like posts' },
        { status: 401 }
      )
    }

    const postId = params.id
    const userId = session.user.id

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

    // Check if user has already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.postLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        message: 'Post unliked',
        liked: false,
        likeCount
      })
    } else {
      // Like - create new like
      await prisma.postLike.create({
        data: {
          userId,
          submissionId: postId
        }
      })

      const likeCount = await prisma.postLike.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        message: 'Post liked',
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
