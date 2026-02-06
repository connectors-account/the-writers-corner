import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get likes for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { postId } = params

    const likes = await prisma.postLike.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    })

    const userHasLiked = session?.user?.id 
      ? likes.some(like => like.userId === session.user.id)
      : false

    return NextResponse.json({
      likes,
      likeCount: likes.length,
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

// POST - Like a post
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
    const userId = session.user.id

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'You have already liked this post' },
        { status: 400 }
      )
    }

    const like = await prisma.postLike.create({
      data: {
        postId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    })

    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({
      like,
      likeCount,
      userHasLiked: true
    })
  } catch (error) {
    console.error('Error creating like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to unlike posts' },
        { status: 401 }
      )
    }

    const { postId } = params
    const userId = session.user.id

    // Check if the like exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    })

    if (!existingLike) {
      return NextResponse.json(
        { error: 'You have not liked this post' },
        { status: 400 }
      )
    }

    await prisma.postLike.delete({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    })

    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({
      success: true,
      likeCount,
      userHasLiked: false
    })
  } catch (error) {
    console.error('Error deleting like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
