
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

    // Get all post IDs (submission IDs are used as post IDs for community posts)
    const postIds = submissions.map(s => s.id)

    // Fetch likes for all posts
    const likes = await prisma.postLike.findMany({
      where: {
        postId: { in: postIds }
      }
    })

    // Fetch comments for all posts with user info
    const comments = await prisma.postComment.findMany({
      where: {
        postId: { in: postIds }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group likes and comments by postId
    const likesByPost = likes.reduce((acc, like) => {
      if (!acc[like.postId]) acc[like.postId] = []
      acc[like.postId].push(like)
      return acc
    }, {} as Record<string, typeof likes>)

    const commentsByPost = comments.reduce((acc, comment) => {
      if (!acc[comment.postId]) acc[comment.postId] = []
      acc[comment.postId].push({
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user
      })
      return acc
    }, {} as Record<string, any[]>)

    // Convert submissions to community post format with likes and comments
    const posts = submissions.map(submission => ({
      id: submission.id,
      title: submission.exercise.title,
      content: submission.content,
      createdAt: submission.createdAt.toISOString(),
      user: submission.user,
      exercise: submission.exercise,
      likeCount: likesByPost[submission.id]?.length || 0,
      isLikedByUser: likesByPost[submission.id]?.some(like => like.userId === userId) || false,
      comments: commentsByPost[submission.id] || []
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
