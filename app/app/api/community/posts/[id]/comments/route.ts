import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Helper function to get session ID from cookies or create a new one
function getSessionId(request: NextRequest): string {
  const sessionId = request.cookies.get('anonymous_session')?.value
  
  if (sessionId) {
    return sessionId
  }
  
  // Generate a new session ID if it doesn't exist
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Helper function to get client IP
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

// GET /api/community/posts/[id]/comments - Get all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    const comments = await prisma.postComment.findMany({
      where: {
        postId
      },
      orderBy: {
        createdAt: 'desc'
      }
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

// POST /api/community/posts/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const sessionId = getSessionId(request)
    const ipAddress = getClientIp(request)
    
    const body = await request.json()
    const { content, authorName } = body

    // Validate input
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (!authorName || !authorName.trim()) {
      return NextResponse.json(
        { error: 'Author name is required' },
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

    // Create the comment
    const comment = await prisma.postComment.create({
      data: {
        postId,
        content: content.trim(),
        authorName: authorName.trim(),
        sessionId,
        ipAddress
      }
    })

    const response = NextResponse.json({ comment }, { status: 201 })

    // Set session cookie
    response.cookies.set('anonymous_session', sessionId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
