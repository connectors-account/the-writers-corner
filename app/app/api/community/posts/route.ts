
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch public exercise submissions with likes and comments
    const submissions = await prisma.exerciseSubmission.findMany({
      where: {
        isPublic: true
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        },
        Exercise: {
          include: {
            WritingTopic: {
              select: {
                title: true,
                slug: true
              }
            }
          }
        },
        Like: {
          select: {
            userId: true
          }
        },
        Comment: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Convert submissions to community post format with like/comment counts
    const posts = submissions.map(submission => ({
      id: submission.id,
      title: submission.Exercise.title,
      content: submission.content,
      createdAt: submission.createdAt.toISOString(),
      user: submission.User,
      exercise: {
        title: submission.Exercise.title,
        topic: submission.Exercise.WritingTopic
      },
      likeCount: submission.Like.length,
      commentCount: submission.Comment.length,
      isLikedByUser: submission.Like.some(like => like.userId === session.user.id)
    }))

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching community posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
