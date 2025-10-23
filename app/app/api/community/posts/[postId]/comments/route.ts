
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Get all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params

    const comments = await prisma.postComment.findMany({
      where: {
        OR: [
          { postId },
          { submissionId: postId }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await prisma.user.findUnique({
          where: { id: comment.userId },
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        })

        return {
          ...comment,
          user,
          isOwner: comment.userId === session.user.id
        }
      })
    )

    return NextResponse.json({ comments: commentsWithUsers })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const comment = await prisma.postComment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        postId,
        submissionId: postId // Using postId as submissionId since posts are submissions
      }
    })

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: comment.userId },
      select: {
        firstName: true,
        lastName: true,
        name: true
      }
    })

    return NextResponse.json({
      comment: {
        ...comment,
        user,
        isOwner: true
      }
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
