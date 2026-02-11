import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

const MAX_COMMENT_LENGTH = 500

// Update a comment (only by owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { commentId } = params
    const userId = session.user.id
    const body = await request.json()
    const { content } = body

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (existingComment.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      )
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const trimmedContent = content.trim()

    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: trimmedContent },
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

    return NextResponse.json({
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt.toISOString(),
        updatedAt: updatedComment.updatedAt.toISOString(),
        user: updatedComment.user,
        isOwner: true
      },
      message: 'Comment updated'
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a comment (only by owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { commentId } = params
    const userId = session.user.id

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (existingComment.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ message: 'Comment deleted' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
