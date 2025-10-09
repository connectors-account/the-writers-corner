
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

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

    // Check if the post exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId, isPublic: true }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Post already liked' },
        { status: 400 }
      )
    }

    // Create the like
    await prisma.like.create({
      data: {
        userId: session.user.id,
        submissionId: postId
      }
    })

    // Get updated like count
    const likesCount = await prisma.like.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({ 
      success: true,
      likesCount 
    })
  } catch (error) {
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

    // Find and delete the like
    const like = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    if (!like) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }

    await prisma.like.delete({
      where: {
        id: like.id
      }
    })

    // Get updated like count
    const likesCount = await prisma.like.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({ 
      success: true,
      likesCount 
    })
  } catch (error) {
    console.error('Error removing like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
