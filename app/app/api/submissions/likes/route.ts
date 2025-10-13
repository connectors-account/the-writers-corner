import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET: Get likes for a submission
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const likes = await prisma.submissionLike.findMany({
      where: {
        submissionId
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

// POST: Toggle like (add or remove)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId, userName } = body

    if (!submissionId || !userName) {
      return NextResponse.json(
        { error: 'Submission ID and user name are required' },
        { status: 400 }
      )
    }

    // Check if the submission exists
    const submission = await prisma.exerciseSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if user already liked this submission
    const existingLike = await prisma.submissionLike.findUnique({
      where: {
        submissionId_userName: {
          submissionId,
          userName
        }
      }
    })

    if (existingLike) {
      // Unlike: Remove the like
      await prisma.submissionLike.delete({
        where: {
          id: existingLike.id
        }
      })

      return NextResponse.json({ 
        action: 'unliked',
        message: 'Like removed successfully' 
      })
    } else {
      // Like: Add the like
      const newLike = await prisma.submissionLike.create({
        data: {
          submissionId,
          userName
        }
      })

      return NextResponse.json({ 
        action: 'liked',
        like: newLike,
        message: 'Like added successfully' 
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
