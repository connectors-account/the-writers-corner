
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET: Check if user has liked and get like count
export async function GET(
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

    // Get like count
    const likeCount = await prisma.like.count({
      where: {
        submissionId: postId
      }
    })

    // Check if current user has liked
    const userLike = await prisma.like.findUnique({
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
    console.error('Error fetching like data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Toggle like (like/unlike)
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

    // Check if post exists
    const post = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.like.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        success: true,
        isLiked: false,
        likeCount
      })
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          submissionId: postId
        }
      })

      const likeCount = await prisma.like.count({
        where: { submissionId: postId }
      })

      return NextResponse.json({
        success: true,
        isLiked: true,
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
