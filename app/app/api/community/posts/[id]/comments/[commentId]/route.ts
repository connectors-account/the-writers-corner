import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// PUT - Update a comment (only by owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to update comments' },
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
    const existingComment = await prisma.postComment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only edit your own comments' },
        { status: 403 }
      )
    }

    // Update the comment
    const updatedComment = await prisma.postComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
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
      message: 'Comment updated',
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt.toISOString(),
        updatedAt: updatedComment.updatedAt.toISOString(),
        user: updatedComment.user,
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
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to delete comments' },
        { status: 401 }
      )
    }

    const { commentId } = params

    // Find the comment
    const existingComment = await prisma.postComment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own comments' },
        { status: 403 }
      )
    }

    // Delete the comment
    await prisma.postComment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({
      message: 'Comment deleted'
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
