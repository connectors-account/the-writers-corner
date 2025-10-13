import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params

    const comments = await prisma.comment.findMany({
      where: {
        submissionId: postId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      comments,
      count: comments.length
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST to add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const body = await request.json()
    const { authorName, content } = body

    if (!authorName || !content) {
      return NextResponse.json(
        { error: 'Author name and content are required' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content cannot be empty' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        submissionId: postId,
        authorName,
        content: content.trim()
      }
    })

    return NextResponse.json({
      comment,
      message: 'Comment added successfully'
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
