import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Get likes for a post
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

    // Get total like count
    const likeCount = await prisma.like.count({
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

// POST - Add a like
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

    // Check if submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create or ignore if already exists
    const like = await prisma.like.upsert({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
        }
      },
      create: {
        userId: session.user.id,
        submissionId
      },
      update: {}
    })

    // Get updated count
    const likeCount = await prisma.like.count({
      where: { submissionId }
    })

    return NextResponse.json({
      success: true,
      likeCount,
      isLiked: true
    })
  } catch (error) {
    console.error('Error creating like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a like
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

    // Delete the like if it exists
    await prisma.like.deleteMany({
      where: {
        userId: session.user.id,
        submissionId
      }
    })

    // Get updated count
    const likeCount = await prisma.like.count({
      where: { submissionId }
    })

    return NextResponse.json({
      success: true,
      likeCount,
      isLiked: false
    })
  } catch (error) {
    console.error('Error deleting like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
