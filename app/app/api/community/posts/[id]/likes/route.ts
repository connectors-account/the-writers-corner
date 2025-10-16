import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

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

// GET /api/community/posts/[id]/likes - Get like count and user's like status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const sessionId = getSessionId(request)

    // Get total like count
    const likeCount = await prisma.postLike.count({
      where: {
        postId
      }
    })

    // Check if current user/session has liked
    const userLike = await prisma.postLike.findFirst({
      where: {
        postId,
        sessionId
      }
    })

    return NextResponse.json({
      count: likeCount,
      liked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/community/posts/[id]/likes - Toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const sessionId = getSessionId(request)
    const ipAddress = getClientIp(request)

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

    // Check if user has already liked
    const existingLike = await prisma.postLike.findFirst({
      where: {
        postId,
        sessionId
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.postLike.delete({
        where: {
          id: existingLike.id
        }
      })

      // Get updated count
      const likeCount = await prisma.postLike.count({
        where: { postId }
      })

      const response = NextResponse.json({
        liked: false,
        count: likeCount
      })

      // Set session cookie
      response.cookies.set('anonymous_session', sessionId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: 'lax'
      })

      return response
    } else {
      // Like - add the like
      await prisma.postLike.create({
        data: {
          postId,
          sessionId,
          ipAddress
        }
      })

      // Get updated count
      const likeCount = await prisma.postLike.count({
        where: { postId }
      })

      const response = NextResponse.json({
        liked: true,
        count: likeCount
      })

      // Set session cookie
      response.cookies.set('anonymous_session', sessionId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: 'lax'
      })

      return response
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
