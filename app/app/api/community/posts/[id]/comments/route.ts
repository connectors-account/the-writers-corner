import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

// GET /api/community/posts/[id]/comments - Get all comments for a post
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

    const comments = await prisma.postComment.findMany({
      where: { submissionId },
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

// POST /api/community/posts/[id]/comments - Add a comment to a post
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
    const userId = session.user.id

    // Check if the submission exists and is public
    const submission = await prisma.exerciseSubmission.findFirst({
      where: {
        id: submissionId,
        isPublic: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be 2000 characters or less' },
        { status: 400 }
      )
    }

    const comment = await prisma.postComment.create({
      data: {
        content: content.trim(),
        userId,
        submissionId
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

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
