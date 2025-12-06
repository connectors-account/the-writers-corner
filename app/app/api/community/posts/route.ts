
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

    // Fetch public exercise submissions
    const submissions = await prisma.exerciseSubmission.findMany({
      where: {
        isPublic: true
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        },
        exercise: {
          include: {
            topic: {
              select: {
                title: true,
                slug: true
              }
            }
          }
        },
        likes: true,
        comments: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Convert submissions to community post format with like and comment counts
    const posts = await Promise.all(
      submissions.map(async (submission) => {
        // Check if current user has liked this post
        const userLike = await prisma.like.findUnique({
          where: {
            userId_exerciseSubmissionId: {
              userId: session.user.id,
              exerciseSubmissionId: submission.id
            }
          }
        })

        return {
          id: submission.id,
          title: submission.exercise.title,
          content: submission.content,
          createdAt: submission.createdAt.toISOString(),
          user: submission.user,
          exercise: submission.exercise,
          likeCount: submission.likes.length,
          commentCount: submission.comments.length,
          liked: !!userLike
        }
      })
    )

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching community posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
