import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Get likes count and user's like status for a post
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

    const submissionId = params.id

    // Get total likes count
    const likesCount = await prisma.like.count({
      where: {
        submissionId
      }
    })

    // Check if current user has liked this post
    const userLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
        }
      }
    })

    return NextResponse.json({
      count: likesCount,
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

// POST - Like a post
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

    const submissionId = params.id

    // Check if submission exists and is public
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission || !submission.isPublic) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create like (will fail if already exists due to unique constraint)
    const like = await prisma.like.create({
      data: {
        userId: session.user.id,
        submissionId
      }
    })

    // Get updated count
    const likesCount = await prisma.like.count({
      where: { submissionId }
    })

    return NextResponse.json({
      success: true,
      count: likesCount,
      isLiked: true
    })
  } catch (error: any) {
    // If unique constraint violation, user already liked
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Post already liked' },
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

// DELETE - Unlike a post
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

    const submissionId = params.id

    // Delete like
    await prisma.like.delete({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
        }
      }
    })

    // Get updated count
    const likesCount = await prisma.like.count({
      where: { submissionId }
    })

    return NextResponse.json({
      success: true,
      count: likesCount,
      isLiked: false
    })
  } catch (error: any) {
    // If like doesn't exist
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
