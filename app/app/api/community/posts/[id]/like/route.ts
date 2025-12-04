
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

// POST - Like or Unlike a post
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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
      where: { id: postId, isPublic: true }
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
        postId_userId: {
          postId: postId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike: Delete the like
      await prisma.postLike.delete({
        where: {
          id: existingLike.id
        }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
        where: { postId: postId }
      })

      return NextResponse.json({
        liked: false,
        likeCount
      })
    } else {
      // Like: Create new like
      await prisma.postLike.create({
        data: {
          postId: postId,
          userId: session.user.id
        }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
        where: { postId: postId }
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
