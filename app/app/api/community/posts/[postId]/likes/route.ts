import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Check if user has liked the post and get like count
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { postId } = params

    // Get total likes count
    const likesCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    // Check if current user has liked (if authenticated)
    let userHasLiked = false
    if (session?.user?.id) {
      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_submissionId: {
            userId: session.user.id,
            submissionId: postId
          }
        }
      })
      userHasLiked = !!existingLike
    }

    return NextResponse.json({
      likesCount,
      userHasLiked
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in to like posts' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Check if submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'You have already liked this post' },
        { status: 400 }
      )
    }

    // Create the like
    await prisma.postLike.create({
      data: {
        userId: session.user.id,
        submissionId: postId
      }
    })

    // Get updated count
    const likesCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({
      success: true,
      likesCount,
      userHasLiked: true
    })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in to unlike posts' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Check if user has liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    if (!existingLike) {
      return NextResponse.json(
        { error: 'You have not liked this post' },
        { status: 400 }
      )
    }

    // Delete the like
    await prisma.postLike.delete({
      where: {
        userId_submissionId: {
          userId: session.user.id,
          submissionId: postId
        }
      }
    })

    // Get updated count
    const likesCount = await prisma.postLike.count({
      where: { submissionId: postId }
    })

    return NextResponse.json({
      success: true,
      likesCount,
      userHasLiked: false
    })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
