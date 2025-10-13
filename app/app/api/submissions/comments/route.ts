import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET: Get comments for a submission
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const comments = await prisma.submissionComment.findMany({
      where: {
        submissionId
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

// POST: Add a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId, userName, content } = body

    if (!submissionId || !userName || !content) {
      return NextResponse.json(
        { error: 'Submission ID, user name, and content are required' },
        { status: 400 }
      )
    }

    // Validate content is not empty after trimming
    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content cannot be empty' },
        { status: 400 }
      )
    }

    // Check if the submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Create the comment
    const newComment = await prisma.submissionComment.create({
      data: {
        submissionId,
        userName,
        content: content.trim()
      }
    })

    return NextResponse.json({ 
      comment: newComment,
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
