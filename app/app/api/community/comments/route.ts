
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// In-memory storage for comments
// Structure: { postId: Array of comment objects }
interface Comment {
  id: string
  postId: string
  content: string
  userId: string
  userName: string
  createdAt: string
}

const commentsStore = new Map<string, Comment[]>()
let commentIdCounter = 1

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const postId = request.nextUrl.searchParams.get('postId')

    if (!postId) {
      // Return all comments
      const allComments: Record<string, Comment[]> = {}
      
      for (const [pId, comments] of commentsStore.entries()) {
        allComments[pId] = comments
      }

      return NextResponse.json({ comments: allComments })
    }

    // Return comments for specific post
    const comments = commentsStore.get(postId) || []
    return NextResponse.json({
      postId,
      comments
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId, content } = await request.json()

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      )
    }

    // Create new comment
    const userName = session.user.firstName && session.user.lastName
      ? `${session.user.firstName} ${session.user.lastName}`
      : session.user.name || 'Anonymous Writer'

    const newComment: Comment = {
      id: `comment-${commentIdCounter++}`,
      postId,
      content: content.trim(),
      userId: session.user.id,
      userName,
      createdAt: new Date().toISOString()
    }

    if (!commentsStore.has(postId)) {
      commentsStore.set(postId, [])
    }

    const comments = commentsStore.get(postId)!
    comments.push(newComment)

    return NextResponse.json({
      postId,
      comment: newComment,
      comments
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
