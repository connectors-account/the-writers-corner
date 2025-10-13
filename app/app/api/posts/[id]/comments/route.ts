import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/posts/[id]/comments - Get all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    const comments = await prisma.comment.findMany({
      where: { submissionId: postId },
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

// POST /api/posts/[id]/comments - Add a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const body = await request.json()
    const { authorName, content } = body

    // Validate input
    if (!authorName || !content) {
      return NextResponse.json(
        { error: 'Author name and content are required' },
        { status: 400 }
      )
    }

    if (authorName.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Author name and content cannot be empty' },
        { status: 400 }
      )
    }

    if (authorName.length > 100) {
      return NextResponse.json(
        { error: 'Author name must be less than 100 characters' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be less than 5000 characters' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        submissionId: postId,
        authorName: authorName.trim(),
        content: content.trim()
      }
    })

    return NextResponse.json({
      message: 'Comment added successfully',
      comment
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
