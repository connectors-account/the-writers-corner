
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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const submissionId = params.id
    const userId = session.user.id

    // Check if submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike: Delete the like
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
        where: { submissionId }
      })

      return NextResponse.json({ 
        liked: false,
        likeCount 
      })
    } else {
      // Like: Create a new like
      await prisma.postLike.create({
        data: {
          userId,
          submissionId
        }
      })

      // Get updated like count
      const likeCount = await prisma.postLike.count({
        where: { submissionId }
      })

      return NextResponse.json({ 
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

// Get like status and count for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const submissionId = params.id
    const userId = session.user.id

    // Get like count
    const likeCount = await prisma.postLike.count({
      where: { submissionId }
    })

    // Check if current user liked this post
    const userLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    return NextResponse.json({
      liked: !!userLike,
      likeCount
    })
  } catch (error) {
    console.error('Error fetching like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
