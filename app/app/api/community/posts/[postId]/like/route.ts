
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import '@/lib/types'

export const dynamic = 'force-dynamic'

// POST - Add a like to a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const body = await request.json()
    const { userName } = body

    if (!userName) {
      return NextResponse.json(
        { error: 'userName is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userName: {
          postId,
          userName
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      )
    }

    // Create the like
    const like = await prisma.postLike.create({
      data: {
        postId,
        userName
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({ 
      success: true, 
      like,
      likeCount 
    })
  } catch (error) {
    console.error('Error creating like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a like from a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const { searchParams } = new URL(request.url)
    const userName = searchParams.get('userName')

    if (!userName) {
      return NextResponse.json(
        { error: 'userName is required' },
        { status: 400 }
      )
    }

    // Find and delete the like
    const like = await prisma.postLike.findUnique({
      where: {
        postId_userName: {
          postId,
          userName
        }
      }
    })

    if (!like) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }

    await prisma.postLike.delete({
      where: {
        postId_userName: {
          postId,
          userName
        }
      }
    })

    // Get updated like count
    const likeCount = await prisma.postLike.count({
      where: { postId }
    })

    return NextResponse.json({ 
      success: true,
      likeCount 
    })
  } catch (error) {
    console.error('Error deleting like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get all likes for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params

    const likes = await prisma.postLike.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' }
    })

    const likeCount = likes.length

    return NextResponse.json({ 
      likes,
      likeCount 
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
