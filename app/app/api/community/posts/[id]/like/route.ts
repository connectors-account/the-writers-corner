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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submissionId = params.id

    // Check if submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if user already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId
        }
      }
    })

    if (existingLike) {
      // Unlike - delete the existing like
      await prisma.like.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.like.count({
        where: { submissionId }
      })

      return NextResponse.json({
        liked: false,
        likeCount
      })
    } else {
      // Like - create new like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          submissionId
        }
      })

      const likeCount = await prisma.like.count({
        where: { submissionId }
      })

      return NextResponse.json({
        liked: true,
        likeCount
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
