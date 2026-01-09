import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Get like count and user's like status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id

    const [likeCount, userLike] = await Promise.all([
      prisma.postLike.count({ where: { postId } }),
      prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId: session.user.id } }
      })
    ])

    return NextResponse.json({
      likeCount,
      isLiked: !!userLike
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Toggle like (like/unlike)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id
    const userId = session.user.id

    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } }
    })

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })
    } else {
      // Like
      await prisma.postLike.create({
        data: { postId, userId }
      })
    }

    const likeCount = await prisma.postLike.count({ where: { postId } })

    return NextResponse.json({
      likeCount,
      isLiked: !existingLike
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
