
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// In-memory storage for likes
// Structure: { postId: Set of userIds who liked the post }
const likesStore = new Map<string, Set<string>>()

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
      // Return all likes data
      const likesData: Record<string, { count: number; userLiked: boolean }> = {}
      
      for (const [pId, userIds] of likesStore.entries()) {
        likesData[pId] = {
          count: userIds.size,
          userLiked: userIds.has(session.user.id)
        }
      }

      return NextResponse.json({ likes: likesData })
    }

    // Return likes for specific post
    const userIds = likesStore.get(postId) || new Set()
    return NextResponse.json({
      postId,
      count: userIds.size,
      userLiked: userIds.has(session.user.id)
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
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

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Toggle like
    if (!likesStore.has(postId)) {
      likesStore.set(postId, new Set())
    }

    const userIds = likesStore.get(postId)!
    const userLiked = userIds.has(session.user.id)

    if (userLiked) {
      userIds.delete(session.user.id)
    } else {
      userIds.add(session.user.id)
    }

    return NextResponse.json({
      postId,
      count: userIds.size,
      userLiked: !userLiked
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
