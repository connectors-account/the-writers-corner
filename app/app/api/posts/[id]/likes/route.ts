import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// Helper function to get user identifier from request
async function getUserIdentifier(request: NextRequest): Promise<string> {
  // Get IP address from headers
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  
  // Get or create session identifier from cookies
  let sessionId = request.cookies.get('visitor_session')?.value
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  return `${ip}_${sessionId}`
}

// GET /api/posts/[id]/likes - Get like count and check if user has liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const userIdentifier = await getUserIdentifier(request)

    const likeCount = await prisma.like.count({
      where: { submissionId: postId }
    })

    const userLike = await prisma.like.findUnique({
      where: {
        submissionId_userIdentifier: {
          submissionId: postId,
          userIdentifier
        }
      }
    })

    return NextResponse.json({
      count: likeCount,
      isLiked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[id]/likes - Toggle like (add or remove)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const userIdentifier = await getUserIdentifier(request)

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
    const existingLike = await prisma.like.findUnique({
      where: {
        submissionId_userIdentifier: {
          submissionId: postId,
          userIdentifier
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.like.delete({
        where: { id: existingLike.id }
      })

      const newCount = await prisma.like.count({
        where: { submissionId: postId }
      })

      const response = NextResponse.json({
        message: 'Post unliked',
        isLiked: false,
        count: newCount
      })

      // Set session cookie
      const sessionId = userIdentifier.split('_').slice(1).join('_')
      response.cookies.set('visitor_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 // 1 year
      })

      return response
    } else {
      // Like - add the like
      await prisma.like.create({
        data: {
          submissionId: postId,
          userIdentifier
        }
      })

      const newCount = await prisma.like.count({
        where: { submissionId: postId }
      })

      const response = NextResponse.json({
        message: 'Post liked',
        isLiked: true,
        count: newCount
      })

      // Set session cookie
      const sessionId = userIdentifier.split('_').slice(1).join('_')
      response.cookies.set('visitor_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 // 1 year
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
