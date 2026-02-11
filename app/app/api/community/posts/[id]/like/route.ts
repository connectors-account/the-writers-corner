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

    // Check if submission exists and is public
    const submission = await prisma.exerciseSubmission.findFirst({
      where: {
        id: submissionId,
        isPublic: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      })

      const likeCount = await prisma.like.count({
        where: { submissionId }
      })

      return NextResponse.json({ 
        liked: false, 
        likeCount,
        message: 'Post unliked' 
      })
    } else {
      // Like - create new like
      await prisma.like.create({
        data: {
          userId,
          submissionId
        }
      })

      const likeCount = await prisma.like.count({
        where: { submissionId }
      })

      return NextResponse.json({ 
        liked: true, 
        likeCount,
        message: 'Post liked' 
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

// Get like status for a post
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

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    const likeCount = await prisma.like.count({
      where: { submissionId }
    })

    return NextResponse.json({ 
      liked: !!existingLike, 
      likeCount 
    })
  } catch (error) {
    console.error('Error getting like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
