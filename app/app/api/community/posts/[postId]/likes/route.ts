import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get like count and check if current user has liked the post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.postId

    // Get total like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    // Check if current user has liked (if authenticated)
    let hasLiked = false
    if (session?.user?.id) {
      const userLike = await prisma.postLike.findUnique({
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

    const postId = params.postId

    // Verify the post exists and is public
    const submission = await prisma.exerciseSubmission.findFirst({
      where: { id: postId, isPublic: true }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        submissionId_userId: {
          submissionId: postId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'You have already liked this post' },
        { status: 400 }
      )
    }

    // Create the like
    await prisma.postLike.create({
      data: {
        submissionId: postId,
        userId: session.user.id
      }
    })

    // Get updated count
    const likeCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({ 
      success: true, 
      likeCount,
      hasLiked: true 
    })
  } catch (error) {
    console.error('Error liking post:', error)
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

    const postId = params.postId

    // Check if like exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        submissionId_userId: {
          submissionId: postId,
          userId: session.user.id
        }
      }
    })

    if (!existingLike) {
      return NextResponse.json(
        { error: 'You have not liked this post' },
        { status: 400 }
      )
    }

    // Delete the like
    await prisma.postLike.delete({
      where: {
        submissionId_userId: {
          submissionId: postId,
          userId: session.user.id
        }
      }
    })

    // Get updated count
    const likeCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({ 
      success: true, 
      likeCount,
      hasLiked: false 
    })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
