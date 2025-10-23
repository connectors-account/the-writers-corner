
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET: Get likes for a post
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

    // Get total likes count
    const likesCount = await prisma.postLike.count({
      where: { postId }
    })

    // Check if current user has liked this post
    const userLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId
        }
      }
    })

    return NextResponse.json({
      count: likesCount,
      liked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching post likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Toggle like on a post
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

    // Check if post exists (using exerciseSubmission as community post)
    const post = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId
        }
      }
    })

    if (existingLike) {
      // Unlike: Remove the like
      await prisma.postLike.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId
          }
        }
      })

      // Get updated count
      const likesCount = await prisma.postLike.count({
        where: { postId }
      })

      return NextResponse.json({
        liked: false,
        count: likesCount
      })
    } else {
      // Like: Add a new like
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          postId
        }
      })

      // Get updated count
      const likesCount = await prisma.postLike.count({
        where: { postId }
      })

      return NextResponse.json({
        liked: true,
        count: likesCount
      })
    }
  } catch (error) {
    console.error('Error toggling post like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
