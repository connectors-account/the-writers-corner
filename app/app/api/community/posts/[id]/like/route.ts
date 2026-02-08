import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// POST - Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to like posts' },
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

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
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
    const like = await prisma.postLike.create({
      data: {
        userId: session.user.id,
        submissionId
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId }
    })

    return NextResponse.json({ success: true, likeCount })
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to unlike posts' },
        { status: 401 }
      )
    }

    const submissionId = params.id

    // Check if like exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
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
        userId_submissionId: {
          userId: session.user.id,
          submissionId
        }
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId }
    })

    return NextResponse.json({ success: true, likeCount })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
