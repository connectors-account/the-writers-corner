
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to like posts' },
        { status: 401 }
      )
    }

    const postId = params.id
    const userId = session.user.id

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.postLike.delete({
        where: {
          id: existingLike.id
        }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
        where: { postId }
      })

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount
      })
    } else {
      // Like - create new like
      await prisma.postLike.create({
        data: {
          postId,
          userId
        }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
        where: { postId }
      })

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
