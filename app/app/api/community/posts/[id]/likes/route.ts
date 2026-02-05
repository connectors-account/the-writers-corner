
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// Toggle like on a post (like if not liked, unlike if already liked)
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

    // Check if the submission exists and is public
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

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId
        }
      }
    })

    let isLiked: boolean
    let likesCount: number

    if (existingLike) {
      // Unlike: delete the existing like
      await prisma.postLike.delete({
        where: {
          id: existingLike.id
        }
      })
      isLiked = false
    } else {
      // Like: create a new like
      await prisma.postLike.create({
        data: {
          userId,
          submissionId
        }
      })
      isLiked = true
    }

    // Get updated likes count
    likesCount = await prisma.postLike.count({
      where: {
        submissionId
      }
    })

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
