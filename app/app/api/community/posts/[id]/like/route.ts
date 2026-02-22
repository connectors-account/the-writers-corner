import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// POST - Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to like posts' },
        { status: 401 }
      )
    }

    const postId = params.id

    // Check if the like already exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
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
    const like = await prisma.postLike.create({
      data: {
        postId,
        userId: session.user.id
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({ 
      success: true, 
      like,
      likeCount,
      liked: true
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to unlike posts' },
        { status: 401 }
      )
    }

    const postId = params.id

    // Delete the like
    await prisma.postLike.delete({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({ 
      success: true, 
      likeCount,
      liked: false
    })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get like status and count for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.id

    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    let liked = false
    if (session?.user?.id) {
      const existingLike = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: session.user.id
          }
        }
      })
      liked = !!existingLike
    }

    return NextResponse.json({ 
      likeCount,
      liked
    })
  } catch (error) {
    console.error('Error getting like status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
