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

    const userId = session.user.id

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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Convert submissions to community post format with like/comment counts
    const posts = await Promise.all(
      submissions.map(async (submission) => {
        // Get like count and user's like status for this submission
        const [likeCount, userLike, commentCount] = await Promise.all([
          prisma.postLike.count({
            where: { postId: submission.id }
          }),
          prisma.postLike.findUnique({
            where: {
              postId_userId: {
                postId: submission.id,
                userId
              }
            }
          }),
          prisma.postComment.count({
            where: { postId: submission.id }
          })
        ])

        return {
          id: submission.id,
          title: submission.exercise.title,
          content: submission.content,
          createdAt: submission.createdAt.toISOString(),
          user: submission.user,
          exercise: submission.exercise,
          likeCount,
          liked: !!userLike,
          commentCount
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
