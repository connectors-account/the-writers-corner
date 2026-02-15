import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

const MAX_COMMENT_LENGTH = 2000
const MIN_COMMENT_LENGTH = 1

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

    const comments = await prisma.postComment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const userId = session.user.id
    const postId = params.id

    const body = await request.json()
    const content = body.content?.trim()

    if (!content || content.length < MIN_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    // Check if post exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId, isPublic: true }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const comment = await prisma.postComment.create({
      data: { content, userId, postId },
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

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
