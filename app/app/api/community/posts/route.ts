
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

    // Get like counts and user's likes for all posts
    const postIds = submissions.map(s => s.id)
    
    const likeCounts = await prisma.postLike.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds }
      },
      _count: {
        postId: true
      }
    })

    const userLikes = await prisma.postLike.findMany({
      where: {
        postId: { in: postIds },
        userId
      },
      select: {
        postId: true
      }
    })

    const likeCountMap = new Map(likeCounts.map(lc => [lc.postId, lc._count.postId]))
    const userLikedSet = new Set(userLikes.map(ul => ul.postId))

    // Get comment counts for all posts
    const commentCounts = await prisma.postComment.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds }
      },
      _count: {
        postId: true
      }
    })

    const commentCountMap = new Map(commentCounts.map(cc => [cc.postId, cc._count.postId]))

    // Convert submissions to community post format with likes and comments info
    const posts = submissions.map(submission => ({
      id: submission.id,
      title: submission.exercise.title,
      content: submission.content,
      createdAt: submission.createdAt.toISOString(),
      user: submission.user,
      exercise: submission.exercise,
      likeCount: likeCountMap.get(submission.id) || 0,
      liked: userLikedSet.has(submission.id),
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
