
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: submissionId } = params

    // Check if post exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create like (ignore if already exists due to unique constraint)
    try {
      const like = await prisma.like.create({
        data: {
          userId: session.user.id,
          submissionId
        }
      })

      // Get updated like count
      const likeCount = await prisma.like.count({
        where: { submissionId }
      })

      return NextResponse.json({ 
        success: true,
        like,
        likeCount
      })
    } catch (error: any) {
      // If unique constraint violation (already liked), return success
      if (error.code === 'P2002') {
        const likeCount = await prisma.like.count({
          where: { submissionId }
        })
        return NextResponse.json({ 
          success: true,
          message: 'Already liked',
          likeCount
        })
      }
      throw error
    }
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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: submissionId } = params

    // Delete the like
    await prisma.like.deleteMany({
      where: {
        userId: session.user.id,
        submissionId
      }
    })

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { submissionId }
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
