
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Like a post
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

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (!submission.isPublic) {
      return NextResponse.json(
        { error: 'This post is not public' },
        { status: 403 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: submissionId
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
        userId: session.user.id,
        submissionId: submissionId
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId: submissionId }
    })

    return NextResponse.json({ 
      success: true,
      likeCount 
    })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unlike a post
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

    // Find and delete the like
    const like = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: submissionId
        }
      }
    })

    if (!like) {
      return NextResponse.json(
        { error: 'You have not liked this post' },
        { status: 400 }
      )
    }

    await prisma.postLike.delete({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: submissionId
        }
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId: submissionId }
    })

    return NextResponse.json({ 
      success: true,
      likeCount 
    })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
