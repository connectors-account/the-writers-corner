import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Helper function to generate anonymous ID from IP
function getAnonymousId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return crypto.createHash('sha256').update(ip).digest('hex')
}

// GET: Retrieve all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    const comments = await prisma.postComment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format comments for response
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      authorName: comment.user 
        ? `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || comment.user.name || 'Anonymous'
        : comment.authorName,
      createdAt: comment.createdAt.toISOString(),
      isAuthor: false // Will be determined on frontend
    }))

    return NextResponse.json({ 
      comments: formattedComments,
      count: formattedComments.length
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await getServerSession(authOptions)
    const anonymousId = getAnonymousId(request)
    
    const body = await request.json()
    const { content, authorName } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    let formattedComment
    if (session?.user?.id) {
      // Authenticated user
      const comment = await prisma.postComment.create({
        data: {
          postId,
          userId: session.user.id,
          content: content.trim(),
          authorName: session.user.firstName && session.user.lastName
            ? `${session.user.firstName} ${session.user.lastName}`
            : session.user.name || 'Anonymous'
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              name: true
            }
          }
        }
      })

      formattedComment = {
        id: comment.id,
        content: comment.content,
        authorName: comment.user 
          ? `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || comment.user.name || 'Anonymous'
          : comment.authorName,
        createdAt: comment.createdAt.toISOString()
      }
    } else {
      // Anonymous user
      const displayName = authorName?.trim() || 'Anonymous'
      const comment = await prisma.postComment.create({
        data: {
          postId,
          anonymousId,
          content: content.trim(),
          authorName: displayName
        }
      })

      formattedComment = {
        id: comment.id,
        content: comment.content,
        authorName: comment.authorName,
        createdAt: comment.createdAt.toISOString()
      }
    }

    return NextResponse.json({ 
      comment: formattedComment,
      message: 'Comment posted successfully' 
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
