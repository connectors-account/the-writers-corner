import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

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

    const userId = session.user.id
    const postId = params.id

    // Check if post exists (it's an ExerciseSubmission)
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId, isPublic: true }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Toggle like: check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    })

    let isLiked: boolean

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })
      isLiked = false
    } else {
      // Like
      await prisma.postLike.create({
        data: { userId, postId }
      })
      isLiked = true
    }

    // Get updated count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({ isLiked, likeCount })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
