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

    // Fetch like counts and user likes for all posts
    const postIds: string[] = submissions.map((s: any) => s.id)

    const [likeCounts, userLikes, commentCounts] = await Promise.all([
      prisma.postLike.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { id: true }
      }),
      prisma.postLike.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true }
      }),
      prisma.postComment.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { id: true }
      })
    ])

    const likeCountMap = new Map(likeCounts.map((l: any) => [l.postId, l._count.id]))
    const userLikeSet = new Set(userLikes.map((l: any) => l.postId))
    const commentCountMap = new Map(commentCounts.map((c: any) => [c.postId, c._count.id]))

    // Convert submissions to community post format
    const posts = submissions.map((submission: any) => ({
      id: submission.id,
      title: submission.exercise.title,
      content: submission.content,
      createdAt: submission.createdAt.toISOString(),
      user: submission.user,
      exercise: submission.exercise,
      likeCount: likeCountMap.get(submission.id) || 0,
      isLikedByUser: userLikeSet.has(submission.id),
      commentCount: commentCountMap.get(submission.id) || 0
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
