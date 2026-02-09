
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

    // Get like counts and user's like status for each post
    const postIds = submissions.map(s => s.id)
    
    const likeCounts = await prisma.postLike.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds }
      },
      _count: {
        id: true
      }
    })

    const userLikes = await prisma.postLike.findMany({
      where: {
        postId: { in: postIds },
        userId: userId
      },
      select: {
        postId: true
      }
    })

    // Get comment counts for each post
    const commentCounts = await prisma.postComment.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds }
      },
      _count: {
        id: true
      }
    })

    const likeCountMap = new Map(likeCounts.map(l => [l.postId, l._count.id]))
    const userLikeSet = new Set(userLikes.map(l => l.postId))
    const commentCountMap = new Map(commentCounts.map(c => [c.postId, c._count.id]))

    // Convert submissions to community post format with like/comment data
    const posts = submissions.map(submission => ({
      id: submission.id,
      title: submission.exercise.title,
      content: submission.content,
      createdAt: submission.createdAt.toISOString(),
      user: submission.user,
      exercise: submission.exercise,
      likeCount: likeCountMap.get(submission.id) || 0,
      liked: userLikeSet.has(submission.id),
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
