
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get like count and check if current user has liked
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
    
    // Count total likes for this submission (posts are actually submissions)
    const likeCount = await prisma.postLike.count({
      where: {
        submissionId: postId
      }
    })

    // Check if current user has liked this post
    const userLike = await prisma.postLike.findUnique({
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
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add a like to a post
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

    // Verify the submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create like (will throw error if already exists due to unique constraint)
    const like = await prisma.postLike.create({
      data: {
        userId: session.user.id,
        submissionId: postId
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: {
        submissionId: postId
      }
    })

    return NextResponse.json({
      success: true,
      likeCount,
      isLiked: true
    })
  } catch (error: any) {
    // Handle duplicate like attempt
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already liked this post' },
        { status: 400 }
      )
    }
    
    console.error('Error adding like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a like from a post
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

    // Delete the like
    const deletedLike = await prisma.postLike.deleteMany({
      where: {
        userId: session.user.id,
        submissionId: postId
      }
    })

    if (deletedLike.count === 0) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: {
        submissionId: postId
      }
    })

    return NextResponse.json({
      success: true,
      likeCount,
      isLiked: false
    })
  } catch (error) {
    console.error('Error removing like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
