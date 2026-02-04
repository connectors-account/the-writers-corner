import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Toggle like on a post
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

    // Check if the submission exists and is public
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!submission || !submission.isPublic) {
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
        liked: false,
        likeCount
      })
    } else {
      // Like - add a new like
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          submissionId: postId
        }
      })

      const likeCount = await prisma.postLike.count({
        where: { submissionId: postId }
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

// Get like status for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { postId } = params

    const likeCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    let liked = false
    if (session?.user?.id) {
      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId: postId
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
