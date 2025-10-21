import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Helper function to generate anonymous ID from IP
function getAnonymousId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return crypto.createHash('sha256').update(ip).digest('hex')
}

// GET: Retrieve like count and check if current user/session has liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await getServerSession(authOptions)
    const anonymousId = getAnonymousId(request)

    // Get total like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    // Check if user has liked
    let hasLiked = false
    if (session?.user?.id) {
      const like = await prisma.postLike.findFirst({
        where: {
          postId,
          userId: session.user.id
        }
      })
      hasLiked = !!like
    } else {
      const like = await prisma.postLike.findFirst({
        where: {
          postId,
          anonymousId
        }
      })
      hasLiked = !!like
    }

    return NextResponse.json({ 
      likeCount, 
      hasLiked 
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Toggle like (add or remove)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await getServerSession(authOptions)
    const anonymousId = getAnonymousId(request)

    if (session?.user?.id) {
      // Authenticated user
      const existingLike = await prisma.postLike.findFirst({
        where: {
          postId,
          userId: session.user.id
        }
      })

      if (existingLike) {
        // Unlike
        await prisma.postLike.delete({
          where: { id: existingLike.id }
        })
        return NextResponse.json({ 
          liked: false, 
          message: 'Like removed' 
        })
      } else {
        // Like
        await prisma.postLike.create({
          data: {
            postId,
            userId: session.user.id
          }
        })
        return NextResponse.json({ 
          liked: true, 
          message: 'Post liked' 
        })
      }
    } else {
      // Anonymous user
      const existingLike = await prisma.postLike.findFirst({
        where: {
          postId,
          anonymousId
        }
      })

      if (existingLike) {
        // Unlike
        await prisma.postLike.delete({
          where: { id: existingLike.id }
        })
        return NextResponse.json({ 
          liked: false, 
          message: 'Like removed' 
        })
      } else {
        // Like
        await prisma.postLike.create({
          data: {
            postId,
            anonymousId
          }
        })
        return NextResponse.json({ 
          liked: true, 
          message: 'Post liked' 
        })
      }
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
