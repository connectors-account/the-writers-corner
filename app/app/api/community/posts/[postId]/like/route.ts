import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Check if post exists
    const post = await prisma.exerciseSubmission.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked the post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Post already liked' },
        { status: 400 }
      )
    }

    // Create like
    const like = await prisma.postLike.create({
      data: {
        userId: session.user.id,
        postId: postId
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId: postId }
    })

    return NextResponse.json({ 
      success: true,
      like,
      likeCount
    })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = params

    // Delete like if it exists
    const deletedLike = await prisma.postLike.deleteMany({
      where: {
        userId: session.user.id,
        postId: postId
      }
    })

    if (deletedLike.count === 0) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId: postId }
    })

    return NextResponse.json({ 
      success: true,
      likeCount
    })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
