
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/community/posts/[id]/likes - Get like count and user's like status
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

    // Get total like count
    const likeCount = await prisma.postLike.count({
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
      likeCount,
      hasLiked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/community/posts/[id]/likes - Like a post
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

    // Create like (will fail if already exists due to unique constraint)
    const like = await prisma.postLike.create({
      data: {
        userId: session.user.id,
        postId
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({
      success: true,
      likeCount,
      hasLiked: true
    })
  } catch (error: any) {
    // Handle duplicate like attempts
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      )
    }

    console.error('Error creating like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/community/posts/[id]/likes - Unlike a post
export async function DELETE(
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

    // Delete like
    await prisma.postLike.delete({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId
        }
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({
      success: true,
      likeCount,
      hasLiked: false
    })
  } catch (error: any) {
    // Handle trying to unlike when not liked
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }

    console.error('Error deleting like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
