import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submissionId = params.id

    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        submissionId_userId: {
          submissionId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          submissionId,
          userId: session.user.id
        }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const submissionId = params.id

    const likeCount = await prisma.postLike.count({
      where: { submissionId }
    })

    let userLiked = false
    if (session?.user?.id) {
      const userLike = await prisma.postLike.findUnique({
        where: {
          submissionId_userId: {
            submissionId,
            userId: session.user.id
          }
        }
      })
      userLiked = !!userLike
    }

    return NextResponse.json({ likeCount, userLiked })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
