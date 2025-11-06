import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// PUT - Update a comment (only by owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
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
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Find the comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner
    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own comments' },
        { status: 403 }
      )
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim()
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

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user,
        isOwner: true
      }
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment (only by owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
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

    // Find the comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner
    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own comments' },
        { status: 403 }
      )
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
