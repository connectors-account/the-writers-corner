import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET likes for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params

    const likes = await prisma.like.findMany({
      where: {
        submissionId: postId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      likes,
      count: likes.length
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST to toggle like (add or remove)
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const body = await request.json()
    const { userIdentifier } = body

    if (!userIdentifier) {
      return NextResponse.json(
        { error: 'User identifier is required' },
        { status: 400 }
      )
    }

    // Check if like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        submissionId_userIdentifier: {
          submissionId: postId,
          userIdentifier
        }
      }
    })

    if (existingLike) {
      // Unlike - delete the like
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      })

      return NextResponse.json({
        liked: false,
        message: 'Post unliked'
      })
    } else {
      // Like - create new like
      const newLike = await prisma.like.create({
        data: {
          submissionId: postId,
          userIdentifier
        }
      })

      return NextResponse.json({
        liked: true,
        like: newLike,
        message: 'Post liked'
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
